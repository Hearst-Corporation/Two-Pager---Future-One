/**
 * lib/oracle-live/gpu-pricing.js
 *
 * Sprint 3.1 — GPU Pricing Intelligence (Live Scrapers).
 *
 * Architecture:
 *   - GPU_SKUS       : canonical list of supported SKUs.
 *   - PROVIDERS      : list of cloud providers wired architecturally.
 *   - Provider modules: real async scrapers imported from ./providers/
 *   - In-memory cache : 1h TTL per (provider, sku) pair.
 *   - getGpuPricingBrief() : async aggregator; merges live + static anchors.
 *                            Uses Promise.allSettled — never hard fails.
 *
 * Static anchors are hydrated from lib/oracle-intelligence/datapoints.js:
 *   lambda_h100_on_demand, lambda_h200_on_demand,
 *   lambda_gb200_pre_order, lambda_mi300x
 * They carry source:'static_anchor', freshness (computed from datapoint timestamp),
 * volatility:'high'.
 *
 * Robustness rules (enforced):
 *   - Promise.allSettled for all provider calls — one failure never kills others.
 *   - Stale cache returned if refresh fails (status:'stale', freshness_hours:N).
 *   - All unavailable results are surfaced with informative notes, never swallowed.
 */

import { DATAPOINT_BY_ID } from '@/lib/oracle-intelligence/datapoints.js';
import { GPU_PRICING_CACHE_TTL_MS } from '@/lib/constants';
import { fetchProviderLambda } from './providers/lambda.js';
import { fetchProviderVastAi } from './providers/vast_ai.js';
import { fetchProviderRunPod } from './providers/runpod.js';
import { fetchProviderCoreWeave } from './providers/coreweave.js';
import { fetchProviderNvidiaDgxCloud } from './providers/nvidia_dgx_cloud.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Canonical GPU SKUs supported by the pricing intelligence layer. */
export const GPU_SKUS = ['H100', 'H200', 'B200', 'GB200', 'MI300X'];

/** Cloud provider identifiers wired architecturally. */
export const PROVIDERS = [
  'lambda',
  'coreweave',
  'vast_ai',
  'runpod',
  'nvidia_dgx_cloud',
];

/**
 * Datapoint IDs in the intelligence layer that map to GPU SKUs.
 * Used to hydrate static anchors when live pricing is unavailable.
 */
const STATIC_ANCHOR_MAP = {
  H100:   ['lambda_h100_on_demand'],
  H200:   ['lambda_h200_on_demand'],
  GB200:  ['lambda_gb200_pre_order'],
  MI300X: ['lambda_mi300x'],
  B200:   [], // No anchor datapoint yet — will add once B200 public rate cards appear
};

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

const CACHE_TTL_MS = GPU_PRICING_CACHE_TTL_MS;

/**
 * Cache map: key `${provider}:${sku}` → { result: Object, fetched_at: number }
 * Module-level singleton — persists across requests in the same process.
 */
const cache = new Map();

/**
 * Get a cached result if fresh, or null if stale/missing.
 *
 * @param {string} provider
 * @param {string} sku
 * @returns {{ result: Object, fetched_at: number } | null}
 */
function getCacheEntry(provider, sku) {
  const key = `${provider}:${sku}`;
  const entry = cache.get(key);
  if (!entry) return null;
  const ageMs = Date.now() - entry.fetched_at;
  if (ageMs < CACHE_TTL_MS) return entry; // fresh
  return null; // stale — caller decides whether to use it
}

/**
 * Get a stale cached result regardless of TTL (for fallback use).
 *
 * @param {string} provider
 * @param {string} sku
 * @returns {{ result: Object, fetched_at: number } | null}
 */
function getStaleCacheEntry(provider, sku) {
  return cache.get(`${provider}:${sku}`) ?? null;
}

/**
 * Store a result in cache.
 *
 * @param {string} provider
 * @param {string} sku
 * @param {Object} result
 */
function setCacheEntry(provider, sku, result) {
  cache.set(`${provider}:${sku}`, { result, fetched_at: Date.now() });
}

