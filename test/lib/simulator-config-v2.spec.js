/**
 * simulator-config-v2.spec.js
 *
 * Architecture guardrails for the simulator config surface. Locks in:
 *   - page.jsx mounts InvestmentCaseSurface (hero) + SimulatorConfigPanel
 *   - SimulatorConfigPanel mounts ArchetypeSegment, ScaleControl, TechnologyStackStep
 *   - legacy orphans (pre-v2 only) are not re-imported in page.jsx
 *   - scale + hardware controls dispatch the correct actions
 *
 * Source-level (readFileSync) — same pattern as archetype-segment.spec.js.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) =>
  readFileSync(fileURLToPath(new URL('../../' + rel, import.meta.url)), 'utf-8');

const pageSrc = read('app/(cockpit)/admin/hearst/simulator/page.jsx');
const panelSrc = read('components/hearst/simulator/SimulatorConfigPanel.jsx');
const archSrc = read('components/hearst/simulator/ArchetypeSegment.jsx');
const scaleSrc = read('components/hearst/simulator/ScaleControl.jsx');
const techStepSrc = read('components/hearst/simulator/sections/TechnologyStackStep.jsx');
const hwMixerSrc = read('components/hearst/simulator/HardwareMixer.jsx');

// Legacy components that must not be wired back into page.jsx directly.
const PAGE_ORPHANS = [
  'ArchetypePicker',
  'ElectricityPriceInput',
  'CaseHeaderStep',
];

const importLines = (src) =>
  src
    .split('\n')
    .filter((l) => l.trim().startsWith('import'))
    .join('\n');

describe('simulator-config-v2 — page.jsx imports no orphan', () => {
  const imports = importLines(pageSrc);
  for (const orphan of PAGE_ORPHANS) {
    it(`page.jsx import block does not reference ${orphan}`, () => {
      expect(imports).not.toContain(orphan);
    });
  }
});

describe('simulator-config-v2 — page.jsx mounts the panel with sim props', () => {
  it('imports SimulatorConfigPanel from the simulator folder', () => {
    expect(pageSrc).toMatch(
      /import\s+SimulatorConfigPanel\s+from\s+['"]@\/components\/hearst\/simulator\/SimulatorConfigPanel['"]/,
    );
  });

  it('renders <SimulatorConfigPanel> with state, dispatch, and sim result props', () => {
    expect(pageSrc).toMatch(
      /<SimulatorConfigPanel[\s\S]*?state=\{state\}[\s\S]*?dispatch=\{dispatch\}/,
    );
    expect(pageSrc).toContain('projection={projection}');
    expect(pageSrc).toContain('derived={simResult?.derived}');
    expect(pageSrc).toContain('solver={simResult?.solver}');
  });

  it('renders <InvestmentCaseSurface> with validate CTA props', () => {
    expect(pageSrc).toMatch(/<InvestmentCaseSurface/);
    expect(pageSrc).toContain('validateBlocked={validateBlocked}');
    expect(pageSrc).toContain('onValidate={handleValidateAndReveal}');
  });
});

describe('simulator-config-v2 — panel mounts scale + hardware + structure', () => {
  it('imports ArchetypeSegment, ScaleControl, TechnologyStackStep, JvStructureVisual', () => {
    expect(panelSrc).toMatch(/import\s+ArchetypeSegment\s+from\s+['"]\.\/ArchetypeSegment['"]/);
    expect(panelSrc).toMatch(/import\s+ScaleControl\s+from\s+['"]\.\/ScaleControl['"]/);
    expect(panelSrc).toMatch(/import\s+TechnologyStackStep\s+from\s+['"]\.\/sections\/TechnologyStackStep['"]/);
    expect(panelSrc).toMatch(/import\s+JvStructureVisual\s+from\s+['"]\.\/JvStructureVisual['"]/);
  });

  it('renders all 4 control sections', () => {
    expect(panelSrc).toMatch(/<ArchetypeSegment/);
    expect(panelSrc).toMatch(/<ScaleControl/);
    expect(panelSrc).toMatch(/<TechnologyStackStep/);
    expect(panelSrc).toMatch(/<JvStructureVisual/);
  });
});

describe('simulator-config-v2 — controls are default-exported', () => {
  it('ArchetypeSegment is a default-exported function', () => {
    expect(archSrc).toMatch(/export default function/);
  });
  it('ScaleControl is a default-exported function', () => {
    expect(scaleSrc).toMatch(/export default function/);
  });
  it('TechnologyStackStep is a default-exported function', () => {
    expect(techStepSrc).toMatch(/export default function/);
  });
});

describe('simulator-config-v2 — dispatch wiring', () => {
  it('ArchetypeSegment applies the preset with canonical model defaults', () => {
    expect(archSrc).toContain('ACTIONS.APPLY_PRESET');
    expect(archSrc).toContain('MODEL_DEFAULTS');
  });

  it('ScaleControl dispatches SET_MODE, SET_CAPITAL, SET_MW, SET_IRR_TARGET', () => {
    expect(scaleSrc).toContain('ACTIONS.SET_MODE');
    expect(scaleSrc).toContain('ACTIONS.SET_CAPITAL');
    expect(scaleSrc).toContain('ACTIONS.SET_MW');
    expect(scaleSrc).toContain('ACTIONS.SET_IRR_TARGET');
  });

  it('panel dispatches SET_HARDWARE_MIX via TechnologyStackStep', () => {
    expect(panelSrc).toContain('ACTIONS.SET_HARDWARE_MIX');
  });

  it('HardwareMixer uses centralized HARDWARE_PRESETS from hearst-config-presets', () => {
    expect(hwMixerSrc).toContain("from '@/lib/hearst-config-presets'");
    expect(hwMixerSrc).toContain('HW_PRESET_PATCHES');
  });
});
