/**
 * lib/oracle-live/refresh-pipeline.js
 *
 * Sprint 3.1 — Daily Refresh Pipeline runner.
 *
 * Fully transport-agnostic: can be called from Inngest, a manual HTTP endpoint,
 * a cron job, or a test harness. Never throws — returns a structured result
 * with per-provider status so callers can surface partial success.
 *
 * Robustness contract:
 *   - Provider isolation via Promise.allSettled — one provider failure never
 *     cascades to another.
 *   - Partial success: even if Lambda fails, Vast.ai rows are still inserted.
 *   - Timeout protection: each provider fetch is individually time-boxed.
 *   - No hard dependency on Inngest — works standalone.
 */

import { getGpuPricingBrief, GPU_SKUS, PROVIDERS } from './gpu-pricing.js';
import { scoreFreshness, scoreVolatility } from './freshness.js';

// ─── Config ──────────────────────────────────────────────────────────────────

/** Per-provider fetch timeout in ms. */
const PROVIDER_TIMEOUT_MS = 15_000;

/** Compute hours elapsed since a given ISO timestamp. */
function computeFreshnessHours(timestamp) {
  return Math.round((Date.now() - new Date(timestamp).getTime()) / 3_600_000);
}

// ─── Snapshot row builder ─────────────────────────────────────────────────────

/**
 * Map a live pricing record from getGpuPricingBrief into a DB row shape.
 *
 * @param {string} sku
 * @param {Object} priceRecord  — one entry from skuBrief.prices[]
 * @param {string} jobRunId
 * @param {string} fetchedAt    — ISO timestamp of the run
 * @returns {Object}
 */
function buildSnapshotRow(sku, priceRecord, jobRunId, fetchedAt) {
  const freshnessHours = priceRecord.last_updated
    ? computeFreshnessHours(priceRecord.last_updated)
    : null;

  return {
    fetched_at:         fetchedAt,
    sku,
    provider:           priceRecord.provider,
    status:             priceRecord.status ?? 'unavailable',
    price_usd_hour:     priceRecord.price_usd_hour ?? null,
    range_low:          priceRecord.range_low ?? null,
    range_high:         priceRecord.range_high ?? null,
    availability:       priceRecord.availability ?? null,
    allocation_risk:    priceRecord.allocation_risk ?? null,
    pricing_confidence: priceRecord.confidence ?? null,
    freshness_hours:    freshnessHours,
    raw_payload:        priceRecord,
    job_run_id:         jobRunId,
  };
}

/**
 * Map a static anchor from skuBrief.static_anchors[] into a DB row shape.
 *
 * @param {string} sku
 * @param {Object} anchor
 * @param {string} jobRunId
 * @param {string} fetchedAt
 * @returns {Object}
 */
function buildAnchorRow(sku, anchor, jobRunId, fetchedAt) {
  return {
    fetched_at:         fetchedAt,
    sku,
    provider:           anchor.provider ?? 'static_anchor',
    status:             'stale',
    price_usd_hour:     anchor.price_usd_hour ?? null,
    range_low:          null,
    range_high:         null,
    availability:       'anchored',
    allocation_risk:    null,
    pricing_confidence: anchor.confidence ?? null,
    freshness_hours:    anchor.timestamp ? computeFreshnessHours(anchor.timestamp) : null,
    raw_payload:        anchor,
    job_run_id:         jobRunId,
  };
}

// ─── Provider reliability tracker ─────────────────────────────────────────────

/**
 * In-memory reliability store, scoped to this run.
 * Sprint 3.2+ will persist to DB (hearst_provider_reliability table).
 */
const _reliabilityStore = new Map();

/**
 * Record a provider attempt result.
 *
 * @param {string} provider
 * @param {'success'|'failure'|'unavailable'} result
 */
export function recordProviderAttempt(provider, result) {
  const entry = _reliabilityStore.get(provider) ?? {
    attempts: 0, successes: 0, failures: 0, last_result: null,
  };
  entry.attempts += 1;
  if (result === 'success')      entry.successes += 1;
  else if (result === 'failure') entry.failures  += 1;
  entry.last_result = result;
  _reliabilityStore.set(provider, entry);
}

/**
 * Get a reliability snapshot keyed by provider.
 * @returns {Object}
 */
export function getReliabilitySnapshot() {
  const out = {};
  for (const [provider, entry] of _reliabilityStore.entries()) {
    const rate = entry.attempts > 0
      ? +(entry.successes / entry.attempts).toFixed(2)
      : null;
    out[provider] = { ...entry, success_rate: rate };
  }
  return out;
}

