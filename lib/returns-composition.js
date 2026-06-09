// lib/returns-composition.js
//
// PRESENTATION-TRUTH helper — decomposes equity proceeds into OPERATIONS vs
// TERMINAL-VALUE contribution using EXISTING engine fields only. No new
// economics, no recomputation of IRR/MOIC/NPV, no tax/verdict/solver logic.
//
//   operatingValue      = Σ years[].free_cash_flow_post_tax ?? free_cash_flow ?? fcf
//   terminalEquityValue = terminal_value_to_equity
//                          ?? max(0, terminal_value − remaining_debt_at_exit)
//   totalEquityProceeds = operatingValue + terminalEquityValue
//   operationsPct       = operatingValue / totalEquityProceeds
//   terminalPct         = terminalEquityValue / totalEquityProceeds   (may exceed 1)
//
// Works on a LIVE projection (years carry free_cash_flow_post_tax) and on the
// persisted memo snapshot (years carry `fcf` pre-tax) — identical output shape,
// so Results / Advisor / PDF / Dossier all read the same composition.

const UNAVAILABLE = Object.freeze({
  available: false,
  operatingValue: null,
  terminalEquityValue: null,
  totalEquityProceeds: null,
  operationsPct: null,
  terminalPct: null,
  tier: 'unavailable',
  label: 'Unavailable',
  note: 'Returns composition unavailable.',
  diligence: null,
});

function yearFcfe(y) {
  const v = y?.free_cash_flow_post_tax ?? y?.free_cash_flow ?? y?.fcf;
  return Number.isFinite(v) ? v : null;
}

const EXIT_STRESS = 'Stress the exit multiple from 18x to 12x and 8x.';

/**
 * @param {object|null} projection  live engine projection OR persisted snapshot
 * @returns {{available:boolean, operatingValue:number|null, terminalEquityValue:number|null,
 *            totalEquityProceeds:number|null, operationsPct:number|null, terminalPct:number|null,
 *            tier:string, label:string, note:string, diligence:string|null}}
 */
export function deriveReturnsComposition(projection) {
  const p = projection || {};
  const years = Array.isArray(p.years) ? p.years : null;

  // Operating value — requires at least one usable yearly FCFE.
  let operatingValue = null;
  if (years && years.length) {
    let sum = 0, seen = 0;
    for (const y of years) { const v = yearFcfe(y); if (v != null) { sum += v; seen += 1; } }
    if (seen > 0) operatingValue = sum;
  }

  // Terminal value to equity — canonical field, else gross TV − debt at exit.
  let terminalEquityValue = null;
  if (Number.isFinite(p.terminal_value_to_equity)) {
    terminalEquityValue = p.terminal_value_to_equity;
  } else if (Number.isFinite(p.terminal_value) && Number.isFinite(p.remaining_debt_at_exit)) {
    terminalEquityValue = Math.max(0, p.terminal_value - p.remaining_debt_at_exit);
  }

  if (operatingValue == null || terminalEquityValue == null) return { ...UNAVAILABLE };

  const totalEquityProceeds = operatingValue + terminalEquityValue;

  // No positive proceeds — operations + terminal do not return equity. % undefined.
  if (!(totalEquityProceeds > 0)) {
    return {
      available: true,
      operatingValue, terminalEquityValue, totalEquityProceeds,
      operationsPct: null, terminalPct: null,
      tier: 'no_positive_proceeds',
      label: 'No positive proceeds',
      note: 'No positive equity proceeds — operations and terminal value do not return the invested equity.',
      diligence: EXIT_STRESS,
    };
  }

  const terminalPct = terminalEquityValue / totalEquityProceeds;
  const operationsPct = operatingValue / totalEquityProceeds;
  const tvWhole = Math.round(terminalPct * 100);
  const opsWhole = Math.round(operationsPct * 100);

  let tier, label, note, diligence = null;
  if (terminalPct > 1.0) {
    tier = 'terminal_only';
    label = 'Terminal-only';
    note = 'Operations are net cash-negative; the positive return depends entirely on terminal sale proceeds.';
    diligence = EXIT_STRESS;
  } else if (terminalPct > 0.75) {
    tier = 'terminal_dominant';
    label = 'Terminal-dominant';
    note = `Returns depend primarily on terminal value: ${tvWhole}% of equity value depends on the exit multiple.`;
    diligence = EXIT_STRESS;
  } else if (terminalPct > 0.50) {
    tier = 'exit_weighted';
    label = 'Exit-weighted';
    note = `Exit-weighted case: ${tvWhole}% of equity value is realized at sale.`;
    diligence = EXIT_STRESS;
  } else {
    tier = 'normal';
    label = 'Operations-led';
    note = `Operations contribute the majority of equity value (${opsWhole}%).`;
  }

  return {
    available: true,
    operatingValue, terminalEquityValue, totalEquityProceeds,
    operationsPct, terminalPct,
    tier, label, note, diligence,
  };
}
