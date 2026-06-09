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
 * Sale-mode (one_time_sale / sale_leaseback): these are single-exit developer
 * projections where the entire return is realized at the exit event. The
 * operations/terminal split is conceptually inapplicable — the "years" array
 * is a hold-baseline that the flip investor never receives, and sale_proceeds_net
 * is gross-of-remaining-debt, so adding the two produces a meaningless and
 * misleading ratio. In sale-mode this function short-circuits and returns
 * valid:false + saleMode:true so the caller can render an honest note instead.
 *
 * @param {object} projection - simulation output (_exec_projection or projection)
 * @returns {{ operationsPct: number|null, terminalPct: number|null, valid: boolean, saleMode?: boolean, note?: string }}
 */
export function computeReturnsComposition(projection) {
  const proj = projection || {};

  // ── Sale-mode short-circuit ──────────────────────────────────────────────────
  // Detect one_time_sale / sale_leaseback: sale_mode flag (set by hearst-deal-structures)
  // or presence of sale_proceeds_net without terminal_value_to_equity (recurring hold).
  const isSaleMode =
    proj.sale_mode === true ||
    (proj.sale_proceeds_net != null && proj.terminal_value_to_equity == null);

  if (isSaleMode) {
    return {
      operationsPct: null,
      terminalPct:   null,
      valid:         false,
      saleMode:      true,
      note:          'Developer sale — return realized at the single exit; an operations-vs-terminal split does not apply.',
    };
  }

  // ── Recurring hold path (unchanged) ─────────────────────────────────────────
  const years = Array.isArray(proj.years) ? proj.years : [];

  // Sum per-year operating cash flows — prefer post-tax, fall back to pre-tax / generic fcf
  let operatingValue = 0;
  for (const y of years) {
    const fcf = y.free_cash_flow_post_tax ?? y.free_cash_flow ?? y.fcf ?? 0;
    operatingValue += (Number.isFinite(fcf) ? fcf : 0);
  }

  // Terminal equity value — prefer pre-computed net-of-debt figure.
  // Fall back to gross TV minus remaining debt.
  let terminalEquityValue = proj.terminal_value_to_equity;
  if (terminalEquityValue == null) {
    const tv = proj.terminal_value ?? null;
    const rd = proj.remaining_debt_at_exit ?? 0;
    terminalEquityValue = tv != null ? Math.max(0, tv - rd) : null;
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
