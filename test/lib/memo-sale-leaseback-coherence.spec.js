// test/lib/memo-sale-leaseback-coherence.spec.js
//
// P0 COHERENCE GUARD — the strategic memo must NOT contradict the Results screen
// for sale_leaseback (compute_as: 'one_time_sale').
//
// Bug: the memo route used to blindly run generateProjection(payload.scenario)
// (a 10-year HOLD) and OVERWRITE payload.projection — the real SALE projection
// (sale_mode:true, payback ≈ dev_exit_year ≈ 4) that the screen showed. The memo
// then pinned HOLD IRR/MOIC/NPV/payback/TV with confidence HIGH while the UI showed
// the SALE. This test pins the fix: resolveTruthProjection() must return the SALE
// projection for sale_leaseback, and the STANDARD path for every other archetype.

import { describe, it, expect } from 'vitest';
import {
  DEAL_ARCHETYPES,
  projectArchetype,
} from '@/lib/hearst-deal-structures.js';
import { generateProjection } from '@/lib/hearst-calculations.js';
import { resolveTruthProjection } from '@/app/api/admin/hearst/strategic-memo/memo-projection.js';

const ID_TO_ARCHETYPE = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

// Realistic-ish baseline scenario (mirrors test/lib/hearst-archetypes.spec.js).
// price_hyperscale_kw_month is set high enough (220) that the sale-leaseback
// levered-equity IRR is a solvable finite number — so the SALE-vs-HOLD IRR
// divergence assertion below is non-vacuous (SALE ≈ 23% vs HOLD ≈ 19%).
const BASE_SCENARIO = {
  total_mw: 50,
  pue: 1.45,
  target_occupancy_pct: 90,
  electricity_price_mwh: 32,
  capex_shell_per_mw: 4_400_000,
  capex_mep_per_mw: 3_800_000,
  capex_substation_per_mw: 1_200_000,
  capex_cooling_per_mw: 1_500_000,
  capex_grid_per_mw: 0,
  capex_land_per_mw: 0,
  capex_contingency_pct: 10,
  price_hyperscale_kw_month: 220,
  annual_escalation_pct: 2,
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

// Build a /simulate-shaped payload snapshot for a given archetype, exactly as the
// memo route receives it (startMemoJob({ payload: simResult })).
function makePayload(archetype) {
  const ar = projectArchetype(BASE_SCENARIO, archetype);
  return {
    scenario: ar.scenario,
    projection: ar.projection, // what the Results screen renders
    archetype_outcome: {
      id: archetype.id,
      label: archetype.label,
      code: archetype.code,
      score: ar.score,
      scores: archetype.scores,
      compute_as: archetype.compute_as || 'recurring_revenue',
    },
    hardware_breakdown: null,
  };
}

describe('sale_leaseback baseline — projectArchetype is a SALE, not a hold', () => {
  it('sale_leaseback projection is sale_mode with payback ≈ dev_exit_year', () => {
    const archetype = ID_TO_ARCHETYPE.sale_leaseback;
    expect(archetype.compute_as).toBe('one_time_sale');
    const ar = projectArchetype(BASE_SCENARIO, archetype);
    expect(ar.projection.sale_mode).toBe(true);
    expect(ar.projection.payback_years).toBe(archetype.dev_exit_year); // 4
    // A hold projection runs the full exit_year (10) horizon; the sale exits at 4.
    expect(ar.projection.payback_years).not.toBe(BASE_SCENARIO.exit_year);
  });
});

describe('resolveTruthProjection — SALE path (sale_leaseback)', () => {
  const archetype = ID_TO_ARCHETYPE.sale_leaseback;

  it('returns the SALE projection (sale_mode true, payback ≈ dev_exit), NOT a 10-yr hold', () => {
    const payload = makePayload(archetype);
    const { projection: truth, mode } = resolveTruthProjection(payload);

    expect(mode).toBe('sale_recompute');
    expect(truth).toBeTruthy();
    expect(truth.sale_mode).toBe(true);
    expect(truth.payback_years).toBe(archetype.dev_exit_year); // 4, not 10
  });

  it('truth IRR/MOIC differ from a naive hold generateProjection(scenario)', () => {
    const payload = makePayload(archetype);
    const { projection: truth } = resolveTruthProjection(payload);

    // The OLD (buggy) behaviour: generateProjection on the post-archetype scenario.
    const holdProjection = generateProjection(payload.scenario);

    // The whole point: the two are NOT the same model. The sale exits at year 4
    // with one-time proceeds; the hold runs the colo P&L to year 10. They must
    // not coincide on the headline returns.
    expect(holdProjection.sale_mode).not.toBe(true);
    // payback diverges (sale=4 vs hold horizon → null/other).
    expect(truth.payback_years).not.toBe(holdProjection.payback_years);
    // IRR diverges (different cash-flow shape entirely). The chosen BASE_SCENARIO
    // makes BOTH IRRs solvable finite numbers, so this assertion is non-vacuous.
    expect(typeof truth.irr).toBe('number');
    expect(typeof holdProjection.irr).toBe('number');
    expect(Math.abs(truth.irr - holdProjection.irr)).toBeGreaterThan(0.005);
  });

  it('truth equals the on-screen projection (deterministic — same code path as /simulate)', () => {
    const payload = makePayload(archetype);
    const { projection: truth } = resolveTruthProjection(payload);
    // payload.projection IS what the screen showed (from projectArchetype at /simulate).
    // The resolver recomputes via the same function → identical headline numbers.
    expect(truth.sale_mode).toBe(payload.projection.sale_mode);
    expect(truth.payback_years).toBe(payload.projection.payback_years);
    expect(truth.irr).toBeCloseTo(payload.projection.irr, 10);
    expect(truth.terminal_value).toBeCloseTo(payload.projection.terminal_value, 4);
    if (truth.moic != null && payload.projection.moic != null) {
      expect(truth.moic).toBeCloseTo(payload.projection.moic, 10);
    }
  });
});

describe('resolveTruthProjection — SALE fallback (archetype not resolvable server-side)', () => {
  it('reuses payload.projection (sale_mode) instead of recomputing a hold', () => {
    const archetype = ID_TO_ARCHETYPE.sale_leaseback;
    const base = makePayload(archetype);
    // Simulate a payload where the archetype id is missing/unknown but the
    // projection IS a sale (e.g. an older client snapshot).
    const payload = {
      ...base,
      archetype_outcome: { id: 'unknown_archetype_xyz' },
    };
    const { projection: truth, mode } = resolveTruthProjection(payload);
    expect(mode).toBe('sale_fallback');
    expect(truth).toBe(payload.projection); // reused verbatim, no hold substitution
    expect(truth.sale_mode).toBe(true);
    expect(truth.payback_years).toBe(archetype.dev_exit_year);
  });
});

describe('resolveTruthProjection — STANDARD path (non-sale archetypes unchanged)', () => {
  it('powered_shell recomputes via generateProjection (NOT sale_mode)', () => {
    const archetype = ID_TO_ARCHETYPE.powered_shell;
    const payload = makePayload(archetype);
    const { projection: truth, mode } = resolveTruthProjection(payload);

    expect(mode).toBe('standard_recompute');
    expect(truth).toBeTruthy();
    expect(truth.sale_mode).not.toBe(true);
    expect(truth.years?.length).toBeGreaterThan(0);

    // It must match a plain generateProjection on the post-archetype scenario
    // (this is the pre-existing, correct behaviour — proving we did NOT change it).
    const reference = generateProjection(payload.scenario);
    expect(truth.payback_years).toBe(reference.payback_years);
    if (truth.irr != null && reference.irr != null) {
      expect(truth.irr).toBeCloseTo(reference.irr, 10);
    }
  });

  it('sovereign_ai (recurring_revenue) stays on the hold recompute path', () => {
    const archetype = ID_TO_ARCHETYPE.sovereign_ai;
    const payload = makePayload(archetype);
    const { projection: truth, mode } = resolveTruthProjection(payload);
    expect(mode).toBe('standard_recompute');
    expect(truth.sale_mode).not.toBe(true);
    expect(truth.years?.length).toBeGreaterThan(0);
  });
});
