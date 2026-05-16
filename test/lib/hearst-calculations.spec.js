// Unit tests for lib/hearst-calculations.js — pure financial math, no I/O.
// All reference values were captured against the live module so failures here mean
// the function semantics changed (not the test). DO NOT change values without
// updating the formula documentation in lib/hearst-calculations.js.

import { describe, it, expect } from 'vitest';
import {
  calcEnergyCost,
  calcOccupiedKw,
  calcColoRevenue,
  calcFacilityMw,
  calcGpuRevenue,
  calcInferenceRevenue,
  calcEbitda,
  calcDscr,
  calcTerminalValue,
  calcMoic,
  calcNpv,
  calcIrr,
  calcPayback,
  calcTotalCapex,
  calcSourceScore,
} from '@/lib/hearst-calculations.js';

describe('calcNpv', () => {
  it('returns 0 for all-zero cashflows', () => {
    expect(calcNpv([0, 0, 0, 0], 0.1)).toBe(0);
  });

  it('equals the plain sum when discount rate is 0', () => {
    expect(calcNpv([10, 10, 10], 0)).toBe(30);
    expect(calcNpv([-100, 60, 60], 0)).toBe(20);
  });

  it('computes a known reference value for mixed positive/negative cashflows', () => {
    // -100 + 60/1.1 + 60/1.21 ≈ 4.1322
    expect(calcNpv([-100, 60, 60], 0.1)).toBeCloseTo(4.1322, 3);
  });

  it('returns null when cashflows or discount_rate is missing', () => {
    expect(calcNpv(null, 0.1)).toBeNull();
    expect(calcNpv([1, 2, 3], null)).toBeNull();
  });
});

describe('calcIrr', () => {
  it('returns ~0.0771 for [-1000, 300, 300, 300, 300] (captured reference)', () => {
    expect(calcIrr([-1000, 300, 300, 300, 300])).toBeCloseTo(0.0771, 3);
  });

  it('returns null for all-negative cashflows (documented behavior)', () => {
    expect(calcIrr([-100, -50, -25])).toBeNull();
  });

  it('returns null when there is only a single cashflow', () => {
    expect(calcIrr([-100])).toBeNull();
    expect(calcIrr(null)).toBeNull();
  });

  it('solves the trivial [-100, 200] case to IRR=1 (100% return)', () => {
    expect(calcIrr([-100, 200])).toBeCloseTo(1, 3);
  });
});

describe('calcDscr', () => {
  it('returns 0 when EBITDA is 0 and debt service > 0', () => {
    // (0 − 0) / 100 = 0 — coverage is zero, formula is well-defined.
    expect(calcDscr({ ebitda: 0, maintenance_capex: 0, debt_service: 100 })).toBe(0);
  });

  it('returns null when debt service is 0 (avoids divide-by-zero)', () => {
    expect(calcDscr({ ebitda: 100, maintenance_capex: 0, debt_service: 0 })).toBeNull();
  });

  it('returns null when ebitda is null/undefined', () => {
    expect(calcDscr({ ebitda: null, maintenance_capex: 0, debt_service: 100 })).toBeNull();
    expect(calcDscr({ ebitda: undefined, maintenance_capex: 0, debt_service: 100 })).toBeNull();
  });

  it('subtracts maintenance capex from EBITDA before dividing', () => {
    // (1000 − 200) / 400 = 2.0
    expect(calcDscr({ ebitda: 1000, maintenance_capex: 200, debt_service: 400 })).toBe(2);
  });

  it('treats missing maintenance_capex as 0', () => {
    expect(calcDscr({ ebitda: 800, debt_service: 400 })).toBe(2);
  });
});

describe('calcPayback', () => {
  it('returns the first year when cumulative FCF turns non-negative', () => {
    // capex 120, fcf [50, 50, 50] → cumulative −70, −20, +30 → year 3
    expect(calcPayback([50, 50, 50], 120)).toBe(3);
  });

  it('returns null when the project never pays back', () => {
    expect(calcPayback([10, 10], 100)).toBeNull();
  });

  it('returns null when yearly_fcf or initial_capex is missing', () => {
    expect(calcPayback(null, 100)).toBeNull();
    expect(calcPayback([10, 10], null)).toBeNull();
  });
});

describe('calcEnergyCost', () => {
  it('matches the canonical formula it_mw × pue × 8760 × price', () => {
    // 10 × 1.3 × 8760 × 100 = 11,388,000
    expect(calcEnergyCost({ it_mw: 10, pue: 1.3, electricity_price_mwh: 100 })).toBe(11_388_000);
  });

  it('returns null when any input is missing/zero (cannot fabricate)', () => {
    expect(calcEnergyCost({ it_mw: 10, pue: null, electricity_price_mwh: 100 })).toBeNull();
    expect(calcEnergyCost({ it_mw: 0, pue: 1.3, electricity_price_mwh: 100 })).toBeNull();
  });
});

