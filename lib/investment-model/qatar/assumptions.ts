import type { QatarAssumptions } from './types';

// Canonical assumptions for the Core Contracted Case (150 MW · $1.5B · $225/kW).
// These reproduce the published headline numbers; see the test suite.
export const QATAR_ASSUMPTIONS: QatarAssumptions = {
  mw: 150,
  fundedCapexUsd: 1_500_000_000,
  leaseRatePerKwMonth: 225,
  ebitdaMargin: 0.65,
  consortiumShare: 0.8,
  operatingPartnerShare: 0.2,
  escalation: 0.03,
  exitMultiple: 22,
  holdYears: 15,
};
