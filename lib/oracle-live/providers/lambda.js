/**
 * lib/oracle-live/providers/lambda.js
 *
 * Sprint 3.1 — Lambda Labs live GPU pricing scraper.
 *
 * Fetches the Lambda Labs GPU cloud pricing page (public HTML) and parses
 * per-GPU on-demand rates. Targets the structured price data embedded in
 * the page (JSON-in-script or HTML table, layout may vary).
 *
 * Strategy:
 *   1. Fetch https://lambdalabs.com/service/gpu-cloud (public marketing page).
 *   2. Parse JSON embedded in <script type="application/json"> or __NEXT_DATA__,
 *      or fall back to regex on visible price strings.
 *   3. Map Lambda SKU names → canonical GPU_SKUS.
 *
 * Always returns the canonical pricing record shape — never throws.
 */

const UA = 'HearstOracleObservatory/1.0 (+https://hearst.app)';
const TIMEOUT_MS = 8000;

/** Map of Lambda SKU name fragments → canonical SKU */
const SKU_MAP = {
  'H100':  'H100',
  'H200':  'H200',
  'B200':  'B200',
  'GB200': 'GB200',
  'MI300': 'MI300X',
  'A100':  'A100',
};

/** Canonical → Lambda display name variants (lowercase fragments) */
const CANONICAL_TO_LAMBDA = {
  H100:   ['h100'],
  H200:   ['h200'],
  B200:   ['b200'],
  GB200:  ['gb200'],
  MI300X: ['mi300x', 'mi300'],
};

/**
 * Extract price (USD/hr) from a text excerpt mentioning a GPU SKU.
 * @param {string} text
 * @returns {number|null}
 */
function extractPriceFromText(text) {
  const hourlyMatch = text.match(/\$\s*([\d,]+\.?\d*)\s*\/\s*(?:hr|hour)/i);
  if (hourlyMatch) {
    return parseFloat(hourlyMatch[1].replace(',', ''));
  }
  const monthlyMatch = text.match(/\$\s*([\d,]+\.?\d*)\s*\/\s*(?:mo|month)/i);
  if (monthlyMatch) {
    const monthly = parseFloat(monthlyMatch[1].replace(',', ''));
    return parseFloat((monthly / 730).toFixed(4));
  }
  return null;
}

/**
 * Try to parse pricing from Lambda's __NEXT_DATA__ JSON blob.
 * @param {string} html
 * @returns {Array<{sku: string, price_usd_hour: number}>}
 */
function parseNextData(html) {
  const results = [];
  try {
    const match = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return results;
    const data = JSON.parse(match[1]);
    const flatten = (obj, depth) => {
      if (!obj || typeof obj !== 'object' || depth > 10) return;
      if (Array.isArray(obj)) { obj.forEach(v => flatten(v, depth + 1)); return; }
      const gpuName = obj.gpu_name ?? obj.name ?? obj.gpu ?? obj.display_name ?? null;
      const price = obj.price_per_hour ?? obj.cost_per_hour ?? obj.price ?? null;
      if (gpuName && typeof price === 'number') {
        results.push({ sku: String(gpuName), price_usd_hour: price });
      }
      Object.values(obj).forEach(v => flatten(v, depth + 1));
    };
    flatten(data, 0);
  } catch (e) { console.warn('[oracle-live/lambda] parseNextData failed:', e.message); }
  return results;
}

/**
 * Try to parse pricing from Lambda's embedded JSON script tags.
 * @param {string} html
 * @returns {Array<{sku: string, price_usd_hour: number}>}
 */
function parseEmbeddedJson(html) {
  const results = [];
  const scriptRegex = /<script[^>]+type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const flatten = (obj, depth) => {
        if (!obj || typeof obj !== 'object' || depth > 10) return;
        if (Array.isArray(obj)) { obj.forEach(v => flatten(v, depth + 1)); return; }
        const gpuName = obj.gpu_name ?? obj.name ?? obj.gpu ?? null;
        const price = obj.price_per_hour ?? obj.cost_per_hour ?? obj.price ?? null;
        if (gpuName && typeof price === 'number') {
          results.push({ sku: String(gpuName), price_usd_hour: price });
        }
        Object.values(obj).forEach(v => flatten(v, depth + 1));
      };
      flatten(data, 0);
    } catch (e) { console.warn('[oracle-live/lambda] parseEmbeddedJson failed:', e.message); }
  }
  return results;
}

