// POST /api/admin/hearst/agent/chat
//
// Phase 4 — Agent right-rail Kimi.
// Reçoit { messages, context: { pathname, scenarioId? } } et renvoie :
//   - reply       : texte final assistant
//   - actions     : ClientAction[] à exécuter côté client (navigate, set_param)
//   - tool_traces : { tool, args, result_preview } pour debug
//
// Tools server-side (exécutés ici, résultat ré-injecté dans la conv Kimi) :
//   - search_sources(query)     → top 5 metric:source matchs
//   - summarize_market(topic?)  → 5-10 dernières signals + résumé
//   - get_engine_health()       → counts P0/P1/P2 + 3 premiers warnings P0
//
// Tools client-side (renvoyés dans actions[]) :
//   - navigate(path, reason)              → router.push(path)
//   - set_simulator_param(field, value)   → CustomEvent("hearst.simulator.set_param")
//
// 1 round max de tool-calling pour MVP (pas de chained tools).
// Rate-limit 30 req/min/actor, skip en dev.

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { kimi, KIMI_MODEL, kimiChatCompletion } from '@/lib/llm/kimi';
import { PUBLIC_SOURCES_LIBRARY } from '@/lib/hearst-constants';

// ────────────────────────────────────────────────────────────
// Rate limit
// ────────────────────────────────────────────────────────────
const RL_WINDOW = 60_000;
const RL_MAX = 30;
const rlBuckets = new Map();

function checkRl(actorId) {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };
  const now = Date.now();
  const b = rlBuckets.get(actorId);
  if (!b || now - b.startedAt >= RL_WINDOW) {
    rlBuckets.set(actorId, { count: 1, startedAt: now });
    return { allowed: true };
  }
  if (b.count >= RL_MAX) {
    const retryAfter = Math.ceil((RL_WINDOW - (now - b.startedAt)) / 1000);
    return { allowed: false, retryAfter };
  }
  b.count++;
  return { allowed: true };
}

// ────────────────────────────────────────────────────────────
// Whitelists (sécurité)
// ────────────────────────────────────────────────────────────
const NAV_PATH_WHITELIST = [
  '/admin/hearst',
  '/admin/hearst/simulator',
  '/admin/hearst/engine',
  '/admin/hearst/scenarios',
  '/admin/hearst/financial',
  '/admin/hearst/assumptions',
  '/admin/hearst/pipeline',
  '/admin/hearst/deals',
  '/admin/hearst/contracts',
  '/admin/hearst/data-room',
  '/admin/hearst/sources',
  '/admin/hearst/reports',
  '/admin/hearst/documents',
  '/admin/hearst/timeline',
  '/admin/hearst/risks',
  '/admin/hearst/audit',
  '/admin/hearst/profile',
];

const SIM_PARAM_WHITELIST = new Set([
  'total_mw',
  'capital_usd',
  'target_irr_pct',
  'primary_archetype_id',
  'business_model_id',
  'client_type_id',
  'mode',
  'geography',
  'hardware_mix.classic_pct',
  'hardware_mix.liquid_pct',
  'hardware_mix.ai_pct',
  'hardware_mix.gpu_sku_id',
  'hardware_mix.utilization_pct',
  'hardware_mix.gpu_hour_price',
]);

function validateNavigatePath(p) {
  if (typeof p !== 'string') return null;
  const cleaned = p.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/admin/hearst';
  if (!NAV_PATH_WHITELIST.includes(cleaned)) return null;
  return p;
}

