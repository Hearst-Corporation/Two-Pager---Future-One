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

  it('uses oracle-brief-page layout class (no viewport stretch)', () => {
    expect(page).toContain('oracle-page oracle-brief-page');
  });
});

describe('Brief home — layout CSS', () => {
  const layout = read('app/(cockpit)/admin/hearst/oracle-layout.css');

  it('brief page opts out of flex viewport stretch', () => {
    expect(layout).toMatch(/\.oracle-page\.oracle-brief-page\s*\{[^}]*flex:\s*0\s+1\s+auto/);
  });

  it('journey grid uses align-items: start (cards content-sized)', () => {
    expect(layout).toMatch(/\[data-brief-journey\][\s\S]*align-items:\s*start/);
  });
});
