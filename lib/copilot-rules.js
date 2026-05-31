// lib/copilot-rules.js
//
// Deterministic Copilot recommendation engine.
// Pure functions — no fetch, no LLM, no side effects.
//
// buildCopilotSuggestion(state, simResult) → RecommendedSetup | null
//
// Returns null when the current configuration is already optimal or
// when there is insufficient simulation data to form a recommendation.

import { DEAL_ARCHETYPES } from './hearst-deal-structures';

// ── Thresholds ────────────────────────────────────────────────────────────────

const IRR_TARGET_STRONG  = 0.20;  // ≥ 20% = strong IC case
const IRR_TARGET_MIN     = 0.14;  // < 14% = suggest improvement
const DSCR_MIN           = 1.30;  // < 1.3 = financing risk
const DEBT_PCT_MAX_SAFE  = 0.65;  // > 65% = high leverage
const DEBT_PCT_MIN       = 0.40;  // < 40% = under-leveraged (suboptimal)
const UTIL_MIN           = 0.72;  // < 72% = underutilized
const UTIL_MAX_STRESS    = 0.92;  // > 92% = stress assumption
const PAYBACK_MAX        = 9;     // > 9 yr = slow payback
const CAPEX_SMALL_MW     = 20;    // < 20 MW = too small for IC viability

// ── Archetype helpers ─────────────────────────────────────────────────────────

const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

function archScore(id) {
  const a = ARCH_BY_ID[id];
  if (!a) return 0;
  const s = a.scores;
  return s.brand + s.bankability + s.speed + s.control + s.margin + s.exit;
}

// ── Rule definitions ──────────────────────────────────────────────────────────
//
// Each rule:
//   id          : unique string
//   label       : short display label
//   objective   : 'maximize_irr' | 'minimize_risk' | 'conservative' | 'ic_case' | 'balance'
//   test(state, proj) → boolean   : true = rule triggers
//   suggest(state, proj) → fields_to_apply[]
//   rationale   : string
//   tradeoffs   : { type: 'advantage'|'risk', label: string }[]
//   confidence  : 'HIGH' | 'MEDIUM' | 'LOW'

