// brief-home.spec.js — Brief landing is the cockpit entry (not a simulator redirect).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) =>
  readFileSync(fileURLToPath(new URL('../../' + rel, import.meta.url)), 'utf-8');

describe('Brief home — entry point', () => {
  const page = read('app/(cockpit)/admin/hearst/page.jsx');
  const root = read('app/page.jsx');

  it('does not redirect straight to simulator', () => {
    expect(page).not.toContain("redirect('/admin/hearst/simulator')");
    expect(page).toContain('BRIEF_TITLE');
  });

  it('links the primary journey (Model → Evidence → Decision)', () => {
    expect(page).toContain("href: '/admin/hearst/simulator'");
    expect(page).toContain("href: '/admin/hearst/sources'");
    expect(page).toContain("href: '/admin/hearst/dossier'");
  });

  it('root redirect targets brief', () => {
    expect(root).toContain("redirect('/admin/hearst')");
  });
});

describe('Hero surface — glass surface layers', () => {
  const hero = read('components/hearst/simulator/InvestmentCaseSurface.jsx');
  const css = read('app/(cockpit)/admin/hearst/simulator/simulator.css');

  it('InvestmentCaseSurface has background grid and glow layers', () => {
    expect(hero).toContain('sim-surface-bg-grid');
    expect(hero).toContain('sim-surface-glow');
    expect(hero).toContain('sim-surface-content');
  });

  it('simulator.css defines glass surface tokens', () => {
    expect(css).toContain('sim-surface');
    expect(css).toContain('var(--cp-surface-glass)');
  });
});
