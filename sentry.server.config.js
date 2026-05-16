/**
 * Sentry — server (Node runtime).
 * No-op if NEXT_PUBLIC_SENTRY_DSN is missing.
 * beforeSend mirrors the lib/logger PII redaction policy so server-side errors
 * never ship raw emails, tokens, or secret-keyed properties to Sentry.
 */

const crypto = require('crypto');

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

const SECRET_KEY_RE = /(auth|api[_-]?key|token|secret|password)/i;

function hashEmail(email) {
  if (typeof email !== 'string' || !email) return undefined;
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
}

function redact(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SECRET_KEY_RE.test(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    if (k === 'user_email') {
      out.user_email_hash = hashEmail(v);
      continue;
    }
    out[k] = redact(v);
  }
  return out;
}

function beforeSend(event) {
  try {
    if (event.user && event.user.email) {
      event.user = {
        ...event.user,
        email: undefined,
        email_hash: hashEmail(event.user.email),
      };
    }
    if (event.request && event.request.headers) {
      event.request.headers = redact(event.request.headers);
    }
    if (event.request && event.request.data) {
      event.request.data = redact(event.request.data);
    }
    if (event.extra) event.extra = redact(event.extra);
    if (event.contexts) event.contexts = redact(event.contexts);
    if (event.tags) event.tags = redact(event.tags);
  } catch (_e) {
    // Never let the redactor itself kill the event pipeline.
  }
  return event;
}

if (dsn) {
  // eslint-disable-next-line global-require
  const Sentry = require('@sentry/nextjs');

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend,
  });
}
