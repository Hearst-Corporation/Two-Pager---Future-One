// Qatar Sovereign Data Center Platform — deterministic investment model.
// Standalone. Does NOT depend on the legacy hearst-* / oracle-* engines.

export interface QatarAssumptions {
  /** Initial contracted capacity, in megawatts. */
  mw: number;
  /** Total funded development capex, in USD. */
  fundedCapexUsd: number;
  /** Lease rate, USD per kW per month. */
  leaseRatePerKwMonth: number;
  /** Asset-level EBITDA margin (0–1). */
  ebitdaMargin: number;
  /** Consortium economic share (0–1). */
  consortiumShare: number;
  /** Operating-partner economic share (0–1). */
  operatingPartnerShare: number;
  /** Annual rent escalation (e.g. 0.03 = 3%). */
  escalation: number;
  /** Exit EV/EBITDA multiple applied to the stabilized Year-N run-rate. */
  exitMultiple: number;
  /** Hold period, in years. */
  holdYears: number;
}

export interface UnitEconomics {
  capexPerMw: number;
  annualRevenuePerMw: number;
  annualEbitdaPerMw: number;
  terminalValuePerMw: number;
  /** Terminal value ÷ build cost, per MW. */
  valueMultiple: number;
}

export interface YearPoint {
  year: number;
  ebitdaTotal: number;
  cumulativeConsortium: number;
}

export interface PlatformResult {
  annualRevenue: number;
  annualEbitda: number;
  consortiumAnnualCash: number;
  operatingPartnerAnnualCash: number;
  stabilizedYieldProject: number;
  stabilizedYieldConsortium: number;
  cumulativeCashTotal: number;
  cumulativeCashConsortium: number;
  cumulativeCashOperating: number;
  year15Ebitda: number;
  terminalValueTotal: number;
  terminalValueConsortium: number;
  terminalValueOperating: number;
  totalValueTotal: number;
  totalValueConsortium: number;
  totalValueOperating: number;
  moicTotal: number;
  moicConsortium: number;
  irrTotal: number;
  irrConsortium: number;
  cumulativeByYear: YearPoint[];
}

export type ScenarioKey = 'downside' | 'base' | 'core';

export interface ScenarioDef {
  key: ScenarioKey;
  label: string;
  overrides: Partial<QatarAssumptions>;
  /** Per-year energized fraction (0–1); empty = fully energized from Year 1. */
  ramp: number[];
  /** Canonical published outputs, for display parity. */
  canonical: { irr: number; moic: number };
}

export interface ScenarioResult extends ScenarioDef {
  assumptions: QatarAssumptions;
  result: PlatformResult;
  irr: number;
  moic: number;
}
