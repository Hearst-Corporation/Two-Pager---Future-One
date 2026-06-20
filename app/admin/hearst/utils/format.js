// Hearst UI display helpers — core formatters re-exported from lib/hearst-format.js.

import {
  MISSING,
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtX,
  fmtMW,
  fmtYears,
} from '@/lib/hearst-format';

export { MISSING, fmtUSD, fmtPctFromRatio, fmtPctRaw, fmtX, fmtMW, fmtYears };

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

export async function parseApiError(res, fallback, {
  badRequestLabel = 'Invalid request',
  forbiddenLabel,
} = {}) {
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  const apiError = body?.error || body?.message;
  switch (res.status) {
    case 400: return apiError ? `${badRequestLabel}: ${apiError}` : fallback;
    case 401: return 'Session expired. Please sign in again.';
    case 403: return forbiddenLabel || fallback;
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
