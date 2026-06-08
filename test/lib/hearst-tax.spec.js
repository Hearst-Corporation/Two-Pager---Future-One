import { describe, it, expect } from 'vitest';
import { generateProjection, generateWaterfall } from '@/lib/hearst-calculations';
import { TAX_DEFAULTS } from '@/lib/hearst-constants';

// Full capex stack (all five components required for calcTotalCapex → a real
// total_capex, depreciation base and debt schedule).
function scenario(extra = {}) {
  return {
    total_mw: 50, target_occupancy_pct: 90, pue: 1.3,
    electricity_price_mwh: 60, price_hyperscale_kw_month: 180,
    commercial_split: { hyperscale_lease: 100 },
    capex_shell_per_mw: 3_000_000, capex_mep_per_mw: 1_500_000,
    capex_substation_per_mw: 800_000, capex_cooling_per_mw: 600_000,
    capex_grid_per_mw: 100_000, capex_contingency_pct: 10,
    debt_pct: 40, debt_interest_rate: 6.5, debt_term_years: 10, site_readiness: 'powered_land',
    exit_year: 10, exit_multiple: 12, start_year: 2026,
    opex_maintenance_pct: 2, opex_staff_annual_musd: 4,
    equity_hearst_pct: 20, equity_brookfield_pct: 55, equity_qatar_pct: 25,
    ...extra,
  };
}

describe('P0-2 operational tax layer', () => {
  it('exposes post-tax IRR/NPV/MOIC + tax_assumptions on every projection', () => {
    const p = generateProjection(scenario());
    expect(p).toHaveProperty('irr_post_tax');
    expect(p).toHaveProperty('npv_post_tax');
    expect(p).toHaveProperty('moic_post_tax');
    expect(p.tax_assumptions).toMatchObject({
      income_tax_rate_pct: TAX_DEFAULTS.income_tax_rate_pct,
      method: 'straight_line',
      basis: 'levered_equity',
    });
  });

  it('per-year rows carry depreciation / ebit / taxable_income / cash_taxes / post-tax FCFE', () => {
    const p = generateProjection(scenario());
    for (const y of p.years) {
      expect(y).toHaveProperty('depreciation');
      expect(y).toHaveProperty('ebit');
      expect(y).toHaveProperty('taxable_income');
      expect(y).toHaveProperty('cash_taxes');
      expect(y).toHaveProperty('free_cash_flow_post_tax');
    }
  });

  it('taxable income POSITIVE → cash taxes > 0 and post-tax returns below pre-tax', () => {
    // High price → strong EBITDA that exceeds the D&A shield → positive taxable income.
    const p = generateProjection(scenario({ price_hyperscale_kw_month: 300, tax_rate_pct: 25 }));
    const positiveYears = p.years.filter(y => (y.taxable_income ?? -1) > 0);
    expect(positiveYears.length).toBeGreaterThan(0);
    for (const y of positiveYears) {
      expect(y.cash_taxes).toBeGreaterThan(0);
      expect(y.free_cash_flow_post_tax).toBeCloseTo(y.free_cash_flow - y.cash_taxes, 2);
    }
    expect(p.irr_post_tax).toBeLessThan(p.irr);
    expect(p.npv_post_tax).toBeLessThan(p.npv);
    expect(p.moic_post_tax).toBeLessThan(p.moic);
  });

  it('taxable income NEGATIVE every year → no tax, no refund, post == pre', () => {
    // Low price + D&A shield → taxable income stays < 0 each year.
    const p = generateProjection(scenario({ price_hyperscale_kw_month: 40 }));
    const taxed = p.years.filter(y => y.cash_taxes != null && y.cash_taxes > 0);
    expect(taxed.length).toBe(0);
    for (const y of p.years) {
      expect(y.cash_taxes == null || y.cash_taxes === 0).toBe(true);  // never a refund
      if (y.free_cash_flow != null) {
        expect(y.free_cash_flow_post_tax).toBeCloseTo(y.free_cash_flow, 2);  // post == pre
      }
    }
    if (p.irr != null && p.irr_post_tax != null) expect(p.irr_post_tax).toBeCloseTo(p.irr, 6);
    expect(p.npv_post_tax).toBeCloseTo(p.npv, 0);
  });

  it('tax never creates a refund even in a deep loss year', () => {
    const p = generateProjection(scenario({ price_hyperscale_kw_month: 20, tax_rate_pct: 25 }));
    for (const y of p.years) {
      expect((y.cash_taxes ?? 0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('interest is deducted from taxable income (taxable < EBITDA − D&A when debt present)', () => {
    const p = generateProjection(scenario({ price_hyperscale_kw_month: 300, tax_rate_pct: 25 }));
    const withInterest = p.years.find(y => y.debt_service && y.ebitda != null && y.depreciation != null && y.taxable_income != null);
    expect(withInterest).toBeDefined();
    expect(withInterest.taxable_income).toBeLessThan(withInterest.ebitda - withInterest.depreciation);
  });

  it('terminal value is NOT income-taxed — pre-tax and post-tax both receive TV_to_equity', () => {
    // In a no-tax (shielded) scenario the only pre/post difference is operating tax
    // (zero here), so MOIC pre == post → confirms TV is not income-taxed twice.
    const p = generateProjection(scenario({ price_hyperscale_kw_month: 40 }));
    expect(p.moic_post_tax).toBeCloseTo(p.moic, 2);
  });

  it('waterfall distributions are POST-TAX (Decision A): investor IRR/MOIC reflect tax', () => {
    // Taxed scenario → equity distributions net of tax → investor IRR < a pre-tax run.
    const taxed = generateProjection(scenario({ price_hyperscale_kw_month: 300, tax_rate_pct: 25 }));
    const wfTaxed = generateWaterfall(scenario({ price_hyperscale_kw_month: 300, tax_rate_pct: 25 }), taxed);
    const untaxed = generateProjection(scenario({ price_hyperscale_kw_month: 300, tax_rate_pct: 0 }));
    const wfUntaxed = generateWaterfall(scenario({ price_hyperscale_kw_month: 300, tax_rate_pct: 0 }), untaxed);
    expect(wfTaxed).toBeTruthy();
    expect(wfUntaxed).toBeTruthy();
    // Each equity investor receives less when operating income is taxed.
    for (const inv of ['hearst', 'brookfield', 'qatar']) {
      expect(wfTaxed.by_investor[inv].irr).toBeLessThan(wfUntaxed.by_investor[inv].irr);
      expect(wfTaxed.by_investor[inv].total_distributions)
        .toBeLessThan(wfUntaxed.by_investor[inv].total_distributions);
    }
    // Lender is senior — repayment is unaffected by income tax.
    expect(wfTaxed.by_investor.lender.total_repaid)
      .toBeCloseTo(wfUntaxed.by_investor.lender.total_repaid, 0);
  });
});