const RULES = [

  // ── R1: Capacity too small for IC viability ───────────────────────────────
  {
    id: 'r_capacity_too_small',
    label: 'Capacity below IC threshold',
    objective: 'ic_case',
    test(state) {
      return (state.total_mw || 0) < CAPEX_SMALL_MW;
    },
    suggest(state) {
      return [
        { field: 'total_mw', label: 'Capacity (MW)', value: 50, current: state.total_mw },
      ];
    },
    rationale:
      'Sub-20 MW projects rarely clear investment committee — fixed costs are too high relative to revenue, and lenders require minimum asset scale for project finance.',
    tradeoffs: [
      { type: 'advantage', label: 'Larger capacity reaches IC-grade NPV and DSCR thresholds' },
      { type: 'risk',      label: 'Higher CAPEX commitment required upfront' },
    ],
    confidence: 'HIGH',
  },

  // ── R2: IRR too low — archetype misfit ────────────────────────────────────
  {
    id: 'r_irr_low_archetype',
    label: 'Low IRR — archetype may not fit',
    objective: 'maximize_irr',
    test(state, proj) {
      if (!proj) return false;
      const irr = proj.irr || 0;
      const arch = state.primary_archetype_id;
      return irr < IRR_TARGET_MIN && arch !== 'powered_shell' && arch !== 'neocloud_gpu';
    },
    suggest(state) {
      const currentScore = archScore(state.primary_archetype_id);
      const better = DEAL_ARCHETYPES
        .filter(a => a.id !== state.primary_archetype_id && archScore(a.id) > currentScore)
        .sort((a, b) => archScore(b.id) - archScore(a.id))[0];
      if (!better) return [];
      return [
        { field: 'primary_archetype_id', label: 'Deal model', value: better.id, current: state.primary_archetype_id },
      ];
    },
    rationale:
      'The current IRR is below the 14% minimum viable threshold. Switching to a higher-scoring archetype typically improves margin without requiring additional capital.',
    tradeoffs: [
      { type: 'advantage', label: 'Higher score archetypes have better margin and bankability' },
      { type: 'risk',      label: 'May require different operator relationships' },
    ],
    confidence: 'MEDIUM',
  },

  // ── R3: IRR low — suggest Powered Shell ──────────────────────────────────
  {
    id: 'r_irr_low_use_shell',
    label: 'IRR below target — Powered Shell recommended',
    objective: 'maximize_irr',
    test(state, proj) {
      if (!proj) return false;
      const irr = proj.irr || 0;
      return irr < IRR_TARGET_MIN && state.primary_archetype_id !== 'powered_shell';
    },
    suggest(state) {
      const fields = [
        { field: 'primary_archetype_id', label: 'Deal model', value: 'powered_shell', current: state.primary_archetype_id },
      ];
      if ((state.hardware_mix?.utilization_pct || 75) < 80) {
        fields.push({ field: 'hardware_mix.utilization_pct', label: 'Utilization', value: 82, current: state.hardware_mix?.utilization_pct });
      }
      return fields;
    },
    rationale:
      'Powered Shell (Shell + Long Lease) delivers the best combination of bankability and margin for Qatar-scale projects. It scores highest on exit and bankability, and the NNN structure reduces opex exposure.',
    tradeoffs: [
      { type: 'advantage', label: 'Highest bankability score — easiest ECA financing' },
      { type: 'advantage', label: 'Eliminates operator opex exposure' },
      { type: 'risk',      label: 'Revenue factor ~33% of full-ops — lower absolute revenue ceiling' },
    ],
    confidence: 'HIGH',
  },

  // ── R4: High leverage — DSCR risk ────────────────────────────────────────
  {
    id: 'r_high_leverage',
    label: 'Leverage above safe threshold',
    objective: 'minimize_risk',
    test(state, proj) {
      if (!proj) return false;
      const dscr = proj.dscr_stabilized || 99;
      const debt = (proj.debt_pct || state.hardware_mix?.debt_pct || 0);
      return dscr < DSCR_MIN || debt > DEBT_PCT_MAX_SAFE;
    },
    suggest(state, proj) {
      const currentDebt = proj?.debt_pct || 0.60;
      const targetDebt  = Math.min(currentDebt, 0.60);
      return [
        { field: 'hardware_mix.debt_pct', label: 'Debt ratio', value: targetDebt, current: currentDebt },
      ];
    },
    rationale:
      'DSCR below 1.3 or debt above 65% signals financing risk. ECA lenders typically require DSCR ≥ 1.35 for project finance drawdown.',
    tradeoffs: [
      { type: 'advantage', label: 'Lower leverage improves DSCR and reduces refinancing risk' },
      { type: 'risk',      label: 'Reduced leverage slightly lowers levered IRR' },
    ],
    confidence: 'HIGH',
  },

  // ── R5: Under-leveraged — IRR opportunity ────────────────────────────────
  {
    id: 'r_under_leveraged',
    label: 'Under-leveraged — debt capacity available',
    objective: 'maximize_irr',
    test(state, proj) {
      if (!proj) return false;
      const irr  = proj.irr || 0;
      const dscr = proj.dscr_stabilized || 0;
      const currentDebt = proj.debt_pct || 0;
      return irr < IRR_TARGET_STRONG && dscr > 1.6 && currentDebt < DEBT_PCT_MIN;
    },
    suggest(state, proj) {
      const currentDebt = proj?.debt_pct || 0.30;
      return [
        { field: 'hardware_mix.debt_pct', label: 'Debt ratio', value: 0.60, current: currentDebt },
      ];
    },
    rationale:
      'DSCR is comfortably above 1.6, indicating unused debt capacity. Increasing leverage to 60% is the standard ECA structure for Qatar sovereign projects and typically adds 3–5 pts to levered IRR.',
    tradeoffs: [
      { type: 'advantage', label: 'Levered IRR improves by ~3–5 points at 60% debt' },
      { type: 'risk',      label: 'Higher fixed debt service — reduces operating flexibility' },
    ],
    confidence: 'MEDIUM',
  },

  // ── R6: Utilization too low ───────────────────────────────────────────────
  {
    id: 'r_utilization_low',
    label: 'Utilization below viable threshold',
    objective: 'balance',
    test(state) {
      const util = state.hardware_mix?.utilization_pct || 75;
      return util < UTIL_MIN;
    },
    suggest(state) {
      return [
        { field: 'hardware_mix.utilization_pct', label: 'Utilization', value: 78, current: state.hardware_mix?.utilization_pct },
      ];
    },
    rationale:
      'Utilization below 72% depresses revenue and compresses EBITDA margin. Qatar hyperscale contracts typically underwire 80–85% utilization as the base take-or-pay case.',
    tradeoffs: [
      { type: 'advantage', label: 'Higher utilization directly improves revenue and EBITDA' },
      { type: 'risk',      label: 'Assumes anchor offtake contract is in place' },
    ],
    confidence: 'HIGH',
  },

  // ── R7: Utilization stress assumption ────────────────────────────────────
  {
    id: 'r_utilization_stress',
    label: 'Utilization above stress ceiling',
    objective: 'minimize_risk',
    test(state) {
      const util = state.hardware_mix?.utilization_pct || 75;
      return util > UTIL_MAX_STRESS;
    },
    suggest(state) {
      return [
        { field: 'hardware_mix.utilization_pct', label: 'Utilization', value: 88, current: state.hardware_mix?.utilization_pct },
      ];
    },
    rationale:
      'Utilization above 92% is a stress assumption rarely underwritten in IC models. Lenders typically cap the base case at 85–88% to preserve downside cushion.',
    tradeoffs: [
      { type: 'advantage', label: 'Conservative utilization improves IC credibility' },
      { type: 'risk',      label: 'Slightly lower projected revenue in base case' },
    ],
    confidence: 'HIGH',
  },

  // ── R8: Slow payback ──────────────────────────────────────────────────────
  {
    id: 'r_slow_payback',
    label: 'Payback exceeds IC threshold',
    objective: 'ic_case',
    test(state, proj) {
      if (!proj) return false;
      return (proj.payback_years || 99) > PAYBACK_MAX;
    },
    suggest(state) {
      const fields = [];
      if (state.primary_archetype_id !== 'powered_shell') {
        fields.push({ field: 'primary_archetype_id', label: 'Deal model', value: 'powered_shell', current: state.primary_archetype_id });
      }
      if ((state.hardware_mix?.utilization_pct || 75) < 82) {
        fields.push({ field: 'hardware_mix.utilization_pct', label: 'Utilization', value: 83, current: state.hardware_mix?.utilization_pct });
      }
      return fields;
    },
    rationale:
      'Payback beyond 9 years is difficult to defend before an IC. Shifting to Powered Shell reduces capex exposure and improves cash yield in years 1–3.',
    tradeoffs: [
      { type: 'advantage', label: 'Shorter payback improves IC score and lender confidence' },
      { type: 'risk',      label: 'Lower total-return ceiling vs full-ops models' },
    ],
    confidence: 'MEDIUM',
  },

  // ── R9: GPU mix sub-optimal for IC ───────────────────────────────────────
  {
    id: 'r_gpu_mix_ic',
    label: 'GPU mix not IC-ready',
    objective: 'ic_case',
    test(state, proj) {
      if (!proj) return false;
      const irr = proj.irr || 0;
      const mix = state.hardware_mix || {};
      const aiPct = mix.ai_pct || 0;
      return irr < IRR_TARGET_STRONG && aiPct < 30;
    },
    suggest(state) {
      const mix = state.hardware_mix || {};
      return [
        { field: 'hardware_mix.ai_pct',     label: 'AI cluster %',   value: 40,  current: mix.ai_pct    },
        { field: 'hardware_mix.liquid_pct',  label: 'Liquid cooling %', value: 40, current: mix.liquid_pct },
        { field: 'hardware_mix.classic_pct', label: 'Standard %',     value: 20,  current: mix.classic_pct},
        { field: 'hardware_mix.gpu_sku_id',  label: 'GPU model',      value: 'gb200_nvl72', current: mix.gpu_sku_id },
      ];
    },
    rationale:
      'AI clusters (GB200 / H100) command the highest $/kW revenue in hyperscale contracts. Increasing AI pct to ≥ 40% with GB200 NVL72 aligns with premium 2025–26 offtake pricing.',
    tradeoffs: [
      { type: 'advantage', label: 'Premium GPU pricing improves revenue/MW by 40–60%' },
      { type: 'risk',      label: 'GB200 supply constraints — lead time 9–12 months' },
      { type: 'risk',      label: 'Higher cooling CAPEX for liquid-cooled clusters' },
    ],
    confidence: 'MEDIUM',
  },
];