// ─── Freshness Helper ─────────────────────────────────────────────────────────

/**
 * Compute a human-readable freshness label from a datapoint timestamp string.
 *
 * @param {string|null} timestamp  ISO date string (e.g. '2025-04-01').
 * @returns {string} e.g. '13 months ago', 'unknown'
 */
function computeFreshness(timestamp) {
  if (!timestamp) return 'unknown';
  const now = new Date();
  const then = new Date(timestamp);
  if (isNaN(then.getTime())) return 'unknown';
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1)  return 'today';
  if (diffDays < 7)  return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

// ─── Provider Dispatch ────────────────────────────────────────────────────────

/** Dispatch map: provider id → async fetch function. */
const PROVIDER_FETCHERS = {
  lambda:           fetchProviderLambda,
  coreweave:        fetchProviderCoreWeave,
  vast_ai:          fetchProviderVastAi,
  runpod:           fetchProviderRunPod,
  nvidia_dgx_cloud: fetchProviderNvidiaDgxCloud,
};

/**
 * Fetch pricing for a single (provider, sku) pair, with cache + stale fallback.
 *
 * - If fresh cache hit: return immediately.
 * - If cache miss: call provider fetcher, store result, return.
 * - If fetcher throws (should never happen; all fetchers try/catch internally):
 *   try stale cache. If no stale: return unavailable record.
 *
 * Always resolves (never rejects).
 *
 * @param {string} provider
 * @param {string} sku
 * @returns {Promise<Object>} Canonical pricing record.
 */
async function fetchWithCache(provider, sku) {
  // 1. Fresh cache hit
  const fresh = getCacheEntry(provider, sku);
  if (fresh) return fresh.result;

  // 2. Live fetch
  const fetcher = PROVIDER_FETCHERS[provider];
  if (!fetcher) {
    return {
      provider,
      sku,
      status: 'unavailable',
      price_usd_hour: null,
      range_low: null,
      range_high: null,
      availability: 'unknown',
      allocation_risk: 'unknown',
      last_successful_update: null,
      freshness_hours: null,
      pricing_confidence: 'unavailable',
      notes: `unknown provider '${provider}'`,
      raw_excerpt: null,
    };
  }

  try {
    const result = await fetcher(sku);
    setCacheEntry(provider, sku, result);
    return result;
  } catch (unexpectedErr) {
    // Fetchers should never throw — but in case one does, fall back gracefully
    const stale = getStaleCacheEntry(provider, sku);
    if (stale) {
      const ageMs = Date.now() - stale.fetched_at;
      const freshnessHours = parseFloat((ageMs / (1000 * 60 * 60)).toFixed(1));
      return {
        ...stale.result,
        status: 'stale',
        freshness_hours: freshnessHours,
        notes: `${stale.result.notes} [stale fallback after crash: ${unexpectedErr.message}]`,
      };
    }
    return {
      provider,
      sku,
      status: 'unavailable',
      price_usd_hour: null,
      range_low: null,
      range_high: null,
      availability: 'unknown',
      allocation_risk: 'unknown',
      last_successful_update: null,
      freshness_hours: null,
      pricing_confidence: 'unavailable',
      notes: `scrape failed (unexpected): ${unexpectedErr.message}`,
      raw_excerpt: null,
    };
  }
}

// ─── Static Anchors ───────────────────────────────────────────────────────────

/**
 * Hydrate static anchor records for a SKU from the intelligence datapoints layer.
 *
 * These anchors give the memo a pricing reference even when live data is unavailable.
 * They are clearly marked source:'static_anchor' and volatility:'high'.
 *
 * @param {string} sku  Canonical SKU name.
 * @returns {Array<Object>} Array of static anchor records (may be empty).
 */
