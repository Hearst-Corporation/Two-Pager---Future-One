// lib/oracle-live/reliability.js
//
// Sprint 3.1 — Provider Reliability Tracker
//
// In-memory MVP. State is per-process; will be migrated to Supabase
// in a later sprint for cross-process persistence.
//
// Principle: a stale source is still useful.
// Never hide stale data — label it honestly.

import {
  computeReliabilityStatus,
} from './freshness.js';

// ────────────────────────────────────────────────────────────────────────
// Internal state
// ────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   successes:            number,
 *   failures:             number,
 *   consecutive_failures: number,
 *   last_success_at:      number|null,   // epoch ms
 *   last_attempt_at:      number|null,   // epoch ms
 *   outage_window:        { started_at: number }|null
 * }} ProviderRecord
 */

/** @type {Map<string, ProviderRecord>} */
const reliabilityState = new Map();

/**
 * Returns an initialised (empty) provider record.
 * @returns {ProviderRecord}
 */
function emptyRecord() {
  return {
    successes:            0,
    failures:             0,
    consecutive_failures: 0,
    last_success_at:      null,
    last_attempt_at:      null,
    outage_window:        null,
  };
}

/**
 * Retrieves or initialises the record for a provider.
 * @param {string} provider
 * @returns {ProviderRecord}
 */
function getOrCreate(provider) {
  if (!reliabilityState.has(provider)) {
    reliabilityState.set(provider, emptyRecord());
  }
  return reliabilityState.get(provider);
}

// ────────────────────────────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────────────────────────────

/**
 * Records one fetch attempt for a provider.
 *
 * Updates success/failure counters, consecutive_failures, and outage_window.
 * Idempotent in the sense that repeated calls correctly accumulate state.
 *
 * @param {string}  provider   - Unique provider key (e.g. 'lambda', 'coreweave').
 * @param {boolean} success    - Whether the fetch succeeded.
 * @param {number}  [timestamp=Date.now()] - Epoch ms of the attempt.
 * @returns {void}
 */
export function recordProviderAttempt(provider, success, timestamp = Date.now()) {
  if (!provider || typeof provider !== 'string') return;
  const ts = (timestamp != null && isFinite(timestamp)) ? Number(timestamp) : Date.now();

  const rec = getOrCreate(provider);
  rec.last_attempt_at = ts;

  if (success) {
    rec.successes += 1;
    rec.consecutive_failures = 0;
    rec.last_success_at = ts;
    rec.outage_window = null; // outage resolved
  } else {
    rec.failures += 1;
    rec.consecutive_failures += 1;
    // Open an outage window on the first failure in a streak
    if (rec.consecutive_failures === 1) {
      rec.outage_window = { started_at: ts };
    }
  }
}

/**
 * Returns the full reliability profile for a provider.
 *
 * Computes the RELIABILITY_STATUS by delegating to freshness.computeReliabilityStatus,
 * and derives additional metrics (uptime %, last-24h success rate, outage flag).
 *
 * @param {string} provider
 * @returns {{
 *   provider:               string,
 *   status:                 'LIVE'|'RECENT'|'STALE'|'DEGRADED'|'UNAVAILABLE',
 *   uptime_pct:             number,   // 0-100, all-time
 *   last_24h_success_rate:  number,   // 0-100 (approximated from current streak)
 *   last_success_at:        number|null,
 *   last_attempt_at:        number|null,
 *   consecutive_failures:   number,
 *   outage_detected:        boolean
 * }}
 */
export function getProviderReliability(provider) {
  const rec = provider && reliabilityState.has(provider)
    ? reliabilityState.get(provider)
    : emptyRecord();

  const total = rec.successes + rec.failures;
  const uptime_pct = total > 0
    ? Math.round((rec.successes / total) * 10000) / 100
    : 100; // no data → optimistic default

  // Approximate last-24h rate from consecutive_failures:
  // If there are recent consecutive failures, rate is degraded.
  // Without a full time-series we use the all-time rate as a proxy,
  // penalised by the current consecutive failure streak.
  const consecutive_penalty = Math.min(rec.consecutive_failures * 10, 100);
  const last_24h_success_rate = Math.max(0, uptime_pct - consecutive_penalty);

  const has_cached_data = rec.last_success_at !== null;
  const last_successful_update = rec.last_success_at
    ? new Date(rec.last_success_at).toISOString()
    : null;

  const status = computeReliabilityStatus({
    last_successful_update,
    consecutive_failures: rec.consecutive_failures,
    has_cached_data,
  });

  return {
    provider,
    status,
    uptime_pct,
    last_24h_success_rate,
    last_success_at:       rec.last_success_at,
    last_attempt_at:       rec.last_attempt_at,
    consecutive_failures:  rec.consecutive_failures,
    outage_detected:       rec.outage_window !== null,
  };
}

/**
 * Returns reliability profiles for all known providers.
 *
 * @returns {ReturnType<typeof getProviderReliability>[]}
 */
export function getAllProvidersReliability() {
  return Array.from(reliabilityState.keys()).map(getProviderReliability);
}

/**
 * Detects whether a provider is currently in an outage state.
 *
 * An outage is declared when consecutive_failures exceeds the threshold.
 *
 * @param {string} provider
 * @param {number} [threshold_consecutive_failures=3]
 * @returns {boolean}
 */
export function detectOutage(provider, threshold_consecutive_failures = 3) {
  if (!provider || !reliabilityState.has(provider)) return false;
  const rec = reliabilityState.get(provider);
  return rec.consecutive_failures > threshold_consecutive_failures;
}

/**
 * Resets the reliability record for a provider.
 * Intended for tests or manual admin recovery; does not affect other providers.
 *
 * @param {string} provider
 * @returns {void}
 */
export function resetReliability(provider) {
  if (!provider) return;
  reliabilityState.set(provider, emptyRecord());
}

/**
 * Produces a 1-line human-readable reliability summary for a provider.
 *
 * Example: "lambda: LIVE (96% uptime, last fetch 12 min ago)"
 *
 * @param {{
 *   provider:             string,
 *   status:               string,
 *   uptime_pct:           number,
 *   last_success_at:      number|null,
 *   consecutive_failures: number
 * }} stats - Typically the output of getProviderReliability().
 * @returns {string}
 */
export function reliabilityNarrative(stats) {
  if (!stats || !stats.provider) return 'Unknown provider';

  const { provider, status, uptime_pct, last_success_at, consecutive_failures } = stats;

  let ageStr = 'never';
  if (last_success_at != null && isFinite(last_success_at)) {
    const diffMs = Date.now() - last_success_at;
    if (diffMs < 0) {
      ageStr = 'just now';
    } else {
      const diffMin = Math.floor(diffMs / 60_000);
      const diffH   = Math.floor(diffMs / 3_600_000);
      const diffD   = Math.floor(diffMs / 86_400_000);
      if (diffMin < 1)    ageStr = 'just now';
      else if (diffH < 1) ageStr = `${diffMin} min ago`;
      else if (diffD < 1) ageStr = `${diffH}h ago`;
      else                ageStr = `${diffD}d ago`;
    }
  }

  const uptimeStr = `${uptime_pct.toFixed(1)}% uptime`;

  const failStr = consecutive_failures > 0
    ? `, ${consecutive_failures} consecutive failure${consecutive_failures > 1 ? 's' : ''}`
    : '';

  return `${provider}: ${status} (${uptimeStr}, last fetch ${ageStr}${failStr})`;
}
