/**
 * lib/oracle-live/providers/coreweave.js
 *
 * Sprint 3.1 — CoreWeave GPU pricing scraper.
 *
 * CoreWeave pricing situation:
 *   - No public self-serve rate card for H100/H200/GB200/MI300X.
 *   - Pricing is disclosed via enterprise quote flow or partner agreements.
 *   - The public pricing page (https://www.coreweave.com/gpu-cloud-computing)
 *     mentions capabilities but routes to "Contact Sales" for rates.
 *   - Some rates appear in public press releases and earnings calls
 *     (e.g. $2.06–$2.49/GPU-hr for H100 SXM cited in Q4 2024 media).
 *
 * Strategy:
 *   1. Attempt a lightweight fetch of the pricing page to confirm it's
 *      accessible and note the HTTP status.
 *   2. Return status:'unavailable' with a clear note — no fabricated prices.
 *   3. The static_anchors in gpu-pricing.js will still supply the intelligence
 *      layer reference data for the memo.
 *
 * Always returns the canonical pricing record shape — never throws.
 */

const UA = 'HearstOracleObservatory/1.0 (+https://hearst.app)';
const TIMEOUT_MS = 8000;

/** CoreWeave pricing page URL */
const PRICING_URL = 'https://www.coreweave.com/gpu-cloud-computing';

/**
 * Fetch GPU pricing from CoreWeave for a given canonical SKU.
 *
 * CoreWeave does not publish a public machine-readable rate card.
 * This function attempts a connectivity probe and returns unavailable
 * with an informative note — never fabricates a price.
 *
 * @param {string} sku  One of GPU_SKUS (e.g. 'H100').
 * @returns {Promise<Object>} Canonical pricing record.
 */
export async function fetchProviderCoreWeave(sku) {
  const base = {
    provider: 'coreweave',
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
    notes: 'no public pricing endpoint — CoreWeave uses enterprise quote flow; contact sales for rate card',
    raw_excerpt: null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PRICING_URL, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);

    // Page is accessible — but has no machine-readable pricing
    base.notes = `CoreWeave pricing page accessible (HTTP ${res.status}) but no public rate card — enterprise quote flow required. Known range for H100 SXM: ~$2.06–$2.49/GPU-hr (press/media Q4 2024, unverified).`;

  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    base.notes = isTimeout
      ? `no public pricing endpoint — connectivity probe timed out after ${TIMEOUT_MS}ms; CoreWeave uses enterprise quote flow`
      : `no public pricing endpoint — connectivity probe failed: ${err.message}; CoreWeave uses enterprise quote flow`;
  }

  return base;
}
