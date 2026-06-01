// Single source of truth for number formatting across the simulator, financial
// page and the strategic memo. PRESENTATION ONLY — no calculation here.
//
// Why this file exists: the same metric used to render differently per screen
// (MOIC "2.34×" on the result page vs "2.34x" in the memo; a $1.2B CAPEX shown
// "$1.20B" by KpiCard but "$1200.0M" in the financial table; three different
// "missing" tokens "—" / "N/A" / "N/A — Source Required"). Every screen now
// delegates here, so the two-step flow shows identical numbers everywhere.

export const MISSING = '—';

// USD with B / M / K tiers. Sign goes BEFORE the $ for negatives (-$0.3B, never $-0.3B).
export function fmtUSD(v) {
  if (v == null || Number.isNaN(v)) return MISSING;
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

// Percentage from a 0..1 RATIO (0.18 -> "18.0%").
export function fmtPctFromRatio(v, dp = 1) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return `${(v * 100).toFixed(dp)}%`;
}

// Percentage from an ALREADY-SCALED value (60 -> "60%"). Use for occupancy /
// ebitda_margin that arrive pre-multiplied — avoids the ×100 double-scale trap.
export function fmtPctRaw(v, dp = 0) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return `${v.toFixed(dp)}%`;
}

// Multiplier (MOIC, DSCR, exit multiple) — lowercase 'x', 2 decimals (majority glyph).
export function fmtX(v) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return `${v.toFixed(2)}x`;
}

export function fmtMW(v, dp = 1) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return `${v.toFixed(dp)} MW`;
}

export function fmtYears(v) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return `${v.toFixed(0)} yr`;
}

// Big integer counts (racks, GPUs) with thousands separators.
export function fmtInt(v) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return Math.round(v).toLocaleString('en-US');
}

// Generic number, up to `maxDp` decimals, with thousands separators.
export function fmtNum(v, maxDp = 2) {
  if (v == null || Number.isNaN(v)) return MISSING;
  return v.toLocaleString('en-US', { maximumFractionDigits: maxDp });
}
