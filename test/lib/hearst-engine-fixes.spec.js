// Unit tests for the A1..A8 financial-correctness fixes in lib/hearst-calculations.js
// and lib/hearst-deal-structures.js (+ TAX_DEFAULTS in lib/hearst-constants.js).
//
// Each describe block cites the fix it pins. Reference numerics were captured against
// the live engine after the fix landed — if the formula changes, update the doc first.

import { describe, it, expect } from 'vitest';
import {
  generateProjection,
  foldGpuRevenue,
  generateWaterfall,
  generateDebtSchedule,
} from '@/lib/hearst-calculations.js';
import { DEAL_ARCHETYPES, projectArchetype } from '@/lib/hearst-deal-structures.js';
import { TAX_DEFAULTS } from '@/lib/hearst-constants.js';

// A complete, valid 50MW Qatar scenario (mirrors the archetypes/solver specs).
const BASE = {
  total_mw: 50, pue: 1.45, target_occupancy_pct: 85, electricity_price_mwh: 32,
  capex_shell_per_mw: 4_400_000, capex_mep_per_mw: 3_800_000, capex_substation_per_mw: 1_200_000,
  capex_cooling_per_mw: 1_500_000, capex_grid_per_mw: 0, capex_land_per_mw: 0, capex_contingency_pct: 10,
  price_hyperscale_kw_month: 115, annual_escalation_pct: 2,
  debt_pct: 60, debt_interest_rate: 6.5, debt_term_years: 12,
  exit_multiple: 16, exit_year: 10, start_year: 2026,
  commercial_split: { hyperscale_lease: 100 },
  opex_maintenance_pct: 4, opex_insurance_pct: 1.5, opex_ga_pct: 3,
  opex_operator_mgmt_fee_pct: 5, opex_staff_annual_musd: 8,
};

const GREENFIELD = { ...BASE, site_readiness: 'greenfield' }; // 36mo COD → idc > 0, rev_start = 4
const EQUITY_SPLIT = { ...BASE, equity_hearst_pct: 51, equity_brookfield_pct: 29, equity_qatar_pct: 20 };

// ── A3 constant ────────────────────────────────────────────────────────────
describe('A3 — TAX_DEFAULTS.capital_gains_rate_pct', () => {
  it('exposes Qatar 10% capital-gains rate in pure-percent convention (0..100)', () => {
    // A3: Qatar Law 24/2018 — 10% on disposition gain.
    expect(TAX_DEFAULTS.capital_gains_rate_pct).toBe(10);
  });
});

// ── A4 depreciation + book value ─────────────────────────────────────────────
describe('A4 — depreciation tracked without truncation; book_value_at_exit exposed', () => {
  it('generateProjection: Σ depreciation booked + book_value_at_exit === total_capex', () => {
    // A4: straight-line over 10 yr, min(annual, remaining) per operating year.
    const p = generateProjection(BASE);
    const sumDepr = p.years.reduce((s, y) => s + (y.depreciation || 0), 0);
    expect(p.book_value_at_exit).toBeGreaterThanOrEqual(0);
    expect(sumDepr + p.book_value_at_exit).toBeCloseTo(p.total_capex, 0);
  });

  it('generateProjection: pre-COD years book zero depreciation (operating false)', () => {
    // A4 + A8: greenfield has rev_start = 4, so years 1-3 are pre-COD (no D&A).
    const p = generateProjection(GREENFIELD);
    expect(p.revenue_start_year).toBe(4);
    expect(p.years[0].depreciation).toBe(0);
    expect(p.years[1].depreciation).toBe(0);
    expect(p.years[2].depreciation).toBe(0);
    expect(p.years[3].depreciation).toBeGreaterThan(0);
    // 7 operating years × annual_depreciation < total_capex → book value remains at exit.
    expect(p.book_value_at_exit).toBeGreaterThan(0);
  });

  it('foldGpuRevenue: Σ depreciation + book_value_at_exit === post-fold total_capex', () => {
    // A4: depreciation rebases on the post-fold basis (facility + GPU hardware).
    const folded = foldGpuRevenue(
      generateProjection(GREENFIELD),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      GREENFIELD,
      {},
    );
    const sumDepr = folded.years.reduce((s, y) => s + (y.depreciation || 0), 0);
    expect(sumDepr + folded.book_value_at_exit).toBeCloseTo(folded.total_capex, 0);
  });
});

