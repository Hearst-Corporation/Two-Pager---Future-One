/**
 * technology-stack-step.spec.js — HardwareMixer stack mounted in SimulatorConfigPanel.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HARDWARE_PRESETS, DEFAULT_HARDWARE_PRESET_ID, hardwareMixMatchesPreset } from '../../lib/hearst-config-presets.js';
import { INITIAL_STATE } from '../../lib/hearst-simulator-state.js';

const panelSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/SimulatorConfigPanel.jsx', import.meta.url)),
  'utf-8',
);

const stepSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/sections/TechnologyStackStep.jsx', import.meta.url)),
  'utf-8',
);

const mixerSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/HardwareMixer.jsx', import.meta.url)),
  'utf-8',
);

describe('TechnologyStackStep — panel wiring', () => {
  it('panel imports TechnologyStackStep and dispatches SET_HARDWARE_MIX', () => {
    expect(panelSrc).toMatch(/import\s+TechnologyStackStep\s+from\s+['"]\.\/sections\/TechnologyStackStep['"]/);
    expect(panelSrc).toMatch(/<TechnologyStackStep[\s\S]*?totalMw=\{totalMw\}/);
    expect(panelSrc).toMatch(/ACTIONS\.SET_HARDWARE_MIX/);
    expect(panelSrc).not.toMatch(/TechPresetControl/);
  });

  it('wraps HardwareMixer', () => {
    expect(stepSrc).toMatch(/import\s+HardwareMixer/);
    expect(stepSrc).toMatch(/<HardwareMixer/);
  });
});

describe('HardwareMixer — preset matching', () => {
  it('uses shared hardwareMixMatchesPreset helper', () => {
    expect(mixerSrc).toMatch(/hardwareMixMatchesPreset/);
    expect(mixerSrc).toMatch(/DEFAULT_HARDWARE_MIX/);
    expect(mixerSrc).not.toMatch(/classic_pct: 60,\s*liquid_pct: 25/);
  });

  it('skips applyPreset when preset already active', () => {
    expect(mixerSrc).toMatch(/if\s*\(\s*activePreset === p\.id\s*\)\s*return/);
  });

  it('uses text-only preset segments (no inline style blob)', () => {
    expect(mixerSrc).toMatch(/hardware-preset-option/);
    expect(mixerSrc).not.toMatch(/PresetIcon/);
    expect(mixerSrc).not.toMatch(/const S = \{/);
    expect(mixerSrc).not.toMatch(/HardwareTopology/);
    expect(mixerSrc).not.toMatch(/InfoHint/);
    expect(mixerSrc).not.toMatch(/from '@\/components\/hearst\/ui'/);
    expect(mixerSrc).toMatch(/hardware-spine-panel/);
    expect(mixerSrc).not.toMatch(/data-hardware-summary/);
    expect(mixerSrc).toMatch(/data-hw-gpu-segment/);
    expect(mixerSrc).toMatch(/hw-gpu-option/);
  });
});

describe('default hardware mix', () => {
  it('INITIAL_STATE matches the default mixed preset', () => {
    const preset = HARDWARE_PRESETS.find((p) => p.id === DEFAULT_HARDWARE_PRESET_ID);
    expect(hardwareMixMatchesPreset(INITIAL_STATE.hardware_mix, preset.patch)).toBe(true);
  });
});
