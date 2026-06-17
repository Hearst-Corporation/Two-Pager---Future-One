// Local display helpers for the FUTUR ONE front (presentation only).

export const MISSING = '—';

/** USD compact tiers; sign before $ (-$866.3M, never $-866277437). */
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

/** Ratio 0..1 → percent (0.125 → 12.5%). */
export function fmtPctFromRatio(v, dp = 1) {
  if (v == null || Number.isNaN(Number(v))) return MISSING;
  return `${(Number(v) * 100).toFixed(dp)}%`;
}

/** Already-scaled percent (60 → 60.0%). */
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

export function fmtScore(n, max = 5) {
  if (n == null || Number.isNaN(Number(n))) return MISSING;
  return `${n}/${max}`;
}

export function fmtDate(iso) {
  if (!iso) return MISSING;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return MISSING;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return MISSING;
  }
}

export function prettyType(t) {
  if (!t) return MISSING;
  return String(t).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function parseApiError(res, fallback) {
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  const apiError = body?.error || body?.message;
  switch (res.status) {
    case 400: return apiError ? `Invalid request: ${apiError}` : fallback;
    case 401: return 'Session expired. Please sign in again.';
    case 403: return fallback;
    case 429: return 'Too many requests. Please wait a moment and retry.';
    default:  return apiError || fallback;
  }
}

/** Source register value cell — format money-like numerics when obvious. */
export function fmtSourceValue(s) {
  if (s.value == null || s.value === '') {
    return s.value_text || MISSING;
  }
  const n = Number(s.value);
  if (Number.isNaN(n)) {
    const unit = s.unit ? ` ${s.unit}` : '';
    return `${s.value}${unit}`;
  }
  const unit = (s.unit || '').toLowerCase();
  if (unit === 'usd' || unit === '$') return fmtUSD(n);
  if (unit === '%' || unit === 'pct' || unit === 'percent') return fmtPctRaw(n);
  if (!unit && Math.abs(n) >= 1e6) return fmtUSD(n);
  const suffix = s.unit ? ` ${s.unit}` : '';
  return `${n}${suffix}`;
}
