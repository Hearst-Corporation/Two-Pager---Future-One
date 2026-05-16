# Observability

Structured logs + Sentry. Two channels, one redaction policy.

## Logger

`lib/logger.js` — zero-dep, JSON-per-line, level-thresholded. Drop into any
route handler, server action, or script.

```js
import { logger } from '@/lib/logger';

// 1. Lifecycle event
logger.info({ event: 'advisor_run_started', user_id, run_id, model });

// 2. Soft anomaly (system still works)
logger.warn({ event: 'rate_limit_table_missing', user_id });

// 3. Hard failure (pass the Error on `err`)
logger.error({ event: 'llm_provider_error', err, run_id });
```

Output is one line of JSON on stdout (info/debug) or stderr (warn/error):

```json
{"ts":"2026-05-16T10:12:33.491Z","level":"info","env":"production","event":"advisor_run_started","user_id":"u_123","run_id":"r_abc","model":"sonnet-4-6"}
```

### Levels

`debug | info | warn | error`. Threshold is `process.env.LOG_LEVEL`
(default `info`). Set `LOG_LEVEL=debug` in local dev for verbose traces.

## Finding logs in Vercel

1. Vercel dashboard → project → **Logs** tab.
2. Filter by route (`/api/*`) or by free-text on the `event` value
   (e.g. `event:advisor_run_started`).
3. Default retention is 7 days. For longer retention, pipe to a Log Drain
   (Datadog, Axiom, BetterStack) — not configured yet.
4. Server runtime logs are JSON; the Vercel UI parses them automatically.

## Sentry

Three init files at the repo root:

- `sentry.client.config.js` — browser
- `sentry.server.config.js` — Node runtime (with `beforeSend` redactor)
- `sentry.edge.config.js` — middleware / edge route handlers

Each is **no-op** when `NEXT_PUBLIC_SENTRY_DSN` is unset, so unconfigured
environments (preview, local dev) stay quiet.

### Setup

1. Create a project in Sentry, copy the DSN.
2. Add to `.env.local` and Vercel env vars:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
   ```
3. Redeploy. The init files run automatically on Next.js startup.

> **Pending — owed by A7 (Next 14 → 15 upgrade):**
> wrap `next.config.js` with `withSentryConfig` so the SDK can upload
> source maps and instrument routes. Until then, errors are captured but
> stack traces will be minified.

### What's enabled

- `tracesSampleRate: 0.1` (10% of transactions) — cheap, sampled perf data.
- `beforeSend` redactor on the server config — hashes emails, strips secrets.

### What's deliberately off

- Breadcrumb integrations (console, fetch auto-capture). We want to ship
  cautiously and audit what would actually be sent first.
- Session replay. Not now.
- Profiling. Not now.

## PII redaction policy

Both the logger and `sentry.server.config.js#beforeSend` apply the same rules.

| Field pattern | Behaviour |
|---|---|
| Key matches `/(auth\|api[_-]?key\|token\|secret\|password)/i` | Value replaced with `'[REDACTED]'` |
| Key is `user_email` | Replaced by `user_email_hash` = `sha256(email).slice(0, 16)` |
| Field is `err` and value is `Error` | Serialized to `{ message, name, stack }` only |

Anything else is logged verbatim. If you're unsure whether a field is PII,
**hash it or drop it** — don't ship and hope.

## Smoke test

```js
// Logger
node -e "const { logger } = require('./lib/logger.js'); \
  logger.info({ event: 'test', user_email: 'a@b.com' }); \
  logger.error({ event: 'boom', err: new Error('x') })"
```

Expect two JSON lines: the first with `user_email_hash`, the second with a
serialized error on `err`.