describe('calcOccupiedKw', () => {
  it('returns kW from MW × 1000 × occupancy%', () => {
    expect(calcOccupiedKw({ it_mw: 10, occupancy_pct: 80 })).toBe(8000);
  });

  it('returns null when it_mw missing (no fabrication)', () => {
    expect(calcOccupiedKw({ it_mw: null, occupancy_pct: 80 })).toBeNull();
  });

  it('preserves 0% occupancy as a real 0 (not null)', () => {
    // occupancy_pct == 0 is a known input, not a missing one.
    expect(calcOccupiedKw({ it_mw: 10, occupancy_pct: 0 })).toBe(0);
  });
});

describe('calcColoRevenue', () => {
  it('multiplies occupied kW × monthly price × 12', () => {
    expect(calcColoRevenue({ occupied_kw: 8000, monthly_price_kw: 150 })).toBe(14_400_000);
  });

  it('returns null on missing inputs', () => {
    expect(calcColoRevenue({ occupied_kw: 0, monthly_price_kw: 150 })).toBeNull();
    expect(calcColoRevenue({ occupied_kw: 8000, monthly_price_kw: 0 })).toBeNull();
  });
});

describe('calcFacilityMw', () => {
  it('returns it_mw × pue', () => {
    expect(calcFacilityMw({ it_mw: 10, pue: 1.3 })).toBe(13);
  });
});

describe('calcGpuRevenue', () => {
  it('matches num_gpus × utilization × 8760 × price', () => {
    // 1000 × 0.8 × 8760 × 2 = 14,016,000
    expect(calcGpuRevenue({ num_gpus: 1000, utilization_pct: 80, gpu_hour_price: 2 })).toBe(14_016_000);
  });
});

describe('calcInferenceRevenue', () => {
  it('returns tokens (in millions) × price', () => {
    expect(calcInferenceRevenue({ tokens_per_year: 1_000_000_000, price_per_million_tokens: 5 })).toBe(5000);
  });
});

describe('calcEbitda', () => {
  it('returns revenue − power_cost − opex', () => {
    expect(calcEbitda({ revenue: 1000, power_cost: 200, opex: 300 })).toBe(500);
  });

  it('returns null if any term is null (never silently coerce)', () => {
    expect(calcEbitda({ revenue: null, power_cost: 200, opex: 300 })).toBeNull();
    expect(calcEbitda({ revenue: 1000, power_cost: null, opex: 300 })).toBeNull();
    expect(calcEbitda({ revenue: 1000, power_cost: 200, opex: null })).toBeNull();
  });
});

describe('calcTerminalValue', () => {
  it('returns ebitda × multiple', () => {
    expect(calcTerminalValue({ exit_ebitda: 100, exit_multiple: 15 })).toBe(1500);
  });

  it('returns null when either input is missing', () => {
    expect(calcTerminalValue({ exit_ebitda: 0, exit_multiple: 15 })).toBeNull();
    expect(calcTerminalValue({ exit_ebitda: 100, exit_multiple: 0 })).toBeNull();
  });
});

describe('calcMoic', () => {
  it('returns proceeds / equity invested', () => {
    expect(calcMoic({ total_equity_proceeds: 300, equity_invested: 100 })).toBe(3);
  });

  it('returns null when equity_invested is 0 (cannot divide)', () => {
    expect(calcMoic({ total_equity_proceeds: 300, equity_invested: 0 })).toBeNull();
  });
});

describe('calcTotalCapex', () => {
  it('aggregates all per-MW components × total_mw × (1 + contingency)', () => {
    // (1e6 × 5) × 10 × 1.10 = 55,000,000
    expect(
      calcTotalCapex({ total_mw: 10, shell: 1e6, mep: 1e6, substation: 1e6, cooling: 1e6, grid: 1e6 })
    ).toBeCloseTo(55_000_000, 2);
  });

  it('returns null if any required component is missing (no fabrication)', () => {
    expect(
      calcTotalCapex({ total_mw: 10, shell: 1e6, mep: null, substation: 1e6, cooling: 1e6, grid: 1e6 })
    ).toBeNull();
  });

  it('returns null when total_mw is missing', () => {
    expect(
      calcTotalCapex({ total_mw: 0, shell: 1e6, mep: 1e6, substation: 1e6, cooling: 1e6, grid: 1e6 })
    ).toBeNull();
  });
});

describe('calcSourceScore', () => {
  it('returns 0 for null or empty scenario', () => {
    expect(calcSourceScore(null)).toBe(0);
    expect(calcSourceScore({})).toBe(0);
  });

  it('returns 100 when all 13 tracked source IDs are present', () => {
    const fullyCited = {
      total_mw_source_id: 's',
      pue_source_id: 's',
      electricity_price_source_id: 's',
      capex_shell_source_id: 's',
      capex_mep_source_id: 's',
      capex_substation_source_id: 's',
      capex_cooling_source_id: 's',
      capex_grid_source_id: 's',
      price_retail_source_id: 's',
      price_wholesale_source_id: 's',
      price_hyperscale_source_id: 's',
      exit_multiple_source_id: 's',
      debt_interest_source_id: 's',
    };
    expect(calcSourceScore(fullyCited)).toBe(100);
  });

  it('rounds to nearest integer for partial coverage', () => {
    // 1/13 ≈ 7.69 → 8
    expect(calcSourceScore({ total_mw_source_id: 's' })).toBe(8);
  });
});
