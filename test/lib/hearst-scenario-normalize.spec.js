import { describe, expect, it } from 'vitest';
import { isLegacyPercentScenario, normalizeScenarioForRead } from '@/lib/hearst-scenario-normalize';

describe('hearst-scenario-normalize', () => {
  it('normalizes legacy ratio-based percent fields for read paths', () => {
    const legacy = {
      target_occupancy_pct: 0.8,
      capex_contingency_pct: 0.1,
      annual_escalation_pct: 0.02,
      opex_maintenance_pct: 0.04,
      opex_insurance_pct: 0.015,
      opex_ga_pct: 0.03,
      opex_operator_mgmt_fee_pct: 0.05,
      equity_hearst_pct: 0.2,
      equity_brookfield_pct: 0.55,
      equity_qatar_pct: 0.25,
      debt_pct: 0.6,
      debt_interest_rate: 0.065,
      commercial_split: { retail_colo: 1 },
      hardware_mix: {
        ai_pct: 0.5,
        utilization_pct: 0.75,
        gpu_mix: [{ sku: 'H200', pct: 1 }],
      },
    };

    expect(isLegacyPercentScenario(legacy)).toBe(true);

    const normalized = normalizeScenarioForRead(legacy);
    expect(normalized).toMatchObject({
      target_occupancy_pct: 80,
      capex_contingency_pct: 10,
      annual_escalation_pct: 2,
      opex_maintenance_pct: 4,
      opex_insurance_pct: 1.5,
      opex_ga_pct: 3,
      opex_operator_mgmt_fee_pct: 5,
      equity_hearst_pct: 20,
      equity_brookfield_pct: 55.00000000000001,
      equity_qatar_pct: 25,
      debt_pct: 60,
      debt_interest_rate: 6.5,
    });
    expect(normalized.commercial_split.retail_colo).toBe(100);
    expect(normalized.hardware_mix.ai_pct).toBe(50);
    expect(normalized.hardware_mix.utilization_pct).toBe(75);
    expect(normalized.hardware_mix.gpu_mix[0].pct).toBe(100);
  });

  it('leaves modern 0..100 values untouched', () => {
    const current = {
      target_occupancy_pct: 80,
      capex_contingency_pct: 10,
      annual_escalation_pct: 2,
      debt_pct: 45,
      debt_interest_rate: 6.5,
      commercial_split: { retail_colo: 100 },
    };

    expect(isLegacyPercentScenario(current)).toBe(false);
    expect(normalizeScenarioForRead(current)).toEqual(current);
  });
});
