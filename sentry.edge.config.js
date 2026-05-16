/**
 * Sentry — edge runtime (Next.js middleware, edge route handlers).
 * Minimal init. No-op if DSN is missing. Node crypto is not available here,
 * so we keep the config lean and rely on lib/logger redaction at call-sites.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  // eslint-disable-next-line global-require
  const Sentry = require('@sentry/nextjs');

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
