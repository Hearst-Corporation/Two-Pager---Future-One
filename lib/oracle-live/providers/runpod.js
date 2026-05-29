/**
 * lib/oracle-live/providers/runpod.js
 *
 * Sprint 3.1 — RunPod live GPU pricing via public GraphQL API.
 *
 * RunPod exposes a public GraphQL endpoint at https://api.runpod.io/graphql
 * that allows unauthenticated queries for GPU types and their pricing.
 *
 * Query used: gpuTypes — returns all GPU types with:
 *   - id, displayName
 *   - securePrice (secure cloud $/GPU-hr)
 *   - communityPrice (community cloud $/GPU-hr, usually cheaper)
 *   - secureSpotPrice, communitySpotPrice
 *   - lowestPrice (aggregate minimum across pod types)
 *
 * We prefer securePrice for apples-to-apples comparison with other providers.
 * We expose communityPrice as range_low when available.
 *
 * Always returns the canonical pricing record shape — never throws.
 */

const UA = 'HearstOracleObservatory/1.0 (+https://hearst.app)';
const TIMEOUT_MS = 8000;
const GRAPHQL_URL = 'https://api.runpod.io/graphql';

/** Canonical SKU → RunPod displayName fragments (case-insensitive) */
const SKU_TO_RUNPOD_NAMES = {
  H100:   ['H100'],
  H200:   ['H200'],
  B200:   ['B200'],
  GB200:  ['GB200'],
  MI300X: ['MI300X', 'MI300'],
};

/** GraphQL query to fetch all GPU types with pricing.
 *  Note: lowestPrice nested object causes INTERNAL_SERVER_ERROR on RunPod's API
 *  as of 2026-05 — omitted here. Use securePrice/communityPrice/spot fields only.
 */
const GPU_TYPES_QUERY = `
  query GpuTypes {
    gpuTypes {
      id
      displayName
      memoryInGb
      securePrice
      communityPrice
      secureSpotPrice
      communitySpotPrice
    }
  }
`;

/**
 * Match a RunPod GPU displayName to a canonical SKU.
 *
 * @param {string} displayName  RunPod GPU display name.
 * @param {string} canonicalSku Our canonical SKU to match against.
 * @returns {boolean}
 */
function matchesSku(displayName, canonicalSku) {
  const fragments = SKU_TO_RUNPOD_NAMES[canonicalSku] ?? [canonicalSku];
  const upper = displayName.toUpperCase();
  return fragments.some(frag => upper.includes(frag.toUpperCase()));
}

/**
 * Fetch GPU pricing from RunPod for a given canonical SKU.
 *
 * @param {string} sku  One of GPU_SKUS (e.g. 'H100').
 * @returns {Promise<Object>} Canonical pricing record.
 */
export async function fetchProviderRunPod(sku) {
  const base = {
    provider: 'runpod',
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: GPU_TYPES_QUERY }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      base.notes = `scrape failed: HTTP ${res.status} from RunPod GraphQL`;
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

    if (data.errors) {
      base.notes = `RunPod GraphQL errors: ${data.errors.map(e => e.message).join('; ')}`;
      return base;
    }

    const gpuTypes = data.data?.gpuTypes ?? [];
    if (!Array.isArray(gpuTypes) || gpuTypes.length === 0) {
      base.notes = 'RunPod returned empty gpuTypes list';
      return base;
    }

    // Find all GPU types matching our SKU
    const matches = gpuTypes.filter(g => g.displayName && matchesSku(g.displayName, sku));

    if (matches.length === 0) {
      base.notes = `RunPod: no GPU type found matching ${sku} (checked ${gpuTypes.length} types)`;
      base.status = 'unavailable';
      return base;
    }

    // Prefer securePrice; fall back to communityPrice
    const prices = matches
      .map(g => {
        const secure = typeof g.securePrice === 'number' ? g.securePrice : null;
        const community = typeof g.communityPrice === 'number' ? g.communityPrice : null;
        return secure ?? community ?? null;
      })
      .filter(p => p !== null && p > 0 && p < 1000)
      .sort((a, b) => a - b);

    const communityPrices = matches
      .map(g => typeof g.communityPrice === 'number' ? g.communityPrice : null)
      .filter(p => p !== null && p > 0)
      .sort((a, b) => a - b);

    const spotPrices = matches
      .map(g => {
        const sp = g.secureSpotPrice ?? g.communitySpotPrice ?? null;
        return typeof sp === 'number' && sp > 0 ? sp : null;
      })
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      base.notes = `RunPod: ${matches.length} matching GPU type(s) found but no valid securePrice for ${sku}`;
      return base;
    }

    // Use median secure price as the canonical price
    const mid = Math.floor(prices.length / 2);
    const price = prices.length % 2 !== 0
      ? prices[mid]
      : (prices[mid - 1] + prices[mid]) / 2;

    const rangeLow = spotPrices.length > 0
      ? spotPrices[0]
      : communityPrices.length > 0
        ? communityPrices[0]
        : prices[0];

    const rangeHigh = prices[prices.length - 1];

    const bestMatch = matches[0];

    return {
      ...base,
      status: 'live',
      price_usd_hour: parseFloat(price.toFixed(4)),
      range_low: parseFloat(rangeLow.toFixed(4)),
      range_high: parseFloat(rangeHigh.toFixed(4)),
      availability: 'available',
      allocation_risk: 'low',
      last_successful_update: new Date().toISOString(),
      freshness_hours: 0,
      pricing_confidence: 'high',
      notes: `RunPod secure cloud: ${matches.length} variant(s) matched "${sku}" (e.g. ${bestMatch.displayName}). Secure $${parseFloat(price.toFixed(4))}/GPU-hr`,
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
