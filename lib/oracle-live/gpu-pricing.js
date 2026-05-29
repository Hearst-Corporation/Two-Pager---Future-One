/**
 * lib/oracle-live/gpu-pricing.js
 *
 * Sprint 3 — GPU Pricing Intelligence Foundation.
 *
 * Architecture:
 *   - GPU_SKUS       : canonical list of supported SKUs.
 *   - PROVIDERS      : list of cloud providers wired architecturally.
 *   - fetchProviderXxx(sku) : per-provider stubs (return unavailable now,
 *                            wired up in Sprint 3.1+ when scrapers are built).
 *   - getGpuPricingBrief()  : aggregator; merges live (unavailable) + static anchors.
 *
 * Static anchors are hydrated from lib/oracle-intelligence/datapoints.js:
 *   lambda_h100_on_demand, lambda_h200_on_demand,
 *   lambda_gb200_pre_order, lambda_mi300x
 * They carry source:'static_anchor', freshness (computed from datapoint timestamp),
 * volatility:'high'.
 *
 * No network requests are made in this file.
 * All TODO Sprint 3.1 comments mark provider plug points for future scrapers.
 */

import { DATAPOINT_BY_ID } from '@/lib/oracle-intelligence/datapoints.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Canonical GPU SKUs supported by the pricing intelligence layer. */
export const GPU_SKUS = ['H100', 'H200', 'B200', 'GB200', 'MI300X'];

/** Cloud provider identifiers wired architecturally (scrapers: Sprint 3.1+). */
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
 *
 * Format: { [sku]: [datapointId, ...] }
 */
const STATIC_ANCHOR_MAP = {
  H100:   ['lambda_h100_on_demand'],
  H200:   ['lambda_h200_on_demand'],
  GB200:  ['lambda_gb200_pre_order'],
  MI300X: ['lambda_mi300x'],
  B200:   [], // No anchor datapoint yet — Sprint 3.1+ will add B200 pricing
};

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

// ─── Provider Stubs ───────────────────────────────────────────────────────────

/**
 * Fetch GPU pricing from Lambda Labs.
 * @param {string} sku  One of GPU_SKUS.
 * @returns {Object} Provider pricing record (unavailable until Sprint 3.1).
 *
 * TODO Sprint 3.1 : scrape https://lambda.ai/service/gpu-cloud price grid
 *   - Parse the on-demand rate table (HTML or JSON API if available).
 *   - Map Lambda SKU names → our canonical GPU_SKUS.
 *   - Return { status:'live', price_usd_hour, availability, ... }.
 */
function fetchProviderLambda(sku) {
  return {
    status: 'unavailable',
    reason: 'live_scraper_not_wired_yet',
    provider: 'lambda',
    sku,
    last_attempted: null,
  };
}

/**
 * Fetch GPU pricing from CoreWeave.
 * @param {string} sku
 * @returns {Object}
 *
 * TODO Sprint 3.1 : scrape https://www.coreweave.com/gpu-cloud-computing price table
 *   - CoreWeave uses a quote-based model for large clusters; on-demand rates
 *     may require authenticated session or contact form.
 *   - Fallback: parse public press release / blog post rate mentions.
 */
function fetchProviderCoreWeave(sku) {
  return {
    status: 'unavailable',
    reason: 'live_scraper_not_wired_yet',
    provider: 'coreweave',
    sku,
    last_attempted: null,
  };
}

/**
 * Fetch GPU pricing from Vast.ai.
 * @param {string} sku
 * @returns {Object}
 *
 * TODO Sprint 3.1 : query https://console.vast.ai/api/v0/bundles/ (public API)
 *   - Filter by gpu_name matching our canonical SKU.
 *   - Aggregate min/median/max $/GPU-hr from live listings.
 *   - Note: Vast.ai is a spot marketplace; prices vary per listing.
 */
function fetchProviderVastAi(sku) {
  return {
    status: 'unavailable',
    reason: 'live_scraper_not_wired_yet',
    provider: 'vast_ai',
    sku,
    last_attempted: null,
  };
}

/**
 * Fetch GPU pricing from RunPod.
 * @param {string} sku
 * @returns {Object}
 *
 * TODO Sprint 3.1 : query https://api.runpod.io/graphql (public GraphQL)
 *   - Use `gpuTypes` query to fetch secure cloud on-demand prices.
 *   - Map RunPod displayName → our canonical GPU_SKUS.
 */
function fetchProviderRunPod(sku) {
  return {
    status: 'unavailable',
    reason: 'live_scraper_not_wired_yet',
    provider: 'runpod',
    sku,
    last_attempted: null,
  };
}

/**
 * Fetch GPU pricing from NVIDIA DGX Cloud.
 * @param {string} sku
 * @returns {Object}
 *
 * TODO Sprint 3.1 : scrape https://www.nvidia.com/en-us/data-center/dgx-cloud/
 *   - DGX Cloud pricing is typically disclosed per-node (8-GPU), not per-GPU-hour.
 *   - Convert node-hour → per-GPU-hour for comparability.
 *   - May require authenticated access or enterprise quote flow.
 */