// ── A3 exit capital-gains tax (post-tax flow only) ───────────────────────────
describe('A3 — exit capital-gains tax nets only the post-tax exit flow', () => {
  it('generateProjection: terminal_tax = max(0, TV − book_value_at_exit) × 10%', () => {
    // A3: gain taxed at TAX_DEFAULTS rate; exposed as terminal_tax.
    const p = generateProjection(BASE);
    const expectedTax = Math.max(0, (p.terminal_value || 0) - p.book_value_at_exit)
      * (TAX_DEFAULTS.capital_gains_rate_pct / 100);
    expect(p.terminal_tax).toBeCloseTo(expectedTax, 0);
  });

  it('generateProjection: irr_post_tax < irr and moic_post_tax < moic when a gain exists', () => {
    // A3: post-tax return strictly below pre-tax once the exit tax bites.
    const p = generateProjection(BASE);
    expect(p.terminal_tax).toBeGreaterThan(0);
    expect(p.irr_post_tax).toBeLessThan(p.irr);
    expect(p.moic_post_tax).toBeLessThan(p.moic);
  });

  it('foldGpuRevenue: exposes terminal_tax and irr_post_tax < irr (post-tax flow only)', () => {
    // A3: same pattern in the fold's post-tax cashflow path.
    const folded = foldGpuRevenue(
      generateProjection(GREENFIELD),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      GREENFIELD,
      {},
    );
    expect(folded.terminal_tax).toBeGreaterThan(0);
    expect(folded.irr_post_tax).toBeLessThan(folded.irr);
    expect(folded.moic_post_tax).toBeLessThan(folded.moic);
  });
});

// ── A1 IDC re-included in folded equity ──────────────────────────────────────
describe('A1 — folded equity_invested re-includes IDC', () => {
  it('equity_invested === facility_capex×(1−debtFrac) + gpu_capex×(1−debtFrac) + idc', () => {
    // A1: IDC was dropped pre-fix, understating t0 equity and inflating IRR/MOIC.
    const pre = generateProjection(GREENFIELD);
    expect(pre.idc).toBeGreaterThan(0);
    const debtFrac = GREENFIELD.debt_pct / 100;
    const gpu_capex = 100_000_000;
    const folded = foldGpuRevenue(
      generateProjection(GREENFIELD),
      { capex_hardware: gpu_capex, revenue_ai_annual: 50_000_000 },
      GREENFIELD,
      {},
    );
    const expected = pre.total_capex * (1 - debtFrac) + gpu_capex * (1 - debtFrac) + pre.idc;
    expect(folded.equity_invested).toBeCloseTo(expected, 0);
    expect(folded.idc).toBe(pre.idc); // projection.idc field preserved
  });
});

// ── A8 GPU-fold operating consistency ────────────────────────────────────────
describe('A8 — folded pre-COD years book no D&A / interest / fixed opex', () => {
  it('uses y.operating; pre-COD year carries zero depreciation and only variable opex', () => {
    // A8: operating = y.operating ?? (revenue>0). Greenfield rev_start=4 → y1 pre-COD.
    const folded = foldGpuRevenue(
      generateProjection(GREENFIELD),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      GREENFIELD,
      { rfs_year: 4 },
    );
    expect(folded.years[0].operating).toBe(false);
    expect(folded.years[0].depreciation).toBe(0);
    // No revenue + non-operating → no fixed staff opex booked pre-COD.
    expect(folded.years[0].opex).toBe(0);
    expect(folded.years[3].operating).toBe(true);
    expect(folded.years[3].depreciation).toBeGreaterThan(0);
  });
});

