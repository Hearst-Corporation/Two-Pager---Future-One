// test/lib/source-of-truth.spec.js
//
// LOCK TEST — ensures PUBLIC_SOURCES_LIBRARY lives ONLY in
// lib/oracle-intelligence/source-library.js and NOT in lib/hearst-constants.js.

import { describe, it, expect } from 'vitest';

describe('PUBLIC_SOURCES_LIBRARY — single source of truth lock', () => {
  it('hearst-constants does NOT export PUBLIC_SOURCES_LIBRARY', async () => {
    const mod = await import('@/lib/hearst-constants');
    expect(mod.PUBLIC_SOURCES_LIBRARY).toBeUndefined();
  });

  it('oracle-intelligence/source-library.js exports a non-empty PUBLIC_SOURCES_LIBRARY', async () => {
    const { PUBLIC_SOURCES_LIBRARY } = await import('@/lib/oracle-intelligence/source-library.js');
    expect(Array.isArray(PUBLIC_SOURCES_LIBRARY)).toBe(true);
    expect(PUBLIC_SOURCES_LIBRARY.length).toBeGreaterThan(30);
  });

  it('oracle-intelligence index re-exports PUBLIC_SOURCES_LIBRARY', async () => {
    const mod = await import('@/lib/oracle-intelligence');
    expect(Array.isArray(mod.PUBLIC_SOURCES_LIBRARY)).toBe(true);
    expect(mod.PUBLIC_SOURCES_LIBRARY.length).toBeGreaterThan(30);
  });
});
