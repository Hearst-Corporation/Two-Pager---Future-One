/**
 * lib/oracle-live/providers/vast_ai.js
 *
 * Sprint 3.1 — Vast.ai live GPU pricing via public API.
 *
 * Vast.ai exposes a public bundle search endpoint that does NOT require auth
 * for browsing available GPU listings. We query it for each canonical SKU,
 * aggregate min/median/max from active listings, and return the pricing record.
 *
 * Endpoint: https://console.vast.ai/api/v0/bundles/
 *   Query params: q (JSON filter object), limit, order
 *
 * Vast.ai is a spot marketplace — prices vary per listing. We expose:
 *   - price_usd_hour: median $/GPU-hr across listings
 *   - range_low:  5th-percentile price
 *   - range_high: 95th-percentile price
 *
 * Always returns the canonical pricing record shape — never throws.
 */

import { SCRAPER_TIMEOUT_MS } from '../../constants.js';

const UA = 'HearstOracleObservatory/1.0 (+https://hearst.app)';
const TIMEOUT_MS = SCRAPER_TIMEOUT_MS;

/** Canonical SKU → Vast.ai gpu_name search patterns */
const SKU_TO_VAST_NAMES = {
  H100:   ['H100', 'H100 SXM', 'H100 PCIe', 'H100-80GB'],
  H200:   ['H200', 'H200 SXM'],
  B200:   ['B200'],
  GB200:  ['GB200'],
  MI300X: ['MI300X', 'Instinct MI300X', 'AMD MI300X'],
};

/**
 * Compute median of a sorted array.
 * @param {number[]} sorted
 * @returns {number}
 */
function median(sorted) {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Percentile of a sorted array.
 * @param {number[]} sorted
 * @param {number} p  0-100
 * @returns {number}
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

/**
 * Fetch GPU pricing from Vast.ai for a given canonical SKU.
 *
 * @param {string} sku  One of GPU_SKUS (e.g. 'H100').
 * @returns {Promise<Object>} Canonical pricing record.
 */
export async function fetchProviderVastAi(sku) {
  const base = {
    provider: 'vast_ai',
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
    notes: '',
    raw_excerpt: null,
  };

  const gpuNames = SKU_TO_VAST_NAMES[sku];
  if (!gpuNames || gpuNames.length === 0) {
    base.notes = `no Vast.ai GPU name mapping for SKU ${sku}`;
    return base;
  }

  // Vast.ai API only accepts a small subset of q fields without 400 errors.
  // Safest: fetch with an empty query and filter client-side by gpu_name.
  // The endpoint returns up to ~200 listings per call.
  const url = `https://console.vast.ai/api/v0/bundles/?q=%7B%7D`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      base.notes = `scrape failed: HTTP ${res.status} from Vast.ai API`;
      return base;
    }

    const text = await res.text();
    base.raw_excerpt = text.slice(0, 200);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      base.notes = `scrape failed: JSON parse error — ${parseErr.message}`;
      return base;
    }

    // Vast.ai returns { offers: [...] } or similar
    const allOffers = data.offers ?? data.bundles ?? data.results ?? (Array.isArray(data) ? data : []);

    if (!Array.isArray(allOffers) || allOffers.length === 0) {
      base.notes = `Vast.ai returned 0 listings (API response empty)`;
      base.status = 'unavailable';
      base.availability = 'unknown';
      return base;
    }

    // Filter client-side by gpu_name matching our canonical SKU
    const offers = allOffers.filter(o => {
      if (!o.gpu_name) return false;
      const gpuUpper = o.gpu_name.toUpperCase();
      return gpuNames.some(name => gpuUpper.includes(name.toUpperCase()));
    });

    if (offers.length === 0) {
      base.notes = `Vast.ai: 0 listings matching ${sku} (GPU names: ${gpuNames.join(', ')}) out of ${allOffers.length} total offers`;
      base.status = 'unavailable';
      base.availability = 'unknown';
      return base;
    }

    // Extract per-GPU hourly price from each listing
    // dph_total = dollar per hour (total for all GPUs in the listing)
    // num_gpus = number of GPUs in the listing
    const perGpuPrices = offers
      .map(o => {
        const total = o.dph_total ?? o.dph_base ?? null;
        const gpus = o.num_gpus ?? 1;
        if (total === null || gpus <= 0) return null;
        return parseFloat((total / gpus).toFixed(4));
      })
      .filter(p => p !== null && p > 0 && p < 1000)
      .sort((a, b) => a - b);

    if (perGpuPrices.length === 0) {
      base.notes = `Vast.ai listings found (${offers.length}) but no valid pricing extracted for ${sku}`;
      return base;
    }

    const medianPrice = parseFloat(median(perGpuPrices).toFixed(4));
    const rangeLow    = parseFloat(percentile(perGpuPrices, 5).toFixed(4));
    const rangeHigh   = parseFloat(percentile(perGpuPrices, 95).toFixed(4));

    const listingCount = perGpuPrices.length;
    const availability = listingCount >= 10
      ? 'available'
      : listingCount >= 3
        ? 'limited'
        : 'limited';

    const allocationRisk = listingCount >= 10
      ? 'low'
      : listingCount >= 3
        ? 'medium'
        : 'high';

    return {
      ...base,
      status: 'live',
      price_usd_hour: medianPrice,
      range_low: rangeLow,
      range_high: rangeHigh,
      availability,
      allocation_risk: allocationRisk,
      last_successful_update: new Date().toISOString(),
      freshness_hours: 0,
      pricing_confidence: listingCount >= 5 ? 'high' : 'medium',
      notes: `Vast.ai spot marketplace: ${listingCount} listings, median $${medianPrice}/GPU-hr (5th–95th pct: $${rangeLow}–$${rangeHigh})`,
      raw_excerpt: base.raw_excerpt,
    };

  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    base.notes = isTimeout
      ? `scrape failed: timeout after ${TIMEOUT_MS}ms`
      : `scrape failed: ${err.message}`;
    return base;
  }
}
