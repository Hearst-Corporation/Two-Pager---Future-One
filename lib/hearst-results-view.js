// hearst-results-view.js — pure helpers shared by /results page and inline ResultsStep.
// No JSX. Importé par : app/(cockpit)/admin/hearst/simulator/results/page.jsx
//                       components/hearst/simulator/sections/ResultsStep.jsx
// Additive — ne pas modifier les signatures ni la logique des calculs.

import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { BUSINESS_MODELS, CLIENT_TYPES, FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import { fmtMW, fmtPctFromRatio, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';

// ── Lookup maps ──────────────────────────────────────────
export const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));
export const BUSINESS_BY_ID = Object.fromEntries(BUSINESS_MODELS.map(b => [b.id, b]));
export const CLIENT_BY_ID = Object.fromEntries(CLIENT_TYPES.map(c => [c.id, c]));

// ── Constants ────────────────────────────────────────────
export const DECISION_METRICS = [
  {
    id: 'irr',
    label: UI.RESULTS_DM_IRR,
    note: UI.RESULTS_DM_IRR_NOTE,
    value: p => fmtPctFromRatio(p?.irr),
  },
  {
    id: 'npv',
    label: UI.RESULTS_DM_NPV,
    note: UI.RESULTS_DM_NPV_NOTE,
    value: p => fmtUSD(p?.npv),
  },
  {
    id: 'moic',
    label: UI.RESULTS_DM_MOIC,
    note: UI.RESULTS_DM_MOIC_NOTE,
    value: p => fmtX(p?.moic),
  },
];

export const VIZ_META = {
  radar: {
    label: UI.RESULTS_VIZ_RADAR_LABEL,
    title: UI.RESULTS_VIZ_RADAR_TITLE,
    detail: UI.RESULTS_VIZ_RADAR_DETAIL,
  },
  network: {
    label: UI.RESULTS_VIZ_NETWORK_LABEL,
    title: UI.RESULTS_VIZ_NETWORK_TITLE,
    detail: UI.RESULTS_VIZ_NETWORK_DETAIL,
  },
  matrix: {
    label: UI.RESULTS_VIZ_MATRIX_LABEL,
    title: UI.RESULTS_VIZ_MATRIX_TITLE,
    detail: UI.RESULTS_VIZ_MATRIX_DETAIL,
  },
  sankey: {
    label: UI.RESULTS_VIZ_SANKEY_LABEL,
    title: UI.RESULTS_VIZ_SANKEY_TITLE,
    detail: UI.RESULTS_VIZ_SANKEY_DETAIL,
  },
};

// ── Functions ────────────────────────────────────────────

/**
 * Returns a subtitle string for the scenario hero.
 * @param {object} state
 * @param {object|null} scenario
 * @returns {string}
 */
export function scenarioSubtitle(state, scenario) {
  const arch = ARCH_BY_ID[state.primary_archetype_id];
  const business = BUSINESS_BY_ID[state.business_model_id];
  const client = CLIENT_BY_ID[state.client_type_id];
  return [
    arch?.label || state.primary_archetype_id,
    business?.label || state.business_model_id,
    client?.label || state.client_type_id,
    scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : null,
  ].filter(Boolean).join(' · ');
}

/**
 * Returns capital stack segments for the donut chart.
 * @param {object|null} scenario
 * @param {object|null} projection
 * @returns {Array<{label:string, pct:number, value:number, color:string}>}
 */
export function capitalStackSegments(scenario, projection) {
  const total = projection?.total_capex || 0;
  const debtPct = Math.max(0, Math.min(100, scenario?.debt_pct ?? 0));
  const equityTotal = Math.max(0, 100 - debtPct);
  const hearst = scenario?.equity_hearst_pct ?? 0;
  const brookfield = scenario?.equity_brookfield_pct ?? 0;
  const qatar = scenario?.equity_qatar_pct ?? 0;
  const equityBase = hearst + brookfield + qatar || 1;
  return [
    { label: UI.RESULTS_STACK_DEBT, pct: debtPct, value: total * debtPct / 100, color: 'var(--cp-text-muted)' },
    { label: UI.RESULTS_STACK_HEARST, pct: equityTotal * hearst / equityBase, value: total * equityTotal * hearst / equityBase / 100, color: 'var(--cp-accent-maroon)' },
    { label: UI.RESULTS_STACK_BROOKFIELD, pct: equityTotal * brookfield / equityBase, value: total * equityTotal * brookfield / equityBase / 100, color: 'var(--cp-accent)' },
    { label: UI.RESULTS_STACK_QATAR, pct: equityTotal * qatar / equityBase, value: total * equityTotal * qatar / equityBase / 100, color: 'var(--cp-text-primary)' },
  ].filter(s => s.pct > 0.1);
}

/**
 * Returns a verdict string based on projection KPIs.
 * Thresholds sourced from FINANCIAL_THRESHOLDS (hearst-constants.js):
 *   investment_grade_pct / 100, ic_hurdle_pct / 100,
 *   dscr_strong_threshold, dscr_breach_threshold.
 * @param {object|null} projection
 * @returns {string}
 */
export function decisionVerdict(projection) {
  if (!projection) return UI.RESULTS_VERDICT_PENDING;
  const irr = projection.irr;
  const npv = projection.npv;
  const dscr = projection.dscr_stabilized;
  if (irr == null || npv == null) return UI.RESULTS_VERDICT_INSUFFICIENT;
  if (irr >= FINANCIAL_THRESHOLDS.investment_grade_pct / 100 && npv > 0 && dscr != null && dscr >= FINANCIAL_THRESHOLDS.dscr_strong_threshold) return UI.RESULTS_VERDICT_INVESTMENT_GRADE;
  if (irr >= FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100 && npv > 0 && (dscr == null || dscr >= FINANCIAL_THRESHOLDS.dscr_breach_threshold)) return UI.RESULTS_VERDICT_VIABLE;
  return UI.RESULTS_VERDICT_REWORK;
}

/**
 * Builds the markdown export string for a scenario.
 * Signature changed from {row,…} to {name,…} so both callers pass a title string.
 * @param {{name:string|null, state:object, scenario:object|null, projection:object|null, archetype:object|null}} params
 * @returns {string}
 */
export function buildMemoMd({ name, state, scenario, projection, archetype }) {
  return `# ${name || UI.RESULTS_HERO_FALLBACK_NAME}

## Scenario
- Operating model: ${archetype?.label || state.primary_archetype_id}
- Business model: ${BUSINESS_BY_ID[state.business_model_id]?.label || state.business_model_id}
- Customer layer: ${CLIENT_BY_ID[state.client_type_id]?.label || state.client_type_id}
- Total power: ${scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING}

## KPIs
- Total CAPEX: ${fmtUSD(projection?.total_capex)}
- Stabilized revenue: ${fmtUSD(projection?.stabilized_revenue)}
- Stabilized EBITDA: ${fmtUSD(projection?.stabilized_ebitda)}
- IRR: ${fmtPctFromRatio(projection?.irr)}
- NPV: ${fmtUSD(projection?.npv)}
- MOIC: ${fmtX(projection?.moic)}
- DSCR: ${fmtX(projection?.dscr_stabilized)}
- Terminal value: ${fmtUSD(projection?.terminal_value)}
`;
}
