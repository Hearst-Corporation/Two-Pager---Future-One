/**
 * Sentry — client (browser).
 * No-op if NEXT_PUBLIC_SENTRY_DSN is missing.
 * Performance monitoring sampled at 10%. Breadcrumb integrations stay default-off
 * for now; we want to ship cautiously and revisit once we know what PII looks like.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  // Lazy-require so missing dep + missing DSN never both fire.
  // eslint-disable-next-line global-require
  const Sentry = require('@sentry/nextjs');

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
