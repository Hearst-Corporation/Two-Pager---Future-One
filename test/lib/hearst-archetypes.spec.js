// Tests pour les 3 nouveaux archétypes (neocloud_gpu, hyperscaler_self_build, sovereign_ai)
// + extension de projectArchetype pour compute_as: 'minority_equity' | 'gpu_cloud'.

import { describe, it, expect } from 'vitest';
import {
  DEAL_ARCHETYPES,
  PRIMARY_DEAL_ARCHETYPES,
  PRIMARY_MODEL_IDS,
  applyArchetype,
  projectArchetype,
} from '@/lib/hearst-deal-structures.js';

const BASE_SCENARIO = {
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

const ID_TO_ARCHETYPE = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

describe('PRIMARY_DEAL_ARCHETYPES — simulateur', () => {
  it('expose exactement les 4 modèles du picker', () => {
    expect(PRIMARY_DEAL_ARCHETYPES.map((a) => a.id)).toEqual(PRIMARY_MODEL_IDS);
    expect(PRIMARY_DEAL_ARCHETYPES).toHaveLength(4);
  });
});

describe('DEAL_ARCHETYPES — 3 nouveaux archétypes', () => {
  it('expose neocloud_gpu, hyperscaler_self_build, sovereign_ai', () => {
    expect(ID_TO_ARCHETYPE.neocloud_gpu).toBeDefined();
    expect(ID_TO_ARCHETYPE.hyperscaler_self_build).toBeDefined();
    expect(ID_TO_ARCHETYPE.sovereign_ai).toBeDefined();
  });

  it('neocloud_gpu a compute_as=gpu_cloud + cooling factor x1.5', () => {
    const a = ID_TO_ARCHETYPE.neocloud_gpu;
    expect(a.compute_as).toBe('gpu_cloud');
    expect(a.capex_component_factor.capex_cooling_per_mw).toBe(1.5);
    expect(a.opex_factor).toBeGreaterThan(1);
  });

  it('hyperscaler_self_build a equity_share + compute_as=minority_equity', () => {
    const a = ID_TO_ARCHETYPE.hyperscaler_self_build;
    expect(a.compute_as).toBe('minority_equity');
    expect(a.equity_share).toBeGreaterThan(0);
    expect(a.equity_share).toBeLessThan(0.5);
    // Tous les factors capex scalés × equity_share
    Object.values(a.capex_component_factor).forEach(v => {
      expect(v).toBeLessThan(0.5);
    });
  });

  it('sovereign_ai a bankability max (brand_premium dropped — P1-2)', () => {
    const a = ID_TO_ARCHETYPE.sovereign_ai;
    expect(a.compute_as).toBe('recurring_revenue');
    // brand_premium_pct was removed: sovereign_ai now uses revenue_factor=0.90 only —
    // brand_premium dropped to avoid stacking that pushed effective above merchant (intent violation).
    // P1-2: archetype scoring regression guard.
    expect(a.brand_premium_pct).toBeUndefined();
    expect(a.scores.bankability).toBe(5);
    expect(a.scores.brand).toBe(5);
  });
});

describe('projectArchetype — compute_as branches', () => {
  it('minority_equity: flague la projection avec equity_share', () => {
    const a = ID_TO_ARCHETYPE.hyperscaler_self_build;
    const r = projectArchetype(BASE_SCENARIO, a);
    expect(r.projection.minority_equity).toBe(true);
    expect(r.projection.equity_share).toBe(a.equity_share);
  });

  it('gpu_cloud: flague la projection en gpu_cloud_mode', () => {
    const a = ID_TO_ARCHETYPE.neocloud_gpu;
    const r = projectArchetype(BASE_SCENARIO, a);
    expect(r.projection.gpu_cloud_mode).toBe(true);
    expect(r.projection.notes).toMatch(/GPU-hour/i);
  });

  it('sovereign_ai: utilise le branch recurring_revenue (defaults)', () => {
    const a = ID_TO_ARCHETYPE.sovereign_ai;
    const r = projectArchetype(BASE_SCENARIO, a);
    expect(r.projection.minority_equity).toBeFalsy();
    expect(r.projection.gpu_cloud_mode).toBeFalsy();
    // sovereign_ai now uses revenue_factor=0.90 only — brand_premium dropped to avoid stacking
    // that pushed effective above merchant (intent violation).
    // P1-2: archetype scoring regression guard.
    expect(r.scenario.price_hyperscale_kw_month).toBeCloseTo(115 * 0.90, 2);
  });

  it('CAPEX total minority_equity est ~20% du baseline', () => {
    const baseline_projection = projectArchetype(BASE_SCENARIO, ID_TO_ARCHETYPE.manage_only);
    const minority_projection = projectArchetype(BASE_SCENARIO, ID_TO_ARCHETYPE.hyperscaler_self_build);
    const ratio = minority_projection.projection.total_capex / baseline_projection.projection.total_capex;
    expect(ratio).toBeGreaterThan(0.18);
    expect(ratio).toBeLessThan(0.22);
  });
});

describe('applyArchetype — backwards compat (5 original archetypes)', () => {
  it('powered_shell : exclut MEP et cooling', () => {
    const a = ID_TO_ARCHETYPE.powered_shell;
    const s = applyArchetype(BASE_SCENARIO, a);
    expect(s.capex_mep_per_mw).toBe(0);
    expect(s.capex_cooling_per_mw).toBe(0);
    expect(s.capex_shell_per_mw).toBe(4_400_000);
  });

  it('manage_only : applique operator_fee_pct=12 (stocké en percent 12)', () => {
    const a = ID_TO_ARCHETYPE.manage_only;
    const s = applyArchetype(BASE_SCENARIO, a);
    // applyArchetype stores operator_fee_pct as-is in percent scale (pure percent convention, A11).
    // archetype.operator_fee_pct = 12 → s.opex_operator_mgmt_fee_pct = 12
    expect(s.opex_operator_mgmt_fee_pct).toBe(12);
  });
});
