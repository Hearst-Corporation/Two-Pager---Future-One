/**
 * Sentry — client (browser).
 * Migrated from sentry.client.config.js to the Next.js `instrumentation-client`
 * convention (Sentry v10 + Turbopack-compatible).
 * No-op if NEXT_PUBLIC_SENTRY_DSN is missing.
 * Performance monitoring sampled at 10%. Breadcrumb integrations stay default-off
 * for now; we want to ship cautiously and revisit once we know what PII looks like.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Sentry's "onRouterTransitionStart" navigation hook is intentionally omitted:
// `captureRouterTransitionStart` is not exported by @sentry/nextjs 10.58 (verified
// at build time), so exporting it would create an `undefined` export. Client-side
// navigation spans are simply not instrumented on this version — the build-time
// "ACTION REQUIRED" notice is cosmetic and safe to ignore here.
