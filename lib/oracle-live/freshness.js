// lib/oracle-live/freshness.js
//
// Sprint 3 — Live Data freshness scoring.
// Extends the static freshnessScore from oracle-intelligence/schema.js with
// live-data-specific half-lives and volatility mapping per category.

const MS_PER_DAY = 86_400_000;

// ────────────────────────────────────────────────────────────────────────
// Volatility mapping by category
// ────────────────────────────────────────────────────────────────────────

/**
 * Per-category volatility table.
 * Rationale:
 *   - gpu_pricing: spot rates shift daily/weekly → extreme
 *   - gpu_allocation: allocation windows change every few weeks → extreme
 *   - transformer_lead_time: quotes update monthly → high
 *   - cdu_lead_time: supply chain moves quarterly → high
 *   - interconnect_latency: infrastructure-level, slow to change → medium
 *   - permitting: government timelines, years-long cycles → low
 *   - energy_tariff: regulated, annual reviews → low
 *   - signal_misc: unknown cadence, default conservative → medium
 */
const CATEGORY_VOLATILITY_MAP = {
  gpu_pricing: 'extreme',
  gpu_allocation: 'extreme',
  transformer_lead_time: 'high',
  cdu_lead_time: 'high',
  interconnect_latency: 'medium',
  signal_misc: 'medium',
  energy_tariff: 'low',
  permitting: 'low',
};

/**
 * Regional modifier — some regions have less predictable update cadences.
 * Bumps the base volatility by one level when applicable.
 */
const REGION_VOLATILITY_BUMP = new Set(['qatar', 'saudi_arabia', 'gcc', 'mena']);

const VOLATILITY_ORDER = ['low', 'medium', 'high', 'extreme'];

function bumpVolatility(v, region) {
  if (!REGION_VOLATILITY_BUMP.has(region)) return v;
  const idx = VOLATILITY_ORDER.indexOf(v);
  if (idx < 0 || idx >= VOLATILITY_ORDER.length - 1) return v;
  return VOLATILITY_ORDER[idx + 1];
}

// ────────────────────────────────────────────────────────────────────────
// Half-life table (in days) per volatility class — live data is more demanding
// than static oracle data because staleness carries real trading/decision risk.
//
//   extreme : half-life  3 days  (GPU spot market)
//   high    : half-life  6 days  (supply chain lead times)
//   medium  : half-life 30 days  (latency, misc signals)
//   low     : half-life 90 days  (regulated tariffs, permitting)
// ────────────────────────────────────────────────────────────────────────

const HALF_LIFE_DAYS = {
  extreme: 3,
  high: 6,
  medium: 30,
  low: 90,
};

// ────────────────────────────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────────────────────────────

/**
 * Computes a freshness score in [0,1] for a live datapoint.
 *
 * Uses exponential decay: score = 0.5^(elapsed / halfLife).
 * At t=0 → 1.0 (perfectly fresh). At t=halfLife → 0.5. At t>>halfLife → ~0.
 *
 * @param {{ timestamp: string, volatility: 'low'|'medium'|'high'|'extreme' }} param0
 * @returns {number} Freshness score in [0,1].
 */
export function scoreFreshness({ timestamp, volatility }) {
  if (!timestamp) return 0;
  const v = VOLATILITY_ORDER.includes(volatility) ? volatility : 'medium';
  const halfLifeDays = HALF_LIFE_DAYS[v];
  const elapsedDays = (Date.now() - new Date(timestamp).getTime()) / MS_PER_DAY;
  if (elapsedDays < 0) return 1;
  return Math.max(0, Math.min(1, Math.pow(0.5, elapsedDays / halfLifeDays)));
}

/**
 * Derives a volatility class for a given category and region combination.
 *
 * @param {{ category: string, region?: string }} param0
 * @returns {'low'|'medium'|'high'|'extreme'}
 */
export function scoreVolatility({ category, region }) {
  const base = CATEGORY_VOLATILITY_MAP[category] || 'medium';
  return region ? bumpVolatility(base, region) : base;
}

/**
 * Returns a human-readable freshness tag based on freshness score.
 *
 * Thresholds (tuned for live data where staleness matters more):
 *   FRESH   : score >= 0.75
 *   OK      : score >= 0.40
 *   STALE   : score >= 0.10
 *   EXPIRED : score <  0.10
 *
 * @param {{ score: number }} param0
 * @returns {'FRESH'|'OK'|'STALE'|'EXPIRED'}
 */
export function freshnessTag({ score }) {
  if (score >= 0.75) return 'FRESH';
  if (score >= 0.40) return 'OK';
  if (score >= 0.10) return 'STALE';
  return 'EXPIRED';
}