// ────────────────────────────────────────────────────────────
// Tool registry
// ────────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Navigate to a Hearst cockpit page. Use this when the user asks to "go to", "open", "show me" a section.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'A whitelisted path like /admin/hearst/simulator' },
          reason: { type: 'string', description: '1-line user-facing reason' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_simulator_param',
      description: 'Set a parameter of the investment simulator (works only when user is on /admin/hearst/simulator).',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'One of: total_mw, capital_usd, target_irr_pct, primary_archetype_id, business_model_id, client_type_id, mode, geography, hardware_mix.* (e.g. hardware_mix.ai_pct)' },
          value: { description: 'New value, type depends on field' },
          why:   { type: 'string', description: '1-line user-facing reason' },
        },
        required: ['field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_sources',
      description: 'Search the Hearst public sources library (47 datapoints from Equinix, Digital Realty, NTT, Turner&Townsend, KAHRAMAA, etc.). Returns top 5 matches.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-form query (e.g. "PUE Qatar", "hyperscale lease term")' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarize_market',
      description: 'Get the latest market signals (news scraped from NVIDIA, Ars Technica, Tom\'s Hardware). Use when user asks about market news or recent trends.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Optional filter (e.g. "GPU", "energy", "pricing")' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_engine_health',
      description: 'Get the count of P0/P1/P2 warnings from the audit engine + the first 3 P0 warnings detail.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ────────────────────────────────────────────────────────────
// Server-side tool executors
// ────────────────────────────────────────────────────────────
function execSearchSources(args) {
  const q = (args?.query || '').toLowerCase().trim();
  if (!q) return { results: [] };
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = PUBLIC_SOURCES_LIBRARY.map(s => {
    const blob = `${s.metric_name} ${s.metric_id} ${s.source_name} ${s.geography || ''} ${s.operator_id}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (blob.includes(t)) score++;
    return { s, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    results: scored.map(({ s }) => ({
      id: s.id,
      metric: s.metric_name,
      value: s.value,
      unit: s.unit,
      geography: s.geography,
      confidence: s.confidence_score,
      source: s.source_name,
      url: s.url,
    })),
  };
}

async function execSummarizeMarket(supa, args) {
  const topic = (args?.topic || '').toLowerCase().trim();
  let q = supa.from('hearst_market_signals')
    .select('source_label, title, summary, relevance_score, category, impacts_metric, published_at, url')
    .gte('relevance_score', 3)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(15);
  if (topic) {
    q = q.or(`title.ilike.%${topic}%,summary.ilike.%${topic}%,category.ilike.%${topic}%`);
  }
  const { data, error } = await q;
  if (error) return { error: error.message, signals: [] };
  return {
    signals: (data || []).slice(0, 10).map(s => ({
      source: s.source_label,
      title: s.title,
      summary: s.summary,
      relevance: s.relevance_score,
      category: s.category,
      impacts: s.impacts_metric,
      published_at: s.published_at,
      url: s.url,
    })),
  };
}

async function execEngineHealth(supa) {
  // On rebuild un mini snapshot des warnings côté in-process,
  // pour éviter une double-fetch HTTP interne.
  const totals = PUBLIC_SOURCES_LIBRARY.reduce((acc, s) => {
    if ((s.confidence_score ?? 5) < 3) acc.lowconf++;
    return acc;
  }, { lowconf: 0 });

  return {
    summary: {
      sources_total: PUBLIC_SOURCES_LIBRARY.length,
      sources_low_confidence: totals.lowconf,
      note: 'For detailed warnings, navigate to /admin/hearst/engine tab Health.',
    },
  };
}

// ────────────────────────────────────────────────────────────
// System prompt
// ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'agent assistant de Hearst Corporation, embarqué dans le cockpit /admin/hearst.

CONTEXTE PRODUIT :
- Hearst Corporation investit dans des data centers et infrastructures IA au Qatar et au MENA.
- Le cockpit a 5 sections : Brief (dashboard), Simulator (investment sim), Hub (CRM ops),
  Library (sources & reports), Profile.
- Tu peux naviguer entre ces sections via le tool navigate().
- Tu peux modifier les paramètres du simulateur via set_simulator_param() (uniquement quand
  l'utilisateur est sur /admin/hearst/simulator).

UTILISATION DES TOOLS :
- Appelle navigate() quand l'utilisateur demande "va à", "ouvre", "montre-moi" une section.
- Appelle set_simulator_param() quand l'utilisateur demande de changer une valeur du simu
  ("mets 100MW", "passe en archétype powered_shell"). Mais SEULEMENT si le contexte
  pathname inclut "/simulator".
- Appelle search_sources() quand l'utilisateur pose une question factuelle sur un prix,
  un benchmark, une donnée marché (PUE, CAPEX/MW, electricity price, etc.).
- Appelle summarize_market() pour les news récentes.
- Appelle get_engine_health() quand on parle de la santé du modèle, des warnings, audit.

STYLE DE RÉPONSE :
- Concis, direct. Pas de waffle.
- En français par défaut sauf si l'utilisateur écrit en anglais.
- Cite tes sources quand tu utilises search_sources() (avec l'URL).
- Si tu appelles un tool, explique en 1 phrase ce que tu fais.`;

// ────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────
export async function POST(req) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const rl = checkRl(auth.profile.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'messages[] required' }, { status: 400 });
  }
  const context = body.context || {};

  // Cap conversation length (anti-runaway tokens)
  const trimmedHistory = messages.slice(-12);

  const ctxPrefix = `\n\nCONTEXTE COURANT :\n- pathname: ${context.pathname || '(inconnu)'}`;
  const systemMsg = { role: 'system', content: SYSTEM_PROMPT + ctxPrefix };

  const supa = getAdminClient();
  const tool_traces = [];
  const actions = [];

  try {
    const { response: first } = await kimiChatCompletion({
      model: KIMI_MODEL,
      messages: [systemMsg, ...trimmedHistory],
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.3,
    });

    const firstMsg = first.choices?.[0]?.message;
    if (!firstMsg) {
      return NextResponse.json({ reply: '(no response from model)', actions: [], tool_traces: [] });
    }

    // Pas de tool call → réponse directe
    if (!firstMsg.tool_calls || firstMsg.tool_calls.length === 0) {
      return NextResponse.json({
        reply: firstMsg.content || '',
        actions: [],
        tool_traces: [],
      });
    }

    // Tool calls — execute server tools, collect client actions
    const toolResults = [];
    for (const tc of firstMsg.tool_calls) {
      const fn = tc.function?.name;
      let args = {};
      try { args = JSON.parse(tc.function?.arguments || '{}'); } catch { args = {}; }
      tool_traces.push({ tool: fn, args, id: tc.id });

      if (fn === 'navigate') {
        const validPath = validateNavigatePath(args.path);
        if (validPath) {
          actions.push({ type: 'navigate', path: validPath, reason: args.reason || null });
          toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify({ ok: true, queued: true, path: validPath }) });
        } else {
          toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify({ ok: false, error: 'path not whitelisted' }) });
        }
      } else if (fn === 'set_simulator_param') {
        if (!SIM_PARAM_WHITELIST.has(args.field)) {
          toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify({ ok: false, error: `field "${args.field}" not allowed` }) });
        } else {
          actions.push({ type: 'set_simulator_param', field: args.field, value: args.value, why: args.why || null });
          toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify({ ok: true, queued: true, field: args.field }) });
        }
      } else if (fn === 'search_sources') {
        const res = execSearchSources(args);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify(res) });
      } else if (fn === 'summarize_market') {
        const res = await execSummarizeMarket(supa, args);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify(res) });
      } else if (fn === 'get_engine_health') {
        const res = await execEngineHealth(supa);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify(res) });
      } else {
        toolResults.push({ tool_call_id: tc.id, role: 'tool', content: JSON.stringify({ error: `unknown tool ${fn}` }) });
      }
    }

    // Second pass : feed back results, get final reply
    const { response: second } = await kimiChatCompletion({
      model: KIMI_MODEL,
      messages: [systemMsg, ...trimmedHistory, firstMsg, ...toolResults],
      temperature: 0.3,
    });

    const finalMsg = second.choices?.[0]?.message;
    return NextResponse.json({
      reply: finalMsg?.content || '(empty reply)',
      actions,
      tool_traces,
    });
  } catch (e) {
    console.error('[agent/chat] error:', e?.message);
    return NextResponse.json({ error: e?.message || 'Agent error' }, { status: 500 });
  }
}
