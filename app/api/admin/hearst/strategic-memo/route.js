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
// Auth : editor requis (la route persiste une ligne versionnée du mémo en DB via persistMemo).
// Modèle : OpenAI GPT-4.1 (aucun fallback provider). Si l'appel
// échoue/timeout, on retombe sur un mémo déterministe local (sans LLM).
// Rate-limit : 5 req/min/actor en prod, skip en dev.

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { authedWrite } from '@/lib/supabase-admin';
import { MemoGenerateSchema } from '@/lib/validators/hearst';
import { openaiChatCompletion, OPENAI_MEMO_MODEL } from '@/lib/llm/openai';
import { buildOracleSystemPrompt } from '@/lib/oracle-system-prompt';
import { buildIntelligenceBrief } from '@/lib/oracle-intelligence';
import { getGpuPricingBrief, getEnergyBrief, getInfrastructureSignals } from '@/lib/oracle-live';
import { build2DDiagramSpec, buildTopologySpec, buildDeploymentPhaseSpec } from '@/lib/oracle-visualization';
import { explainMetric, simplifyTechnicalTerm } from '@/lib/oracle-explainability';
import { fmtUSD, fmtPctFromRatio, fmtX } from '@/lib/hearst-format';
import { generateProjection, foldGpuRevenue } from '@/lib/hearst-calculations';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import { assertNoPromises, freshnessStatusFromTimestamp, computeDataFreshness, computeConfidenceBlock } from '@/lib/memo-confidence';
import { persistMemo } from '@/lib/strategic-memo-store';
import { reconcileMetricsWithEngine } from '@/lib/engine-reconcile';
import {
  RATE_LIMIT_WINDOW_MS as RL_WINDOW,
  RATE_LIMIT_MAX_REQUESTS as RL_MAX,
  MEMO_LLM_SOFT_TIMEOUT_MS,
} from '@/lib/constants';
import { rateLimit } from '@/lib/rate-limit';
import { DEFAULT_GEOGRAPHY } from '@/app/admin/hearst/utils/constants';

// OpenAI GPT-4.1 can run several minutes in the worst case. Without this
// the route inherits the Vercel default (~10-15s) and 504s mid-generation. 300s =
// plan max, matched by the client timeout (MEMO_CLIENT_TIMEOUT_MS).
export const maxDuration = 300;

