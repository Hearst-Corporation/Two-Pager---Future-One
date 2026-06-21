// Qatar Sovereign Data Center Platform — deterministic model.
// Asserts the canonical headline numbers and the three scenario outputs.
// Imports the TS model via the '@' alias (vitest resolves .ts).

import { describe, it, expect } from 'vitest';
import { QATAR_ASSUMPTIONS } from '@/lib/investment-model/qatar/assumptions';
import {
  computePlatform,
  unitEconomics,
} from '@/lib/investment-model/qatar/calculations';
import { SCENARIO_RESULTS } from '@/lib/investment-model/qatar/scenarios';

const M = 1e6;
const B = 1e9;

describe('Qatar model — canonical platform headline numbers', () => {
  const r = computePlatform(QATAR_ASSUMPTIONS);

  it('gross revenue ≈ $405M', () => expect(r.annualRevenue / M).toBeCloseTo(405, 0));
  it('EBITDA ≈ $263M', () => expect(r.annualEbitda / M).toBeCloseTo(263.25, 1));
  it('consortium annual cash ≈ $211M', () =>
    expect(r.consortiumAnnualCash / M).toBeCloseTo(210.6, 1));
  it('stabilized consortium yield ≈ 14.0%', () =>
    expect(r.stabilizedYieldConsortium * 100).toBeCloseTo(14.0, 1));
  it('cumulative consortium cash ≈ $3.92B', () =>
    expect(r.cumulativeCashConsortium / B).toBeCloseTo(3.92, 2));
  it('terminal value ≈ $7.01B', () =>
    expect(r.terminalValueConsortium / B).toBeCloseTo(7.01, 2));
  it('total consortium value ≈ $10.93B', () =>
    expect(r.totalValueConsortium / B).toBeCloseTo(10.93, 2));
  it('MOIC ≈ 7.3×', () => expect(r.moicConsortium).toBeCloseTo(7.3, 1));
  it('IRR ≈ 20.7%', () => expect(r.irrConsortium * 100).toBeCloseTo(20.7, 1));
  it('total-project IRR ≈ 24.3%', () =>
    expect(r.irrTotal * 100).toBeCloseTo(24.3, 1));
});

describe('Qatar model — per-MW unit economics', () => {
  const u = unitEconomics(QATAR_ASSUMPTIONS);
  it('capex/MW ≈ $10.0M', () => expect(u.capexPerMw / M).toBeCloseTo(10, 1));
  it('revenue/MW ≈ $2.70M', () =>
    expect(u.annualRevenuePerMw / M).toBeCloseTo(2.7, 2));
  it('EBITDA/MW ≈ $1.75M', () =>
    expect(u.annualEbitdaPerMw / M).toBeCloseTo(1.755, 2));
  it('terminal/MW ≈ $58.4M', () =>
    expect(u.terminalValuePerMw / M).toBeCloseTo(58.4, 1));
  it('value multiple ≈ 5.8×', () => expect(u.valueMultiple).toBeCloseTo(5.8, 1));
});

describe('Qatar model — scenario range', () => {
  const by = (k) => SCENARIO_RESULTS.find((s) => s.key === k);

  it('Downside Case ≈ 11.0% IRR / 3.3× MOIC', () => {
    expect(by('downside').irr * 100).toBeCloseTo(11.0, 0);
    expect(by('downside').moic).toBeCloseTo(3.3, 1);
  });
  it('Base Case ≈ 15.1% IRR / 4.9× MOIC', () => {
    expect(by('base').irr * 100).toBeCloseTo(15.1, 0);
    expect(by('base').moic).toBeCloseTo(4.9, 1);
  });
  it('Core Contracted Case ≈ 20.7% IRR / 7.3× MOIC', () => {
    expect(by('core').irr * 100).toBeCloseTo(20.7, 1);
    expect(by('core').moic).toBeCloseTo(7.3, 1);
  });
});
