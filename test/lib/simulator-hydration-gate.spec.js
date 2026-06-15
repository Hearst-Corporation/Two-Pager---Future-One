/**
 * Hydration-gate guard — verifies that the simulator page skips URL-param
 * hydration when a ?scenario= query param is present, preventing the double
 * HYDRATE_FROM_URL dispatch (and consequent double POST /simulate) that occurs
 * when a saved scenario is reopened with extra URL params (e.g. ?scenario=X&mw=80).
 *
 * This is a source-level regression test: it confirms the guard is present in
 * the page file so it cannot be accidentally removed without breaking CI.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const PAGE_PATH = join(
  process.cwd(),
  'app/(cockpit)/admin/hearst/simulator/page.jsx',
);

describe('simulator hydration gate — ?scenario= skips URL-param hydration', () => {
  let src;

  beforeAll(() => {
    src = readFileSync(PAGE_PATH, 'utf8');
  });

  it('page source contains the sp.get("scenario") guard', () => {
    expect(src).toMatch(/sp\.get\(['"]scenario['"]\)/);
  });

  it('guard appears before the parseStateFromUrl call in the mount effect', () => {
    const guardIdx = src.indexOf("sp.get('scenario')");
    const parseIdx = src.indexOf('parseStateFromUrl(sp)');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(parseIdx).toBeGreaterThan(-1);
    // The guard must come before the parse call so it can short-circuit it.
    expect(guardIdx).toBeLessThan(parseIdx);
  });

  it('guard is followed by an early return so hydration is skipped', () => {
    // Match the guard + return on the same or next token — handles same-line
    // and next-line variants (e.g. `if (sp.get('scenario')) return;`).
    expect(src).toMatch(/sp\.get\(['"]scenario['"]\)\s*\)\s*return/);
  });
});
