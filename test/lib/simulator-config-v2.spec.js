/**
 * simulator-config-v2.spec.js
 *
 * Architecture guardrails for the rebuilt simulator surface. Locks in:
 *   - page.jsx mounts InvestmentCaseSurface (hero) + SimulatorConfigPanel (new)
 *   - SimulatorConfigPanel mounts the 3 controls (ArchetypeSegment,
 *     CapacityControl, TechPresetControl) in their data-* slots
 *   - none of the 8 orphaned legacy components are ever re-imported (in page.jsx
 *     OR in the panel) — matched on IMPORT LINES only, so the
 *     "Replaces CaseHeaderStep" comment in page.jsx is NOT a false positive
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
const capSrc = read('components/hearst/simulator/CapacityControl.jsx');
const techSrc = read('components/hearst/simulator/TechPresetControl.jsx');

// The 8 legacy orphans that must NEVER be re-imported.
const ORPHANS = [
  'ArchetypePicker',
  'InputModeSwitcher',
  'InputFieldHero',
  'TechnologyStackStep',
  'HardwareMixer',
  'JvStructureVisual',
  'ElectricityPriceInput',
  'CaseHeaderStep',
];

// Extract only the import lines of a source file (defeats false positives from
// comments — e.g. "Replaces CaseHeaderStep" lives in a comment, not an import).
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

  it('the orphan names DO appear elsewhere only as comments, never as imports', () => {
    // Sanity: CaseHeaderStep is mentioned in a comment in page.jsx — confirm the
    // import-line filter correctly excludes it so the guard above is meaningful.
    expect(pageSrc).toContain('CaseHeaderStep');
    expect(importLines(pageSrc)).not.toContain('CaseHeaderStep');
  });
});

describe('simulator-config-v2 — page.jsx mounts the new panel', () => {
  it('imports SimulatorConfigPanel from the simulator folder', () => {
    expect(pageSrc).toMatch(
      /import\s+SimulatorConfigPanel\s+from\s+['"]@\/components\/hearst\/simulator\/SimulatorConfigPanel['"]/,
    );
  });

  it('renders <SimulatorConfigPanel> with state and dispatch props', () => {
    expect(pageSrc).toMatch(
      /<SimulatorConfigPanel[\s\S]*?state=\{state\}[\s\S]*?dispatch=\{dispatch\}/,
    );
  });

  it('still renders <InvestmentCaseSurface> (hero preserved)', () => {
    expect(pageSrc).toMatch(
      /import\s+InvestmentCaseSurface\s+from\s+['"]@\/components\/hearst\/simulator\/InvestmentCaseSurface['"]/,
    );
    expect(pageSrc).toMatch(/<InvestmentCaseSurface/);
  });
});

describe('simulator-config-v2 — panel mounts the 3 controls', () => {
  it('imports ArchetypeSegment, CapacityControl, TechPresetControl', () => {
    expect(panelSrc).toMatch(/import\s+ArchetypeSegment\s+from\s+['"]\.\/ArchetypeSegment['"]/);
    expect(panelSrc).toMatch(/import\s+CapacityControl\s+from\s+['"]\.\/CapacityControl['"]/);
    expect(panelSrc).toMatch(/import\s+TechPresetControl\s+from\s+['"]\.\/TechPresetControl['"]/);
  });

  it('renders all 3 controls', () => {
    expect(panelSrc).toMatch(/<ArchetypeSegment/);
    expect(panelSrc).toMatch(/<CapacityControl/);
    expect(panelSrc).toMatch(/<TechPresetControl/);
  });

  it('exposes the 3 data-* mount zones', () => {
    expect(panelSrc).toContain('data-arch-segment');
    expect(panelSrc).toContain('data-capacity-control');
    expect(panelSrc).toContain('data-tech-preset');
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
  it('CapacityControl is a default-exported function', () => {
    expect(capSrc).toMatch(/export default function/);
  });
  it('TechPresetControl is a default-exported function', () => {
    expect(techSrc).toMatch(/export default function/);
  });
});

describe('simulator-config-v2 — dispatch wiring', () => {
  it('ArchetypeSegment applies the preset with canonical model defaults', () => {
    expect(archSrc).toContain('ACTIONS.APPLY_PRESET');
    expect(archSrc).toContain('MODEL_DEFAULTS');
  });

  it('CapacityControl dispatches SET_MW', () => {
    expect(capSrc).toContain('ACTIONS.SET_MW');
  });

  it('TechPresetControl dispatches SET_HARDWARE_MIX', () => {
    expect(techSrc).toContain('ACTIONS.SET_HARDWARE_MIX');
  });
});
