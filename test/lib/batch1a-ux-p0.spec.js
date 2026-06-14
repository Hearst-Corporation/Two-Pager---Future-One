// Batch 1-A — regression guards for the four user-facing P0 UX fixes.
//
// These pages are large client components without a render-test harness, so
// (matching the repo's existing fs/source-assertion specs, e.g.
// render-gate-localization.spec.js) we assert the fix invariants at the source
// level — enough to catch silent reintroduction of the bugs.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) =>
  readFileSync(fileURLToPath(new URL('../../' + rel, import.meta.url)), 'utf-8');

const RESULTS = 'app/(cockpit)/admin/hearst/simulator/results/page.jsx';
const DOSSIER = 'app/(cockpit)/admin/hearst/dossier/page.jsx';
const FINANCIAL = 'app/(cockpit)/admin/hearst/financial/page.jsx';
const CTABAR = 'components/hearst/simulator/SimulatorCTABar.jsx';

describe('P0-1 — Results has no fake save / fake confirmation', () => {
  const src = read(RESULTS);

  it('no longer defines the no-op handleSave or its fake savingState toast', () => {
    expect(src).not.toContain('handleSave');
    expect(src).not.toContain('savingState');
    // The fake "saved" toast string is no longer rendered here.
    expect(src).not.toContain('RESULTS_SCENARIO_SAVED');
  });

  it('does not pass an onSave handler to the CTA bar (no save affordance)', () => {
    expect(src).not.toMatch(/onSave=/);
  });
});

describe('P0-1 — CTA bar only renders Save when a real handler is provided', () => {
  const src = read(CTABAR);
  it('guards the Save button behind onSave', () => {
    // The Save <Button> must be conditional on onSave (no save button when absent).
    expect(src).toMatch(/\{onSave && \(/);
  });
});

describe('P0-2 / P0-3 — Dossier rejected fetches stop loading + surface an error', () => {
  const src = read(DOSSIER);

  it('ScenarioView + AllMemosView clear the loading sentinel on rejection', () => {
    // Both views use `memos === null` as the spinner sentinel; on failure they
    // must set it to [] so the spinner cannot persist forever.
    const setMemosEmpty = (src.match(/setMemos\(\[\]\)/g) || []).length;
    expect(setMemosEmpty).toBeGreaterThanOrEqual(3); // 2 catches + 1 rejected-branch
  });

  it('surfaces the rejection through the existing error state', () => {
    expect(src).toContain("setErr(mRes.reason ? String(mRes.reason) : 'Failed to load memos')");
  });

  it('still renders the existing quiet error UI (DOSSIER_ERR), not a new pattern', () => {
    expect(src).toContain('DOSSIER_ERR');
  });
});

describe('P0-4 — Financial scenario selector exposes an accessible active state', () => {
  const src = read(FINANCIAL);
  it('binds aria-current to the active scenario (house convention)', () => {
    expect(src).toContain("aria-current={active ? 'true' : undefined}");
  });
});
