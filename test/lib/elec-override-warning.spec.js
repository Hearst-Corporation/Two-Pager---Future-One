// Test: electricity_price_mwh override behaviour in applyArchetype (powered_shell / NNN)
//
// Bug P0-1: applyArchetype() was unconditionally zeroing electricity_price_mwh when
// opex_factor === 0 (powered_shell archetype), silently discarding user overrides.
//
// Fix (Option B): zero out ONLY when no override is present; emit a warning when an
// override IS present so the caller knows the value is informational (NNN pass-through).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import {
  applyArchetype,
  DEAL_ARCHETYPES,
} from '@/lib/hearst-deal-structures.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEAL_STRUCTURES_SRC = readFileSync(
  join(__dirname, '../../lib/hearst-deal-structures.js'),
  'utf8'
);

const POWERED_SHELL = DEAL_ARCHETYPES.find((a) => a.id === 'powered_shell');

const BASE_SCENARIO = {
  total_mw: 50,
  pue: 1.45,
  target_occupancy_pct: 85,
  electricity_price_mwh: 42, // user-supplied override
  capex_shell_per_mw: 4_400_000,
  capex_mep_per_mw: 3_800_000,
  capex_substation_per_mw: 1_200_000,
  capex_cooling_per_mw: 1_500_000,
  capex_grid_per_mw: 0,
  capex_land_per_mw: 0,
  capex_contingency_pct: 10,
  price_hyperscale_kw_month: 115,
  annual_escalation_pct: 2,
  debt_pct: 60,
  debt_interest_rate: 6.5,
  debt_term_years: 10,
  exit_multiple: 18,
  exit_year: 10,
  commercial_split: { hyperscale: 100 },
};

describe('applyArchetype — electricity_price_mwh override (powered_shell)', () => {
  it('respects user override: electricity_price_mwh is NOT zeroed when scenario_overrides contains it', () => {
    const result = applyArchetype(BASE_SCENARIO, POWERED_SHELL, {
      scenario_overrides: { electricity_price_mwh: 42 },
    });
    expect(result.electricity_price_mwh).toBe(42);
  });

  it('emits a warning in _archetype_warnings when override is present', () => {
    const result = applyArchetype(BASE_SCENARIO, POWERED_SHELL, {
      scenario_overrides: { electricity_price_mwh: 42 },
    });
    expect(result._archetype_warnings).toBeInstanceOf(Array);
    expect(result._archetype_warnings.length).toBeGreaterThan(0);
    expect(result._archetype_warnings[0]).toMatch(/electricity_price_mwh override noted/);
  });

  it('still zeros electricity_price_mwh when no override is supplied', () => {
    const scenarioNoElec = { ...BASE_SCENARIO };
    delete scenarioNoElec.electricity_price_mwh;
    const result = applyArchetype(scenarioNoElec, POWERED_SHELL, {
      scenario_overrides: {},
    });
    expect(result.electricity_price_mwh).toBe(0);
    expect(result._archetype_warnings).toHaveLength(0);
  });

  it('zeros electricity_price_mwh when scenario_overrides is absent and scenario has no elec value', () => {
    const scenarioNoElec = { ...BASE_SCENARIO };
    delete scenarioNoElec.electricity_price_mwh;
    const result = applyArchetype(scenarioNoElec, POWERED_SHELL);
    expect(result.electricity_price_mwh).toBe(0);
  });

  it('source file: zeroing is conditional (not unconditional) — override-check variable present in source', () => {
    // The fix introduces an `elecOverridden` variable to gate the zeroing.
    // Its presence proves the assignment is wrapped in a conditional, not fired unconditionally.
    expect(DEAL_STRUCTURES_SRC).toMatch(/elecOverridden/);
    // The conditional must reference scenario_overrides
    expect(DEAL_STRUCTURES_SRC).toMatch(/scenario_overrides\.electricity_price_mwh/);
  });

  it('source file: warning string is present in the codebase', () => {
    expect(DEAL_STRUCTURES_SRC).toMatch(
      /electricity_price_mwh override noted.*NNN structure passes electricity cost to tenant/
    );
  });
});
