/**
 * archetype-segment.spec.js
 *
 * Source-level guards for the ArchetypeSegment v2 control:
 *   - sources the 4 primary archetypes + canonical model defaults
 *   - selecting an archetype dispatches APPLY_PRESET (NOT bare archetype-only actions)
 *     so business_model_id / client_type_id are posted too
 *   - segment is accessible (aria-pressed)
 *   - mounted in SimulatorConfigPanel
 *   - tokens-only (no hex / rgba)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const segSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/ArchetypeSegment.jsx', import.meta.url)),
  'utf-8',
);

const panelSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/SimulatorConfigPanel.jsx', import.meta.url)),
  'utf-8',
);

describe('ArchetypeSegment — data sources', () => {
  it('imports PRIMARY_DEAL_ARCHETYPES from hearst-deal-structures', () => {
    expect(segSrc).toMatch(/import\s*\{[^}]*PRIMARY_DEAL_ARCHETYPES[^}]*\}\s*from\s*['"]@\/lib\/hearst-deal-structures['"]/);
  });

  it('imports MODEL_DEFAULTS from hearst-config-presets', () => {
    expect(segSrc).toMatch(/import\s*\{[^}]*MODEL_DEFAULTS[^}]*\}\s*from\s*['"]@\/lib\/hearst-config-presets['"]/);
  });
});

describe('ArchetypeSegment — dispatch wiring', () => {
  it('dispatches ACTIONS.APPLY_PRESET with primary_archetype_id', () => {
    expect(segSrc).toMatch(/type:\s*ACTIONS\.APPLY_PRESET/);
    expect(segSrc).toMatch(/primary_archetype_id/);
  });

  it('spreads MODEL_DEFAULTS into the APPLY_PRESET payload', () => {
    expect(segSrc).toMatch(/MODEL_DEFAULTS\[/);
    expect(segSrc).toMatch(/\.\.\.\(?\s*def/);
  });

  it('does NOT dispatch archetype without APPLY_PRESET bundle', () => {
    expect(segSrc).not.toMatch(/type:\s*ACTIONS\.SET_PRIMARY_ARCHETYPE/);
  });

  it('skips dispatch when the archetype is already selected', () => {
    expect(segSrc).toMatch(/if\s*\(\s*primaryId\s*===\s*id\s*\)\s*return/);
  });
});

describe('ArchetypeSegment — accessibility', () => {
  it('exposes aria-pressed on the cards', () => {
    expect(segSrc).toMatch(/aria-pressed/);
  });

  it('shows detail only on the selected archetype', () => {
    expect(segSrc).toMatch(/\{selected && m &&/);
    expect(segSrc).not.toMatch(/data-dimmed/);
  });
});

describe('ArchetypeSegment — design system hygiene', () => {
  it('contains no hex colors', () => {
    expect(segSrc).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it('contains no rgb/rgba literals', () => {
    expect(segSrc).not.toMatch(/rgba?\(/);
  });
});

describe('SimulatorConfigPanel — mounts ArchetypeSegment', () => {
  it('imports ArchetypeSegment', () => {
    expect(panelSrc).toMatch(/import\s+ArchetypeSegment\s+from\s+['"]\.\/ArchetypeSegment['"]/);
  });

  it('renders <ArchetypeSegment> in the data-arch-segment slot', () => {
    expect(panelSrc).toMatch(/<ArchetypeSegment[\s\S]*?primaryId=\{state\.primary_archetype_id\}[\s\S]*?dispatch=\{dispatch\}/);
  });
});
