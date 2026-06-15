/**
 * capacity-control.spec.js
 *
 * Source-level guards for the CapacityControl v2 control:
 *   - dispatches ACTIONS.SET_MW on change
 *   - uses the Field primitive from @/components/hearst/ui
 *   - is a number input
 *   - does NOT import the orphaned InputFieldHero
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
  it('imports Field from @/components/hearst/ui', () => {
    expect(capSrc).toMatch(/import\s*\{[^}]*\bField\b[^}]*\}\s*from\s*['"]@\/components\/hearst\/ui['"]/);
  });

  it('uses a number input type', () => {
    expect(capSrc).toMatch(/type=["']number["']/);
  });
});

describe('CapacityControl — design system hygiene', () => {
  it('does NOT import the orphaned InputFieldHero', () => {
    expect(capSrc).not.toMatch(/@\/components\/hearst\/simulator\/InputFieldHero/);
    expect(capSrc).not.toMatch(/InputFieldHero/);
  });

  it('contains no hex colors', () => {
    expect(capSrc).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it('contains no rgb/rgba literals', () => {
    expect(capSrc).not.toMatch(/rgba?\(/);
  });
});

describe('SimulatorConfigPanel — mounts CapacityControl', () => {
  it('imports CapacityControl', () => {
    expect(panelSrc).toMatch(/import\s+CapacityControl\s+from\s+['"]\.\/CapacityControl['"]/);
  });

  it('renders <CapacityControl> with value={state.total_mw}', () => {
    expect(panelSrc).toMatch(/<CapacityControl[\s\S]*?value=\{state\.total_mw\}[\s\S]*?dispatch=\{dispatch\}/);
  });
});
