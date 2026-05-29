/**
 * POST /api/admin/hearst/gpu-prices/refresh
 *
 * Sprint 3.1 — Manual GPU pricing refresh trigger.
 *
 * Allows admin/editor users to trigger the daily refresh pipeline on demand
 * (demos, CI checks, on-call debugging). Mirrors the Inngest cron job but is
 * invocable via HTTP without waiting for the schedule.
 *
 * Auth:    requireProfile('editor') — editor or above only.
 * Method:  POST only (idempotent-ish: each call produces a distinct job_run_id).
 * Rate:    3 requests / minute / actor in production.
 *
 * Response 200:
 *   { jobRunId, fetchedAt, total, inserted, failed, providers, durationMs }
 *
 * Response 429:
 *   { error: 'rate_limited', retry_after_ms }
 */

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin.js';
import { runDailyRefresh } from '@/lib/oracle-live/refresh-pipeline.js';
import { isSafeDemoMode, DEMO_DISABLED_RESPONSE } from '@/lib/demo-mode';

// ─── Rate limiter (in-memory, per-actor, production only) ────────────────────

const RATE_WINDOW_MS  = 60_000; // 1 minute
const RATE_MAX        = 3;
const _rateLimitStore = new Map(); // actorId → { count, windowStart }

function checkRateLimit(actorId) {
  if (process.env.NODE_ENV !== 'production') return { allowed: true, retryAfterMs: 0 };

  const now   = Date.now();
  const entry = _rateLimitStore.get(actorId);

  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    _rateLimitStore.set(actorId, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count < RATE_MAX) {
    entry.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  const retryAfterMs = RATE_WINDOW_MS - (now - entry.windowStart);
  return { allowed: false, retryAfterMs };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  // Wave 1 — SAFE_DEMO_MODE: disable the live refresh trigger during presentations.
  if (isSafeDemoMode()) return NextResponse.json(DEMO_DISABLED_RESPONSE, { status: 503 });

  // Auth — editor role required for write/trigger operations.
  const auth = await requireProfile('editor');
  if (auth instanceof NextResponse) return auth;

  const actorId = auth.profile.id;

  // Rate limit.
  const { allowed, retryAfterMs } = checkRateLimit(actorId);
  if (!allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retry_after_ms: retryAfterMs },
      {
        status:  429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  // Parse optional body params (region, etc.).
  let body = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch (_) {
    // Non-JSON body — ignore, use defaults.
  }
  const region = typeof body.region === 'string' ? body.region : null;

  // Run the pipeline.
  const supa   = getAdminClient();
  const result = await runDailyRefresh({ supa, region });

  return NextResponse.json({
    ok:         true,
    triggered_by: actorId,
    ...result,
  });
}