// ── Priority: pick the highest-priority matching rule ────────────────────────
//
// Order matters: first match wins. Rules are ordered from most structural
// (capacity, archetype fit) to most tactical (GPU mix).

const RULE_PRIORITY = [
  'r_capacity_too_small',
  'r_irr_low_use_shell',
  'r_irr_low_archetype',
  'r_slow_payback',
  'r_high_leverage',
  'r_under_leveraged',
  'r_utilization_low',
  'r_utilization_stress',
  'r_gpu_mix_ic',
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a single copilot recommendation from the current simulator state
 * and the latest engine result.
 *
 * @param {object} state      Current simulatorReducer state
 * @param {object|null} simResult  Latest result from POST /simulate (may be null)
 * @returns {RecommendedSetup|null}
 */
export function buildCopilotSuggestion(state, simResult) {
  const proj = simResult?.projection || null;

  for (const id of RULE_PRIORITY) {
    const rule = RULES.find(r => r.id === id);
    if (!rule) continue;
    if (!rule.test(state, proj)) continue;

    const fields = rule.suggest(state, proj);
    if (!fields || fields.length === 0) continue;

    // Skip rules that would suggest the same value already in state
    const hasChange = fields.some(f => f.value !== f.current);
    if (!hasChange) continue;

    return {
      rule_id:        rule.id,
      label:          rule.label,
      objective:      rule.objective,
      rationale:      rule.rationale,
      confidence:     rule.confidence,
      tradeoffs:      rule.tradeoffs,
      fields_to_apply: fields,
      requires_confirmation: true,
    };
  }

  return null;
}

/**
 * Human-readable label for a field key.
 */
export function fieldLabel(fieldKey) {
  const MAP = {
    'total_mw':                   'Capacity (MW)',
    'primary_archetype_id':       'Deal model',
    'hardware_mix.utilization_pct': 'Utilization %',
    'hardware_mix.ai_pct':        'AI cluster %',
    'hardware_mix.liquid_pct':    'Liquid cooling %',
    'hardware_mix.classic_pct':   'Standard rack %',
    'hardware_mix.gpu_sku_id':    'GPU model',
    'hardware_mix.debt_pct':      'Debt ratio',
  };
  return MAP[fieldKey] || fieldKey;
}

/**
 * Format a raw field value for display.
 */
export function fmtFieldValue(fieldKey, value) {
  if (value == null) return '—';
  if (fieldKey === 'primary_archetype_id') {
    const a = ARCH_BY_ID[value];
    return a ? a.label : value;
  }
  if (fieldKey.endsWith('_pct') || fieldKey === 'hardware_mix.utilization_pct'
      || fieldKey.endsWith('ai_pct') || fieldKey.endsWith('liquid_pct')
      || fieldKey.endsWith('classic_pct')) {
    const n = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(n)) return n <= 1 ? `${(n * 100).toFixed(0)}%` : `${n}%`;
  }
  if (fieldKey === 'total_mw') return `${value} MW`;
  if (fieldKey === 'hardware_mix.gpu_sku_id') {
    const MAP = { 'gb200_nvl72': 'GB200 NVL72', 'h100_sxm5': 'H100 SXM5', 'h200_sxm5': 'H200 SXM5' };
    return MAP[value] || value;
  }
  return String(value);
}
