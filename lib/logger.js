/**
 * lib/logger.js — minimal structured logger.
 *
 * Outputs one JSON line per call.
 *  - Levels:        debug | info | warn | error
 *  - Threshold:     LOG_LEVEL env var (default 'info')
 *  - Streams:       console.error for warn/error, console.log otherwise
 *  - Env tag:       VERCEL_ENV ?? NODE_ENV
 *  - PII safety:    sha256-prefix on user_email, regex-redact secret-ish keys
 *  - Errors:        Error instances on `err` are serialized to {message,name,stack}
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info({ event: 'advisor_run_started', user_id, run_id, model });
 *   logger.warn({ event: 'rate_limit_table_missing', user_id });
 *   logger.error({ event: 'llm_provider_error', err, run_id });
 */

const crypto = require('crypto');

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function currentThreshold() {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] ?? LEVELS.info;
}

// Match common secret-bearing key names. Case-insensitive.
const SECRET_KEY_RE = /(auth|api[_-]?key|token|secret|password)/i;

function hashEmail(email) {
  if (typeof email !== 'string' || email.length === 0) return undefined;
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
}

function serializeError(err) {
  if (!(err instanceof Error)) return err;
  // Only the safe trio — avoid arbitrary props that could leak PII (request bodies, etc.)
  return { message: err.message, name: err.name, stack: err.stack };
}

function redact(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SECRET_KEY_RE.test(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    if (k === 'err') {
      out[k] = serializeError(v);
      continue;
    }
    if (k === 'user_email') {
      // Hash and drop the cleartext.
      out.user_email_hash = hashEmail(v);
      continue;
    }
    out[k] = redact(v);
  }
  return out;
}

function log(level, payload) {
  const lvl = LEVELS[level];
  if (lvl === undefined) return;
  if (lvl < currentThreshold()) return;

  const ts = new Date().toISOString();
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';

  // Defensive: both `redact()` (recursive) and `JSON.stringify` will blow up
  // on circular payloads — RangeError from the former, TypeError from the
  // latter. A crash inside the logger would cascade into whatever request
  // triggered it, so we fall back to a minimal envelope describing the
  // failure rather than rethrowing.
  let serialized;
  try {
    const safe = redact(payload && typeof payload === 'object' ? payload : { value: payload });
    const line = { ts, level, env, ...safe };
    serialized = JSON.stringify(line);
  } catch (err) {
    // Reading `payload.event` is itself defensive: a throwing getter on the
    // event property would re-enter the failure path and rethrow out of the
    // logger. Isolate it in its own try/catch so the fallback envelope is
    // always emitted.
    let originalEvent = 'unknown';
    try {
      if (payload && typeof payload === 'object' && typeof payload.event === 'string') {
        originalEvent = payload.event;
      }
    } catch {
      // payload.event threw — keep 'unknown'
    }
    serialized = JSON.stringify({
      ts,
      level,
      env,
      event: 'logger_serialization_failed',
      error: err?.message || String(err),
      original_event: originalEvent,
    });
  }

  if (level === 'error' || level === 'warn') {
    // eslint-disable-next-line no-console
    console.error(serialized);
  } else {
    // eslint-disable-next-line no-console
    console.log(serialized);
  }
}

const logger = {
  debug: (payload) => log('debug', payload),
  info: (payload) => log('info', payload),
  warn: (payload) => log('warn', payload),
  error: (payload) => log('error', payload),
};

module.exports = { logger, log };
module.exports.default = logger;
