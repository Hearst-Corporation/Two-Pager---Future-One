// cp-tokens-structure.spec.js — guard against broken :root blocks in cp-tokens.css

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSS = readFileSync(
  fileURLToPath(new URL('../../app/(cockpit)/admin/hearst/cp-tokens.css', import.meta.url)),
  'utf-8',
);

describe('cp-tokens.css structure', () => {
  it('has balanced :root braces', () => {
    const opens = (CSS.match(/:root\s*\{/g) || []).length;
    const closes = (CSS.match(/\}/g) || []).length;
    expect(opens).toBeGreaterThan(0);
    expect(closes).toBeGreaterThanOrEqual(opens);
  });

  it('does not nest :root inside :root', () => {
    expect(CSS).not.toMatch(/:root\s*\{[^}]*:root\s*\{/);
  });

  it('defines layout tokens used by refactored components', () => {
    expect(CSS).toContain('--cp-scroll-anchor-offset');
    expect(CSS).toContain('--cp-modal-w');
    expect(CSS).toContain('--cp-chart-h');
    expect(CSS).toContain('--cp-z-raised');
    expect(CSS).toContain('--cp-btn-height-xs');
  });

  it('keeps global h1 rules out of tokens file', () => {
    expect(CSS).not.toMatch(/^h1,/m);
  });
});
