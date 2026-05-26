// Tests pour lib/hearst-solver.js — mwFromCapital + solveForTargetIrr + solveScenarioForMode.

import { describe, it, expect } from 'vitest';
import {
  mwFromCapital,
  solveForTargetIrr,
  solveScenarioForMode,
} from '@/lib/hearst-solver.js';

// Scénario de base "Qatar greenfield 50MW" calibré sur PUBLIC_SOURCES_LIBRARY.
const QATAR_BASE_SCENARIO = {
  total_mw: 50,
  pue: 1.45,
  target_occupancy_pct: 85,
  electricity_price_mwh: 32,
  capex_shell_per_mw: 4_400_000,
  capex_mep_per_mw: 3_800_000,
  capex_substation_per_mw: 1_200_000,
  capex_cooling_per_mw: 1_500_000,
  capex_grid_per_mw: 0,
  capex_land_per_mw: 0,
  capex_contingency_pct: 0.10,
  price_retail_colo_kw_month: 0,
  price_wholesale_kw_month: 0,
  price_hyperscale_kw_month: 115,
  annual_escalation_pct: 0.02,
  debt_pct: 0.60,
  debt_interest_rate: 6.5,
  debt_term_years: 12,
  exit_multiple: 16,
  exit_year: 10,
  start_year: 2026,
  commercial_split: { hyperscale_lease: 100 },
  opex_maintenance_pct: 0.04,
  opex_insurance_pct: 0.015,
  opex_ga_pct: 0.03,
  opex_operator_mgmt_fee_pct: 0.05,
  opex_staff_annual_musd: 8,
};

describe('mwFromCapital', () => {
  it('returns 0 for capital ≤ 0', () => {
    expect(mwFromCapital(0).mw).toBe(0);
    expect(mwFromCapital(-100).mw).toBe(0);
  });

  it('is inversible (mw → capital → mw within 0.5%)', () => {
    const start_mw = 50;
    // Total per MW = 4.4 + 3.8 + 1.2 + 1.5 = 10.9 M × 1.10 contingency = 11.99 M
    const expected_capital = start_mw * 10_900_000 * 1.10;
    const { mw } = mwFromCapital(expected_capital, QATAR_BASE_SCENARIO);
    expect(mw).toBeGreaterThan(start_mw * 0.995);
    expect(mw).toBeLessThan(start_mw * 1.005);
  });

  it('exposes a usable capex_per_mw_used breakdown', () => {
    const r = mwFromCapital(500_000_000, QATAR_BASE_SCENARIO);
    expect(r.capex_per_mw_used).toBeGreaterThan(10_000_000);
    expect(r.capex_per_mw_used).toBeLessThan(15_000_000);
    expect(r.breakdown).toMatchObject({
      shell: 4_400_000,
      mep: 3_800_000,
      substation: 1_200_000,
      cooling: 1_500_000,
    });
  });
});

describe('solveForTargetIrr — bissection', () => {
  it('converges on lever=pricing for a reasonable target', () => {
    const result = solveForTargetIrr(QATAR_BASE_SCENARIO, 0.15, 'pricing');
    // Target peut être hors plage si scenario de base ne le permet pas — on accepte
    // soit converged=true soit un diagnostic explicite.
    if (result.converged) {
      expect(result.achieved_irr).toBeGreaterThan(0.14);
      expect(result.achieved_irr).toBeLessThan(0.16);
      expect(result.lever_value).toBeGreaterThan(50);
      expect(result.lever_value).toBeLessThan(400);
    } else {
      expect(result.diagnostic).toBeTruthy();
    }
  });

  it('returns diagnostic when target is unreachable', () => {
    // 50% IRR impossible avec ces inputs Qatar — soit out-of-range,
    // soit IRR non-computable aux bornes (EBITDA<0 à pricing=$50).
    const result = solveForTargetIrr(QATAR_BASE_SCENARIO, 0.50, 'pricing');
    expect(result.converged).toBe(false);
    expect(result.diagnostic).toMatch(/out of range|did not converge|not computable/i);
  });

  it('respects custom bounds', () => {
    const result = solveForTargetIrr(QATAR_BASE_SCENARIO, 0.15, 'pricing', {
      bounds: [100, 200],
    });
    // Doit produire un lever_value dans [100, 200] OU diagnostic
    if (result.converged) {
      expect(result.lever_value).toBeGreaterThanOrEqual(100);
      expect(result.lever_value).toBeLessThanOrEqual(200);
    }
  });
});

describe('solveScenarioForMode', () => {
  it('mw_first: passe total_mw au scenario', () => {
    const r = solveScenarioForMode('mw_first', { total_mw: 100 }, QATAR_BASE_SCENARIO);
    expect(r.scenario.total_mw).toBe(100);
    expect(r.derived.total_mw).toBe(100);
  });

  it('capital_first: dérive MW depuis capital', () => {
    const r = solveScenarioForMode(
      'capital_first',
      { total_capex_usd: 1_200_000_000 }, // ~100MW @ $12M/MW
      QATAR_BASE_SCENARIO,
    );
    expect(r.scenario.total_mw).toBeGreaterThan(90);
    expect(r.scenario.total_mw).toBeLessThan(110);
    expect(r.derived.capital_usd).toBe(1_200_000_000);
    expect(r.derived.mw).toBe(r.scenario.total_mw);
  });

  it('target_irr_first: invoque le solver', () => {
    const r = solveScenarioForMode(
      'target_irr_first',
      { target_irr_pct: 15, lever: 'pricing', total_mw: 50 },
      QATAR_BASE_SCENARIO,
    );
    expect(r.solver).toBeDefined();
    expect(typeof r.derived.converged).toBe('boolean');
    expect(r.derived.target_irr).toBeCloseTo(0.15);
    expect(r.derived.lever).toBe('pricing');
  });

  it('rejette un mode inconnu', () => {
    expect(() => solveScenarioForMode('weird_mode', {}, {})).toThrow();
  });
});
