// lib/oracle-live/schema.js
//
// Sprint 3 — Live Data Architecture foundation.
// Schema, enums, and validation helpers for live infrastructure datapoints.
// Pure definitions — no I/O, no scraping, no fabricated values.

// ────────────────────────────────────────────────────────────────────────
// Enums — extend only via explicit review.
// ────────────────────────────────────────────────────────────────────────

/**
 * Categories of live infrastructure data tracked by the Oracle system.
 * @type {string[]}
 */
export const LIVE_CATEGORIES = [
  'gpu_pricing',           // H100/H200/B200 spot and contract rates $/hr
  'energy_tariff',         // Utility tariffs $/kWh, capacity charges
  'transformer_lead_time', // Weeks to delivery for HV/MV transformers
  'cdu_lead_time',         // Coolant Distribution Unit lead times (weeks)
  'gpu_allocation',        // NVIDIA/AMD allocation windows and availability
  'interconnect_latency',  // Cross-region fiber latency ms, dark fiber availability
  'permitting',            // Government permitting timelines (weeks)
  'signal_misc',           // Catch-all for one-off infrastructure signals
];

/**
 * Source type taxonomy for live datapoints.
 * @type {string[]}
 */
export const LIVE_SOURCE_TYPES = [
  'rate_card',             // Vendor or utility public rate card
  'rss_feed',              // Machine-parsed RSS news feed
  'api_endpoint',          // Programmatic API (vendor, utility, exchange)
  'rss_aggregated',        // Aggregated feed from multiple RSS sources
  'vendor_disclosure',     // Direct vendor communications / datasheet
  'utility_disclosure',    // Utility official tariff filing
  'mock_data',             // Placeholder — system not yet wired to real source
  'admin_input',           // Manually injected by administrator (lower trust)
];

/**
 * Availability states for a live datapoint source.
 * @type {string[]}
 */
export const AVAILABILITY_STATUS = [
  'live',             // Source actively returning fresh data
  'stale',            // Source reachable but data exceeds freshness threshold
  'unavailable',      // Source unreachable or integration not yet built
  'mock',             // Placeholder value — do NOT present as real market data
  'scraping_failed',  // Scraping attempted but failed (HTML changed, blocked, etc.)
];

// ────────────────────────────────────────────────────────────────────────
// Required fields for a Live Datapoint
// ────────────────────────────────────────────────────────────────────────

// Fields that must always be present (non-null).
const LIVE_DATAPOINT_REQUIRED = [
  'id',
  'source',
  'source_type',
  'category',
  'region',
  'timestamp',
  'confidence',
  'freshness',
  'volatility',
  'authority_score',
  'notes',
];

// Fields that may be null only when availability_status === 'unavailable'.
// For live/stale/mock datapoints they must carry a real value.
const LIVE_DATAPOINT_NULLABLE_WHEN_UNAVAILABLE = [
  'source_url',
  'value',
  'unit',
  'range_low',
  'range_high',
];

// ────────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────────

/**
 * Validates a live datapoint against the required schema.
 *
 * @param {Object} d - The live datapoint to validate.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateLiveDatapoint(d) {
  const errors = [];
  const isUnavailable = d.availability_status === 'unavailable';

  for (const k of LIVE_DATAPOINT_REQUIRED) {
    if (d[k] === undefined || d[k] === null) {
      errors.push(`missing field: ${k}`);
    }
  }

  // Nullable fields are allowed to be null only for unavailable datapoints.
  for (const k of LIVE_DATAPOINT_NULLABLE_WHEN_UNAVAILABLE) {
    if (!isUnavailable && (d[k] === undefined || d[k] === null)) {
      errors.push(`missing field: ${k} (required when availability_status is not 'unavailable')`);
    }
  }

  if (d.category && !LIVE_CATEGORIES.includes(d.category)) {
    errors.push(`unknown category: ${d.category}`);
  }

  if (d.source_type && !LIVE_SOURCE_TYPES.includes(d.source_type)) {
    errors.push(`unknown source_type: ${d.source_type}`);
  }

  if (d.confidence !== undefined && d.confidence !== null) {
    if (typeof d.confidence !== 'number' || d.confidence < 0 || d.confidence > 1) {
      errors.push(`confidence must be a number in [0,1], got: ${d.confidence}`);
    }
  }

  if (d.freshness !== undefined && d.freshness !== null) {
    if (typeof d.freshness !== 'number' || d.freshness < 0 || d.freshness > 1) {
      errors.push(`freshness must be a number in [0,1], got: ${d.freshness}`);
    }
  }

  if (d.authority_score !== undefined && d.authority_score !== null) {
    if (typeof d.authority_score !== 'number' || d.authority_score < 0 || d.authority_score > 1) {
      errors.push(`authority_score must be a number in [0,1], got: ${d.authority_score}`);
    }
  }

  if (d.volatility && !['low', 'medium', 'high', 'extreme'].includes(d.volatility)) {
    errors.push(`unknown volatility: ${d.volatility}`);
  }

  if (
    d.range_low !== undefined && d.range_high !== undefined &&
    d.range_low !== null && d.range_high !== null
  ) {
    if (typeof d.range_low !== 'number' || typeof d.range_high !== 'number') {
      errors.push('range_low and range_high must be numbers');
    } else if (d.range_low > d.range_high) {
      errors.push(`range_low (${d.range_low}) must be <= range_high (${d.range_high})`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// ────────────────────────────────────────────────────────────────────────
// markUnavailable — canonical "no data" datapoint factory
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns a properly-shaped live datapoint indicating the source is unavailable.
 * Never fabricates a value — value is explicitly null.
 *
 * @param {string} category - One of LIVE_CATEGORIES.
 * @param {string} region   - Target region (e.g. 'qatar', 'gcc').
 * @param {string} reason   - Human-readable explanation of why data is unavailable.
 * @returns {Object} A live datapoint with availability_status='unavailable' and value=null.
 */
export function markUnavailable(category, region, reason) {
  const now = new Date().toISOString();
  return {
    id: `unavailable__${category}__${region}__${Date.now()}`,
    source: 'system',
    source_url: null,
    source_type: 'mock_data',
    category,
    region,
    timestamp: now,
    value: null,
    unit: null,
    range_low: null,
    range_high: null,
    confidence: 0,
    freshness: 0,
    volatility: 'high',
    authority_score: 0,
    availability_status: 'unavailable',
    notes: reason || 'Data source not yet integrated.',
  };
}
