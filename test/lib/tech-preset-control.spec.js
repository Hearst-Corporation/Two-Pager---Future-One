/**
 * tech-preset-control.spec.js
 *
 * Source-level guards for the TechPresetControl v2 control:
 *   - selecting a preset dispatches ACTIONS.SET_HARDWARE_MIX with the patch
 *   - declares the 3 concrete hardware presets (colo / mixed / ai_factory)
 *   - cards are accessible (aria-pressed)
 *   - tokens-only (no hex / rgba)
 *   - mounted in SimulatorConfigPanel with hardwareMix={state.hardware_mix}
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HARDWARE_PRESETS } from '../../lib/hearst-config-presets.js';

const ctrlSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/TechPresetControl.jsx', import.meta.url)),
  'utf-8',
);

const panelSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/SimulatorConfigPanel.jsx', import.meta.url)),
  'utf-8',
);

describe('TechPresetControl — dispatch wiring', () => {
  it('dispatches ACTIONS.SET_HARDWARE_MIX', () => {
    expect(ctrlSrc).toMatch(/type:\s*ACTIONS\.SET_HARDWARE_MIX/);
  });

  it('imports ACTIONS from hearst-simulator-state', () => {
    expect(ctrlSrc).toMatch(/import\s*\{[^}]*ACTIONS[^}]*\}\s*from\s*['"]@\/lib\/hearst-simulator-state['"]/);
  });
});

describe('TechPresetControl — preset sources', () => {
  it('imports HARDWARE_PRESETS from hearst-config-presets', () => {
    expect(ctrlSrc).toMatch(/import\s*\{[^}]*HARDWARE_PRESETS[^}]*\}\s*from\s*['"]@\/lib\/hearst-config-presets['"]/);
  });

  it('declares the 3 concrete presets (ids)', () => {
    expect(HARDWARE_PRESETS.map((p) => p.id)).toEqual(['colo', 'mixed', 'ai_factory']);
  });

  it('declares the 3 distinct classic_pct patches (80 / 40 / 10)', () => {
    const pcts = HARDWARE_PRESETS.map((p) => p.patch.classic_pct);
    expect(pcts).toEqual([80, 40, 10]);
  });

  it('names presets via UI strings', () => {
    expect(ctrlSrc).toMatch(/UI\.HW_PRESET_COLO_NAME/);
    expect(ctrlSrc).toMatch(/UI\.HW_PRESET_MIXED_NAME/);
    expect(ctrlSrc).toMatch(/UI\.HW_PRESET_AI_NAME/);
  });
});

describe('TechPresetControl — accessibility', () => {
  it('exposes aria-pressed on the cards', () => {
    expect(ctrlSrc).toMatch(/aria-pressed/);
  });
});

describe('TechPresetControl — design system hygiene', () => {
  it('contains no hex colors', () => {
    expect(ctrlSrc).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  it('contains no rgb/rgba literals', () => {
    expect(ctrlSrc).not.toMatch(/rgba?\(/);
  });
});

describe('SimulatorConfigPanel — mounts TechPresetControl', () => {
  it('imports TechPresetControl', () => {
    expect(panelSrc).toMatch(/import\s+TechPresetControl\s+from\s+['"]\.\/TechPresetControl['"]/);
  });

  it('renders <TechPresetControl> with hardwareMix={state.hardware_mix}', () => {
    expect(panelSrc).toMatch(/<TechPresetControl[\s\S]*?hardwareMix=\{state\.hardware_mix\}[\s\S]*?dispatch=\{dispatch\}/);
  });
});
