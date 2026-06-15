/**
 * input-field-hero.spec.js — Size/Budget/Return hero uses scoped CSS, not inline S blob.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const heroSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/InputFieldHero.jsx', import.meta.url)),
  'utf-8',
);

const cssSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/simulator-config.css', import.meta.url)),
  'utf-8',
);

describe('InputFieldHero — CSS migration', () => {
  it('imports simulator-config.css and exposes data hooks', () => {
    expect(heroSrc).toMatch(/import\s+['"]\.\/simulator-config\.css['"]/);
    expect(heroSrc).toMatch(/data-sim-input-hero/);
    expect(heroSrc).toMatch(/data-brief-bar-row/);
    expect(heroSrc).toMatch(/data-brief-results/);
  });

  it('does not use inline style object', () => {
    expect(heroSrc).not.toMatch(/style=\{/);
    expect(heroSrc).not.toMatch(/const S = \{/);
  });

  it('styles live in simulator-config.css', () => {
    expect(cssSrc).toMatch(/\[data-sim-input-hero\]/);
    expect(cssSrc).toMatch(/\.sim-input-field-value/);
    expect(cssSrc).toMatch(/\[data-sim-scale-stack\]/);
  });
});
