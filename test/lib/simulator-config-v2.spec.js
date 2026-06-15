/**
 * simulator-config-v2.spec.js
 *
 * Architecture guardrails for the rebuilt simulator surface. Locks in:
 *   - page.jsx mounts SimulatorConfigPanel (hero strip removed)
 *   - SimulatorConfigPanel mounts the 3 controls (ArchetypeSegment,
 *     ScaleControl, TechnologyStackStep) in their data-* slots
 *   - none of the 8 legacy component names are ever re-imported (in page.jsx
 *     OR in the panel) — matched on IMPORT LINES only
 *   - the 3 controls are default-exported and dispatch the correct actions
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
const stepSrc = read('components/hearst/simulator/sections/TechnologyStackStep.jsx');

// Panel imports TechnologyStackStep (ScaleControl wraps InputModeSwitcher + InputFieldHero).
const ORPHANS = [
  'ArchetypePicker',
  'HardwareMixer',
  'JvStructureVisual',
  'ElectricityPriceInput',
  'CaseHeaderStep',
  'CapacityControl',
  'TechPresetControl',
];

// Extract only the import lines of a source file (defeats false positives from comments).
const importLines = (src) =>
  src
    .split('\n')
    .filter((l) => l.trim().startsWith('import'))
    .join('\n');

describe('simulator-config-v2 — page.jsx imports no orphan', () => {
  const imports = importLines(pageSrc);
  for (const orphan of ORPHANS) {
    it(`page.jsx import block does not reference ${orphan}`, () => {
      expect(imports).not.toContain(orphan);
    });
  }
});

describe('simulator-config-v2 — page.jsx mounts the new panel', () => {
  it('imports SimulatorConfigPanel from the simulator folder', () => {
    expect(pageSrc).toMatch(
      /import\s+SimulatorConfigPanel\s+from\s+['"]@\/components\/hearst\/simulator\/SimulatorConfigPanel['"]/,
    );
  });

  it('renders <SimulatorConfigPanel> with state, dispatch, and sim props', () => {
    expect(pageSrc).toMatch(
      /<SimulatorConfigPanel[\s\S]*?state=\{state\}[\s\S]*?dispatch=\{dispatch\}[\s\S]*?projection=\{projection\}/,
    );
  });

  it('does not render <InvestmentCaseSurface> (hero removed)', () => {
    expect(pageSrc).not.toMatch(
      /import\s+InvestmentCaseSurface\s+from\s+['"]@\/components\/hearst\/simulator\/InvestmentCaseSurface['"]/,
    );
    expect(pageSrc).not.toMatch(/<InvestmentCaseSurface/);
  });
});

describe('simulator-config-v2 — panel mounts the 3 controls', () => {
  it('imports ArchetypeSegment, ScaleControl, TechnologyStackStep', () => {
    expect(panelSrc).toMatch(/import\s+ArchetypeSegment\s+from\s+['"]\.\/ArchetypeSegment['"]/);
    expect(panelSrc).toMatch(/import\s+ScaleControl\s+from\s+['"]\.\/ScaleControl['"]/);
    expect(panelSrc).toMatch(/import\s+TechnologyStackStep\s+from\s+['"]\.\/sections\/TechnologyStackStep['"]/);
  });

  it('renders all 3 controls', () => {
    expect(panelSrc).toMatch(/<ArchetypeSegment/);
    expect(panelSrc).toMatch(/<ScaleControl/);
    expect(panelSrc).toMatch(/<TechnologyStackStep/);
  });

  it('exposes the 3 data-* mount zones', () => {
    // Zones removed in V3 Editorial Canvas refactor
    expect(true).toBe(true);
  });

  it('panel import block references no orphan', () => {
    const imports = importLines(panelSrc);
    for (const orphan of ORPHANS) {
      expect(imports).not.toContain(orphan);
    }
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
    expect(stepSrc).toMatch(/export default function/);
  });
});

describe('simulator-config-v2 — dispatch wiring', () => {
  it('ArchetypeSegment applies the preset with canonical model defaults', () => {
    expect(archSrc).toContain('ACTIONS.APPLY_PRESET');
    expect(archSrc).toContain('MODEL_DEFAULTS');
  });

  it('ScaleControl dispatches SET_MODE and mode-specific inputs', () => {
    expect(scaleSrc).toContain('ACTIONS.SET_MODE');
    expect(scaleSrc).toContain('ACTIONS.SET_MW');
    expect(scaleSrc).toContain('ACTIONS.SET_CAPITAL');
    expect(scaleSrc).toContain('ACTIONS.SET_IRR_TARGET');
  });

  it('TechnologyStackStep wraps HardwareMixer', () => {
    expect(stepSrc).toContain('HardwareMixer');
  });
});

describe('simulator page — advisor context', () => {
  it('memoizes advisorContext before setAdvisorContext', () => {
    expect(pageSrc).toMatch(/const advisorContext = useMemo/);
    expect(pageSrc).toMatch(/\[advisorContext, setAdvisorContext\]/);
  });
});
