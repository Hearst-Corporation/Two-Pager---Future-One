// brief-home.spec.js — /admin/hearst forwards directly to simulator.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) =>
  readFileSync(fileURLToPath(new URL('../../' + rel, import.meta.url)), 'utf-8');

describe('Brief home — entry point', () => {
  const page = read('app/(cockpit)/admin/hearst/page.jsx');
  const root = read('app/page.jsx');

  it('redirects straight to simulator', () => {
    expect(page).toContain("redirect('/admin/hearst/simulator')");
    expect(page).toContain("from 'next/navigation'");
  });

  it('does not render legacy brief cards', () => {
    expect(page).not.toContain('data-brief-journey');
    expect(page).not.toContain('BRIEF_TITLE');
  });

  it('root redirect targets brief', () => {
    expect(root).toContain("redirect('/admin/hearst')");
  });

  it('uses a dedicated entry component name', () => {
    expect(page).toContain('HearstEntryPage');
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