/**
 * Text-based heuristic: find SKU near a price string.
 * @param {string} html
 * @param {string} canonicalSku
 * @returns {number|null}
 */
function parseHtmlText(html, canonicalSku) {
  const fragments = CANONICAL_TO_LAMBDA[canonicalSku] ?? [canonicalSku.toLowerCase()];
  const text = html.replace(/<[^>]+>/g, ' ');
  for (const frag of fragments) {
    const idx = text.toLowerCase().indexOf(frag);
    if (idx === -1) continue;
    const excerpt = text.slice(idx, idx + 400);
    const price = extractPriceFromText(excerpt);
    if (price !== null && price > 0 && price < 500) return price;
  }
  return null;
}

/**
 * Resolve canonical SKU from a Lambda GPU name string.
 * @param {string} gpuName
 * @returns {string|null}
 */
function resolveCanonicalSku(gpuName) {
  const upper = gpuName.toUpperCase();
  for (const [frag, canonical] of Object.entries(SKU_MAP)) {
    if (upper.includes(frag)) return canonical;
  }
  return null;
}

/**
 * Fetch GPU pricing from Lambda Labs for a given canonical SKU.
 *
 * @param {string} sku  One of GPU_SKUS (e.g. 'H100').
 * @returns {Promise<Object>} Canonical pricing record.
 */
export async function fetchProviderLambda(sku) {
  const base = {
    provider: 'lambda',
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

  const urls = [
    'https://lambdalabs.com/service/gpu-cloud',
    'https://cloud.lambdalabs.com/instances',
  ];

  for (const url of urls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,*/*',
        },
        redirect: 'follow',
      });
      clearTimeout(timer);

      if (!res.ok) {
        base.notes = `HTTP ${res.status} from ${url}`;
        continue;
      }

      const html = await res.text();
      const rawExcerpt = html.slice(0, 200);

      // Try __NEXT_DATA__ first (most structured)
      const nextItems = parseNextData(html);
      for (const item of nextItems) {
        const canonical = resolveCanonicalSku(item.sku);
        if (canonical === sku && item.price_usd_hour > 0) {
          return {
            ...base,
            status: 'live',
            price_usd_hour: item.price_usd_hour,
            availability: 'available',
            allocation_risk: 'low',
            last_successful_update: new Date().toISOString(),
            freshness_hours: 0,
            pricing_confidence: 'high',
            notes: `Parsed from Lambda __NEXT_DATA__ JSON (${url})`,
            raw_excerpt: rawExcerpt,
          };
        }
      }

      // Try embedded application/json script tags
      const jsonItems = parseEmbeddedJson(html);
      for (const item of jsonItems) {
        const canonical = resolveCanonicalSku(item.sku);
        if (canonical === sku && item.price_usd_hour > 0) {
          return {
            ...base,
            status: 'live',
            price_usd_hour: item.price_usd_hour,
            availability: 'available',
            allocation_risk: 'low',
            last_successful_update: new Date().toISOString(),
            freshness_hours: 0,
            pricing_confidence: 'medium',
            notes: `Parsed from Lambda embedded JSON (${url})`,
            raw_excerpt: rawExcerpt,
          };
        }
      }

      // Fallback: text-based heuristic
      const textPrice = parseHtmlText(html, sku);
      if (textPrice !== null) {
        return {
          ...base,
          status: 'live',
          price_usd_hour: textPrice,
          availability: 'available',
          allocation_risk: 'medium',
          last_successful_update: new Date().toISOString(),
          freshness_hours: 0,
          pricing_confidence: 'low',
          notes: `Heuristic text parse from Lambda pricing page (${url}) — verify manually`,
          raw_excerpt: rawExcerpt,
        };
      }

      base.notes = `Page fetched (${url}) but ${sku} price not found in parsed content`;
      base.raw_excerpt = rawExcerpt;

    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      base.notes = isTimeout
        ? `scrape failed: timeout after ${TIMEOUT_MS}ms (${url})`
        : `scrape failed: ${err.message} (${url})`;
    }
  }

  if (!base.notes) {
    base.notes = `no public pricing found for ${sku} on Lambda pricing pages`;
  }
  return base;
}
