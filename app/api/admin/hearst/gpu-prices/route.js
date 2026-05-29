/**
 * GET /api/admin/hearst/gpu-prices
 *
 * Sprint 3 — GPU Pricing Intelligence endpoint.
 *
 * Returns a pricing brief for all supported GPU SKUs.
 * Live provider data is currently unavailable (scrapers wired in Sprint 3.1).
 * Static anchors from the intelligence layer are always included.
 *
 * Query params:
 *   - skus      : comma-separated list of SKUs to filter (e.g. ?skus=H100,H200).
 *                 Defaults to all supported SKUs.
 *   - providers : comma-separated list of providers to include.
 *                 Defaults to all supported providers.
 *   - region    : optional region string for future geo-scoped pricing.
 *
 * Auth: requireProfile('viewer') — read-only, any logged-in user.
 * Rate-limit: 3 requests/min/actor in production; skipped in development.
 */

import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/supabase-admin';
import { getGpuPricingBrief, GPU_SKUS, PROVIDERS } from '@/lib/oracle-live/gpu-pricing.js';

// ─── Rate limiter (in-memory, per-actor, production only) ────────────────────

/** Simple in-memory rate-limit store. Keyed by actor id. */
const RATE_LIMIT_WINDOW_MS  = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQS   = 3;
const rateLimitStore = new Map(); // actorId → { count, windowStart }

/**
 * Check whether the actor has exceeded the rate limit.
 *
 * @param {string} actorId
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
function checkRateLimit(actorId) {
  // Skip rate-limiting in non-production environments.
  if (process.env.NODE_ENV !== 'production') return { allowed: true, retryAfterMs: 0 };

  const now  = Date.now();
  const entry = rateLimitStore.get(actorId);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // Fresh window.
    rateLimitStore.set(actorId, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count < RATE_LIMIT_MAX_REQS) {
    entry.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
  return { allowed: false, retryAfterMs };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(req) {
  // Auth — requires at minimum viewer role.
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const actorId = auth.profile.id;

  // Rate limit.
  const { allowed, retryAfterMs } = checkRateLimit(actorId);
  if (!allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retry_after_ms: retryAfterMs },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  // Parse query params.
  const { searchParams } = new URL(req.url);

  const skusParam      = searchParams.get('skus');
  const providersParam = searchParams.get('providers');
  const region         = searchParams.get('region') ?? null;

  // Validate and filter SKUs.
  const requestedSkus = skusParam
    ? skusParam.split(',').map(s => s.trim().toUpperCase()).filter(s => GPU_SKUS.includes(s))
    : GPU_SKUS;

  if (requestedSkus.length === 0) {
    return NextResponse.json(
      { error: 'invalid_skus', supported: GPU_SKUS },
      { status: 400 },
    );
  }

  // Validate and filter providers.
  const requestedProviders = providersParam
    ? providersParam.split(',').map(s => s.trim().toLowerCase()).filter(s => PROVIDERS.includes(s))
    : PROVIDERS;

  if (requestedProviders.length === 0) {
    return NextResponse.json(
      { error: 'invalid_providers', supported: PROVIDERS },
      { status: 400 },
    );
  }

  // Build brief.
  const brief = getGpuPricingBrief({
    region,
    skus:      requestedSkus,
    providers: requestedProviders,
  });

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    region:       region ?? 'global',
    skus_covered: requestedSkus,
    providers_covered: requestedProviders,
    data_status:  'sprint_3_foundation_no_live_scrapers',
    brief,
    meta: {
      supported_skus:      GPU_SKUS,
      supported_providers: PROVIDERS,
      live_data:           false,
      static_anchors:      true,
      next_milestone:      'Sprint 3.1 — wire provider scrapers (Lambda, CoreWeave, Vast.ai, RunPod, DGX Cloud)',
    },
  });
}
