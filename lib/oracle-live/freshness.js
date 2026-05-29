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

// ────────────────────────────────────────────────────────────────────────
// Reliability status — Sprint 3.1 additions
// A stale source is still useful. Do NOT hide stale data. Label it honestly.
// ────────────────────────────────────────────────────────────────────────

const MS_PER_HOUR = 3_600_000;

/**
 * Ordered reliability status labels.
 *
 *   LIVE        — fetched < 1h ago, success
 *   RECENT      — fetched < 24h ago, success
 *   STALE       — fetched < 7d ago, OR last fetch failed but cached data exists
 *   DEGRADED    — provider has known outage / consecutive_failures > 3
 *   UNAVAILABLE — never fetched OR > 7d old with no cache
 *
 * @type {Array<'LIVE'|'RECENT'|'STALE'|'DEGRADED'|'UNAVAILABLE'>}
 */
export const RELIABILITY_STATUS = ['LIVE', 'RECENT', 'STALE', 'DEGRADED', 'UNAVAILABLE'];

/**
 * Computes a reliability status from provider fetch metadata.
 *
 * Principle: a stale source is still useful — never hide it, label it honestly.
 *
 * Decision tree:
 *   1. No cached data AND no successful update ever → UNAVAILABLE
 *   2. consecutive_failures > 3                    → DEGRADED
 *   3. last_successful_update is null              → STALE (if cache) or UNAVAILABLE
 *   4. age < 1h                                    → LIVE
 *   5. age < 24h                                   → RECENT
 *   6. age < 7d                                    → STALE
 *   7. age >= 7d                                   → STALE (if cache) or UNAVAILABLE
 *
 * @param {{
 *   last_successful_update: string|null,
 *   last_attempt?: string|null,
 *   consecutive_failures?: number,
 *   has_cached_data?: boolean
 * }} param0
 * @returns {'LIVE'|'RECENT'|'STALE'|'DEGRADED'|'UNAVAILABLE'}
 */
export function computeReliabilityStatus({
  last_successful_update,
  last_attempt,
  consecutive_failures = 0,
  has_cached_data = false,
} = {}) {
  // Never fetched and no cache at all
  if (!last_successful_update && !has_cached_data) return 'UNAVAILABLE';

  // Provider actively failing beyond threshold
  if ((consecutive_failures ?? 0) > 3) return 'DEGRADED';

  // No successful update recorded but cache exists — still usable, label STALE
  if (!last_successful_update) return 'STALE';

  const ageMs = Date.now() - new Date(last_successful_update).getTime();

  // Guard against clock skew or bad timestamps
  if (ageMs < 0) return 'LIVE';

  const ageHours = ageMs / MS_PER_HOUR;

  if (ageHours < 1)      return 'LIVE';
  if (ageHours < 24)     return 'RECENT';
  if (ageHours < 7 * 24) return 'STALE';

  // > 7d: still expose if cache exists (stale but not dead), else UNAVAILABLE
  return has_cached_data ? 'STALE' : 'UNAVAILABLE';
}

/**
 * Exponential confidence decay based on data age and volatility class.
 *
 * Half-lives (time at which confidence halves from its initial value):
 *   'high'   → 12 hours  (e.g. GPU spot pricing, live market data)
 *   'medium' → 72 hours  (e.g. infrastructure latency, misc signals)
 *   'low'    → 336 hours / 14 days (e.g. regulated tariffs, permitting)
 *
 * Formula: confidence = confidence_initial × 0.5^(age_hours / halfLife_hours)
 *
 * @param {{
 *   confidence_initial: number,
 *   age_hours: number,
 *   volatility: 'high'|'medium'|'low'
 * }} param0
 * @returns {number} Decayed confidence in [0, 1]
 */
export function confidenceDecay({ confidence_initial, age_hours, volatility } = {}) {
  const initial = (confidence_initial != null && isFinite(confidence_initial))
    ? Math.max(0, Math.min(1, Number(confidence_initial)))
    : 1;

  const hours = (age_hours != null && isFinite(age_hours) && age_hours >= 0)
    ? Number(age_hours)
    : 0;

  const halfLifeHours = {
    high:   12,
    medium: 72,
    low:    14 * 24, // 336h
  }[volatility] ?? 72; // unknown volatility → default to medium

  return Math.max(0, Math.min(1, initial * Math.pow(0.5, hours / halfLifeHours)));
}

/**
 * Returns design-token-based badge styling for a given reliability status.
 *
 * Tokens follow the Cockpit --ct-{name} / --cp-{name} convention.
 * Stale data is labeled honestly with amber/warning — never hidden or suppressed.
 *
 * @param {'LIVE'|'RECENT'|'STALE'|'DEGRADED'|'UNAVAILABLE'} status
 * @returns {{ color_token: string, bg_token: string, border_token: string, label: string }}
 */
export function statusBadgeTone(status) {
  // Cockpit tokens only — no hex fallbacks (Hearst lint rule).
  // Mapping aligns with the --ct-status-* tokens defined in cp-tokens.css.
  const tones = {
    LIVE: {
      color_token:  'var(--ct-status-success)',
      bg_token:     'var(--ct-status-success-soft)',
      border_token: 'var(--ct-status-success-border)',
      label:        'Live',
    },
    RECENT: {
      // No info token in Cockpit DS; reuse success-muted family.
      color_token:  'var(--ct-status-success)',
      bg_token:     'var(--ct-status-success-soft)',
      border_token: 'var(--ct-status-success-border)',
      label:        'Recent',
    },
    STALE: {
      color_token:  'var(--ct-status-warning)',
      bg_token:     'var(--ct-status-warning-soft)',
      border_token: 'var(--ct-status-warning-border)',
      label:        'Stale',
    },
    DEGRADED: {
      color_token:  'var(--ct-status-danger)',
      bg_token:     'var(--ct-status-danger-soft)',
      border_token: 'var(--ct-status-danger-border)',
      label:        'Degraded',
    },
    UNAVAILABLE: {
      color_token:  'var(--cp-text-muted)',
      bg_token:     'var(--cp-surface-2)',
      border_token: 'var(--cp-border)',
      label:        'Unavailable',
    },
  };

  return tones[status] ?? tones.UNAVAILABLE;
}
