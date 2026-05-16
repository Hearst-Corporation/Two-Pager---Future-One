/**
 * Tests for middleware hardening (A2 — Middleware hardening sprint).
 *
 * Covers:
 *   - safeNextPath() sanitisation of the `?next=` redirect param
 *   - Fail-closed module-load behaviour when ADMIN_DEV_AUTOLOGIN_EMAIL is set
 *     alongside a Vercel production/preview env signal
 *
 * Runner: Vitest. Vitest infrastructure (config + devDependency) is owed by
 * agent A8 — this file is written ahead of time so A8 can pick it up.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Snapshot the env vars we mutate so we can restore them between tests.
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'ADMIN_DEV_AUTOLOGIN_EMAIL'];

function snapshotEnv() {
  const snap = {};
  for (const k of ENV_KEYS) snap[k] = process.env[k];
  return snap;
}

function restoreEnv(snap) {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe('safeNextPath', () => {
  let safeNextPath;

  beforeEach(async () => {
    // Ensure a clean, safe env before importing.
    vi.resetModules();
    delete process.env.ADMIN_DEV_AUTOLOGIN_EMAIL;
    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = 'test';
    ({ safeNextPath } = await import('../middleware.js'));
  });

  it('returns the path unchanged for a normal same-origin path', () => {
    expect(safeNextPath('/admin/hearst')).toBe('/admin/hearst');
  });

  it('collapses protocol-relative paths to /admin', () => {
    expect(safeNextPath('//evil.com/x')).toBe('/admin');
  });

  it('rejects absolute http(s) URLs', () => {
    expect(safeNextPath('http://evil.com')).toBe('/admin');
    expect(safeNextPath('https://evil.com/admin')).toBe('/admin');
  });

  it('rejects javascript: URIs', () => {
    expect(safeNextPath('javascript:alert(1)')).toBe('/admin');
  });

  it('rejects empty / non-string / bare-slash input', () => {
    expect(safeNextPath('')).toBe('/admin');
    expect(safeNextPath('/')).toBe('/admin'); // `/` alone fails /^\/[^/]/
    expect(safeNextPath(undefined)).toBe('/admin');
    expect(safeNextPath(null)).toBe('/admin');
    expect(safeNextPath(42)).toBe('/admin');
  });
});

describe('module load — fail-closed autologin guard', () => {
  let envSnap;

  beforeEach(() => {
    envSnap = snapshotEnv();
    vi.resetModules();
  });

  afterEach(() => {
    restoreEnv(envSnap);
    vi.resetModules();
  });

  it('THROWS when ADMIN_DEV_AUTOLOGIN_EMAIL is set AND VERCEL_ENV=production', async () => {
    process.env.ADMIN_DEV_AUTOLOGIN_EMAIL = 'x@y';
    process.env.VERCEL_ENV = 'production';
    await expect(import('../middleware.js')).rejects.toThrow(
      /ADMIN_DEV_AUTOLOGIN_EMAIL/
    );
  });

  it('THROWS when ADMIN_DEV_AUTOLOGIN_EMAIL is set AND VERCEL_ENV=preview', async () => {
    process.env.ADMIN_DEV_AUTOLOGIN_EMAIL = 'x@y';
    process.env.VERCEL_ENV = 'preview';
    await expect(import('../middleware.js')).rejects.toThrow(
      /ADMIN_DEV_AUTOLOGIN_EMAIL/
    );
  });

  it('does NOT throw in local dev: ADMIN_DEV_AUTOLOGIN_EMAIL set, NODE_ENV=development, no VERCEL_ENV', async () => {
    process.env.ADMIN_DEV_AUTOLOGIN_EMAIL = 'x@y';
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import('../middleware.js');
    expect(typeof mod.safeNextPath).toBe('function');
    expect(typeof mod.middleware).toBe('function');
  });

  it('does NOT throw when ADMIN_DEV_AUTOLOGIN_EMAIL is unset, even on Vercel production', async () => {
    delete process.env.ADMIN_DEV_AUTOLOGIN_EMAIL;
    process.env.VERCEL_ENV = 'production';
    const mod = await import('../middleware.js');
    expect(typeof mod.safeNextPath).toBe('function');
  });
});
