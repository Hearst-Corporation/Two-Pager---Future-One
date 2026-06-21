// Tests pour lib/hearst-solver.js — mwFromCapital + solveForTargetIrr + solveScenarioForMode.

import { describe, it, expect } from 'vitest';
import {
  mwFromCapital,
  solveForTargetIrr,
  solveScenarioForMode,
  solveMwForCapital,
} from '@/lib/hearst-solver.js';
import { projectArchetype, DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { foldGpuRevenue, generateProjection } from '@/lib/hearst-calculations';
import { calcHardwareBreakdown } from '@/lib/hearst-gpu-catalog';
import { bootstrapScenarioFromSources } from '@/lib/hearst-bootstrap';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';

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
  capex_contingency_pct: 10, // A19: migrated to pure percent (0..100)
  price_retail_colo_kw_month: 0,
  price_wholesale_kw_month: 0,
  price_hyperscale_kw_month: 115,
  annual_escalation_pct: 2, // A19: migrated to pure percent (0..100)
  // Post-A15: migrated to pure percent convention (0..100). Previous values reflected 0.60% leverage bug.
  debt_pct: 60,
  debt_interest_rate: 6.5,
  debt_term_years: 12,
  exit_multiple: 16,
  exit_year: 10,
  start_year: 2026,
  commercial_split: { hyperscale_lease: 100 },
  opex_maintenance_pct: 4,
  opex_insurance_pct: 1.5,
  opex_ga_pct: 3,
  opex_operator_mgmt_fee_pct: 5,
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

  // P0-3: capital_first must NOT change mw_first / target_irr_first behaviour even
  // when the new opts.totalCapexForMw is supplied (those modes ignore it).
  it('mw_first unchanged when totalCapexForMw opt is present', () => {
    const r = solveScenarioForMode('mw_first', { total_mw: 100 }, QATAR_BASE_SCENARIO, { totalCapexForMw: () => 1 });
    expect(r.scenario.total_mw).toBe(100);
    expect(r.derived.total_mw).toBe(100);
    expect(r.solver).toBeUndefined();
  });

  it('target_irr_first unchanged when totalCapexForMw opt is present', () => {
    const a = solveScenarioForMode('target_irr_first', { target_irr_pct: 15, lever: 'pricing', total_mw: 50 }, QATAR_BASE_SCENARIO);
    const b = solveScenarioForMode('target_irr_first', { target_irr_pct: 15, lever: 'pricing', total_mw: 50 }, QATAR_BASE_SCENARIO, { totalCapexForMw: () => 1 });
    expect(b.derived.lever_value).toBe(a.derived.lever_value);
    expect(b.derived.target_irr).toBe(a.derived.target_irr);
  });

  it('capital_first falls back to facility-only mwFromCapital when no evaluator', () => {
    const r = solveScenarioForMode('capital_first', { total_capex_usd: 1_000_000_000 }, QATAR_BASE_SCENARIO);
    expect(r.derived.archetype_aware).toBe(false);
    expect(r.derived.mw).toBe(r.scenario.total_mw);
  });

  it('capital_first uses the archetype-aware solve when an evaluator is supplied', () => {
    // synthetic engine: $10M/MW everywhere → $1.0B should solve to ~100 MW
    const r = solveScenarioForMode('capital_first', { total_capex_usd: 1_000_000_000 }, QATAR_BASE_SCENARIO, { totalCapexForMw: (mw) => mw * 10_000_000 });
    expect(r.derived.archetype_aware).toBe(true);
    expect(r.solver.converged).toBe(true);
    expect(r.scenario.total_mw).toBeCloseTo(100, 0);
    expect(Math.abs(r.solver.capex - 1_000_000_000)).toBeLessThanOrEqual(r.solver.tolerance);
  });
});