// ── A2 waterfall: CADS distribution + NET TV + balloon repayment ─────────────
describe('A2 — waterfall distributes on CADS, nets TV, repays the balloon', () => {
  it('(ii) waterfall terminal_value_to_equity === projection.terminal_value_to_equity (NET)', () => {
    // A2(ii): equity gets the NET TV (after remaining debt), not gross.
    const p = generateProjection(EQUITY_SPLIT);
    const wf = generateWaterfall(EQUITY_SPLIT, p);
    expect(wf.summary.terminal_value_to_equity).toBeCloseTo(p.terminal_value_to_equity, 0);
  });

  it('(iii) no debt is forgiven: principal amortized in window + balloon === original principal', () => {
    // A2(iii): debt_term_years (20) > exit_year (10) → a balloon is retired at exit.
    const scenario = { ...EQUITY_SPLIT, debt_pct: 30, debt_interest_rate: 5, debt_term_years: 20 };
    const p = generateProjection(scenario);
    const wf = generateWaterfall(scenario, p);
    const L = wf.by_investor.lender;
    const originalPrincipal = p.total_capex * (scenario.debt_pct / 100);
    expect(L.balloon_repaid_at_exit).toBeGreaterThan(0);
    expect(L.total_principal_incl_balloon).toBeCloseTo(originalPrincipal, 0);
  });

  it('(iii) when every year fully services debt: total_repaid ≈ interest_in_window + principal incl. balloon', () => {
    // A2(iii): with no DSCR breach, lender receives exactly scheduled interest + full principal.
    // High occupancy + NNN (tenant pays power) + modest 30% leverage → CADS covers debt
    // service in every year, so the lender is never shorted.
    const scenario = {
      ...EQUITY_SPLIT, electricity_price_mwh: 0, site_readiness: 'operational',
      target_occupancy_pct: 95,
      capex_shell_per_mw: 3_000_000, capex_mep_per_mw: 2_000_000,
      capex_substation_per_mw: 600_000, capex_cooling_per_mw: 400_000,
      price_hyperscale_kw_month: 300, annual_escalation_pct: 3,
      debt_pct: 30, debt_interest_rate: 5, debt_term_years: 20,
      opex_maintenance_pct: 2, opex_insurance_pct: 0.5, opex_ga_pct: 1,
      opex_operator_mgmt_fee_pct: 0, opex_staff_annual_musd: 1,
    };
    const p = generateProjection(scenario);
    // Sanity: this scenario fully covers debt every year (no breach).
    expect(p.years.every(y => y.dscr == null || y.dscr >= 1)).toBe(true);
    const wf = generateWaterfall(scenario, p);
    const L = wf.by_investor.lender;
    // Tolerance of a few dollars: the exposed fields are individually rounded to whole
    // dollars, so the sum can differ from total_repaid by ±$1-2 of rounding noise.
    expect(Math.abs(L.total_repaid - (L.total_interest_in_window + L.total_principal_incl_balloon))).toBeLessThan(5);
  });

  it('(i) distributes equity on CADS (EBITDA − maintenance capex), not raw EBITDA', () => {
    // A2(i): equity carry shrinks relative to a raw-EBITDA basis because maintenance
    // capex is netted before the waterfall. Verified by reproducing the CADS basis.
    const p = generateProjection(EQUITY_SPLIT);
    const wf = generateWaterfall(EQUITY_SPLIT, p);
    // The summary still reports gross terminal_value (display), but the equity flows
    // derive from CADS — total equity distributions must not exceed CADS + NET TV.
    const totalCads = p.years.reduce((s, y) => s + ((y.ebitda ?? 0) - (y.maintenance_capex ?? 0)), 0);
    const equityDist =
      wf.by_investor.hearst.total_distributions +
      wf.by_investor.brookfield.total_distributions +
      wf.by_investor.qatar.total_distributions;
    // Equity can never receive more than residual CADS after debt + the NET terminal value.
    expect(equityDist).toBeLessThanOrEqual(totalCads + wf.summary.terminal_value_to_equity + 1);
  });
});

