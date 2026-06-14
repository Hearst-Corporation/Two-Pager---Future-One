/**
 * lib/oracle-live/providers/nvidia_dgx_cloud.js
 *
 * Sprint 3.1 — NVIDIA DGX Cloud GPU pricing scraper.
 *
 * NVIDIA DGX Cloud pricing situation:
 *   - DGX Cloud is accessed through CSP marketplaces (AWS, Azure, GCP, OCI).
 *   - Pricing is per-node (8 GPUs) and disclosed through enterprise agreements
 *     or marketplace listings — not a public self-serve rate card.
 *   - Known reference: ~$37,000/node/month for H100 SXM (8× H100) = ~$4.65/GPU-hr
 *     (various press sources, 2024 — unverified and subject to change).
 *   - DGX B200/GB200 pricing not yet public.
 *   - NVIDIA's marketplace partners (CoreWeave, Oracle, AWS) set their own rates.
 *
 * Strategy:
 *   1. Probe the DGX Cloud public page for any structured pricing data.
 *   2. Return status:'unavailable' with an informative note — no fabricated prices.
 *   3. The intelligence layer static_anchors supply reference data for the memo.
 *
 * Always returns the canonical pricing record shape — never throws.
 */

import { SCRAPER_TIMEOUT_MS } from '../../constants.js';

const UA = 'HearstOracleObservatory/1.0 (+https://hearst.app)';
const TIMEOUT_MS = SCRAPER_TIMEOUT_MS;

/** NVIDIA DGX Cloud public page */
const DGX_CLOUD_URL = 'https://www.nvidia.com/en-us/data-center/dgx-cloud/';

/**
 * Fetch GPU pricing from NVIDIA DGX Cloud for a given canonical SKU.
 *
 * DGX Cloud does not publish a public machine-readable per-GPU-hour rate card.
 * This function probes the public page and returns unavailable with context.
 * No prices are fabricated.
 *
 * @param {string} sku  One of GPU_SKUS (e.g. 'H100').
 * @returns {Promise<Object>} Canonical pricing record.
 */
export async function fetchProviderNvidiaDgxCloud(sku) {
  const base = {
    provider: 'nvidia_dgx_cloud',
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
    notes: 'no public pricing endpoint — DGX Cloud pricing is per-node via CSP marketplace agreements (AWS/Azure/GCP/OCI); no self-serve rate card available',
    raw_excerpt: null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(DGX_CLOUD_URL, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);

    base.notes = `NVIDIA DGX Cloud page accessible (HTTP ${res.status}) but no machine-readable rate card — pricing is per-node via CSP marketplace (AWS/Azure/GCP/OCI). Reference: ~$37k/node/month for H100 SXM 8× (~$4.65/GPU-hr) per 2024 press — unverified.`;

  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    base.notes = isTimeout
      ? `no public pricing endpoint — DGX Cloud page timed out after ${TIMEOUT_MS}ms; pricing via CSP marketplace only`
      : `no public pricing endpoint — DGX Cloud page probe failed: ${err.message}; pricing via CSP marketplace only`;
  }

  return base;
}
