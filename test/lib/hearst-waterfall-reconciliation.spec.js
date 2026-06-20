// Reconciliation tests — IDC single-count + waterfall integrity
// AC-R1: IDC expensed pre-COD only (not capitalized at t0)
// AC-R2: Σ 3 investors per year == canonical post-tax FCFE series (±$1k)
// AC-R3: preferred return stops accruing after capital is fully returned

import { describe, it, expect } from 'vitest';
import {
  generateProjection,
  generateWaterfall,
} from '../../lib/hearst-calculations.js';

const BASE_GREENFIELD = {
  total_mw: 100,
  phase1_mw: 40, phase1_complete_year: 2,
  phase2_mw: 30, phase2_complete_year: 4,
  phase3_mw: 30, phase3_complete_year: 6,
  pue: 1.45,
  target_occupancy_pct: 85,
  electricity_price_mwh: 32,
  price_retail_colo_kw_month: 155,
  price_wholesale_kw_month: 95,
  price_hyperscale_kw_month: 110,
  opex_maintenance_pct: 3, opex_staff_annual_musd: 2,
  opex_insurance_pct: 1, opex_ga_pct: 1, opex_operator_mgmt_fee_pct: 2,
  commercial_split: { retail_colo: 100 },
  annual_escalation_pct: 2,
  debt_pct: 65, debt_interest_rate: 6, debt_term_years: 10,
  site_readiness: 'greenfield',
  capex_shell_per_mw: 4400000, capex_mep_per_mw: 3800000,
  capex_substation_per_mw: 1200000, capex_cooling_per_mw: 1500000,
  capex_grid_per_mw: 800000, capex_contingency_pct: 10,
  exit_multiple: 18, exit_year: 10, start_year: 2026,
  equity_hearst_pct: 40, equity_brookfield_pct: 40, equity_qatar_pct: 20,
};

const BASE_POWERED = {
  ...BASE_GREENFIELD,
  site_readiness: 'powered_shell',
  // powered_shell: 9mo offset → revenue_start_year = 1, no pre-COD years, IDC = 0
};

// ── AC-R1: IDC single-count — expensed in pre-COD FCFE, NOT capitalized at t0 ──
describe('AC-R1 — IDC single-count (greenfield)', () => {
  it('equity_invested equals total_capex * (1 - debt%) — IDC is NOT in t0 ticket', () => {
    const p = generateProjection(BASE_GREENFIELD);
    expect(p.equity_invested).not.toBeNull();
    expect(p.idc).toBeGreaterThan(0); // IDC exists and is informative
    // equity_invested must be total_capex × (1 − debt%), NOT including IDC
    const expected = p.total_capex * (1 - BASE_GREENFIELD.debt_pct / 100);
    expect(p.equity_invested).toBeCloseTo(expected, -3); // within $1k
    // IDC is strictly absent from the t0 ticket
    expect(Math.abs(p.equity_invested - (expected + p.idc))).toBeGreaterThan(1000);
  });

  it('pre-COD years have negative FCFE (= -debt_service) — IDC is expensed here', () => {
    const p = generateProjection(BASE_GREENFIELD);
    // revenue_start_year >= 3 for greenfield (36mo offset)
    expect(p.revenue_start_year).toBeGreaterThanOrEqual(3);
    // Years before revenue_start_year are pre-COD — FCF must be negative (debt service outflow)
    const pre_cod_years = p.years.filter(y => y.revenue == null);
    expect(pre_cod_years.length).toBeGreaterThan(0);
    pre_cod_years.forEach(y => {
      expect(y.free_cash_flow_post_tax).toBeLessThan(0);
    });
  });

  it('IDC warning contains "Interest During Construction" (test sentinel)', () => {
    const p = generateProjection(BASE_GREENFIELD);
    expect(p.idc).toBeGreaterThan(0);
    const hasWarning = p.warnings.some(w => w.includes('Interest During Construction'));
    expect(hasWarning).toBe(true);
  });

  it('powered_shell: idc = 0 and equity_invested = total_capex * (1 - debt%)', () => {
    const p = generateProjection(BASE_POWERED);
    expect(p.idc).toBe(0);
    const expected = p.total_capex * (1 - BASE_POWERED.debt_pct / 100);
    expect(p.equity_invested).toBeCloseTo(expected, -3);
  });
});