// ── A5 debt schedule DSCR uses CADS when provided ────────────────────────────
describe('A5 — generateDebtSchedule DSCR uses cads_by_year when provided', () => {
  it('CADS-based DSCR ≤ EBITDA-based DSCR (maintenance capex reduces coverage)', () => {
    // A5: cads_by_year overrides ebitda_by_year for DSCR; backward-compatible fallback.
    const p = generateProjection(EQUITY_SPLIT);
    const ebitda_by_year = p.years.map(y => y.ebitda ?? 0);
    const cads_by_year = p.years.map(y => (y.ebitda ?? 0) - (y.maintenance_capex ?? 0));
    const dsEbitda = generateDebtSchedule(EQUITY_SPLIT, { ebitda_by_year });
    const dsCads = generateDebtSchedule(EQUITY_SPLIT, { ebitda_by_year, cads_by_year });
    const yr = 9; // a stabilized year with positive maintenance capex
    expect(dsCads.schedule[yr].dscr).toBeLessThanOrEqual(dsEbitda.schedule[yr].dscr);
  });

  it('falls back to ebitda_by_year when cads_by_year is absent (backward compatible)', () => {
    // A5: omitting cads_by_year reproduces the legacy EBITDA-based DSCR exactly.
    const p = generateProjection(EQUITY_SPLIT);
    const ebitda_by_year = p.years.map(y => y.ebitda ?? 0);
    const ds = generateDebtSchedule(EQUITY_SPLIT, { ebitda_by_year });
    const yr = 9;
    expect(ds.schedule[yr].dscr).toBeCloseTo(
      (ebitda_by_year[yr]) / ds.schedule[yr].total_service, 2);
  });
});

// ── A6 one_time_sale MOIC on net interim basis ───────────────────────────────
describe('A6 — sale_leaseback MOIC === sum(equity_cash_flows[1..]) / equity_invested', () => {
  const slb = DEAL_ARCHETYPES.find(a => a.id === 'sale_leaseback');

  it('debt-free sale: MOIC === sale_proceeds_net / equity_invested (no interim outflows)', () => {
    // A6: with no debt, equity_cash_flows[1..] = just the final sale proceeds.
    const r = projectArchetype({ ...BASE, debt_pct: 0 }, slb);
    expect(r.projection.moic).toBeCloseTo(
      r.projection.sale_proceeds_net / r.projection.equity_invested, 6);
  });

  it('levered sale: MOIC reflects interim debt drag (below the gross sale_net / equity ratio)', () => {
    // A6: the old numerator credited gross sale proceeds and ignored interim debt
    // service. New numerator nets interim outflows → strictly lower MOIC.
    const r = projectArchetype({ ...BASE, debt_pct: 60, debt_interest_rate: 6.5, debt_term_years: 12 }, slb);
    const grossBasis = r.projection.sale_proceeds_net / r.projection.equity_invested;
    expect(r.projection.moic).toBeLessThan(grossBasis);
    // Display fields preserved for the UI.
    expect(r.projection.sale_proceeds_net).toBeGreaterThan(0);
    expect(r.projection.tax_owed).toBeGreaterThanOrEqual(0);
  });
});

// ── A7 sensitivity grid uses post-tax IRR ────────────────────────────────────
describe('A7 — generateSensitivity baseline & cells use post-tax IRR', () => {
  it('baseline irr === generateProjection(scenario).irr_post_tax', async () => {
    // A7: import generateSensitivity lazily (same module).
    const { generateSensitivity } = await import('@/lib/hearst-calculations.js');
    const grid = generateSensitivity(BASE, 'exit_multiple', 'target_occupancy_pct', 3);
    const proj = generateProjection(BASE);
    expect(grid.baseline.irr).toBeCloseTo(proj.irr_post_tax, 6);
    // And it is the POST-tax (not pre-tax) number when a gain exists.
    expect(grid.baseline.irr).toBeLessThan(proj.irr);
  });
});