function buildStaticAnchors(sku) {
  const ids = STATIC_ANCHOR_MAP[sku] || [];
  return ids
    .map(id => DATAPOINT_BY_ID[id])
    .filter(Boolean)
    .map(dp => ({
      source:          'static_anchor',
      datapoint_id:    dp.id,
      provider:        dp.entity_id,
      sku,
      gpu_sku_label:   dp.metrics?.gpu_sku ?? dp.metrics?.sku ?? null,
      price_usd_hour:  dp.metrics?.price_per_gpu_hour ?? null,
      price_msrp_usd:  dp.metrics?.msrp_usd ?? null,
      unit:            dp.metrics?.unit ?? null,
      freshness:       computeFreshness(dp.timestamp),
      timestamp:       dp.timestamp,
      confidence:      dp.confidence,
      volatility:      'high',
      source_name:     dp.notes?.source_name ?? null,
      caveat:          dp.notes?.caveat ?? null,
      applicability:   dp.notes?.applicability ?? null,
    }));
}

// ─── Aggregation Helpers ──────────────────────────────────────────────────────

/**
 * Compute median of a numeric array.
 * @param {number[]} values
 * @returns {number|null}
 */
function computeMedian(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Determine aggregate status from a list of provider results.
 *
 * - ≥2 live → 'live'
 * - 1 live  → 'partial_live'
 * - ≥1 stale (and 0 live) → 'stale'
 * - all unavailable → 'unavailable'
 *
 * @param {Object[]} results  Array of canonical pricing records.
 * @returns {string}
 */
function computeAggregateStatus(results) {
  const liveCount  = results.filter(r => r.status === 'live').length;
  const staleCount = results.filter(r => r.status === 'stale').length;
  if (liveCount >= 2)  return 'live';
  if (liveCount === 1) return 'partial_live';
  if (staleCount > 0)  return 'stale';
  return 'unavailable';
}

/**
 * Determine confidence band from aggregate status and live prices count.
 * @param {string} aggregateStatus
 * @param {number} livePriceCount
 * @returns {string}
 */
function computeConfidenceBand(aggregateStatus, livePriceCount) {
  if (aggregateStatus === 'live'         && livePriceCount >= 3) return 'high';
  if (aggregateStatus === 'live'         && livePriceCount >= 2) return 'medium';
  if (aggregateStatus === 'partial_live' || aggregateStatus === 'stale') return 'low';
  return 'no_live_data';
}

// ─── SKU Notes ────────────────────────────────────────────────────────────────

/**
 * Human-readable note explaining the data situation for a given SKU.
 *
 * @param {string} sku
 * @param {string} aggregateStatus
 * @returns {string}
 */
function buildSkuNote(sku, aggregateStatus) {
  const baseNotes = {
    H100:
      'H100 on-demand pricing aggregated across Lambda, Vast.ai, RunPod. CoreWeave and DGX Cloud require enterprise quotes.',
    H200:
      'H200 supply-constrained SKU — pricing moves weekly. Live data from Lambda and Vast.ai spot market.',
    B200:
      'B200 hardware is ramping (2025–2026). Public rate cards limited; static anchor not yet available.',
    GB200:
      'GB200 NVL72 rack-level system — Lambda pre-order anchor available. Spot market listings sparse.',
    MI300X:
      'MI300X inference-optimised — Lambda and Vast.ai spot listings primary sources.',
  };
  const base = baseNotes[sku] ?? `GPU pricing data for ${sku}.`;
  if (aggregateStatus === 'unavailable') {
    return `${base} All live scrapers returned unavailable — static anchors remain the pricing reference.`;
  }
  if (aggregateStatus === 'stale') {
    return `${base} Live data is stale (cache fallback) — treat with caution.`;
  }
  return base;
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

/**
 * Get a GPU pricing brief for the requested SKUs and providers.
 *
 * Calls all provider scrapers in parallel (Promise.allSettled).
 * One provider failing never blocks others.
 * Stale cache is returned if a refresh fails.
 * Static anchors supplement live data when providers are unavailable.
 *
 * @param {Object}   [opts]
 * @param {string}   [opts.region]     Optional region filter (informational).
 * @param {string[]} [opts.skus]       SKUs to include. Defaults to all GPU_SKUS.
 * @param {string[]} [opts.providers]  Providers to query. Defaults to all PROVIDERS.
 * @returns {Promise<Array<Object>>} Array of per-SKU pricing briefs.
 */
export async function getGpuPricingBrief({
  region = null,
  skus = GPU_SKUS,
  providers = PROVIDERS,
} = {}) {
  // Launch all (provider, sku) fetches in parallel
  // Structure: results[skuIdx][providerIdx]
  const allSettled = await Promise.allSettled(
    skus.map(sku =>
      Promise.allSettled(
        providers.map(provider => fetchWithCache(provider, sku))
      )
    )
  );

  return skus.map((sku, skuIdx) => {
    const skuSettled = allSettled[skuIdx];

    // Safely extract per-provider results (handle unexpected outer rejection)
    let providerSettled = [];
    if (skuSettled.status === 'fulfilled') {
      providerSettled = skuSettled.value;
    } else {
      // Outer Promise.allSettled rejection (should not happen) — all unavailable
      providerSettled = providers.map(() => ({
        status: 'rejected',
        reason: skuSettled.reason,
      }));
    }

    // Build canonical price records from settled results
    const prices = providers.map((provider, pIdx) => {
      const settled = providerSettled[pIdx];
      if (settled?.status === 'fulfilled') {
        const r = settled.value;
        return {
          provider:            r.provider ?? provider,
          status:              r.status,
          price_usd_hour:      r.price_usd_hour ?? null,
          range_low:           r.range_low ?? null,
          range_high:          r.range_high ?? null,
          availability:        r.availability ?? 'unknown',
          allocation_risk:     r.allocation_risk ?? 'unknown',
          last_updated:        r.last_successful_update ?? null,
          freshness_hours:     r.freshness_hours ?? null,
          pricing_confidence:  r.pricing_confidence ?? 'unavailable',
          notes:               r.notes ?? '',
          raw_excerpt:         r.raw_excerpt ?? null,
        };
      }
      // Promise rejected (should not happen given try/catch in fetchers)
      return {
        provider,
        status: 'unavailable',
        price_usd_hour: null,
        range_low: null,
        range_high: null,
        availability: 'unknown',
        allocation_risk: 'unknown',
        last_updated: null,
        freshness_hours: null,
        pricing_confidence: 'unavailable',
        notes: `scrape rejected: ${settled?.reason?.message ?? 'unknown error'}`,
        raw_excerpt: null,
      };
    });

    // Aggregate statistics across live providers
    const livePrices = prices
      .filter(p => (p.status === 'live' || p.status === 'partial_live') && p.price_usd_hour !== null)
      .map(p => p.price_usd_hour);

    const stalePrices = prices
      .filter(p => p.status === 'stale' && p.price_usd_hour !== null)
      .map(p => p.price_usd_hour);

    // Use live prices preferentially; fall back to stale for aggregation
    const pricesToAggregate = livePrices.length > 0 ? livePrices : stalePrices;
    const sortedPrices = [...pricesToAggregate].sort((a, b) => a - b);

    const medianPrice  = computeMedian(sortedPrices);
    const rangeLow     = sortedPrices[0] ?? null;
    const rangeHigh    = sortedPrices[sortedPrices.length - 1] ?? null;

    const aggregateStatus   = computeAggregateStatus(prices);
    const confidenceBand    = computeConfidenceBand(aggregateStatus, livePrices.length);

    // Hydrate static anchors from intelligence layer
    const static_anchors = buildStaticAnchors(sku);

    return {
      sku,

      // Live provider prices — real data from Sprint 3.1 scrapers
      prices,

      // Aggregate statistics
      median_price_usd_hour: medianPrice !== null ? parseFloat(medianPrice.toFixed(4)) : null,
      range_low:             rangeLow    !== null ? parseFloat(rangeLow.toFixed(4))    : null,
      range_high:            rangeHigh   !== null ? parseFloat(rangeHigh.toFixed(4))   : null,
      confidence_band:       confidenceBand,
      status:                aggregateStatus,

      // Static anchors: reference pricing even without live data
      static_anchors,

      // Region context (passed through for future geo-scoped pricing logic)
      region: region ?? 'global',

      // Human-readable explanation of the current data state
      notes: buildSkuNote(sku, aggregateStatus),
    };
  });
}
