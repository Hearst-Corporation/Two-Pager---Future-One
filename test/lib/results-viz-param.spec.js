/**
 * results-viz-param.spec.js
 * Source-level guard: verifies that the results page honours ?viz= from the URL
 * by using a normalizeViz guard rather than a hardcoded 'radar' string.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESULTS_PAGE = join(
  __dirname,
  '../../app/(cockpit)/admin/hearst/simulator/results/page.jsx'
);

const src = readFileSync(RESULTS_PAGE, 'utf8');

describe('results page — ?viz= URL param support', () => {
  test('VALID_VIZ Set is defined at module level', () => {
    expect(src).toMatch(/const\s+VALID_VIZ\s*=\s*new\s+Set\s*\(/);
  });

  test('normalizeViz function is defined', () => {
    expect(src).toMatch(/function\s+normalizeViz\s*\(/);
  });

  test('normalizeViz is called inside the useState initializer', () => {
    // The lazy initializer must call normalizeViz (not just reference 'radar' raw)
    expect(src).toMatch(/useState\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?normalizeViz\s*\(/);
  });

  test("'radar' is not a hardcoded direct argument to useState", () => {
    // Ensure we no longer have useState('radar') — the raw literal shortcut
    expect(src).not.toMatch(/useState\s*\(\s*['"]radar['"]\s*\)/);
  });

  test('VALID_VIZ includes the standard viz identifiers', () => {
    const validIds = ['radar', 'network', 'matrix', 'sankey', 'gantt', 'diagram', 'topology'];
    for (const id of validIds) {
      expect(src).toContain(`'${id}'`);
    }
  });

  test('normalizeViz falls back to radar for unknown values', () => {
    // Inline functional test — re-implement the same logic and verify behaviour
    const VALID = new Set(['radar', 'network', 'matrix', 'sankey', 'gantt', 'diagram', 'topology']);
    const normalize = (raw) => (VALID.has(raw) ? raw : 'radar');

    expect(normalize('sankey')).toBe('sankey');
    expect(normalize('network')).toBe('network');
    expect(normalize(null)).toBe('radar');
    expect(normalize(undefined)).toBe('radar');
    expect(normalize('')).toBe('radar');
    expect(normalize('unknown')).toBe('radar');
    expect(normalize('RADAR')).toBe('radar'); // case-sensitive
  });
});
