import type { QatarAssumptions, ProprietaryComputeTier } from './types';

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

// Proprietary Compute Reserve (Equity upside, outside Core Contracted Case)
export const PROPRIETARY_COMPUTE_RESERVE: ProprietaryComputeTier[] = [
  { mw: 1, label: 'Proof Cluster', description: 'Initial sovereign validation and secure enclave testing.' },
  { mw: 3, label: 'Model Factory', description: 'Dedicated fine-tuning on national-priority data.' },
  { mw: 5, label: 'Platform Seed', description: 'Sovereign model serving and intelligence layer activation.' },
  { mw: 10, label: 'Proprietary LLM Platform', description: 'Full-scale sovereign intelligence and platform-controlled compute.' },
  { mw: 20, label: 'Institutional Expansion', description: 'Optional scale-up for regional algorithmic dominance.' },
];
