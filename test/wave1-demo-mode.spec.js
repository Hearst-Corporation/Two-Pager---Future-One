// Wave 1 — SAFE_DEMO_MODE flag.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const KEYS = ['SAFE_DEMO_MODE', 'NEXT_PUBLIC_SAFE_DEMO_MODE'];
let snapshot;

beforeEach(() => { snapshot = {}; KEYS.forEach(k => { snapshot[k] = process.env[k]; delete process.env[k]; }); });
afterEach(() => { KEYS.forEach(k => { if (snapshot[k] === undefined) delete process.env[k]; else process.env[k] = snapshot[k]; }); });

// Re-import fresh each time (module reads env at call time, so a single import is fine).
import { isSafeDemoMode, DEMO_DISABLED_RESPONSE } from '../lib/demo-mode.js';

describe('C-SAFE_DEMO_MODE', () => {
  it('is off by default', () => {
    expect(isSafeDemoMode()).toBe(false);
  });
  it('is on when the server flag is truthy', () => {
    process.env.SAFE_DEMO_MODE = '1';
    expect(isSafeDemoMode()).toBe(true);
  });
  it('is on when only the public flag is set (badge path)', () => {
    process.env.NEXT_PUBLIC_SAFE_DEMO_MODE = 'true';
    expect(isSafeDemoMode()).toBe(true);
  });
  it('ignores non-truthy values', () => {
    process.env.SAFE_DEMO_MODE = 'off';
    expect(isSafeDemoMode()).toBe(false);
  });
  it('exposes a stable disabled response shape', () => {
    expect(DEMO_DISABLED_RESPONSE.error).toBe('disabled_in_demo_mode');
  });
});