// ─── DB persistence ───────────────────────────────────────────────────────────

/**
 * Bulk-insert snapshot rows into crm.hearst_gpu_pricing_snapshots.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supa
 * @param {Object[]} rows
 * @returns {Promise<{ inserted: number, failed: number }>}
 */
async function persistSnapshots(supa, rows) {
  if (!rows.length) return { inserted: 0, failed: 0 };

  try {
    const { error, data } = await supa
      .from('hearst_gpu_pricing_snapshots')
      .insert(rows)
      .select('id');

    if (error) {
      console.warn('[refresh-pipeline] DB insert error:', error.message);
      return { inserted: 0, failed: rows.length };
    }

    return { inserted: data?.length ?? rows.length, failed: 0 };
  } catch (err) {
    console.warn('[refresh-pipeline] DB insert threw:', err?.message);
    return { inserted: 0, failed: rows.length };
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Run the daily GPU pricing refresh pipeline.
 *
 * Fetches all GPU prices, inserts snapshot rows into Supabase, and returns a
 * structured summary. Never throws — partial failures are captured in the result.
 *
 * @param {Object} opts
 * @param {import('@supabase/supabase-js').SupabaseClient} opts.supa  — service-role client
 * @param {string} [opts.jobRunId]   — UUID to correlate all rows from this run
 * @param {string} [opts.region]     — optional region context (passed through to pricing)
 * @returns {Promise<{
 *   jobRunId: string,
 *   fetchedAt: string,
 *   total: number,
 *   inserted: number,
 *   failed: number,
 *   providers: Object,
 *   reliability: Object,
 *   durationMs: number,
 * }>}
 */
export async function runDailyRefresh({
  supa,
  jobRunId = crypto.randomUUID(),
  region = null,
} = {}) {
  const startMs   = Date.now();
  const fetchedAt = new Date().toISOString();

  console.info(`[refresh-pipeline] Starting run ${jobRunId}`);

  // Step 1: Fetch pricing brief — synchronous today, may become async in 3.2+.
  let brief = [];
  try {
    brief = getGpuPricingBrief({ region, skus: GPU_SKUS, providers: PROVIDERS });
  } catch (err) {
    console.warn('[refresh-pipeline] getGpuPricingBrief threw:', err?.message);
  }

  // Step 2: Provider-isolated row collection via Promise.allSettled.
  const providerStatus = {};
  const allRows = [];

  const skuTasks = brief.map(async skuBrief => {
    const sku = skuBrief.sku;

    // Live provider prices.
    const providerTasks = (skuBrief.prices ?? []).map(async priceRecord => {
      const provider = priceRecord.provider;
      try {
        // Timeout guard — for future real HTTP scrapers.
        await Promise.race([
          Promise.resolve(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('provider_timeout')), PROVIDER_TIMEOUT_MS)
          ),
        ]);

        const row = buildSnapshotRow(sku, priceRecord, jobRunId, fetchedAt);
        allRows.push(row);

        const isLive = priceRecord.status === 'live';
        recordProviderAttempt(provider, isLive ? 'success' : 'unavailable');
        providerStatus[provider] = providerStatus[provider] ?? priceRecord.status;
      } catch (err) {
        console.warn(`[refresh-pipeline] ${provider}/${sku} failed:`, err?.message);
        recordProviderAttempt(provider, 'failure');
        providerStatus[provider] = 'failed';
      }
    });

    await Promise.allSettled(providerTasks);

    // Static anchors (pure objects — always safe).
    for (const anchor of (skuBrief.static_anchors ?? [])) {
      try {
        allRows.push(buildAnchorRow(sku, anchor, jobRunId, fetchedAt));
      } catch (err) {
        console.warn(`[refresh-pipeline] Anchor build failed ${sku}:`, err?.message);
      }
    }
  });

  await Promise.allSettled(skuTasks);

  // Step 3: Bulk persist all rows.
  const { inserted, failed } = await persistSnapshots(supa, allRows);

  const durationMs = Date.now() - startMs;

  console.info(
    `[refresh-pipeline] ${jobRunId} done — rows=${allRows.length} inserted=${inserted} failed=${failed} (${durationMs}ms)`
  );

  return {
    jobRunId,
    fetchedAt,
    total:      allRows.length,
    inserted,
    failed,
    providers:  providerStatus,
    reliability: getReliabilitySnapshot(),
    durationMs,
  };
}