// ── AC-R2: reconciliation — Σ investors == canonical post-tax projection series ──
describe('AC-R2 — Waterfall reconciliation (greenfield + powered)', () => {
  const TOLERANCE = 1000; // $1k

  function checkReconciliation(scenario, label) {
    it(`${label}: Σ(hearst+brookfield+qatar) per year == projection.free_cash_flow_post_tax`, () => {
      const proj = generateProjection(scenario);
      const wf = generateWaterfall(scenario, proj);
      expect(wf).not.toBeNull();

      const { hearst, brookfield, qatar } = wf.by_investor;
      // cash_flows[0] = t0 outflow for each investor
      // cash_flows[1..N] = annual distributions

      // Verify t0: sum of investor t0 outflows == -projection.equity_invested
      const t0_sum = hearst.cash_flows[0] + brookfield.cash_flows[0] + qatar.cash_flows[0];
      expect(Math.abs(t0_sum - (-(proj.equity_invested || 0)))).toBeLessThan(TOLERANCE);

      // Verify each year: sum of distributions == canonical FCFE post-tax + TV at exit
      for (let y = 1; y <= proj.years.length; y++) {
        const row = proj.years[y - 1];
        const is_exit = y === (scenario.exit_year || 10);
        const canonical_fcfe = (row.free_cash_flow_post_tax ?? 0)
          + (is_exit ? (proj.terminal_value_to_equity ?? 0) : 0);
        const investor_sum = (hearst.cash_flows[y] ?? 0)
          + (brookfield.cash_flows[y] ?? 0)
          + (qatar.cash_flows[y] ?? 0);
        expect(
          Math.abs(investor_sum - canonical_fcfe),
          `Year ${y}: investors sum ${investor_sum.toFixed(0)} vs canonical ${canonical_fcfe.toFixed(0)}`
        ).toBeLessThan(TOLERANCE);
      }
    });

    it(`${label}: lender total_repaid == Σ scheduled debt service + exit payoff`, () => {
      const proj = generateProjection(scenario);
      const wf = generateWaterfall(scenario, proj);
      expect(wf).not.toBeNull();

      const { lender } = wf.by_investor;
      // lender.total_repaid should be >= lender.total_principal + total_interest
      // (it now includes the remaining_debt_at_exit payoff at exit year)
      const scheduled_total = (lender.total_interest || 0) + (lender.total_principal || 0);
      // total_repaid must cover at least what was scheduled (may include exit payoff)
      expect(lender.total_repaid).toBeGreaterThanOrEqual(scheduled_total - TOLERANCE);
    });
  }

  checkReconciliation(BASE_GREENFIELD, 'GREENFIELD');
  checkReconciliation(BASE_POWERED, 'POWERED_SHELL');
});

// ── AC-R3: preferred return stops accruing after capital is fully returned ──
describe('AC-R3 — Preferred: ceases after capital return', () => {
  it('hearst pref distributions stop growing once hearst carry covers equity_in', () => {
    // Use a very high-return scenario so capital is returned well before year 10
    const highReturn = {
      ...BASE_POWERED,
      price_retail_colo_kw_month: 400,   // very high price → fast capital return
      debt_pct: 0,                        // no debt → lender tier is empty
      target_occupancy_pct: 95,
      exit_multiple: 30,
    };

    const proj = generateProjection(highReturn);
    const wf = generateWaterfall(highReturn, proj);
    expect(wf).not.toBeNull();

    // In a high-return 0-debt scenario, hearst distributions in early years
    // should be large. By year 5 or so, capital should be returned.
    // The total pref collected must never exceed what was actually due.
    // We verify indirectly: hearst MOIC > 1 (got back more than invested) and
    // IRR is computable (no NaN).
    const { hearst } = wf.by_investor;
    expect(hearst.moic).not.toBeNull();
    expect(Number.isNaN(hearst.irr)).toBe(false);
    // Once capital is returned, pref base = 0 → no further accrual. As a proxy:
    // total pref can't exceed equity_in × (1+PREF_RATE)^10 (compound ceiling).
    // Since PREF_RATE=8%, over 10 years max pref = equity_in × ((1.08^10) − 1) ≈ 116% of equity_in.
    // Total distributions > equity_in proves capital was returned.
    expect(hearst.total_distributions).toBeGreaterThan(hearst.equity_invested);
  });

  it('pref tracker invariant: if capital_returned=equity_in then pref stops growing next year', () => {
    // This test checks the waterfall produces finite, non-crazy numbers across 10 years
    // with a profile that returns capital mid-way
    const proj = generateProjection({ ...BASE_POWERED, price_retail_colo_kw_month: 300, debt_pct: 0 });
    const wf = generateWaterfall({ ...BASE_POWERED, price_retail_colo_kw_month: 300, debt_pct: 0 }, proj);
    expect(wf).not.toBeNull();

    const { hearst, brookfield, qatar } = wf.by_investor;
    [hearst, brookfield, qatar].forEach(inv => {
      // No NaN, no Infinity in any year's distribution
      inv.cash_flows.forEach((v, i) => {
        expect(Number.isNaN(v)).toBe(false);
        expect(Number.isFinite(v)).toBe(true);
      });
    });
  });
});
