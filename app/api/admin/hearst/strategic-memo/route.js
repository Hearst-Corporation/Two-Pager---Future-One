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
import { buildIntelligenceBrief } from '@/lib/oracle-intelligence';
import { getGpuPricingBrief, getEnergyBrief, getInfrastructureSignals, getLiveInfrastructureBrief } from '@/lib/oracle-live';
import { build2DDiagramSpec, buildTopologySpec, buildDeploymentPhaseSpec } from '@/lib/oracle-visualization';
import { explainMetric, simplifyTechnicalTerm, SUPPORTED_AUDIENCES } from '@/lib/oracle-explainability';
import { fmtUSD, fmtPctFromRatio, fmtX } from '@/lib/hearst-format';
import { assertNoPromises, freshnessStatusFromTimestamp, computeDataFreshness, computeConfidenceBlock } from '@/lib/memo-confidence';
import { persistMemo } from '@/lib/strategic-memo-store';
import { reconcileMetricsWithEngine } from '@/lib/engine-reconcile';

// Wave 1 (C18) — the LLM cascade (4 Hypercli models → Claude → OpenAI) can run
// several minutes in the worst case. Without this the route inherits the Vercel
// default (~10-15s) and 504s mid-generation on any fallback. 300s = plan max.
export const maxDuration = 300;

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
    ],
    "structural_differences": ["string (1-line callout per peer of WHY the headline metric is or isn't directly comparable)", ...]
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
  "long_term_strategic_value": { "ten_year_arc": "string", "speculative_branches": ["string", ...] },
  "decision_tensions": [
    { "id": "string (from intelligence_brief.tensions[].id)", "verdict": "string explaining which pole the scenario tilts to and why" }
  ],
  "intelligence_sources": [
    { "datapoint_id": "string (from intelligence_brief.datapoints[].id)", "used_for": "string", "trust": "HIGH|MEDIUM|LOW" }
  ],
  "live_intelligence": {
    "gpu_pricing": { "summary": "string", "freshness_tag": "FRESH|OK|STALE|EXPIRED|NO_LIVE_DATA", "median_observed": "string|null" },
    "energy": { "summary": "string", "tariff_used": "string", "freshness_tag": "FRESH|OK|STALE|EXPIRED|NO_LIVE_DATA" },
    "signals": [
      { "id": "string (from live brief signals)", "title": "string", "severity": "HIGH|MEDIUM|LOW", "implication": "string" }
    ],
    "freshness_summary": "1-line overall freshness assessment",
    "volatility_summary": "1-line overall volatility assessment"
  },
  "visualization": {
    "diagram_type": "floorplan|topology|gantt",
    "summary": "1-2 lines explaining what the diagram shows",
    "topology_summary": "1-line topology interpretation"
  },
  "explainability": {
    "audience": "beginner|investor|minister|operator",
    "simplified_takeaways": ["string (3-5 lines, plain language)"],
    "jargon_translations": { "IRR": "string", "PUE": "string", "DSCR": "string", "payback": "string" },
    "why_this_recommendation": "1-paragraph explaining the rationale in language matching audience"
  }
}

Strict rules :
- Output ONLY valid JSON. No markdown fence, no prose around it.
- Confidence tags are required where indicated.
- Each metric in key_financial_metrics MUST have a source field. Use a real datapoint_id from intelligence_brief.datapoints when possible; use "ASSUMED" only when no comparable exists.
- market_benchmarking MUST cite at least 3 distinct entities from intelligence_brief.comparables, and structural_differences MUST explain WHY two peers aren't apples-to-apples (use intelligence_brief.comparables[].profile to anchor the WHY).
- reality_check_flags in deployment_roadmap MUST include every entry from intelligence_brief.reality_violations verbatim, plus any others you detect.
- decision_tensions MUST address every entry from intelligence_brief.tensions (verdict per tension, even if one pole is clearly preferred).
- intelligence_sources : list at least 5 datapoint_ids you actually used, with the section name in used_for.
- If a section is genuinely not material, set "skip": true (only allowed on strategic_context).
- Max 5 items per items[] array. Quality over quantity.
- live_intelligence, visualization, explainability are OPTIONAL blocks — include them if the live layer provided usable data. If a live data field is unavailable, use freshness_tag "NO_LIVE_DATA" and set summary to "No live data available".
- explainability.audience MUST match the audience provided in the live intelligence layer section.
- live_intelligence.signals: include only signals actually present in the live brief (do not fabricate).

