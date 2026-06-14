// oracle-rail-nav.spec.js — nav grouping regression guard.
//
// OracleRailNav is a portal-mounted client component without a render harness,
// so we assert invariants at source level — matching the repo pattern used in
// batch1a-ux-p0.spec.js and render-gate-localization.spec.js.
//
// Guards:
//   1. All 6 routes are present and reachable (no route silently removed).
//   2. Primary deal journey: Model → Evidence → Decision (group: 'primary').
//   3. Analyst tools: Underwriting, Playbook, Saved scenarios (group: 'analyst').
//   4. active-state helper supports nested /results route under Model.
//   5. GPT/chat route is untouched (portal mounts check).
//   6. Labels are driven from ui-strings (no hardcoded text in SECTIONS).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) =>
  readFileSync(fileURLToPath(new URL('../../' + rel, import.meta.url)), 'utf-8');

const NAV = 'components/OracleRailNav.jsx';
const UI  = 'lib/ui-strings.ts';

describe('OracleRailNav — all 6 routes present', () => {
  const src = read(NAV);

  it('defines simulator route (Model)', () => {
    expect(src).toContain("href: '/admin/hearst/simulator'");
  });
  it('defines sources route (Evidence)', () => {
    expect(src).toContain("href: '/admin/hearst/sources'");
  });
  it('defines dossier route (Decision)', () => {
    expect(src).toContain("href: '/admin/hearst/dossier'");
  });
  it('defines financial route (Underwriting)', () => {
    expect(src).toContain("href: '/admin/hearst/financial'");
  });
  it('defines deals route (Playbook)', () => {
    expect(src).toContain("href: '/admin/hearst/deals'");
  });
  it('defines workspace route (Saved scenarios)', () => {
    expect(src).toContain("href: '/admin/hearst/workspace'");
  });
});

describe('OracleRailNav — primary demo journey (group: primary)', () => {
  const src = read(NAV);

  it('simulator is in primary group', () => {
    expect(src).toContain("href: '/admin/hearst/simulator', label: UI.NAV_SIMULATOR, group: 'primary'");
  });
  it('sources is in primary group', () => {
    expect(src).toContain("href: '/admin/hearst/sources', label: UI.NAV_SOURCES, group: 'primary'");
  });
  it('dossier is in primary group', () => {
    expect(src).toContain("href: '/admin/hearst/dossier', label: UI.NAV_DOSSIER, group: 'primary'");
  });
});

describe('OracleRailNav — analyst tools (group: analyst)', () => {
  const src = read(NAV);

  it('financial is in analyst group', () => {
    expect(src).toContain("href: '/admin/hearst/financial', label: UI.NAV_FINANCIAL, group: 'analyst'");
  });
  it('deals is in analyst group', () => {
    expect(src).toContain("href: '/admin/hearst/deals', label: UI.NAV_DEALS, group: 'analyst'");
  });
  it('workspace is in analyst group', () => {
    expect(src).toContain("href: '/admin/hearst/workspace', label: UI.NAV_WORKSPACE, group: 'analyst'");
  });
});

describe('OracleRailNav — active-state logic', () => {
  const src = read(NAV);

  it('isSectionActive handles nested /results path under simulator', () => {
    // startsWith(prefix + '/') catches /admin/hearst/simulator/results
    expect(src).toContain("pathname.startsWith(prefix + '/')");
  });
  it('isSectionActive is exported/defined in component', () => {
    expect(src).toContain('function isSectionActive(section, pathname)');
  });
});

describe('OracleRailNav — labels from ui-strings (not hardcoded)', () => {
  const uiSrc = read(UI);

  it("NAV_SIMULATOR is 'Model'", () => {
    expect(uiSrc).toContain("NAV_SIMULATOR: 'Model'");
  });
  it("NAV_SOURCES is 'Evidence'", () => {
    expect(uiSrc).toContain("NAV_SOURCES: 'Evidence'");
  });
  it("NAV_DOSSIER is 'Decision'", () => {
    expect(uiSrc).toContain("NAV_DOSSIER: 'Decision'");
  });
  it("NAV_FINANCIAL is 'Underwriting'", () => {
    expect(uiSrc).toContain("NAV_FINANCIAL: 'Underwriting'");
  });
  it("NAV_DEALS is 'Playbook'", () => {
    expect(uiSrc).toContain("NAV_DEALS: 'Playbook'");
  });
  it("NAV_WORKSPACE is 'Saved scenarios'", () => {
    expect(uiSrc).toContain("NAV_WORKSPACE: 'Saved scenarios'");
  });
});

describe('OracleRailNav — portal integrity (chat untouched)', () => {
  const src = read(NAV);

  it('mounts into .ct-rail-left (desktop rail slot)', () => {
    expect(src).toContain('.ct-rail-left');
  });
  it('uses data-oracle-railnav-slot sentinel (safe last-child append)', () => {
    expect(src).toContain('data-oracle-railnav-slot');
  });
  it('uses createPortal for both desktop and mobile surfaces', () => {
    const count = (src.match(/createPortal/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
  it('exports OracleRailNav (no breaking rename)', () => {
    expect(src).toContain('export function OracleRailNav()');
  });
});
