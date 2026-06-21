import type { QatarAssumptions, PlatformResult, UnitEconomics, YearPoint } from './types';

/** IRR via bisection on the NPV. Deterministic; no external solver. */
export function irr(cashflows: number[], lo = -0.95, hi = 3): number {
  const npv = (r: number) =>
    cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
  let a = lo;
  let b = hi;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (npv(m) > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** Per-megawatt unit economics. */
export function unitEconomics(a: QatarAssumptions): UnitEconomics {
  const capexPerMw = a.fundedCapexUsd / a.mw;
  const annualRevenuePerMw = 1000 * a.leaseRatePerKwMonth * 12;
  const annualEbitdaPerMw = annualRevenuePerMw * a.ebitdaMargin;
  const exitEbitdaPerMw =
    annualEbitdaPerMw * Math.pow(1 + a.escalation, a.holdYears - 1);
  const terminalValuePerMw = exitEbitdaPerMw * a.exitMultiple;
  return {
    capexPerMw,
    annualRevenuePerMw,
    annualEbitdaPerMw,
    terminalValuePerMw,
    valueMultiple: terminalValuePerMw / capexPerMw,
  };
}

/**
 * Full platform projection.
 * @param ramp optional per-year energized fraction (0–1). Empty ⇒ fully energized
 *   from Year 1 (the Core Contracted Case). Used to model lease-up in stress cases.
 */
export function computePlatform(
  a: QatarAssumptions,
  ramp: number[] = []
): PlatformResult {
  const {
    mw,
    fundedCapexUsd,
    leaseRatePerKwMonth,
    ebitdaMargin,
    consortiumShare,
    operatingPartnerShare,
    escalation,
    exitMultiple,
    holdYears,
  } = a;

  const annualRevenue = mw * 1000 * leaseRatePerKwMonth * 12;
  const annualEbitda = annualRevenue * ebitdaMargin;
  const consortiumAnnualCash = annualEbitda * consortiumShare;
  const operatingPartnerAnnualCash = annualEbitda * operatingPartnerShare;

  const energized = (y: number) => (ramp.length ? ramp[y - 1] ?? 1 : 1);

  let cumEbitda = 0;
  const cumulativeByYear: YearPoint[] = [];
  for (let y = 1; y <= holdYears; y++) {
    const ebitdaY = annualEbitda * Math.pow(1 + escalation, y - 1) * energized(y);
    cumEbitda += ebitdaY;
    cumulativeByYear.push({
      year: y,
      ebitdaTotal: ebitdaY,
      cumulativeConsortium: cumEbitda * consortiumShare,
    });
  }

  // Terminal value is struck on the stabilized run-rate at exit (no ramp haircut:
  // by the hold horizon the platform is fully energized in every scenario).
  const year15Ebitda = annualEbitda * Math.pow(1 + escalation, holdYears - 1);
  const terminalValueTotal = year15Ebitda * exitMultiple;

  const cumulativeCashTotal = cumEbitda;
  const cumulativeCashConsortium = cumEbitda * consortiumShare;
  const cumulativeCashOperating = cumEbitda * operatingPartnerShare;
  const terminalValueConsortium = terminalValueTotal * consortiumShare;
  const terminalValueOperating = terminalValueTotal * operatingPartnerShare;

  const totalValueTotal = cumulativeCashTotal + terminalValueTotal;
  const totalValueConsortium = cumulativeCashConsortium + terminalValueConsortium;
  const totalValueOperating = cumulativeCashOperating + terminalValueOperating;

  const cfTotal = [-fundedCapexUsd];
  // Consortium deploys only its share of capex — IRR must reflect its actual outlay.
  const cfConsortium = [-fundedCapexUsd * consortiumShare];
  for (let y = 1; y <= holdYears; y++) {
    const ebitdaY = annualEbitda * Math.pow(1 + escalation, y - 1) * energized(y);
    let cTot = ebitdaY;
    let cCons = ebitdaY * consortiumShare;
    if (y === holdYears) {
      cTot += terminalValueTotal;
      cCons += terminalValueConsortium;
    }
    cfTotal.push(cTot);
    cfConsortium.push(cCons);
  }

  return {
    annualRevenue,
    annualEbitda,
    consortiumAnnualCash,
    operatingPartnerAnnualCash,
    stabilizedYieldProject: annualEbitda / fundedCapexUsd,
    stabilizedYieldConsortium: consortiumAnnualCash / fundedCapexUsd,
    cumulativeCashTotal,
    cumulativeCashConsortium,
    cumulativeCashOperating,
    year15Ebitda,
    terminalValueTotal,
    terminalValueConsortium,
    terminalValueOperating,
    totalValueTotal,
    totalValueConsortium,
    totalValueOperating,
    moicTotal: totalValueTotal / fundedCapexUsd,
    moicConsortium: (fundedCapexUsd * consortiumShare) > 0
      ? totalValueConsortium / (fundedCapexUsd * consortiumShare)
      : 0,
    irrTotal: irr(cfTotal),
    irrConsortium: irr(cfConsortium),
    cumulativeByYear,
  };
}

// ---- canonical display formatters (so the UI shows the published numbers) ----
export const usdB = (x: number) => `$${(x / 1e9).toFixed(2)}B`;
export const usdM = (x: number) => `$${Math.round(x / 1e6)}M`;
export const usdMdec = (x: number, dec = 1) => `$${(x / 1e6).toFixed(dec)}M`;
export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
export const mult = (x: number) => `${x.toFixed(1)}×`;