ANTI-GENERIC RULES (must be enforced) :
- BANNED phrases (the memo MUST NOT use): "transformational", "best-in-class", "unlock", "world-leading", "innovative", "cutting-edge", "industry-leading", "next-generation" (unless quoting a real product name).
- Every BANNED phrase auto-disqualifies the section. If the LLM uses any of these, it must regenerate.
- Each metric in key_financial_metrics MUST cite an intelligence_brief.datapoints[].id (not just "ASSUMED"). If no comparable exists in the brief, mark explicitly "no public comparable - LOW VISIBILITY".

EVERY RECOMMENDATION MUST INCLUDE (in recommended_architecture.rationale AND in strategic_opportunities[].execution_path):
- Why this choice (anchored on a brief datapoint or signal)
- What alternatives were considered (at least 1)
- What risk is accepted (specific, not "execution risk")
- What metric will tell us if we were right (e.g. "DSCR > 1.4 after Year 2 stabilization")

TRADEOFFS MANDATORY (in infrastructure_analysis.tradeoffs AND decision_tensions.verdict) :
- Each tradeoff explicit, no euphemisms
- Format: "Choosing X over Y because Z, accepting [specific cost]"

NUMERIC ANCHORING :
- Every claim about pricing, capex, occupancy, IRR, ramp speed MUST have a number with confidence tag.
- Replace soft language like "may improve" with "expected to add X-Y bps to IRR under [assumption]".
- Replace "significant" with the actual % or $ figure.

STAKEHOLDER MATCH :
- The memo language MUST match oracle_ctx.stakeholder.
- Government brief → strategic + long-horizon
- Investor brief → returns + risk + exit
- Operator brief → contract structure + opex
- If wrong audience tone, memo is invalid.