// ── P0-1 exit capital-gains basis = book value AT exit_year (not end-of-horizon) ─
describe('P0-1 — exit-tax basis tracks depreciation booked THROUGH exit_year', () => {
  it('exit_year=5 on a 10-yr-life asset → book_value_at_exit_basis ≈ 50% of total_capex', () => {
    // P0-1: the capital-gains basis is the undepreciated book value AT exit_year, not
    // the ≈0 end-of-horizon residual. After 5 of 10 straight-line years, half remains.
    const p = generateProjection({ ...BASE, exit_year: 5 });
    expect(p.book_value_at_exit_basis).toBeCloseTo(p.total_capex * 0.5, 0);
    // The end-of-horizon residual field stays ≈0 (A4 invariant unaffected).
    expect(p.book_value_at_exit).toBeCloseTo(0, 0);
  });

  it('exit_year=5: exit_tax ≈ 0 when terminal_value ≤ book_value_at_exit_basis (no phantom gain)', () => {
    // P0-1 CRIT: with the correct basis, an early exit at TV below the half-depreciated
    // book value yields NO taxable gain. The prior bug (residual ≈0 basis) taxed the
    // entire terminal value — a phantom gain.
    const p = generateProjection({ ...BASE, exit_year: 5 });
    expect(p.terminal_value).toBeLessThanOrEqual(p.book_value_at_exit_basis);
    expect(p.terminal_tax).toBeCloseTo(0, 6);
    // Sanity: the buggy residual-basis would have taxed ~10% of the whole TV (>$1M).
    const buggyTax = Math.max(0, (p.terminal_value || 0) - p.book_value_at_exit)
      * (TAX_DEFAULTS.capital_gains_rate_pct / 100);
    expect(buggyTax).toBeGreaterThan(1_000_000);
  });

  it('exit_year=10: behavior unchanged — basis ≈ end-of-horizon residual ≈ 0, exit tax positive', () => {
    // P0-1: at full horizon, depreciation-through-exit === total depreciation, so the
    // exit basis equals the residual (≈0) and the gain/tax match the prior behavior.
    const p = generateProjection({ ...BASE, exit_year: 10 });
    expect(p.book_value_at_exit_basis).toBeCloseTo(p.book_value_at_exit, 0);
    expect(p.book_value_at_exit_basis).toBeCloseTo(0, 0);
    expect(p.terminal_tax).toBeGreaterThan(0);
    const expectedTax = Math.max(0, (p.terminal_value || 0) - p.book_value_at_exit_basis)
      * (TAX_DEFAULTS.capital_gains_rate_pct / 100);
    expect(p.terminal_tax).toBeCloseTo(expectedTax, 0);
  });

  it('foldGpuRevenue: exit_year=5 → post-fold book_value_at_exit_basis ≈ 50% of post-fold total_capex', () => {
    // P0-1: same correction in the fold, on the post-fold (facility + GPU) basis.
    const folded = foldGpuRevenue(
      generateProjection({ ...BASE, exit_year: 5 }),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      { ...BASE, exit_year: 5 },
      { exit_year: 5 },
    );
    expect(folded.book_value_at_exit_basis).toBeCloseTo(folded.total_capex * 0.5, 0);
  });
});

// ── P0-2 folded post-tax MOIC must not double-count GPU equity ────────────────
describe('P0-2 — folded moic_post_tax === moic when there is no tax', () => {
  it('zero exit tax + zero operating tax → moic_post_tax === moic exactly (gap is tax only)', () => {
    // P0-2 CRIT: the only difference between pre- and post-tax MOIC must be tax, never
    // the −gpu_equity outflow. With no exit_multiple → terminal_value null → exit_tax 0,
    // and no income tax is modeled in operations, so the two MOICs must be identical.
    const NOEXIT = { ...BASE, exit_multiple: undefined };
    const folded = foldGpuRevenue(
      generateProjection(NOEXIT),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      NOEXIT,
      {},
    );
    expect(folded.terminal_tax).toBe(0);
    expect(folded.moic_post_tax).toBe(folded.moic);
  });

  it('with a real exit gain: moic_post_tax < moic, and the gap equals the exit tax / equity', () => {
    // P0-2: when tax IS present, the post-tax MOIC sits below the pre-tax MOIC by exactly
    // exit_tax / equity_invested (rounded) — i.e. the gap is the tax, not gpu_equity.
    const folded = foldGpuRevenue(
      generateProjection(BASE),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      BASE,
      {},
    );
    expect(folded.terminal_tax).toBeGreaterThan(0);
    expect(folded.moic_post_tax).toBeLessThan(folded.moic);
    const expectedGap = folded.terminal_tax / folded.equity_invested;
    expect(folded.moic - folded.moic_post_tax).toBeCloseTo(expectedGap, 1);
  });
});

