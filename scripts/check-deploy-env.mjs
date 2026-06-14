#!/usr/bin/env node
// scripts/check-deploy-env.mjs
//
// DEPLOY-ENV PARITY GUARD.
//
// The Next.js production build runs next.config.js → validateEnv(), which THROWS
// if a required env var is missing. CI builds with placeholder env vars, so a
// green CI does NOT prove the real Vercel environment is configured — that gap
// once left production failing for days (missing OPENAI_API_KEY on Vercel).
//
// This script pulls the REAL Vercel environment for a target (default: production)
// and asserts every REQUIRED_SERVER / REQUIRED_PUBLIC var from lib/env-validation.js
// is present. Run it BEFORE/AFTER a deploy to catch env drift the build gate can't.
//
//   VERCEL_TOKEN=... node scripts/check-deploy-env.mjs [production|preview|development]
//
// Exit codes: 0 = all required present (or skipped — no token). 1 = missing vars.
// Never prints secret values — only variable names and presence.

import { execSync } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { REQUIRED_SERVER, REQUIRED_PUBLIC } = require('../lib/env-validation.js');

const target = process.argv[2] || 'production';
const required = [...REQUIRED_SERVER, ...REQUIRED_PUBLIC];

if (!process.env.VERCEL_TOKEN) {
  console.warn(
    `⚠️  check-deploy-env skipped: VERCEL_TOKEN not set. ` +
    `Run with VERCEL_TOKEN=… to verify the ${target} environment.`,
  );
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), 'vercel-env-'));
const file = join(dir, '.env.check');

try {
  // --yes: no interactive prompt. stdio ignored so the token/values never echo.
  execSync(`vercel env pull "${file}" --environment=${target} --yes`, {
    stdio: 'ignore',
    env: process.env,
  });

  const present = new Set(
    readFileSync(file, 'utf-8')
      .split('\n')
      .map((line) => line.match(/^([A-Z0-9_]+)=/)?.[1])
      .filter(Boolean),
  );

  const missing = required.filter((v) => !present.has(v));

  for (const v of required) {
    console.log(`${present.has(v) ? '✓' : '✗'} ${v}`);
  }

  if (missing.length) {
    console.error(
      `\n❌ ${target} environment is missing ${missing.length} required var(s): ${missing.join(', ')}\n` +
      `   The production build (validateEnv) will fail. Add them in Vercel before deploying.`,
    );
    process.exit(1);
  }

  console.log(`\n✅ ${target}: all ${required.length} required env vars present.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