describe('solveMwForCapital — bounded binary search (P0-3)', () => {
  const TOL = (b) => Math.max(0.01 * b, 1_000_000);

  it('converges so total_capex(MW) is within tolerance of the budget', () => {
    const budget = 1_000_000_000;
    const r = solveMwForCapital(budget, (mw) => mw * 33_000_000); // facility+GPU-heavy curve
    expect(r.converged).toBe(true);
    expect(r.iterations).toBeLessThanOrEqual(30);
    expect(Math.abs(r.capex - budget)).toBeLessThanOrEqual(TOL(budget));
    expect(r.mw).toBeCloseTo(budget / 33_000_000, 0);
  });

  it('solves a GPU-shaped curve a facility-only divide would overshoot ~200%', () => {
    const budget = 1_000_000_000;
    const facilityPerMw = 11_000_000, hardwarePerMw = 22_000_000; // 2× facility = GPU dominates
    const total = (mw) => mw * (facilityPerMw + hardwarePerMw);
    // facility-only sizing (the old bug): budget / facilityPerMw MW
    const facilityOnlyMw = budget / facilityPerMw;
    expect(total(facilityOnlyMw) / budget).toBeGreaterThan(2.5); // would overshoot >150%
    const r = solveMwForCapital(budget, total);
    expect(r.converged).toBe(true);
    expect(Math.abs(r.capex - budget) / budget).toBeLessThanOrEqual(0.01); // ≤1%
  });

  it('budget <= 0 → 0 MW, not converged, honest diagnostic', () => {
    const r = solveMwForCapital(0, (mw) => mw * 10_000_000);
    expect(r.mw).toBe(0);
    expect(r.converged).toBe(false);
    expect(r.diagnostic).toMatch(/positive/i);
  });

  it('budget below minimum-scale CAPEX → floor MW with diagnostic (no silent overshoot)', () => {
    // bounds [5,1000]; at 5 MW this curve costs $250M; budget $100M cannot fund it
    const r = solveMwForCapital(100_000_000, (mw) => mw * 50_000_000);
    expect(r.converged).toBe(false);
    expect(r.mw).toBe(5);
    expect(r.diagnostic).toMatch(/below the minimum-scale/i);
  });

  it('budget above max-scale CAPEX → ceiling MW with diagnostic', () => {
    const r = solveMwForCapital(100_000_000_000, (mw) => mw * 10_000_000); // 1000 MW = $10B < $100B
    expect(r.converged).toBe(false);
    expect(r.mw).toBe(1000);
    expect(r.diagnostic).toMatch(/exceeds CAPEX at the max/i);
  });

  it('fails honestly when total_capex is not computable', () => {
    const r = solveMwForCapital(1_000_000_000, () => null);
    expect(r.converged).toBe(false);
    expect(r.mw).toBeNull();
    expect(r.diagnostic).toMatch(/not computable or not monotonic/i);
  });

  it('fails honestly when total_capex is not monotonic across bounds', () => {
    const r = solveMwForCapital(1_000_000_000, (mw) => 1_000_000_000 - mw); // decreasing
    expect(r.converged).toBe(false);
    expect(r.diagnostic).toMatch(/monotonic/i);
  });
});