// ── P0-3a per-year post-tax FCFE row field ───────────────────────────────────
describe('P0-3a — every year row carries free_cash_flow_post_tax === FCFE − cash_taxes', () => {
  it('generateProjection: row.free_cash_flow_post_tax === free_cash_flow (no operating tax)', () => {
    // P0-3a: the engine builds a post-tax cashflow ARRAY but previously never set a
    // per-year ROW field, so the memo snapshot could not show post-tax FCFE.
    const p = generateProjection(BASE);
    for (const y of p.years) {
      expect(typeof y.free_cash_flow_post_tax).toBe('number');
      expect(y.free_cash_flow_post_tax).toBeCloseTo(y.free_cash_flow ?? 0, 6);
    }
  });

  it('foldGpuRevenue: row.free_cash_flow_post_tax === free_cash_flow − cash_taxes', () => {
    // P0-3a: mirror the array build — cash_taxes is 0 in operations, so the post-tax
    // FCFE equals free_cash_flow, but the field MUST exist on every row.
    const folded = foldGpuRevenue(
      generateProjection(BASE),
      { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 },
      BASE,
      {},
    );
    for (const y of folded.years) {
      expect(typeof y.free_cash_flow_post_tax).toBe('number');
      expect(y.free_cash_flow_post_tax).toBeCloseTo((y.free_cash_flow ?? 0) - (y.cash_taxes ?? 0), 6);
    }
  });
});

// ── P2-4 zero-debt waterfall lender flow never negative ──────────────────────
describe('P2-4 — generateWaterfall: with no debt the lender receives 0, never negative', () => {
  it('zero-debt, loss years present → all lender flows ≥ 0', () => {
    // P2-4: the old min(fcf_pre_debt, debt_service) pushed negative numbers to the
    // lender in loss years when debt_service was 0. Greenfield COD gating forces loss
    // (pre-COD / ramp) years, so this exercises the negative-flow path.
    const ND = {
      ...BASE, debt_pct: 0,
      equity_hearst_pct: 51, equity_brookfield_pct: 29, equity_qatar_pct: 20,
      site_readiness: 'greenfield',
    };
    const p = generateProjection(ND);
    const wf = generateWaterfall(ND, p);
    const flows = wf.by_investor.lender.debt_service_flows;
    expect(flows.length).toBeGreaterThan(0);
    for (const v of flows) expect(v).toBeGreaterThanOrEqual(0);
    // No debt → lender receives nothing across the whole hold.
    expect(flows.every(v => v === 0)).toBe(true);
  });

  it('with debt, lender flow path is unchanged (min(CADS, service); shortfalls preserved)', () => {
    // P2-4: the guard ONLY changes the no-debt branch. When debt exists the lender flow
    // stays min(fcf_pre_debt, debt_service) exactly as before — including the negative
    // shortfall the model books in loss years (NOT silently zeroed). We pin equality to
    // the original formula per-year so the fix provably leaves the debt path untouched.
    const WITH_DEBT = { ...EQUITY_SPLIT, debt_pct: 50, debt_interest_rate: 6, debt_term_years: 12 };
    const p = generateProjection(WITH_DEBT);
    const wf = generateWaterfall(WITH_DEBT, p);
    const flows = wf.by_investor.lender.debt_service_flows;
    const exit_year = WITH_DEBT.exit_year || 10;
    const ds = generateDebtSchedule(WITH_DEBT, {
      cads_by_year: p.years.map(y => (y.ebitda ?? 0) - (y.maintenance_capex ?? 0)),
    }).schedule;
    const remainingAtExit = p.remaining_debt_at_exit ?? 0;
    p.years.forEach((row, i) => {
      const fcf_pre_debt = (row.ebitda ?? 0) - (row.maintenance_capex ?? 0);
      const debt_service = ds[i]?.total_service || 0;
      let expected = debt_service > 0 ? Math.min(fcf_pre_debt, debt_service) : 0;
      if (i + 1 === exit_year) expected += remainingAtExit;
      expect(flows[i]).toBeCloseTo(Math.round(expected), 0);
    });
    // At least the exit-balloon year carries a large positive flow.
    expect(Math.max(...flows)).toBeGreaterThan(0);
  });
});
