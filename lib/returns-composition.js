// lib/returns-composition.js
//
// Decomposes a projection's total return into Operations vs Terminal components.
// Returns raw ratios (may exceed 1.0 in terminal-dominant deals) — callers
// are responsible for clamping display labels.

/**
 * Compute the operations/terminal share of total equity return.
 *
 * Operations value = Σ per-year free_cash_flow_post_tax (preferred) or
 *   free_cash_flow or fcf across all projection years.
 * Terminal equity value = terminal_value_to_equity (preferred, net of debt)
 *   or max(0, terminal_value − remaining_debt_at_exit).
 *
 * operationsPct + terminalPct sum to 1 when valid=true.
 * valid=false when total is zero or non-finite.
 *
 * @param {object} projection - simulation output (_exec_projection or projection)
 * @returns {{ operationsPct: number, terminalPct: number, valid: boolean }}
 */
export function computeReturnsComposition(projection) {
  const proj = projection || {};
  const years = Array.isArray(proj.years) ? proj.years : [];

  // Sum per-year operating cash flows — prefer post-tax, fall back to pre-tax / generic fcf
  let operatingValue = 0;
  for (const y of years) {
    const fcf = y.free_cash_flow_post_tax ?? y.free_cash_flow ?? y.fcf ?? 0;
    operatingValue += (Number.isFinite(fcf) ? fcf : 0);
  }

  // Terminal equity value — prefer pre-computed net-of-debt figure.
  // For sale-mode projections (one_time_sale / sale_leaseback) terminal_value_to_equity
  // is absent; use sale_proceeds_net (net of Qatar disposition tax) to match the post-tax
  // IRR/MOIC basis shown on the same card, otherwise fall back to gross TV minus debt.
  let terminalEquityValue = proj.terminal_value_to_equity;
  if (terminalEquityValue == null) {
    if (proj.sale_proceeds_net != null) {
      terminalEquityValue = proj.sale_proceeds_net;
    } else {
      const tv = proj.terminal_value ?? null;
      const rd = proj.remaining_debt_at_exit ?? 0;
      terminalEquityValue = tv != null ? Math.max(0, tv - rd) : null;
    }
  }

  if (terminalEquityValue == null) {
    return { operationsPct: 0, terminalPct: 1, valid: false };
  }

  const total = operatingValue + terminalEquityValue;

  if (total <= 0 || !Number.isFinite(total)) {
    return { operationsPct: 0, terminalPct: 1, valid: false };
  }

  const operationsPct = operatingValue / total;
  const terminalPct   = terminalEquityValue / total;

  if (!Number.isFinite(operationsPct) || !Number.isFinite(terminalPct)) {
    return { operationsPct: 0, terminalPct: 1, valid: false };
  }

  return { operationsPct, terminalPct, valid: true };
}

/** Returns a descriptive label for the composition profile. */
export function returnsCompositionLabel(operationsPct, terminalPct) {
  if (!Number.isFinite(operationsPct) || !Number.isFinite(terminalPct)) return 'Undetermined';
  if (terminalPct > 1) return 'Terminal-dominant (exit-driven)';
  if (terminalPct > 0.75) return 'Terminal-dominant';
  if (terminalPct > 0.5) return 'Terminal-weighted';
  if (operationsPct > 0.75) return 'Operations-dominant';
  if (operationsPct > 0.5) return 'Operations-weighted';
  return 'Balanced';
}
