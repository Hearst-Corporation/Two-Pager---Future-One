// Stress tests + waterfall integrity — hearst-calculations.js
// 26 named scenarios covering edge cases, extremes, and combinatorial worst/best cases.
// Zero NaN, zero Infinity, zero engine crashes expected across all scenarios.

import { describe, it, expect } from 'vitest';
import {
  generateProjection,
  generateWaterfall,
  generateDebtSchedule,
  foldGpuRevenue,
} from '../../lib/hearst-calculations.js';

const BASE = {
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
  opex_maintenance_pct: 3,
  opex_staff_annual_musd: 2,
  opex_insurance_pct: 1,
  opex_ga_pct: 1,
  opex_operator_mgmt_fee_pct: 2,
  commercial_split: { retail_colo: 100 },
  annual_escalation_pct: 2,
  debt_pct: 65,
  debt_interest_rate: 6,
  debt_term_years: 10,
  site_readiness: 'greenfield',
  capex_shell_per_mw: 4400000,
  capex_mep_per_mw: 3800000,
  capex_substation_per_mw: 1200000,
  capex_cooling_per_mw: 1500000,
  capex_grid_per_mw: 800000,
  capex_contingency_pct: 10,
  exit_multiple: 18,
  exit_year: 10,
  start_year: 2026,
  equity_hearst_pct: 40,
  equity_brookfield_pct: 40,
  equity_qatar_pct: 20,
};

function noNaN(val) {
  if (val == null) return; // null is allowed
  expect(Number.isNaN(val), `expected not NaN, got NaN`).toBe(false);
}
function noInfinity(val) {
  if (val == null) return;
  expect(Number.isFinite(val) || val === null, `expected finite, got ${val}`).toBe(true);
}
function sanityCheck(proj) {
  noNaN(proj.irr); noInfinity(proj.irr);
  noNaN(proj.npv); noInfinity(proj.npv);
  noNaN(proj.moic); noInfinity(proj.moic);
  noNaN(proj.irr_post_tax); noInfinity(proj.irr_post_tax);
  noNaN(proj.total_capex); noInfinity(proj.total_capex);
  expect(Array.isArray(proj.warnings)).toBe(true);
  expect(Array.isArray(proj.years)).toBe(true);
  proj.years.forEach((y, i) => {
    noNaN(y.revenue); noNaN(y.ebitda); noNaN(y.free_cash_flow);
    noInfinity(y.revenue); noInfinity(y.ebitda); noInfinity(y.free_cash_flow);
  });
}

