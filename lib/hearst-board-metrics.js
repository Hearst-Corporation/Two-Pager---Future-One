// lib/hearst-board-metrics.js
//
// ── CANONICAL BOARD-METRIC CONTRACT ─────────────────────────────────────────
// The single source of truth for every financial figure the Investment
// Committee sees. PRESENTATION ONLY — no calculation, no tax logic, no verdict
// logic. It pins, per metric:
//
//   field    — the engine field to read (encodes the canonical TAX BASIS)
//   preField — the pre-tax counterpart shown as a transparency sub-figure (or null)
//   fmt      — the canonical formatter (from lib/hearst-format — the ONLY layer)
//   label    — the canonical board-facing label
//   basis    — 'post_tax' | 'n/a'  (documented tax basis)
//
// Canonical decisions (audit P0-1 / P0-2 / P0-3):
//   • Headline RETURN metrics (IRR / NPV / MOIC) are POST-TAX — the number the IC
//     acts on — with the pre-tax value available as a sub-figure. They fall back
//     to pre-tax only for projections that predate the tax layer (post-tax null).
//   • Units / precision / glyph are encoded by lib/hearst-format (USD 1-decimal M
//     tier + $B tier, percent 1-decimal, multiplier lowercase "x", payback "yr").
//
// Every surface (Results, ORACLE Advisor, Financial, Dossier, Memo, PDF) MUST
// derive its board numbers from here (or from lib/hearst-format via this map).
// No surface may pick its own field or format a board metric on its own.

import { fmtUSD, fmtPctFromRatio, fmtX, fmtYears, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';

export const BOARD_METRICS = {
  irr: {
    label: UI.RESULTS_DM_IRR,   // 'IRR (Post-tax)'
    basis: 'post_tax',
    field: (p) => p?.irr_post_tax ?? p?.irr,
    preField: (p) => p?.irr,
    fmt: fmtPctFromRatio,
  },
  npv: {
    label: UI.RESULTS_DM_NPV,   // 'NPV (Post-tax)'
    basis: 'post_tax',
    field: (p) => p?.npv_post_tax ?? p?.npv,
    preField: (p) => p?.npv,
    fmt: fmtUSD,
  },
  moic: {
    label: UI.RESULTS_DM_MOIC,  // 'MOIC (Post-tax)'
    basis: 'post_tax',
    field: (p) => p?.moic_post_tax ?? p?.moic,
    preField: (p) => p?.moic,
    fmt: fmtX,
  },
  payback: {
    label: 'Payback', basis: 'n/a',
    field: (p) => p?.payback_years, preField: () => null, fmt: fmtYears,
  },
  capex: {
    label: 'Total CAPEX', basis: 'n/a',
    field: (p) => p?.total_capex, preField: () => null, fmt: fmtUSD,
  },
  terminal_value: {
    label: 'Terminal Value', basis: 'n/a',
    field: (p) => p?.terminal_value, preField: () => null, fmt: fmtUSD,
  },
  dscr: {
    label: 'DSCR', basis: 'n/a',
    field: (p) => p?.dscr_stabilized, preField: () => null, fmt: fmtX,
  },
  revenue: {
    label: 'Stabilized Revenue', basis: 'n/a',
    field: (p) => p?.stabilized_revenue, preField: () => null, fmt: fmtUSD,
  },
  ebitda: {
    label: 'Stabilized EBITDA', basis: 'n/a',
    field: (p) => p?.stabilized_ebitda, preField: () => null, fmt: fmtUSD,
  },
};

/** Raw canonical value for a metric (number) or null when absent. */
export function boardValue(projection, id) {
  const m = BOARD_METRICS[id];
  if (!m) return null;
  const v = m.field(projection);
  return v == null ? null : v;
}

/** Canonical formatted string for a metric (delegates to lib/hearst-format). */
export function boardFormatted(projection, id) {
  const m = BOARD_METRICS[id];
  if (!m) return MISSING;
  return m.fmt(m.field(projection));
}

/** Canonical board-facing label for a metric. */
export function boardLabel(id) {
  return BOARD_METRICS[id]?.label ?? id;
}