// AC-B: projectionFn injection into solveForTargetIrr / solveScenarioForMode
describe('solveForTargetIrr — projectionFn injection (AC-B)', () => {
  // Synthetic projectionFn that returns a higher IRR than generateProjection for the same lever.
  // We bias the IRR by adding a fixed bonus so the solver must converge to a DIFFERENT lever_value.
  const BONUS_IRR = 0.08; // 8pp upward bias applied by the fake pipeline
  const syntheticProjectionFn = (scenario) => {
    const base = generateProjection(scenario);
    if (!base || base.irr == null) return base;
    return { ...base, irr: base.irr + BONUS_IRR };
  };

  it('AC-B1: target_irr_first with projectionFn — achieved_irr == projectionFn(result.scenario).irr (not raw)', () => {
    const target = 0.20; // 20% target
    // Without projectionFn (raw generateProjection)
    const rawResult = solveForTargetIrr(QATAR_BASE_SCENARIO, target, 'pricing');
    // With projectionFn (biased pipeline)
    const injResult = solveForTargetIrr(QATAR_BASE_SCENARIO, target, 'pricing', {
      projectionFn: syntheticProjectionFn,
    });

    if (injResult.converged) {
      // The achieved_irr must equal projectionFn(scenario).irr, NOT the raw IRR
      const pIrr = syntheticProjectionFn(injResult.scenario)?.irr;
      expect(injResult.achieved_irr).toBeCloseTo(pIrr, 3);
      expect(injResult.achieved_irr).toBeCloseTo(target, 2);

      // Prove the gap: raw IRR at the injected solver's lever_value is DIFFERENT (≥BONUS_IRR lower)
      if (rawResult.converged) {
        // The two solvers should have converged to different lever values because of the bias
        expect(Math.abs(injResult.lever_value - rawResult.lever_value)).toBeGreaterThan(1);
      }
    } else {
      // Acceptable if biased pipeline pushes target out of range
      expect(injResult.diagnostic).toBeTruthy();
    }
  });

  it('AC-B2: without projectionFn — behaviour is strictly identical to prior baseline', () => {
    const target = 0.15;
    const resultA = solveForTargetIrr(QATAR_BASE_SCENARIO, target, 'pricing');
    const resultB = solveForTargetIrr(QATAR_BASE_SCENARIO, target, 'pricing', {});
    // Both must produce exactly the same outcome (no projectionFn = generateProjection default)
    expect(resultB.converged).toBe(resultA.converged);
    if (resultA.converged && resultB.converged) {
      expect(resultB.lever_value).toBeCloseTo(resultA.lever_value, 6);
      expect(resultB.achieved_irr).toBeCloseTo(resultA.achieved_irr, 6);
    }
  });

  it('AC-B3a: capital_first inchangé (projectionFn ignoré)', () => {
    const a = solveScenarioForMode('capital_first', { total_capex_usd: 1_000_000_000 }, QATAR_BASE_SCENARIO);
    const b = solveScenarioForMode('capital_first', { total_capex_usd: 1_000_000_000 }, QATAR_BASE_SCENARIO, {
      projectionFn: syntheticProjectionFn,
    });
    // capital_first uses totalCapexForMw, not projectionFn — both fall back to facility-only here
    expect(b.derived.archetype_aware).toBe(a.derived.archetype_aware);
    expect(b.derived.mw).toBeCloseTo(a.derived.mw, 1);
  });

  it('AC-B3b: mw_first inchangé (projectionFn ignoré)', () => {
    const a = solveScenarioForMode('mw_first', { total_mw: 75 }, QATAR_BASE_SCENARIO);
    const b = solveScenarioForMode('mw_first', { total_mw: 75 }, QATAR_BASE_SCENARIO, {
      projectionFn: syntheticProjectionFn,
    });
    expect(b.scenario.total_mw).toBe(a.scenario.total_mw);
    expect(b.derived.total_mw).toBe(a.derived.total_mw);
    expect(b.solver).toBeUndefined();
  });

  it('AC-B3c: solveScenarioForMode target_irr_first threads projectionFn to solveForTargetIrr', () => {
    const target_pct = 20;
    const target = target_pct / 100;
    const rawR = solveScenarioForMode('target_irr_first', { target_irr_pct: target_pct, lever: 'pricing', total_mw: 50 }, QATAR_BASE_SCENARIO);
    const injR = solveScenarioForMode('target_irr_first', { target_irr_pct: target_pct, lever: 'pricing', total_mw: 50 }, QATAR_BASE_SCENARIO, {
      projectionFn: syntheticProjectionFn,
    });
    if (injR.solver.converged) {
      // achieved_irr must match projectionFn output, not raw
      const pIrr = syntheticProjectionFn(injR.scenario)?.irr;
      expect(injR.solver.achieved_irr).toBeCloseTo(pIrr, 3);
      if (rawR.solver.converged) {
        // Lever values must differ because the biased pipeline changes the solve
        expect(Math.abs(injR.solver.lever_value - rawR.solver.lever_value)).toBeGreaterThan(0.5);
      }
    } else {
      expect(injR.solver.diagnostic).toBeTruthy();
    }
  });
});