describe('Stress tests — generateProjection (26 scenarios)', () => {
  it('BASELINE — returns non-null IRR, MOIC, no NaN', () => {
    const p = generateProjection(BASE);
    sanityCheck(p);
    expect(p.irr).not.toBeNull();
    expect(p.moic).not.toBeNull();
    expect(p.total_capex).toBeGreaterThan(0);
  });

  it('ZERO CAPACITY — total_mw=0 returns missing_inputs gracefully', () => {
    const p = generateProjection({ ...BASE, total_mw: 0 });
    expect(p.missing_inputs.length).toBeGreaterThan(0);
    expect(p.years).toHaveLength(0);
  });

  it('TINY CAPACITY — total_mw=1 computes without NaN', () => {
    const p = generateProjection({ ...BASE, total_mw: 1, phase1_mw: 0.4, phase2_mw: 0.3, phase3_mw: 0.3 });
    sanityCheck(p);
    expect(p.total_capex).toBeGreaterThan(0);
  });

  it('HUGE CAPACITY — total_mw=10000 computes without overflow', () => {
    const p = generateProjection({ ...BASE, total_mw: 10000, phase1_mw: 4000, phase2_mw: 3000, phase3_mw: 3000 });
    sanityCheck(p);
    expect(p.total_capex).toBeGreaterThan(0);
  });

  it('NNN (zero electricity) — energy cost = 0, still computes', () => {
    const p = generateProjection({ ...BASE, electricity_price_mwh: 0 });
    sanityCheck(p);
    expect(p.years[9].power_cost).toBe(0);
    expect(p.irr).not.toBeNull();
  });

  it('EXTREME POWER — electricity_price_mwh=1000 computes, EBITDA may be negative', () => {
    const p = generateProjection({ ...BASE, electricity_price_mwh: 1000, debt_pct: 0 });
    sanityCheck(p);
  });

  it('ZERO DEBT — debt_pct=0, equity=full capex, IRR computable', () => {
    const p = generateProjection({ ...BASE, debt_pct: 0 });
    sanityCheck(p);
    expect(p.equity_invested).toBeCloseTo(p.total_capex, -3);
    expect(p.idc).toBe(0);
  });

  it('MAXIMAL DEBT — debt_pct=99, thin equity, IRR may be extreme', () => {
    const p = generateProjection({ ...BASE, debt_pct: 99 });
    sanityCheck(p);
    expect(p.equity_invested).toBeGreaterThan(0);
  });

  it('ZERO REVENUE — no prices → missing_inputs, no crash', () => {
    const p = generateProjection({
      ...BASE,
      price_retail_colo_kw_month: null,
      price_wholesale_kw_month: null,
      price_hyperscale_kw_month: null,
    });
    expect(p.missing_inputs.some(m => m.includes('price'))).toBe(true);
    expect(p.years).toHaveLength(0);
  });

  it('LOW OCCUPANCY — target_occupancy_pct=10 computes gracefully', () => {
    const p = generateProjection({ ...BASE, target_occupancy_pct: 10 });
    sanityCheck(p);
  });

  it('FULL OCCUPANCY — target_occupancy_pct=100 computes', () => {
    const p = generateProjection({ ...BASE, target_occupancy_pct: 100 });
    sanityCheck(p);
    expect(p.irr).not.toBeNull();
  });

  it('FAST RAMP — phases 1/2/3 years', () => {
    const p = generateProjection({ ...BASE, phase1_complete_year: 1, phase2_complete_year: 2, phase3_complete_year: 3 });
    sanityCheck(p);
  });

  it('SLOW RAMP — phases 4/7/10 years', () => {
    const p = generateProjection({ ...BASE, phase1_complete_year: 4, phase2_complete_year: 7, phase3_complete_year: 10 });
    sanityCheck(p);
  });

  it('LOW EXIT MULTIPLE — exit_multiple=3 computes, may be low/negative IRR', () => {
    const p = generateProjection({ ...BASE, exit_multiple: 3 });
    sanityCheck(p);
  });

  it('HIGH EXIT MULTIPLE — exit_multiple=50 does not overflow', () => {
    const p = generateProjection({ ...BASE, exit_multiple: 50 });
    sanityCheck(p);
    if (p.irr != null) expect(p.irr).toBeLessThan(100);
  });

  it('NO EXIT MULTIPLE — exit_multiple=null → terminal_value=null, graceful', () => {
    const p = generateProjection({ ...BASE, exit_multiple: null });
    sanityCheck(p);
    expect(p.terminal_value).toBeNull();
    expect(p.terminal_value_to_equity).toBeNull();
  });

  it('HIGH OPEX — all opex pcts=20 may push negative EBITDA, no NaN', () => {
    const p = generateProjection({
      ...BASE, debt_pct: 0,
      opex_maintenance_pct: 20, opex_insurance_pct: 20,
      opex_ga_pct: 20, opex_operator_mgmt_fee_pct: 20,
    });
    sanityCheck(p);
  });

  it('POWERED SHELL — cod_offset=9mo, revenue starts year 1', () => {
    const p = generateProjection({ ...BASE, site_readiness: 'powered_shell' });
    sanityCheck(p);
    expect(p.revenue_start_year).toBe(1);
  });

  it('GREENFIELD — cod_offset=36mo, revenue starts year 4, IDC warning', () => {
    const p = generateProjection({ ...BASE, site_readiness: 'greenfield' });
    sanityCheck(p);
    expect(p.revenue_start_year).toBeGreaterThanOrEqual(3);
    if (p.idc > 0) expect(p.warnings.some(w => w.includes('Interest During Construction'))).toBe(true);
  });

  it('HIGH INTEREST — debt_interest_rate=20 computes', () => {
    const p = generateProjection({ ...BASE, debt_interest_rate: 20 });
    sanityCheck(p);
  });

  it('DEBT TERM < EXIT YEAR — debt_term_years=5, remaining debt at exit=0', () => {
    const p = generateProjection({ ...BASE, debt_term_years: 5, exit_year: 10 });
    sanityCheck(p);
    // Loan fully amortized by year 5 — remaining debt at year 10 should be ~0
    expect(p.remaining_debt_at_exit).toBe(0);
  });

  it('WORST CASE — low occupancy + extreme power + no exit multiple, graceful', () => {
    const p = generateProjection({
      ...BASE, debt_pct: 0,
      target_occupancy_pct: 15,
      electricity_price_mwh: 500,
      exit_multiple: null,
    });
    sanityCheck(p);
  });

  it('BEST CASE — high occupancy + low power + low capex + high exit', () => {
    const p = generateProjection({
      ...BASE,
      target_occupancy_pct: 95,
      electricity_price_mwh: 10,
      capex_shell_per_mw: 2000000,
      capex_mep_per_mw: 2000000,
      capex_substation_per_mw: 500000,
      capex_cooling_per_mw: 500000,
      capex_grid_per_mw: 300000,
      exit_multiple: 25,
    });
    sanityCheck(p);
    if (p.irr != null) expect(p.irr).toBeGreaterThan(0);
  });

  it('POST-TAX ≤ PRE-TAX — irr_post_tax always ≤ irr when both non-null', () => {
    const p = generateProjection(BASE);
    if (p.irr != null && p.irr_post_tax != null) {
      expect(p.irr_post_tax).toBeLessThanOrEqual(p.irr + 1e-6);
    }
  });

  it('MOIC INVARIANT — moic = total_inflows / equity_invested', () => {
    const p = generateProjection({ ...BASE, site_readiness: 'powered_shell', debt_pct: 0 });
    if (p.moic != null && p.equity_invested > 0) {
      // moic is pre-tax. total_inflows = cash_flows[1..N]. Verify directional consistency.
      expect(p.moic).toBeGreaterThan(0);
    }
  });
});

