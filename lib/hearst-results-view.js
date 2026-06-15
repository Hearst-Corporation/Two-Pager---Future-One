// hearst-results-view.js — helpers partagés page /results.

import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { BUSINESS_MODELS, CLIENT_TYPES, FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import { fmtMW, fmtPctFromRatio, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';
import { deriveReturnsComposition } from '@/lib/returns-composition';

// ── Lookup maps ──────────────────────────────────────────
export const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));
export const BUSINESS_BY_ID = Object.fromEntries(BUSINESS_MODELS.map(b => [b.id, b]));
export const CLIENT_BY_ID = Object.fromEntries(CLIENT_TYPES.map(c => [c.id, c]));

export function formatBusinessClientPair(businessModelId, clientTypeId) {
  const bm = BUSINESS_BY_ID[businessModelId]?.label || businessModelId;
  const ct = CLIENT_BY_ID[clientTypeId]?.label || clientTypeId;
  return `${bm} / ${ct}`;
}

// ── Constants ────────────────────────────────────────────
// Board-facing decision metrics are POST-TAX (P0-2). Each carries a pre-tax
// sub-value for transparency. value() falls back to pre-tax only if the post-tax
// field is absent (older persisted projections), keeping the display honest.
// The pre-tax sub-figure is suppressed when post-tax equals pre-tax (e.g.
// sale_leaseback, whose cash flows are already net of capital-gains tax), to
// avoid printing the same number twice — mirrors the chat grounding block.
export const DECISION_METRICS = [
  {
    id: 'irr',
    label: UI.RESULTS_DM_IRR,
    note: UI.RESULTS_DM_IRR_NOTE,
    value: p => fmtPctFromRatio(p?.irr_post_tax ?? p?.irr),
    subValue: p => (p?.irr_post_tax != null && p?.irr != null && p?.irr !== p?.irr_post_tax) ? `${UI.RESULTS_DM_PRETAX_PREFIX} ${fmtPctFromRatio(p?.irr)}` : null,
  },
  {
    id: 'npv',
    label: UI.RESULTS_DM_NPV,
    note: UI.RESULTS_DM_NPV_NOTE,
    value: p => fmtUSD(p?.npv_post_tax ?? p?.npv),
    subValue: p => (p?.npv_post_tax != null && p?.npv != null && p?.npv !== p?.npv_post_tax) ? `${UI.RESULTS_DM_PRETAX_PREFIX} ${fmtUSD(p?.npv)}` : null,
  },
  {
    id: 'moic',
    label: UI.RESULTS_DM_MOIC,
    note: UI.RESULTS_DM_MOIC_NOTE,
    value: p => fmtX(p?.moic_post_tax ?? p?.moic),
    subValue: p => (p?.moic_post_tax != null && p?.moic != null && p?.moic !== p?.moic_post_tax) ? `${UI.RESULTS_DM_PRETAX_PREFIX} ${fmtX(p?.moic)}` : null,
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
    { label: UI.RESULTS_STACK_BROOKFIELD, pct: equityTotal * brookfield / equityBase, value: total * equityTotal * brookfield / equityBase / 100, color: 'var(--cp-op-brookfield)' },
    { label: UI.RESULTS_STACK_QATAR, pct: equityTotal * qatar / equityBase, value: total * equityTotal * qatar / equityBase / 100, color: 'var(--cp-op-qia)' },
  ].filter(s => s.pct > 0.1);
}


/**
 * Builds the markdown export string for a scenario.
 * Signature changed from {row,…} to {name,…} so both callers pass a title string.
 * @param {{name:string|null, state:object, scenario:object|null, projection:object|null, archetype:object|null}} params
 * @returns {string}
 */
export function buildMemoMd({ name, state, scenario, projection, archetype }) {
  const c = deriveReturnsComposition(projection);
  const terminalPct = c.available && c.terminalPct != null ? Math.round(c.terminalPct * 100) : null;
  const terminalSentence = terminalPct != null ? `\n*Returns are ${terminalPct}% terminal-value dependent.*\n` : '';
  const warnings = projection?.warnings?.length ? `\n### Risks & Mitigants\n${projection.warnings.map(w => `- ⚠️ ${w}`).join('\n')}\n` : '';
  
  const moicVal = projection?.moic_post_tax ?? projection?.moic;
  
  return `# ${name || UI.RESULTS_HERO_FALLBACK_NAME}

**Deploy ${fmtUSD(projection?.total_capex)} into a ${scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) + ' ' : ''}${archetype?.label || state.primary_archetype_id} in ${state.geography} targeting ${fmtPctFromRatio(projection?.irr_post_tax ?? projection?.irr)} IRR and ${moicVal ? moicVal.toFixed(1) : '—'}x MOIC.**
${terminalSentence}${warnings}
## Headline Metrics
- **IRR (Post-tax):** ${fmtPctFromRatio(projection?.irr_post_tax ?? projection?.irr)}
- **MOIC (Post-tax):** ${fmtX(projection?.moic_post_tax ?? projection?.moic)}
- **Peak Capital Required:** ${fmtUSD(projection?.total_capex)}
- **Stabilized EBITDA:** ${fmtUSD(projection?.stabilized_ebitda)}
- **Payback Period:** ${projection?.payback_years != null ? `${projection.payback_years} yr` : MISSING}

## Scenario Configuration
| Parameter | Value |
| :--- | ---: |
| Operating Model | ${archetype?.label || state.primary_archetype_id} |
| Business Model | ${BUSINESS_BY_ID[state.business_model_id]?.label || state.business_model_id} |
| Client Profile | ${CLIENT_BY_ID[state.client_type_id]?.label || state.client_type_id} |
| IT Capacity | ${scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING} |

## Capital Structure
| Source | Value |
| :--- | ---: |
| Equity Invested | ${fmtUSD(projection?.equity_invested)} |
| Total CAPEX | ${fmtUSD(projection?.total_capex)} |
| Terminal Value | ${fmtUSD(projection?.terminal_value)} |
| DSCR (Stabilized) | ${fmtX(projection?.dscr_stabilized)} |
`;
}
