import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent } from '@sentry/core';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const SECRET_KEY_RE = /(auth|api[_-]?key|token|secret|password)/i;

function hashEmail(email: unknown) {
  if (typeof email !== 'string' || !email) return undefined;
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
}

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (SECRET_KEY_RE.test(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    if (key === 'user_email') {
      out.user_email_hash = hashEmail(nestedValue);
      continue;
    }
    out[key] = redact(nestedValue);
  }
  return out;
}

function beforeSend(event: ErrorEvent) {
  try {
    if (event.user?.email) {
      event.user = {
        ...event.user,
        email: undefined,
        email_hash: hashEmail(event.user.email),
      };
    }
    if (event.request?.headers) {
      event.request.headers = redact(event.request.headers) as typeof event.request.headers;
    }
    if (event.request?.data) {
      event.request.data = redact(event.request.data);
    }
    if (event.extra) event.extra = redact(event.extra) as typeof event.extra;
    if (event.contexts) event.contexts = redact(event.contexts) as typeof event.contexts;
    if (event.tags) event.tags = redact(event.tags) as typeof event.tags;
  } catch {
    // Never let the redactor itself kill the event pipeline.
  }

  return event;
}

let initialized = false;

export function initServerSentry() {
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend,
  });

  initialized = true;
}