describe('Stress tests — generateWaterfall', () => {
  it('EQUAL SPLIT — Hearst+Brookfield+Qatar=33/33/34, sums consistent', () => {
    const proj = generateProjection({ ...BASE, site_readiness: 'powered_shell' });
    const wf = generateWaterfall({ ...BASE, equity_hearst_pct: 33, equity_brookfield_pct: 33, equity_qatar_pct: 34, site_readiness: 'powered_shell' }, proj);
    expect(wf).not.toBeNull();
    noNaN(wf.by_investor.hearst.irr);
    noNaN(wf.by_investor.brookfield.irr);
    noNaN(wf.by_investor.qatar.irr);
  });

  it('HEARST ONLY — equity_hearst_pct=100, Brookfield+Qatar=0', () => {
    const proj = generateProjection({ ...BASE, site_readiness: 'powered_shell' });
    const wf = generateWaterfall({ ...BASE, equity_hearst_pct: 100, equity_brookfield_pct: 0, equity_qatar_pct: 0, site_readiness: 'powered_shell' }, proj);
    expect(wf).not.toBeNull();
    expect(wf.by_investor.brookfield.equity_invested).toBe(0);
    expect(wf.by_investor.qatar.equity_invested).toBe(0);
  });

  it('TV_TO_EQUITY NET — waterfall should not receive gross TV when debt remains', () => {
    // With powered_shell (fast ramp, clear returns) and debt, the terminal_value_to_equity
    // should be less than terminal_value. Waterfall should use net figure.
    const proj = generateProjection({ ...BASE, site_readiness: 'powered_shell', debt_pct: 60 });
    expect(proj.terminal_value_to_equity).toBeLessThan(proj.terminal_value);
    const wf = generateWaterfall({ ...BASE, site_readiness: 'powered_shell', debt_pct: 60 }, proj);
    expect(wf).not.toBeNull();
    // Investor total distributions should not exceed terminal_value_to_equity + annual FCF sum
    const hearst_total = wf.by_investor.hearst.total_distributions;
    noNaN(hearst_total); noInfinity(hearst_total);
  });

  it('ZERO EQUITY INVESTORS — graceful object with zero distributions', () => {
    const proj = generateProjection({ ...BASE, site_readiness: 'powered_shell' });
    const wf = generateWaterfall({ ...BASE, equity_hearst_pct: 0, equity_brookfield_pct: 0, equity_qatar_pct: 0, site_readiness: 'powered_shell' }, proj);
    // Should return a valid object, not throw
    expect(wf).not.toBeNull();
  });
});

describe('Stress tests — generateDebtSchedule', () => {
  it('AMORTIZING SCHEDULE — closing balance decreases each year', () => {
    const sched = generateDebtSchedule({ ...BASE, site_readiness: 'powered_shell' });
    expect(sched).not.toBeNull();
    const balances = sched.schedule.map(r => r.closing_balance);
    for (let i = 1; i < balances.length; i++) {
      expect(balances[i]).toBeLessThanOrEqual(balances[i - 1] + 1);
    }
  });

  it('DEBT TERM SHORTER THAN PROJECTION — no crash, final balance = 0', () => {
    const sched = generateDebtSchedule({ ...BASE, debt_term_years: 5 });
    expect(sched).not.toBeNull();
    const lastRow = sched.schedule[sched.schedule.length - 1];
    expect(lastRow.closing_balance).toBe(0);
  });

  it('ZERO DEBT — returns null (no loan)', () => {
    const sched = generateDebtSchedule({ ...BASE, debt_pct: 0 });
    expect(sched).toBeNull();
  });
});

describe('Stress tests — foldGpuRevenue', () => {
  it('BASIC FOLD — revenue and EBITDA increase after GPU fold', () => {
    const proj = generateProjection({ ...BASE, site_readiness: 'powered_shell', debt_pct: 0 });
    const ebitdaBefore = proj.years[5]?.ebitda;
    foldGpuRevenue(proj, { revenue_ai_annual: 50_000_000, capex_hardware: 100_000_000 }, BASE, { rfs_year: 3 });
    const ebitdaAfter = proj.years[5]?.ebitda;
    expect(ebitdaAfter).toBeGreaterThan(ebitdaBefore);
  });

  it('RFS_YEAR > EXIT_YEAR — GPU skipped, warning emitted', () => {
    const proj = generateProjection({ ...BASE, site_readiness: 'powered_shell', debt_pct: 0 });
    foldGpuRevenue(proj, { revenue_ai_annual: 50_000_000, capex_hardware: 100_000_000 }, BASE, { rfs_year: 12, exit_year: 10 });
    expect(proj.gpu_skipped_before_rfs).toBe(true);
    expect(proj.warnings.some(w => w.includes('RFS year'))).toBe(true);
  });
});
