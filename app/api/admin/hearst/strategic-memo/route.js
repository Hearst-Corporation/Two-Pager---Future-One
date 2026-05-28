// POST /api/admin/hearst/strategic-memo
//
// Sprint 1 — Strategic Memo Generator (operator-grade, institutional).
//
// Génère un mémo structuré 11 sections + confidence layer à partir d'un
// snapshot de scénario (output du /simulate ou state simulator) + contexte
// produit + overrides stakeholder/region/overlays.
//
// Renvoie un OBJET STRUCTURÉ (pas un blob markdown) pour que le composant
// <StrategicMemoModal /> rende chaque section avec ses propres affordances
// (collapsible, confidence tag, source citations, charts ré-utilisés).
//
// Auth : viewer (mémo = lecture seulement, pas d'écriture DB).
// Modèle : Kimi cascade (kimi-k2.6 → k2.5 → glm-5 → minimax-m2.5).
// Rate-limit : 5 req/min/actor en prod, skip en dev.

import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/supabase-admin';
import { kimiChatCompletion, KIMI_MODEL } from '@/lib/llm/kimi';
import { buildOracleSystemPrompt } from '@/lib/oracle-system-prompt';

const RL_WINDOW = 60_000;
const RL_MAX = 5;
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

const SECTION_IDS = [
  'executive_summary',
  'confidence_block',
  'strategic_context',
  'key_financial_metrics',
  'infrastructure_analysis',
  'market_benchmarking',
  'risks_constraints',
  'strategic_opportunities',
  'recommended_architecture',
  'commercialization_strategy',
  'deployment_roadmap',
  'long_term_strategic_value',
];

const MEMO_SCHEMA_INSTRUCTIONS = `Return a JSON object with the following exact keys (no markdown, no prose outside JSON) :

{
  "executive_summary": { "headline": "string", "bullets": ["string", ...], "overall_confidence": "HIGH|MEDIUM|LOW" },
  "confidence_block": {
    "confidence_level": "HIGH|MEDIUM|LOW",
    "source_density": "N sourced / M total",
    "estimation_quality": "1-2 sentences",
    "known_unknowns": ["string", ...]
  },
  "strategic_context": { "body": "string (max 8 lines)", "skip": false },
  "key_financial_metrics": {
    "metrics": [
      { "label": "string", "value": "string", "unit": "string", "confidence": "HIGH|MEDIUM|LOW", "source": "string|null" },
      ...
    ],
    "narrative": "string (max 4 lines)"
  },
  "infrastructure_analysis": { "body": "string", "tradeoffs": ["string", ...] },
  "market_benchmarking": {
    "comparables": [
      { "name": "string", "metric": "string", "value": "string", "source": "string" },
      ...
    ]
  },
  "risks_constraints": {
    "items": [
      { "category": "power|supply_chain|regulatory|fx|tenant_concentration|climate|geopolitical|other",
        "label": "string", "severity": "HIGH|MEDIUM|LOW", "mitigation": "string", "dependency": "string|null" },
      ...
    ]
  },
  "strategic_opportunities": {
    "items": [ { "label": "string", "execution_path": "string", "confidence": "HIGH|MEDIUM|LOW" }, ... ]
  },
  "recommended_architecture": {
    "config": { "mw": "string", "tier": "string", "cooling": "string", "rack_mix": "string", "gpu_sku": "string", "networking": "string", "phasing": "string" },
    "rationale": "string"
  },
  "commercialization_strategy": {
    "pricing": "string", "contract_structure": "string", "anchor_tenant": "string", "ramp_profile": "string"
  },
  "deployment_roadmap": {
    "phases": [ { "label": "string", "months_from_t0": "string", "gating_events": ["string", ...] }, ... ],
    "reality_check_flags": ["string", ...]
  },
  "long_term_strategic_value": { "ten_year_arc": "string", "speculative_branches": ["string", ...] }
}

Strict rules :
- Output ONLY valid JSON. No markdown fence, no prose around it.
- Confidence tags are required where indicated.
- Each metric in key_financial_metrics MUST have a source field (use "ASSUMED" if unsourced).
- reality_check_flags in deployment_roadmap MUST surface any timeline that violates operational_realism benchmarks.
- If a section is genuinely not material, set "skip": true (only allowed on strategic_context).
- Max 5 items per items[] array. Quality over quantity.`;

