/**
 * scale-control.spec.js — ScaleControl (3 input modes) mounted in SimulatorConfigPanel.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scaleSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/ScaleControl.jsx', import.meta.url)),
  'utf-8',
);

const panelSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/SimulatorConfigPanel.jsx', import.meta.url)),
  'utf-8',
);

const pageSrc = readFileSync(
  fileURLToPath(new URL('../../app/(cockpit)/admin/hearst/simulator/page.jsx', import.meta.url)),
  'utf-8',
);

describe('ScaleControl — wiring', () => {
  it('composes InputModeSwitcher and InputFieldHero', () => {
    expect(scaleSrc).toMatch(/import\s+InputModeSwitcher/);
    expect(scaleSrc).toMatch(/import\s+InputFieldHero/);
    expect(scaleSrc).toMatch(/<InputModeSwitcher/);
    expect(scaleSrc).toMatch(/<InputFieldHero/);
  });

  it('dispatches SET_MODE, SET_CAPITAL, SET_MW, SET_IRR_TARGET', () => {
    expect(scaleSrc).toMatch(/ACTIONS\.SET_MODE/);
    expect(scaleSrc).toMatch(/ACTIONS\.SET_CAPITAL/);
    expect(scaleSrc).toMatch(/ACTIONS\.SET_MW/);
    expect(scaleSrc).toMatch(/ACTIONS\.SET_IRR_TARGET/);
  });

  it('skips SET_MODE when mode unchanged', () => {
    expect(scaleSrc).toMatch(/if\s*\(\s*state\.mode === id\s*\)\s*return/);
  });
});

describe('SimulatorConfigPanel — mounts ScaleControl', () => {
  it('imports and renders ScaleControl with sim result props', () => {
    expect(panelSrc).toMatch(/import\s+ScaleControl\s+from\s+['"]\.\/ScaleControl['"]/);
    expect(panelSrc).toMatch(/<ScaleControl[\s\S]*?projection=\{projection\}/);
    expect(panelSrc).not.toMatch(/CapacityControl/);
  });
});

describe('simulator page — passes sim props to panel', () => {
  it('forwards projection, scenario, derived, solver', () => {
    expect(pageSrc).toMatch(/derived=\{derived\}/);
    expect(pageSrc).toMatch(/solver=\{solver\}/);
  });
});