function fetchProviderNvidiaDgxCloud(sku) {
  return {
    status: 'unavailable',
    reason: 'live_scraper_not_wired_yet',
    provider: 'nvidia_dgx_cloud',
    sku,
    last_attempted: null,
  };
}

/** Dispatch map: provider id → fetch function. */
const PROVIDER_FETCHERS = {
  lambda:           fetchProviderLambda,
  coreweave:        fetchProviderCoreWeave,
  vast_ai:          fetchProviderVastAi,
  runpod:           fetchProviderRunPod,
  nvidia_dgx_cloud: fetchProviderNvidiaDgxCloud,
};

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
      confidence:      dp.confidence,    // from original datapoint (e.g. 'high', 'medium')
      volatility:      'high',           // GPU spot prices move fast; always flag high
      source_name:     dp.notes?.source_name ?? null,
      caveat:          dp.notes?.caveat ?? null,
      applicability:   dp.notes?.applicability ?? null,
    }));
}

// ─── SKU Notes ────────────────────────────────────────────────────────────────

/**
 * Human-readable note explaining the data situation for a given SKU.
 *
 * @param {string} sku
 * @returns {string}
 */
function buildSkuNote(sku) {
  const notes = {
    H100:
      'H100 pricing anchored to Lambda public catalog (Apr 2025). Live scraper (Sprint 3.1) will add CoreWeave, Vast.ai, RunPod, DGX Cloud comparisons for a full market range.',
    H200:
      'H200 anchored to Lambda public catalog (Apr 2025). Supply-constrained SKU — pricing moves weekly; live scraper needed for accurate range.',
    B200:
      'B200 has no static anchor yet; hardware is ramping in 2025-2026. Pricing will be wired in Sprint 3.1 once public rate cards appear.',
    GB200:
      'GB200 anchored to Lambda pre-order catalog (Apr 2025). Rack-level NVL72 MSRP ($3M/rack) available as hardware reference datapoint.',
    MI300X:
      'MI300X anchored to Lambda AMD catalog (Apr 2025). Inference-optimised workload arbitrage — live comparison across RunPod/Vast.ai needed in Sprint 3.1.',
  };
  return notes[sku] ?? `No live data available for ${sku}. Sprint 3.1 will wire provider scrapers.`;
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

/**
 * Get a GPU pricing brief for the requested SKUs and providers.
 *
 * Returns an array of per-SKU objects. Each object contains:
 *   - prices[]        : Live provider prices (all currently `unavailable`).
 *   - static_anchors[]: Static anchor records from intelligence datapoints layer.
 *   - Aggregate stats : All null until live data flows (Sprint 3.1+).
 *   - status / confidence_band : Data quality signal for consumers.
 *   - notes           : Human-readable explanation of the current data gap.
 *
 * @param {Object}   [opts]
 * @param {string}   [opts.region]     Optional region filter (informational; future geo-scoped pricing).
 * @param {string[]} [opts.skus]       SKUs to include. Defaults to all GPU_SKUS.
 * @param {string[]} [opts.providers]  Providers to query. Defaults to all PROVIDERS.
 * @returns {Array<Object>} Array of per-SKU pricing briefs.
 */
export function getGpuPricingBrief({
  region = null,
  skus = GPU_SKUS,
  providers = PROVIDERS,
} = {}) {
  return skus.map(sku => {
    // Collect live provider records (all unavailable this sprint).
    const prices = providers.map(provider => {
      const fetcher = PROVIDER_FETCHERS[provider];
      const raw = fetcher
        ? fetcher(sku)
        : {
            status: 'unavailable',
            reason: 'unknown_provider',
            provider,
            sku,
            last_attempted: null,
          };

      return {
        provider:        raw.provider,
        status:          raw.status,
        price_usd_hour:  null,
        last_updated:    null,
        availability:    'unknown',
        allocation_risk: 'unknown',
        confidence:      'unavailable',
        // Internal field — callers may strip before sending to client if desired.
        _reason:         raw.reason,
      };
    });

    // Hydrate static anchors from intelligence layer.
    const static_anchors = buildStaticAnchors(sku);

    return {
      sku,

      // Live provider prices — all unavailable until Sprint 3.1.
      prices,

      // Aggregate statistics — will be computed once live data flows.
      median_price_usd_hour: null,
      range_low:             null,
      range_high:            null,
      confidence_band:       'no_live_data',
      status:                'unavailable',

      // Static anchors: reference pricing even without live data.
      static_anchors,

      // Region context (passed through for future geo-scoped pricing logic).
      region: region ?? 'global',

      // Human-readable explanation of the data gap for this SKU.
      notes: buildSkuNote(sku),
    };
  });
}
