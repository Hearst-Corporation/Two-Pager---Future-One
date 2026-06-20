// Single source of truth for number formatting across the simulator, financial
// page, strategic memo and PDF. PRESENTATION ONLY — no calculation here.

export const MISSING = '—';

export function fmtUSD(v) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  const n = Number(v);
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

export function fmtPctFromRatio(v, dp = 1) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  return `${(Number(v) * 100).toFixed(dp)}%`;
}

export function fmtPctRaw(v, dp = 1) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  return `${Number(v).toFixed(dp)}%`;
}

export function fmtX(v) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  return `${Number(v).toFixed(2)}×`;
}

export function fmtMW(v, dp = 0) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  return `${Number(v).toFixed(dp)} MW`;
}

export function fmtYears(v) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  const n = Number(v);
  return `${n % 1 === 0 ? n : n.toFixed(1)} yrs`;
}
