import { QATAR_ASSUMPTIONS } from './assumptions';
import { computePlatform } from './calculations';
import type { ScenarioDef, ScenarioResult } from './types';

// Three institutional scenarios. The Core Contracted Case is the reference case;
// the others apply rate compression and a phased lease-up ramp to evidence the floor.
export const SCENARIOS: ScenarioDef[] = [
  {
    key: 'downside',
    label: 'Downside Case',
    overrides: {
      leaseRatePerKwMonth: 185,
      fundedCapexUsd: 1_950_000_000,
      exitMultiple: 16.5,
      escalation: 0.02,
    },
    ramp: [0.2, 0.5, 0.8],
    canonical: { irr: 0.134, moic: 4.17 },
  },
  {
    key: 'base',
    label: 'Base Case',
    overrides: {
      leaseRatePerKwMonth: 195,
      fundedCapexUsd: 1_750_000_000,
      exitMultiple: 19.5,
      escalation: 0.03,
    },
    ramp: [0.4, 0.8],
    canonical: { irr: 0.179, moic: 6.17 },
  },
  {
    key: 'core',
    label: 'Core Contracted Case',
    overrides: {},
    ramp: [],
    canonical: { irr: 0.243, moic: 9.1 },
  },
];

export function computeScenario(s: ScenarioDef): ScenarioResult {
  const assumptions = { ...QATAR_ASSUMPTIONS, ...s.overrides };
  const result = computePlatform(assumptions, s.ramp);
  return {
    ...s,
    assumptions,
    result,
    irr: result.irrConsortium,
    moic: result.moicConsortium,
  };
}

export const SCENARIO_RESULTS: ScenarioResult[] = SCENARIOS.map(computeScenario);