EXPLAINABILITY RULES :
- explainability.simplified_takeaways MUST exclude every term flagged by lib/oracle-explainability.detectJargon() for the chosen audience. Re-write any takeaway that contains banned jargon.
- explainability.why_this_recommendation MUST start with "We recommend X because Y supported by [datapoint_id Z]." Not "This is an opportunity to..."`;

// Strip raw_excerpt + any debug payload from the live brief before sending to
// the client. raw_excerpt carries the first 200 chars of provider HTML, useful
// for server-side debug but pure noise (and a small leak surface) in the API
// response.
function sanitizeLiveBriefForClient(brief) {
  if (!brief || typeof brief !== 'object') return brief;
  const stripExcerpt = (o) => {
    if (!o || typeof o !== 'object') return o;
    const { raw_excerpt, ...rest } = o;
    return rest;
  };
  return {
    ...brief,
    gpu_pricing: brief.gpu_pricing && {
      ...brief.gpu_pricing,
      prices: (brief.gpu_pricing.prices || []).map(stripExcerpt),
    },
  };
}

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
    const f = (v, k) => v == null ? 'N/A' : (k === 'pct' ? fmtPctFromRatio(v) : k === 'usd' ? fmtUSD(v) : k === 'x' ? fmtX(v) : v);
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

  const { payload, oracle = {}, user_question, project_id = null, scenario_id = null, title = null } = body || {};
  if (!payload || (!payload.scenario && !payload.projection)) {
    return NextResponse.json({ error: 'payload.scenario or payload.projection required' }, { status: 400 });
  }

  const audience = SUPPORTED_AUDIENCES.includes(body?.audience) ? body.audience : 'investor';

  const oracleCtx = {
    stakeholder: oracle.stakeholder,
    region: oracle.region,
    overlays: oracle.overlays,
    brevity: 'deep',
    surface: 'strategic-memo',
    product_context: 'Hearst Oracle — strategic memo generator (Sprint 1) + intelligence layer (Sprint 2)',
  };
  const systemPrompt = buildOracleSystemPrompt(oracleCtx);

  // ── Hydrate intelligence brief (Sprint 2) ──────────────────────────
  // Detects archetype, region, GPU + cooling profile from the scenario
  // and queries the structured intelligence layer for the most relevant
  // datapoints, comparables, tensions, absorption and reality flags.
  const archetypeId = payload?.archetype_outcome?.id || payload?.scenario?.archetype_id || null;
  const gpuSku     = payload?.hardware_breakdown?.gpu?.id || payload?.hardware_breakdown?.gpu?.sku || null;
  const liquidPct  = payload?.scenario?.hardware_mix?.liquid_pct || 0;
  const aiPct      = payload?.scenario?.hardware_mix?.ai_pct || 0;
  const hasLiquid  = liquidPct > 0 || aiPct > 30 || /gb200/i.test(gpuSku || '');
  const monthsToCod = payload?.scenario?.phase1_complete_year
    ? payload.scenario.phase1_complete_year * 12
    : 24;

  const intelligenceBrief = buildIntelligenceBrief({
    region: oracle.region || 'qatar',
    archetype_id: archetypeId,
    gpu_focus: aiPct > 30 || archetypeId === 'neocloud_gpu',
    sovereign_focus: oracle.stakeholder === 'sovereign' || (oracle.overlays || []).some(o => /VISION_|SOVEREIGN|NEOM|QATAR_NATIONAL/.test(o)),
    months_to_cod: monthsToCod,
    has_liquid_cooling: hasLiquid,
    gpu_sku: gpuSku,
  });

  // ── Infrastructure intelligence layer (live where available) ───────
  // Wave 1 (C1): these briefs are async — they MUST be awaited. Previously they
  // were assigned unresolved, so JSON.stringify produced {} and every "live"
  // figure was hallucinated. Await all three, then assert none stayed a Promise.
  const [gpuPricing, energyBrief, signalBrief] = await Promise.all([
    getGpuPricingBrief({ region: oracleCtx.region || 'qatar' }),
    getEnergyBrief({ region: oracleCtx.region || 'qatar', archetype_id: archetypeId }),
    getInfrastructureSignals({ region: oracleCtx.region || 'qatar', archetype_id: archetypeId, min_severity: 'medium' }),
  ]);
  const liveBrief = { gpu_pricing: gpuPricing, energy: energyBrief, signals: signalBrief };
  assertNoPromises(liveBrief, 'liveBrief');

  // ── Wave 1 (C7 + C11/C12) — server-computed confidence + freshness ─
  // Computed from real trust/freshness scores on the selected datapoints, BEFORE
  // the LLM runs, and re-applied after parse so the model cannot override them.
  const computedConfidence = computeConfidenceBlock(intelligenceBrief.datapoints);
  const dataFreshness = computeDataFreshness(intelligenceBrief.datapoints);
  // Surface a per-datapoint freshness status to the model so it can label stale
  // figures honestly instead of quoting year-old numbers as current.
  intelligenceBrief.datapoints = intelligenceBrief.datapoints.map(d => ({
    ...d, freshness_status: freshnessStatusFromTimestamp(d.timestamp),
  }));
  const visualization = {
    floorplan: build2DDiagramSpec(payload),
    topology:  buildTopologySpec(payload),
    phases:    buildDeploymentPhaseSpec(payload),
  };
  const explainability_seed = {
    audience,
    jargon_translations: {
      IRR: explainMetric('IRR', audience).short,
      PUE: explainMetric('PUE', audience).short,
      DSCR: explainMetric('DSCR', audience).short,
      payback: explainMetric('payback', audience).short,
      powered_shell: simplifyTechnicalTerm('powered_shell', audience),
      liquid_cooling: simplifyTechnicalTerm('liquid_cooling', audience),
      tier_iii: simplifyTechnicalTerm('tier_iii', audience),
    },
  };

  const scenarioSummary = buildScenarioSummary(payload);
  const userMessage = [
    user_question
      ? `User context : ${user_question}`
      : 'Produce a strategic memo for this scenario.',
    '',
    '── Computed scenario snapshot ──',
    scenarioSummary,
    '',
    '── Intelligence brief (Sprint 2 intelligence layer) ──',
    'Use this brief as your primary source of comparables, decision tensions and reality constraints.',
    'Cite datapoints by their id in intelligence_sources, address every tension in decision_tensions, and surface every reality_violations entry in deployment_roadmap.reality_check_flags.',
    '',
    JSON.stringify(intelligenceBrief, null, 2),
    '',
    '── Authoritative confidence (computed server-side — DO NOT alter) ──',
    'These values are computed from datapoint trust + freshness scores. Copy confidence_block.confidence_level and confidence_block.source_density VERBATIM from here. You MAY write estimation_quality and known_unknowns as explanation, but you must NOT invent the confidence level or source density.',
    JSON.stringify(computedConfidence, null, 2),
    '',
    '── Data freshness (computed server-side — DO NOT alter) ──',
    `Display "Data as of ${dataFreshness.data_as_of}" prominently in the memo. Overall data status: ${dataFreshness.overall_status}. Never present a STALE or EXPIRED datapoint as current — label any dated figure explicitly (e.g. "as of <date>, may have moved").`,
    JSON.stringify(dataFreshness, null, 2),
    '',
    '── Infrastructure intelligence (curated benchmarks + live data where available) ──',
    'These are infrastructure intelligence signals. Cite freshness tags and signals in the relevant sections (live_intelligence block). Where live data is unavailable, surface it as a known unknown rather than fabricating a value. Do not describe figures as "real-time" unless the freshness_tag is FRESH.',
    `Audience for this memo: ${audience}. Use the explainability_seed jargon_translations to simplify technical terms in the explainability section.`,
    `- explainability.simplified_takeaways MUST exclude every term flagged by lib/oracle-explainability.detectJargon() for the chosen audience. Re-write any takeaway that contains banned jargon.`,
    `- explainability.why_this_recommendation MUST start with "We recommend X because Y supported by [datapoint_id Z]." Not "This is an opportunity to..."`,
    '',
    JSON.stringify(liveBrief, null, 2),
    '',
    MEMO_SCHEMA_INSTRUCTIONS,
  ].join('\n');

  try {
    // Timing transparent — pour identifier les hotspots et donner au caller
    // une indication de durée par étape (visible dans la réponse `timing`).
    const promptSize = systemPrompt.length + userMessage.length;
    console.log(`[strategic-memo] prompt size: ${promptSize} chars (system: ${systemPrompt.length}, user: ${userMessage.length})`);
    const llmStart = Date.now();
    const { response, model_used } = await kimiChatCompletion({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.0,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });
    const llmDurationMs = Date.now() - llmStart;
    console.log(`[strategic-memo] LLM call completed in ${llmDurationMs}ms via ${model_used}`);

    const rawContent = response.choices?.[0]?.message?.content || '';
    // Strip markdown fences (Claude sometimes wraps JSON in ```json ... ``` despite instructions)
    const content = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let memo;
    try { memo = JSON.parse(content); }
    catch (e) {
      // Second attempt: extract first {...} block in case of surrounding text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { memo = JSON.parse(jsonMatch[0]); }
        catch { /* fall through to error */ }
      }
      if (!memo) {
        console.warn('[strategic-memo] JSON parse failed, raw output kept');
        console.warn('[strategic-memo] raw tail:', rawContent.slice(-300));
        return NextResponse.json({
          error: 'memo_parse_failed',
          raw: rawContent.slice(0, 2000),
          model_used,
        }, { status: 502 });
      }
    }

    // ── Wave 1 (C7) — overwrite model-graded confidence with server values.
    // The LLM keeps estimation_quality + known_unknowns (explanation), but
    // confidence_level / source_density now ORIGINATE from code, not the model.
    memo.confidence_block = {
      ...(memo.confidence_block || {}),
      confidence_level: computedConfidence.confidence_level,
      source_density: computedConfidence.source_density,
      mean_trust_score: computedConfidence.mean_trust_score,
      mean_freshness_score: computedConfidence.mean_freshness_score,
      computed_by: 'server',
    };
    if (memo.executive_summary) {
      memo.executive_summary.overall_confidence = computedConfidence.confidence_level;
    }
    // ── Wave 1 (C11/C12) — attach authoritative freshness to the memo.
    memo.data_freshness = dataFreshness;

    // ── Boardroom report — attach a compact projection snapshot (display only,
    // no recomputation) so the PDF/scorecard can render real cashflow/waterfall
    // charts from the already-computed projection. Rides inside memo_json.
    memo._exec_projection = (() => {
      const pj = payload?.projection; const sc = payload?.scenario;
      if (!pj) return null;
      return {
        total_capex: pj.total_capex, terminal_value: pj.terminal_value, irr: pj.irr, npv: pj.npv,
        moic: pj.moic, payback_years: pj.payback_years, dscr_stabilized: pj.dscr_stabilized,
        stabilized_ebitda: pj.stabilized_ebitda ?? null,
        stabilized_revenue: pj.stabilized_revenue ?? null,
        total_mw: sc?.total_mw ?? null, pue: sc?.pue ?? null,
        capex_per_mw: (pj.total_capex && sc?.total_mw) ? pj.total_capex / sc.total_mw : null,
        cod_offset_months: pj.cod_offset_months ?? null,
        capex_reconciliation: pj.capex_reconciliation ?? null,
        years: (pj.years || []).map(y => ({ y: y.year, rev: y.revenue, ebitda: y.ebitda, fcf: y.free_cash_flow, cum: y.cumulative_fcf })),
      };
    })();

    // ── Engine-truth pin (Task 1) — overwrite LLM-authored financial metric rows
    // with the engine's authoritative numbers. Mirrors the confidence_block pattern
    // above: server-computed values WIN over LLM-graded values. Any LLM row that
    // has no engine equivalent (qualitative rows) is preserved unchanged.
    if (memo.key_financial_metrics) {
      memo.key_financial_metrics.metrics = reconcileMetricsWithEngine(
        memo.key_financial_metrics.metrics,
        memo._exec_projection,
      );
    }

    // ── Post-Kimi server-side quality checks (Sprint 3.1) ─────────────
    const bannedPhrases = [
      'transformational', 'best-in-class', 'unlock', 'world-leading',
      'innovative', 'cutting-edge', 'industry-leading', 'next-generation',
    ];
    const memoText = JSON.stringify(memo).toLowerCase();
    const bannedFound = bannedPhrases.filter(p => memoText.includes(p));

    const hasDatapointCitations = (memo.intelligence_sources?.length || 0) >= 5;
    const hasTradeoffs = (memo.infrastructure_analysis?.tradeoffs?.length || 0) >= 2;
    const tensionsAddressed = (memo.decision_tensions?.length || 0) >= 2;

    const gradeScore = [
      bannedFound.length === 0,
      hasDatapointCitations,
      hasTradeoffs,
      tensionsAddressed,
    ].filter(Boolean).length;
    const overall_grade = gradeScore === 4 ? 'A' : gradeScore === 3 ? 'B' : gradeScore === 2 ? 'C' : 'D';

    if (bannedFound.length > 0) {
      console.warn('[strategic-memo] quality: banned phrases detected:', bannedFound);
    }

    const memo_quality = {
      banned_phrases_detected: bannedFound,
      has_5plus_datapoint_citations: hasDatapointCitations,
      has_explicit_tradeoffs: hasTradeoffs,
      tensions_addressed: tensionsAddressed,
      overall_grade,
    };

    const generated_at = new Date().toISOString();

    // ── Persist the memo as a permanent, versioned institutional asset ──
    // No user action required: every successful generation creates a row.
    // DB failure must NOT lose the generated memo — we still return it and
    // surface the persistence error.
    let persisted = null;
    try {
      persisted = await persistMemo({
        memo,
        meta: {
          generated_at, provider_used: model_used, generation_time_ms: llmDurationMs,
          stakeholder: oracleCtx.stakeholder || 'operator', region: oracleCtx.region || 'qatar', audience,
        },
        project_id, scenario_id, title,
        actor_id: auth.profile?.id || null,
      });
    } catch (e) {
      persisted = { error: e?.message || 'persist_failed' };
    }

    return NextResponse.json({
      memo,
      persisted,
      generated_at,
      model_used,
      timing_ms: {
        llm: llmDurationMs,
        prompt_chars: promptSize,
      },
      oracle_ctx: {
        stakeholder: oracleCtx.stakeholder || 'operator',
        region: oracleCtx.region || 'qatar',
        overlays: oracleCtx.overlays || [],
      },
      intelligence_brief: {
        datapoints_count: intelligenceBrief.datapoints.length,
        comparables_count: intelligenceBrief.comparables.length,
        tensions_count: intelligenceBrief.tensions.length,
        reality_violations_count: intelligenceBrief.reality_violations.length,
        intelligence_layer_version: intelligenceBrief.intelligence_layer_version,
        // Include the brief itself so the UI can render badges + open
        // datapoint panels without re-querying.
        datapoints: intelligenceBrief.datapoints,
        comparables: intelligenceBrief.comparables,
        tensions: intelligenceBrief.tensions,
        absorption: intelligenceBrief.absorption,
        reality_violations: intelligenceBrief.reality_violations,
      },
      // Strip raw_excerpt before shipping to client (debug-only HTML payload).
      live_intelligence: sanitizeLiveBriefForClient(liveBrief),
      // Wave 1 (C7 + C11/C12) — server-authoritative confidence + freshness.
      confidence: computedConfidence,
      data_freshness: dataFreshness,
      visualization,
      explainability_seed,
      audience,
      memo_quality,
    });
  } catch (e) {
    console.error('[strategic-memo] error:', e?.message);
    return NextResponse.json({ error: e?.message || 'Memo generation failed' }, { status: 500 });
  }
}
