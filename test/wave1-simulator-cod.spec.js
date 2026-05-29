// Wave 1 — financial credibility fixes (C8 CAPEX reconciliation, C9 COD gating,
// C10 GPU refresh disclosure).
import { describe, it, expect } from 'vitest';
import { generateProjection, foldGpuRevenue } from '../lib/hearst-calculations.js';

// A complete, valid scenario. CAPEX components are deliberately high so the
// C8 reconciliation warning fires; site_readiness greenfield → 36mo COD.
const greenfield = {
  total_mw: 50,
  pue: 1.4,
  electricity_price_mwh: 42,
  target_occupancy_pct: 90,
  price_retail_colo_kw_month: 150,
  capex_shell_per_mw: 8_000_000,
  capex_mep_per_mw: 5_000_000,   // → ~14.3M/MW after contingency, >15% over benchmark
  capex_substation_per_mw: 1_000_000,
  capex_cooling_per_mw: 1_500_000,
  capex_grid_per_mw: 500_000,
  capex_contingency_pct: 10,
  debt_pct: 60,
  debt_interest_rate: 6,
  exit_multiple: 18,
  exit_year: 10,
  opex_maintenance_pct: 5,
  opex_staff_annual_musd: 8,
  site_readiness: 'greenfield',  // SITE_READINESS.cod_offset_months = 36
};

describe('C9 — revenue is gated to COD (no revenue before delivery)', () => {
  const proj = generateProjection(greenfield);
  it('computes revenue_start_year from the 36-month COD offset', () => {
    expect(proj.revenue_start_year).toBe(4);   // floor(36/12)+1
    expect(proj.cod_offset_months).toBe(36);
  });
  it('books zero revenue in construction years 1-3', () => {
    expect(proj.years[0].revenue).toBeFalsy();
    expect(proj.years[1].revenue).toBeFalsy();
    expect(proj.years[2].revenue).toBeFalsy();
  });
  it('begins revenue at COD (year 4)', () => {
    expect(proj.years[3].revenue).toBeGreaterThan(0);
  });
  it('emits a COD gating warning', () => {
    expect(proj.warnings.some(w => /COD|delivery/i.test(w))).toBe(true);
  });
  it('a near-ready site (operational) is NOT gated', () => {
    const op = generateProjection({ ...greenfield, site_readiness: 'operational' });
    expect(op.revenue_start_year).toBe(1);
    expect(op.years[0].revenue).toBeGreaterThan(0);
  });
});

describe('C8 — CAPEX reconciliation warning on >15% divergence', () => {
  const proj = generateProjection(greenfield);
  it('flags the divergence and exposes benchmark/model/delta', () => {
    expect(proj.capex_reconciliation).toBeTruthy();
    expect(proj.capex_reconciliation.within_tolerance).toBe(false);
    expect(proj.capex_reconciliation.benchmark_capex_per_mw).toBe(8_850_000);
    expect(Math.abs(proj.capex_reconciliation.delta_pct)).toBeGreaterThan(15);
    expect(proj.warnings.some(w => w.includes('CAPEX RECONCILIATION WARNING'))).toBe(true);
  });
  it('does NOT warn when bottom-up sits within tolerance', () => {
    // ~8.0M/MW base *1.1 = ~8.8M/MW → within 15% of 8.85M
    const inBand = generateProjection({
      ...greenfield,
      capex_shell_per_mw: 4_500_000, capex_mep_per_mw: 2_500_000,
      capex_substation_per_mw: 600_000, capex_cooling_per_mw: 350_000, capex_grid_per_mw: 50_000,
    });
    expect(inBand.capex_reconciliation.within_tolerance).toBe(true);
    expect(inBand.warnings.some(w => w.includes('CAPEX RECONCILIATION WARNING'))).toBe(false);
  });
});

describe('C10 — GPU refresh CAPEX disclosure', () => {
  it('attaches a no-silent-optimism warning when GPU revenue is folded in', () => {
    const proj = generateProjection(greenfield);
    const folded = foldGpuRevenue(proj, { capex_hardware: 100_000_000, revenue_ai_annual: 50_000_000 }, greenfield, {});
    expect(folded.gpu_refresh_modeled).toBe(false);
    expect(folded.warnings.some(w => /GPU refresh CAPEX not currently modeled/i.test(w))).toBe(true);
  });
});
