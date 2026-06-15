/**
 * capacity-control.spec.js
 *
 * Source-level guards for the CapacityControl v2 control:
 *   - dispatches ACTIONS.SET_MW on change
 *   - uses the Field primitive from @/components/hearst/ui
 *   - is a number input
 *   - tokens-only (no hex / rgba)
 *   - mounted in SimulatorConfigPanel with value={state.total_mw}
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const capSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/CapacityControl.jsx', import.meta.url)),
  'utf-8',
);

const panelSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/SimulatorConfigPanel.jsx', import.meta.url)),
  'utf-8',
);

describe('CapacityControl — dispatch wiring', () => {
  it('dispatches ACTIONS.SET_MW', () => {
    expect(capSrc).toMatch(/type:\s*ACTIONS\.SET_MW/);
  });
});

describe('CapacityControl — primitive usage', () => {
  it('renders a native input', () => {
    expect(capSrc).toMatch(/<input/);
  });

  it('uses a number input type', () => {
    expect(capSrc).toMatch(/type=["']number["']/);
  });
});

describe('CapacityControl — design system hygiene', () => {
  it('contains no hex colors', () => {
    expect(capSrc).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it('contains no rgb/rgba literals', () => {
    expect(capSrc).not.toMatch(/rgba?\(/);
  });
});

describe('SimulatorConfigPanel — mounts ScaleControl (replaces CapacityControl)', () => {
  it('imports ScaleControl', () => {
    expect(panelSrc).toMatch(/import\s+ScaleControl\s+from\s+['"]\.\/ScaleControl['"]/);
  });

  it('renders <ScaleControl> with state and dispatch', () => {
    expect(panelSrc).toMatch(/<ScaleControl[\s\S]*?state=\{state\}[\s\S]*?dispatch=\{dispatch\}/);
  });
});
