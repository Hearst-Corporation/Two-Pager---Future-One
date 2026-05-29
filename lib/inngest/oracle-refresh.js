/**
 * lib/inngest/oracle-refresh.js
 *
 * Sprint 3.1 — Inngest function: oracle.refresh.daily
 *
 * Triggers at 06:00 Qatar time (AST = UTC+3) every day.
 * Calls runDailyRefresh() from the transport-agnostic pipeline runner.
 *
 * Robustness:
 *   - Step-level retry with exponential backoff (3 attempts).
 *   - Failure handler logs and suppresses re-throw — the pipeline is
 *     partial-success tolerant and must not block future runs.
 *   - If `inngest` package is absent, the module catches the import error
 *     and exports a no-op so the rest of the app is not broken.
 */

import { runDailyRefresh } from '@/lib/oracle-live/refresh-pipeline.js';
import { getAdminClient } from '@/lib/supabase-admin.js';

// ─── Inngest function definition ──────────────────────────────────────────────

/**
 * Build and export the Inngest function.
 * Wrapped in a try/catch so that absence of the `inngest` package does not
 * crash the module tree at startup.
 *
 * @param {import('inngest').Inngest} inngest
 * @returns {import('inngest').InngestFunction | null}
 */
export function buildOracleRefreshFn(inngest) {
  try {
    return inngest.createFunction(
      {
        id:   'oracle-refresh-daily',
        name: 'oracle.refresh.daily',
        retries: 3,
        // Failure handler: log but do not re-throw — partial success is acceptable.
        onFailure: async ({ error }) => {
          console.warn('[oracle-refresh] All retries exhausted:', error?.message ?? error);
        },
      },
      // 6 AM Qatar Standard Time (AST = UTC+3) → 03:00 UTC
      { cron: '0 3 * * *' },

      async ({ step }) => {
        const result = await step.run(
          'refreshPricing',
          async () => {
            const supa = getAdminClient();
            return runDailyRefresh({ supa });
          },
        );

        console.info('[oracle-refresh] Run complete:', JSON.stringify({
          jobRunId:  result.jobRunId,
          total:     result.total,
          inserted:  result.inserted,
          failed:    result.failed,
          durationMs: result.durationMs,
        }));

        return result;
      },
    );
  } catch (err) {
    console.warn('[oracle-refresh] Failed to build Inngest function:', err?.message);
    return null;
  }
}

// ─── Named export for convenience ─────────────────────────────────────────────

/**
 * Pre-built Inngest function instance, using the shared client.
 * May be null if the `inngest` package is not installed.
 */
let oracleRefreshDaily = null;

try {
  const { inngest } = await import('./client.js');
  oracleRefreshDaily = buildOracleRefreshFn(inngest);
} catch (err) {
  console.warn('[oracle-refresh] Inngest client unavailable — cron disabled:', err?.message);
}

export { oracleRefreshDaily };