// Integration: real engine pipeline. Mirrors app/api/.../simulate/route.js
// buildArchetypeProjection so the solver sees the engine's TRUE total_capex.
describe('capital_first archetype-aware — real engine, $1.0B budget', () => {
  const ARCH = Object.fromEntries(DEAL_ARCHETYPES.map((a) => [a.id, a]));
  const DEFAULT_MINORITY_EQUITY_SHARE = 0.20; // mirrors simulate/route.js
  const BUDGET = 1_000_000_000;

  function evaluatorFor(archetype_id, business_model_id, hardware_mix) {
    const boot = bootstrapScenarioFromSources({ geography: 'qatar', business_model_id, mw_target: 50, archetype_id, extraSources: [] });
    const defaults = boot.scenario;
    const archetype = ARCH[archetype_id];
    const evalFn = (mw) => {
      const ar = projectArchetype({ ...defaults, total_mw: mw }, archetype);
      const proj = ar.projection;
      const hb = calcHardwareBreakdown(ar.scenario, hardware_mix);
      if (hb) {
        const hw_share = archetype.compute_as === 'minority_equity'
          ? (archetype.equity_share || DEFAULT_MINORITY_EQUITY_SHARE)
          : (archetype.revenue_factor ?? 1.0);
        if (hw_share !== 1.0) {
          hb.revenue_ai_annual = (hb.revenue_ai_annual || 0) * hw_share;
          hb.capex_hardware = (hb.capex_hardware || 0) * hw_share;
          hb.total_gpus = Math.round((hb.total_gpus || 0) * hw_share);
        }
      }
      if (hb && (hb.revenue_ai_annual > 0 || hb.capex_hardware > 0)) {
        foldGpuRevenue(proj, hb, ar.scenario, {
          rfs_year: ar.scenario.phase1_complete_year || 3,
          ramp_years: 2,
          exit_year: ar.scenario.exit_year || 10,
          discount_rate_pct: ar.scenario.discount_rate_pct ?? FINANCIAL_THRESHOLDS.discount_rate_pct,
        });
      }
      return proj?.total_capex ?? null;
    };
    return { defaults, evalFn };
  }

  const CASES = [
    { name: 'powered_shell', bm: 'hyperscale_lease', hw: { classic_pct: 80, liquid_pct: 20, ai_pct: 0, utilization_pct: 80 }, facilityOnlyOk: true },
    { name: 'neocloud_gpu', bm: 'gpu_cloud', hw: { classic_pct: 0, liquid_pct: 20, ai_pct: 80, utilization_pct: 85, gpu_sku_id: 'gb200_nvl72' }, facilityOnlyOk: false },
    { name: 'sovereign_ai', bm: 'sovereign_ai', hw: { classic_pct: 10, liquid_pct: 30, ai_pct: 60, utilization_pct: 85, gpu_sku_id: 'gb200_nvl72' }, facilityOnlyOk: false },
  ];

  for (const c of CASES) {
    it(`${c.name}: solved CAPEX within 1% of $1.0B`, () => {
      const { evalFn } = evaluatorFor(c.name, c.bm, c.hw);
      const r = solveMwForCapital(BUDGET, evalFn);
      expect(r.converged).toBe(true);
      expect(Math.abs(r.capex - BUDGET) / BUDGET).toBeLessThanOrEqual(0.01);
      expect(r.mw).toBeGreaterThan(0);
    });
  }

  it('facility-only sizing overshoots for GPU/AI archetypes (the bug being fixed)', () => {
    for (const c of CASES.filter((x) => !x.facilityOnlyOk)) {
      const { defaults, evalFn } = evaluatorFor(c.name, c.bm, c.hw);
      const facilityOnlyMw = mwFromCapital(BUDGET, defaults).mw;
      const realCapex = evalFn(facilityOnlyMw);
      expect(realCapex / BUDGET).toBeGreaterThan(1.1); // >10% overshoot under the old path
    }
  });

  it('powered_shell stays stable (facility-only already ≈ correct)', () => {
    const { defaults, evalFn } = evaluatorFor('powered_shell', 'hyperscale_lease', { classic_pct: 80, liquid_pct: 20, ai_pct: 0, utilization_pct: 80 });
    const facilityOnlyMw = mwFromCapital(BUDGET, defaults).mw;
    const r = solveMwForCapital(BUDGET, evalFn);
    // archetype-aware result is within a few % of the facility-only result (no GPU CAPEX)
    expect(Math.abs(r.mw - facilityOnlyMw) / facilityOnlyMw).toBeLessThan(0.1);
  });
});