// Rate limit : RL_MAX (5) req / RL_WINDOW (60s) par actor en prod, skip en dev.
// Backed by lib/rate-limit (Upstash Redis distribué + fallback in-memory) — un
// compteur in-memory pur se réinitialisait à chaque cold start Vercel, laissant un
// attaquant bypasser le cap et déclencher des appels GPT-4.1 illimités (coût OpenAI).
async function checkRl(actorId) {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };
  const rl = await rateLimit(actorId, { limit: RL_MAX, windowSec: Math.round(RL_WINDOW / 1000) });
  return { allowed: rl.ok, retryAfter: rl.resetSec };
}

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
- explainability.why_this_recommendation MUST start with "We recommend X because Y" and name the supporting evidence in plain prose (e.g. "supported by Equinix FY2024 10-K"). Do NOT emit bracketed tokens like [datapoint_id Z]; cite the source by its real name. Not "This is an opportunity to..."`;

// Strip raw_excerpt + any debug payload from the live brief before sending to
// the client. raw_excerpt carries the first 200 chars of provider HTML, useful
// for server-side debug but pure noise (and a small leak surface) in the API
// response.
function sanitizeLiveBriefForClient(brief) {
  if (!brief || typeof brief !== 'object') return brief;
  const stripExcerpt = (o) => {
    if (!o || typeof o !== 'object') return o;
    const { raw_excerpt: _raw_excerpt, ...rest } = o;
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
    parts.push(`Projection : total CAPEX ${f(projection.total_capex, 'usd')} · stab. EBITDA ${f(projection.stabilized_ebitda, 'usd')} · IRR post-tax ${f(projection.irr_post_tax ?? projection.irr, 'pct')} (pre-tax ${f(projection.irr, 'pct')}) · MOIC post-tax ${f(projection.moic_post_tax ?? projection.moic, 'x')} (pre-tax ${f(projection.moic, 'x')}) · payback ${projection.payback_years ?? '?'} yr · DSCR ${projection.dscr_stabilized ? f(projection.dscr_stabilized, 'x') : 'N/A'} · NPV post-tax ${f(projection.npv_post_tax ?? projection.npv, 'usd')} (pre-tax ${f(projection.npv, 'usd')}) · TV ${f(projection.terminal_value, 'usd')}${projection.tax_assumptions ? ` · Tax ${projection.tax_assumptions.income_tax_rate_pct}% (Qatar, straight-line D&A ${projection.tax_assumptions.depreciable_life_years}y; returns are levered equity)` : ''}`);
    if (projection?.warnings?.length) {
      parts.push(`Engine warnings : ${projection.warnings.join(' | ')}`);
    }
  }
  if (hardware_breakdown) {
    parts.push(`Hardware : ${hardware_breakdown.mw_classic?.toFixed(1)} MW classic / ${hardware_breakdown.mw_liquid?.toFixed(1)} MW liquid / ${hardware_breakdown.mw_ai?.toFixed(1)} MW AI · ${hardware_breakdown.total_gpus} GPUs (${hardware_breakdown.gpu?.sku || 'n/a'})`);
  }
  if (source_map) {
    parts.push(`source_map filled : ${Object.keys(source_map).length} fields · confidence_score ${confidence_score ?? 'N/A'}`);
  }
  return parts.join('\n');
}

function compactIntelligenceBriefForModel(brief) {
  if (!brief) return brief;
  return {
    region: brief.region,
    archetype_id: brief.archetype_id,
    intelligence_layer_version: brief.intelligence_layer_version,
    datapoints: (brief.datapoints || []).slice(0, 8).map(d => ({
      id: d.id,
      entity_id: d.entity_id,
      confidence: d.confidence,
      trust: d.trust,
      freshness_status: d.freshness_status,
      metrics: d.metrics,
      source_name: d.source_name,
      caveat: d.caveat,
    })),
    comparables: (brief.comparables || []).slice(0, 5).map(c => ({
      entity_id: c.entity_id,
      profile: Object.fromEntries(
        Object.entries(c.profile || {}).slice(0, 5).map(([key, value]) => [
          key,
          typeof value === 'string' && value.length > 240 ? `${value.slice(0, 237)}...` : value,
        ]),
      ),
    })),
    tensions: (brief.tensions || []).map(t => ({
      id: t.id,
      label: t.label,
      pole_a: t.pole_a,
      pole_b: t.pole_b,
    })),
    absorption: brief.absorption,
    reality_violations: brief.reality_violations || [],
  };
}

function compactLiveBriefForModel(brief) {
  if (!brief) return brief;
  return {
    gpu_pricing: brief.gpu_pricing && {
      summary: brief.gpu_pricing.summary,
      freshness_tag: brief.gpu_pricing.freshness_tag,
      median_observed: brief.gpu_pricing.median_observed,
      prices: (brief.gpu_pricing.prices || []).slice(0, 4).map(p => ({
        provider: p.provider,
        sku: p.sku,
        price_usd_hr: p.price_usd_hr,
        freshness_tag: p.freshness_tag,
      })),
    },
    energy: brief.energy && {
      summary: brief.energy.summary,
      tariff_used: brief.energy.tariff_used,
      freshness_tag: brief.energy.freshness_tag,
    },
    signals: (brief.signals?.signals || brief.signals || []).slice(0, 5).map(s => ({
      id: s.id,
      title: s.title,
      severity: s.severity,
      implication: s.implication,
    })),
  };
}

function buildProjectionSnapshot(payload) {
  const pj = payload?.projection; const sc = payload?.scenario;
  if (!pj) return null;
  return {
    total_capex: pj.total_capex, terminal_value: pj.terminal_value, irr: pj.irr, npv: pj.npv,
    moic: pj.moic, payback_years: pj.payback_years, dscr_stabilized: pj.dscr_stabilized,
    // P0-2 — post-tax board-facing returns + tax basis (pre-tax kept above).
    irr_post_tax: pj.irr_post_tax ?? null, npv_post_tax: pj.npv_post_tax ?? null,
    moic_post_tax: pj.moic_post_tax ?? null, tax_assumptions: pj.tax_assumptions ?? null,
    stabilized_ebitda: pj.stabilized_ebitda ?? null,
    stabilized_revenue: pj.stabilized_revenue ?? null,
    total_mw: sc?.total_mw ?? null, pue: sc?.pue ?? null,
    capex_per_mw: (pj.total_capex && sc?.total_mw) ? pj.total_capex / sc.total_mw : null,
    cod_offset_months: pj.cod_offset_months ?? null,
    capex_reconciliation: pj.capex_reconciliation ?? null,
    years: (pj.years || []).map(y => ({ y: y.year, rev: y.revenue, ebitda: y.ebitda, fcf: y.free_cash_flow, cum: y.cumulative_fcf })),
    // Extended fields (AC-C3)
    equity_invested: pj.equity_invested ?? null,
    idc: pj.idc ?? null,
    construction_years: pj.construction_years ?? null,
    terminal_value_to_equity: pj.terminal_value_to_equity ?? null,
    remaining_debt_at_exit: pj.remaining_debt_at_exit ?? null,
    revenue_start_year: pj.revenue_start_year ?? null,
    warnings: pj.warnings ?? [],
    gpu_refresh: pj.gpu_refresh ?? null,
  };
}

function buildDeterministicMemo({ payload, intelligenceBrief, computedConfidence, dataFreshness, audience }) {
  const projection = payload?.projection || {};
  const scenario = payload?.scenario || {};
  const fmtMaybe = (value, kind) => value == null ? 'Not modeled' : kind === 'pct' ? fmtPctFromRatio(value) : kind === 'usd' ? fmtUSD(value) : kind === 'x' ? fmtX(value) : String(value);
  const primaryConcern = projection?.warnings?.[0]
    || (projection.irr != null && projection.irr < FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100 ? 'IRR is below the IC review threshold.' : 'No blocking engine warning surfaced.');
  const realityFlags = intelligenceBrief.reality_violations || [];
  const topDatapoints = (intelligenceBrief.datapoints || []).slice(0, 5);
  const tensions = intelligenceBrief.tensions || [];

  return {
    executive_summary: {
      headline: 'Engine-backed strategic memo generated without LLM narrative',
      bullets: [
        `IRR ${fmtMaybe(projection.irr, 'pct')} · MOIC ${fmtMaybe(projection.moic, 'x')} · Payback ${projection.payback_years ?? 'Not modeled'} years.`,
        `Total CAPEX ${fmtMaybe(projection.total_capex, 'usd')} for ${scenario.total_mw ?? 'unknown'} MW.`,
        primaryConcern,
      ],
      overall_confidence: computedConfidence.confidence_level,
    },
    confidence_block: {
      ...computedConfidence,
      estimation_quality: 'Generated from the simulator output and curated intelligence because the LLM provider exceeded the response window.',
      known_unknowns: ['Narrative synthesis was not produced by the LLM.', 'Human review is required before IC circulation.'],
      computed_by: 'server',
    },
    strategic_context: {
      body: 'This memo preserves engine-owned numbers and marks the narrative as deterministic fallback. Use it as a decision canvas seed, not a final board memo.',
      skip: false,
    },
    key_financial_metrics: {
      metrics: [
        { label: 'IRR (Post-tax, levered equity)', value: fmtMaybe(projection.irr_post_tax ?? projection.irr, 'pct'), unit: '', confidence: computedConfidence.confidence_level, source: 'ENGINE' },
        { label: 'IRR (Pre-tax, levered equity)', value: fmtMaybe(projection.irr, 'pct'), unit: '', confidence: computedConfidence.confidence_level, source: 'ENGINE' },
        { label: 'MOIC (Post-tax)', value: fmtMaybe(projection.moic_post_tax ?? projection.moic, 'x'), unit: '', confidence: computedConfidence.confidence_level, source: 'ENGINE' },
        { label: 'NPV (Post-tax)', value: fmtMaybe(projection.npv_post_tax ?? projection.npv, 'usd'), unit: '', confidence: computedConfidence.confidence_level, source: 'ENGINE' },
        { label: 'CAPEX', value: fmtMaybe(projection.total_capex, 'usd'), unit: '', confidence: computedConfidence.confidence_level, source: 'ENGINE' },
        { label: 'Payback', value: projection.payback_years ?? 'Not modeled', unit: projection.payback_years == null ? '' : 'years', confidence: computedConfidence.confidence_level, source: 'ENGINE' },
      ],
      narrative: 'Financial rows are pinned to the simulator engine; no LLM-authored figures are included.',
    },
    infrastructure_analysis: {
      body: `Scenario scale: ${scenario.total_mw ?? 'unknown'} MW · PUE ${scenario.pue ?? 'unknown'} · AI allocation ${scenario.hardware_mix?.ai_pct ?? 0}%.`,
      tradeoffs: tensions.slice(0, 3).map(t => `Choosing ${t.pole_a} over ${t.pole_b} requires IC review; accepting quantified tradeoff pending human synthesis.`),
    },
    market_benchmarking: {
      comparables: (intelligenceBrief.comparables || []).slice(0, 5).map(c => ({
        name: c.entity_id,
        metric: 'Comparable profile',
        value: 'Referenced',
        source: 'ORACLE intelligence layer',
      })),
      structural_differences: (intelligenceBrief.comparables || []).slice(0, 3).map(c => `${c.entity_id}: profile is structurally comparable but not automatically interchangeable with this scenario.`),
    },
    risks_constraints: {
      items: [
        { category: 'other', label: primaryConcern, severity: primaryConcern.includes('No blocking') ? 'LOW' : 'MEDIUM', mitigation: 'Review engine assumptions and rerun sensitivity before approval.', dependency: 'IC assumption review' },
        ...realityFlags.slice(0, 4).map(flag => ({ category: 'other', label: flag, severity: 'MEDIUM', mitigation: 'Validate with delivery, permitting and procurement workstream owners.', dependency: 'Execution diligence' })),
      ].slice(0, 5),
    },
    strategic_opportunities: {
      items: [
        { label: 'Use engine-backed memo as decision seed', execution_path: 'Why: simulator returned usable KPIs. Alternative: wait for LLM narrative. Accepted risk: less prose nuance. Metric: IC can review IRR/MOIC/CAPEX without provider delay.', confidence: computedConfidence.confidence_level },
      ],
    },
    recommended_architecture: {
      config: {
        mw: scenario.total_mw != null ? `${scenario.total_mw} MW` : 'Not modeled',
        tier: scenario.tier || 'Not modeled',
        cooling: scenario.hardware_mix?.liquid_pct ? `${scenario.hardware_mix.liquid_pct}% liquid allocation` : 'Standard / not modeled',
        rack_mix: scenario.hardware_mix ? `${scenario.hardware_mix.classic_pct ?? 0}% classic / ${scenario.hardware_mix.liquid_pct ?? 0}% liquid / ${scenario.hardware_mix.ai_pct ?? 0}% AI` : 'Not modeled',
        gpu_sku: scenario.hardware_mix?.gpu_sku_id || 'Not modeled',
        networking: 'Not modeled',
        phasing: scenario.phase1_complete_year ? `Phase 1 by year ${scenario.phase1_complete_year}` : 'Not modeled',
      },
      rationale: `We recommend IC review because the engine shows ${fmtMaybe(projection.irr, 'pct')} IRR supported by ENGINE metrics, while ${primaryConcern}`,
    },
    commercialization_strategy: {
      pricing: scenario.price_hyperscale_kw_month != null ? `$${scenario.price_hyperscale_kw_month}/kW/mo hyperscale` : 'Not modeled',
      contract_structure: 'Requires IC structuring review',
      anchor_tenant: 'Not modeled',
      ramp_profile: scenario.target_occupancy_pct != null ? `${scenario.target_occupancy_pct}% target occupancy` : 'Not modeled',
    },
    deployment_roadmap: {
      phases: [
        { label: 'IC review', months_from_t0: '0', gating_events: ['Validate engine assumptions', 'Review risks', 'Rerun memo when LLM provider is healthy'] },
      ],
      reality_check_flags: realityFlags,
    },
    long_term_strategic_value: {
      ten_year_arc: 'Long-term value depends on occupancy, capital intensity, power availability and contract structure.',
      speculative_branches: [],
    },
    decision_tensions: tensions.map(t => ({ id: t.id, verdict: `Requires human IC synthesis between ${t.pole_a} and ${t.pole_b}.` })),
    intelligence_sources: topDatapoints.map(d => ({ datapoint_id: d.id, used_for: 'fallback memo grounding', trust: (d.confidence || 'medium').toUpperCase() })),
    explainability: {
      audience,
      simplified_takeaways: ['The simulator produced usable numbers.', 'The AI memo writer timed out.', 'This fallback keeps the numbers and avoids inventing narrative.'],
      jargon_translations: {
        IRR: explainMetric('IRR', audience).short,
        PUE: explainMetric('PUE', audience).short,
        DSCR: explainMetric('DSCR', audience).short,
        payback: explainMetric('payback', audience).short,
      },
      why_this_recommendation: (() => {
        const src = topDatapoints[0]?.source_name;
        const tail = src ? ` supported by ${src}` : '';
        return `We recommend IC review because simulator metrics show ${fmtMaybe(projection.irr, 'pct')} IRR${tail}.`;
      })(),
    },
    _exec_projection: buildProjectionSnapshot(payload),
    data_freshness: dataFreshness,
    _generation_mode: 'deterministic_fallback',
  };
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  const rl = await checkRl(auth.profile.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  let rawBody;
  try { rawBody = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const parseResult = MemoGenerateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'validation_failed', issues: parseResult.error.issues }, { status: 400 });
  }

  let { payload, oracle = {}, user_question, project_id = null, scenario_id = null, title = null } = parseResult.data;

  // ── Part A: server-side projection recompute (kills "trust client projection") ──
  // payload.scenario IS the post-archetype scenario (simulate returns archResult.scenario).
  // We recompute from the engine and use that as the source of truth instead of
  // whatever the client sent in payload.projection (which may be fabricated/empty).
  let serverProjection = null;
  if (payload?.scenario) {
    try {
      serverProjection = generateProjection(payload.scenario);
      const hb = payload.hardware_breakdown;
      if (serverProjection?.years?.length && hb && ((hb.revenue_ai_annual > 0) || (hb.capex_hardware > 0))) {
        foldGpuRevenue(serverProjection, hb, payload.scenario, {
          rfs_year: payload.scenario.phase1_complete_year || 3, ramp_years: 2,
          exit_year: payload.scenario.exit_year || 10,
          discount_rate_pct: payload.scenario.discount_rate_pct ?? FINANCIAL_THRESHOLDS.discount_rate_pct,
        });
      }
    } catch (e) {
      Sentry.captureException(e, {
        level: 'warning',
        tags: { route: 'strategic-memo', stage: 'projection_recompute' },
        extra: { actor_id: auth.profile?.id ?? 'anon' },
      });
      serverProjection = null;
    }
  }
  const truthProjection = (serverProjection && serverProjection.years?.length) ? serverProjection : (payload?.projection || null);
  // Replace payload.projection with the engine-authoritative value so all downstream reads use it.
  payload = { ...payload, projection: truthProjection };

  const audience = parseResult.data.audience ?? 'investor';

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
    region: oracle.region || DEFAULT_GEOGRAPHY,
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
    getGpuPricingBrief({ region: oracleCtx.region || DEFAULT_GEOGRAPHY }),
    getEnergyBrief({ region: oracleCtx.region || DEFAULT_GEOGRAPHY, archetype_id: archetypeId }),
    getInfrastructureSignals({ region: oracleCtx.region || DEFAULT_GEOGRAPHY, archetype_id: archetypeId, min_severity: 'medium' }),
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
  const modelIntelligenceBrief = compactIntelligenceBriefForModel(intelligenceBrief);
  const modelLiveBrief = compactLiveBriefForModel(liveBrief);
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
    JSON.stringify(modelIntelligenceBrief),
    '',
    '── Authoritative confidence (computed server-side — DO NOT alter) ──',
    'These values are computed from datapoint trust + freshness scores. Copy confidence_block.confidence_level and confidence_block.source_density VERBATIM from here. You MAY write estimation_quality and known_unknowns as explanation, but you must NOT invent the confidence level or source density.',
    JSON.stringify(computedConfidence),
    '',
    '── Data freshness (computed server-side — DO NOT alter) ──',
    `Display "Data as of ${dataFreshness.data_as_of}" prominently in the memo. Overall data status: ${dataFreshness.overall_status}. Never present a STALE or EXPIRED datapoint as current — label any dated figure explicitly (e.g. "as of <date>, may have moved").`,
    JSON.stringify(dataFreshness),
    '',
    '── Infrastructure intelligence (curated benchmarks + live data where available) ──',
    'These are infrastructure intelligence signals. Cite freshness tags and signals in the relevant sections (live_intelligence block). Where live data is unavailable, surface it as a known unknown rather than fabricating a value. Do not describe figures as "real-time" unless the freshness_tag is FRESH.',
    `Audience for this memo: ${audience}. Use the explainability_seed jargon_translations to simplify technical terms in the explainability section.`,
    `- explainability.simplified_takeaways MUST exclude every term flagged by lib/oracle-explainability.detectJargon() for the chosen audience. Re-write any takeaway that contains banned jargon.`,
    `- explainability.why_this_recommendation MUST start with "We recommend X because Y" and name the supporting evidence in plain prose (e.g. "supported by Equinix FY2024 10-K"). Do NOT emit bracketed tokens like [datapoint_id Z]; cite the source by its real name. Not "This is an opportunity to..."`,
    '',
    JSON.stringify(modelLiveBrief),
    '',
    MEMO_SCHEMA_INSTRUCTIONS,
  ].join('\n');

  try {
    // Timing transparent — pour identifier les hotspots et donner au caller
    // une indication de durée par étape (visible dans la réponse `timing`).
    const promptSize = systemPrompt.length + userMessage.length;
    let memo;
    let model_used = OPENAI_MEMO_MODEL;
    let llmDurationMs = 0;
    const llmStart = Date.now();
    const llmTimeout = new Promise(resolve => {
      setTimeout(() => resolve({ __timeout: true }), MEMO_LLM_SOFT_TIMEOUT_MS);
    });

    try {
      const llmResult = await Promise.race([
        openaiChatCompletion({
          model: OPENAI_MEMO_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage },
          ],
          temperature: 0.0,
          max_tokens: 9000,
          response_format: { type: 'json_object' },
        }),
        llmTimeout,
      ]);
      llmDurationMs = Date.now() - llmStart;

      if (llmResult?.__timeout) {
        Sentry.captureMessage('[strategic-memo] LLM soft timeout; using deterministic fallback', {
          level: 'warning',
          tags: { route: 'strategic-memo', stage: 'llm_timeout' },
          extra: { actor_id: auth.profile?.id ?? 'anon', llm_duration_ms: llmDurationMs },
        });
        memo = buildDeterministicMemo({ payload, intelligenceBrief, computedConfidence, dataFreshness, audience });
        model_used = 'deterministic-fallback';
      } else {
        model_used = llmResult.model_used;

        const rawContent = llmResult.response.choices?.[0]?.message?.content || '';
        // Strip markdown fences (model sometimes wraps JSON in ```json ... ```)
        const content = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        try { memo = JSON.parse(content); }
        catch (e) {
          // Second attempt: extract first {...} block in case of surrounding text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try { memo = JSON.parse(jsonMatch[0]); }
            catch { /* fall through to error */ }
          }
          if (!memo) {
            // Do NOT log the raw LLM output: it may carry sensitive/confidential
            // memo content and Langfuse already traces the full LLM call. Emit only
            // non-reversible metadata (length + sha256 hash) to correlate without leaking.
            Sentry.captureMessage('[strategic-memo] LLM JSON parse failed; using deterministic fallback', {
              level: 'warning',
              tags: { route: 'strategic-memo', stage: 'llm_parse_failed' },
              extra: {
                actor_id: auth.profile?.id ?? 'anon',
                raw_length: rawContent.length,
                raw_sha256: crypto.createHash('sha256').update(rawContent).digest('hex'),
              },
            });
            memo = buildDeterministicMemo({ payload, intelligenceBrief, computedConfidence, dataFreshness, audience });
            model_used = 'deterministic-fallback';
          }
        }
      }
    } catch (e) {
      llmDurationMs = Date.now() - llmStart;
      Sentry.captureException(e, {
        level: 'warning',
        tags: { route: 'strategic-memo', stage: 'llm_failed' },
        extra: { actor_id: auth.profile?.id ?? 'anon', llm_duration_ms: llmDurationMs },
      });
      memo = buildDeterministicMemo({ payload, intelligenceBrief, computedConfidence, dataFreshness, audience });
      model_used = 'deterministic-fallback';
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
    // DRY: single source of truth via buildProjectionSnapshot (AC-C3).
    memo._exec_projection = buildProjectionSnapshot(payload);

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

    // ── Post-LLM server-side quality checks (Sprint 3.1) ─────────────
    const bannedPhrases = [
      'transformational', 'best-in-class', 'unlock', 'world-leading',
      'innovative', 'cutting-edge', 'industry-leading', 'next-generation',
    ];
    const memoText = JSON.stringify(memo).toLowerCase();
    const bannedFound = bannedPhrases.filter(p => memoText.includes(p));

    const QUALITY_MIN_CITATIONS = 5;
    const QUALITY_MIN_TRADEOFFS = 2;
    const QUALITY_MIN_TENSIONS = 2;
    const hasDatapointCitations = (memo.intelligence_sources?.length || 0) >= QUALITY_MIN_CITATIONS;
    const hasTradeoffs = (memo.infrastructure_analysis?.tradeoffs?.length || 0) >= QUALITY_MIN_TRADEOFFS;
    const tensionsAddressed = (memo.decision_tensions?.length || 0) >= QUALITY_MIN_TENSIONS;

    const gradeScore = [
      bannedFound.length === 0,
      hasDatapointCitations,
      hasTradeoffs,
      tensionsAddressed,
    ].filter(Boolean).length;
    const overall_grade = gradeScore === 4 ? 'A' : gradeScore === 3 ? 'B' : gradeScore === 2 ? 'C' : 'D';

    if (bannedFound.length > 0) {
      Sentry.captureMessage('[strategic-memo] quality: banned phrases detected', {
        level: 'warning',
        tags: { route: 'strategic-memo', stage: 'quality_banned_phrases' },
        extra: { actor_id: auth.profile?.id ?? 'anon', banned_found: bannedFound },
      });
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
          stakeholder: oracleCtx.stakeholder || 'operator', region: oracleCtx.region || DEFAULT_GEOGRAPHY, audience,
        },
        project_id, scenario_id, title,
        actor_id: auth.profile?.id || null,
      });
    } catch (e) {
      Sentry.captureException(e, {
        tags: { route: 'strategic-memo', stage: 'persist' },
        extra: { actor_id: auth.profile?.id ?? 'anon' },
      });
      persisted = { error: 'persist_failed' };
    }

    const persistFailed = !!(persisted && persisted.error);
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
        region: oracleCtx.region || DEFAULT_GEOGRAPHY,
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
    }, persistFailed ? { status: 207 } : undefined);
  } catch (e) {
    Sentry.captureException(e, {
      tags: { route: 'strategic-memo', stage: 'top_level' },
      extra: { actor_id: auth.profile?.id ?? 'anon' },
    });
    return NextResponse.json({ error: 'memo_generation_failed' }, { status: 500 });
  }
}