function buildScenarioSummary(payload) {
  const { scenario, projection, archetype_outcome, hardware_breakdown, source_map, confidence_score } = payload;
  const parts = [];
  if (archetype_outcome) {
    parts.push(`Archetype : ${archetype_outcome.label} (${archetype_outcome.code}) — score ${archetype_outcome.score ?? 'N/A'}/100`);
  }
  if (scenario) {
    parts.push(`Scenario : ${scenario.total_mw ?? '?'} MW · PUE ${scenario.pue ?? '?'} · debt ${scenario.debt_pct ?? '?'}% @ ${scenario.debt_interest_rate ?? '?'}% · exit yr ${scenario.exit_year ?? '?'}`);
    parts.push(`Pricing : hyperscale $${scenario.price_hyperscale_kw_month ?? '?'}/kW/mo · electricity $${scenario.electricity_price_mwh ?? '?'}/MWh`);
    parts.push(`Equity split : Hearst ${scenario.equity_hearst_pct ?? '?'}% / Brookfield ${scenario.equity_brookfield_pct ?? '?'}% / Qatar ${scenario.equity_qatar_pct ?? '?'}%`);
  }
  if (projection) {
    const f = (v, k) => v == null ? 'N/A' : (k === 'pct' ? `${(v * 100).toFixed(1)}%` : k === 'usd' ? `$${(v / 1e6).toFixed(1)}M` : k === 'x' ? `${v.toFixed(2)}x` : v);
    parts.push(`Projection : total CAPEX ${f(projection.total_capex, 'usd')} · stab. EBITDA ${f(projection.stabilized_ebitda, 'usd')} · IRR ${f(projection.irr, 'pct')} · MOIC ${f(projection.moic, 'x')} · payback ${projection.payback_years ?? '?'} yr · DSCR ${projection.dscr_stabilized ? f(projection.dscr_stabilized, 'x') : 'N/A'} · NPV ${f(projection.npv, 'usd')} · TV ${f(projection.terminal_value, 'usd')}`);
  }
  if (hardware_breakdown) {
    parts.push(`Hardware : ${hardware_breakdown.mw_classic?.toFixed(1)} MW classic / ${hardware_breakdown.mw_liquid?.toFixed(1)} MW liquid / ${hardware_breakdown.mw_ai?.toFixed(1)} MW AI · ${hardware_breakdown.total_gpus} GPUs (${hardware_breakdown.gpu?.sku || 'n/a'})`);
  }
  if (source_map) {
    parts.push(`source_map filled : ${Object.keys(source_map).length} fields · confidence_score ${confidence_score ?? 'N/A'}`);
  }
  return parts.join('\n');
}

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

  const { payload, oracle = {}, user_question } = body || {};
  if (!payload || (!payload.scenario && !payload.projection)) {
    return NextResponse.json({ error: 'payload.scenario or payload.projection required' }, { status: 400 });
  }

  const oracleCtx = {
    stakeholder: oracle.stakeholder,
    region: oracle.region,
    overlays: oracle.overlays,
    brevity: 'deep',
    surface: 'strategic-memo',
    product_context: 'Hearst Oracle — strategic memo generator (Sprint 1)',
  };
  const systemPrompt = buildOracleSystemPrompt(oracleCtx);

  const scenarioSummary = buildScenarioSummary(payload);
  const userMessage = [
    user_question
      ? `User context : ${user_question}`
      : 'Produce a strategic memo for this scenario.',
    '',
    'Computed scenario snapshot :',
    scenarioSummary,
    '',
    MEMO_SCHEMA_INSTRUCTIONS,
  ].join('\n');

  try {
    const { response, model_used } = await kimiChatCompletion({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices?.[0]?.message?.content || '';
    let memo;
    try { memo = JSON.parse(content); }
    catch (e) {
      console.warn('[strategic-memo] JSON parse failed, raw output kept');
      return NextResponse.json({
        error: 'memo_parse_failed',
        raw: content.slice(0, 2000),
        model_used,
      }, { status: 502 });
    }

    return NextResponse.json({
      memo,
      generated_at: new Date().toISOString(),
      model_used,
      oracle_ctx: {
        stakeholder: oracleCtx.stakeholder || 'operator',
        region: oracleCtx.region || 'qatar',
        overlays: oracleCtx.overlays || [],
      },
    });
  } catch (e) {
    console.error('[strategic-memo] error:', e?.message);
    return NextResponse.json({ error: e?.message || 'Memo generation failed' }, { status: 500 });
  }
}
