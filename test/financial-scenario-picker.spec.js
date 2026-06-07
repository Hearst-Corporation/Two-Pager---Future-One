import { describe, it, expect } from 'vitest';
import {
  dedupeSavedPlans,
  groupCanonicalScenarios,
  pickDefaultPrimaryScenarioId,
} from '../lib/financial-scenario-picker.js';

describe('financial-scenario-picker', () => {
  const scenarios = [
    { id: 'b1', name: 'Base Case', scenario_type: 'base', created_at: '2026-01-01' },
    { id: 'b2', name: 'Base Case duplicate', scenario_type: 'base', created_at: '2026-06-01' },
    { id: 'd1', name: 'Downside Case', scenario_type: 'downside', created_at: '2026-01-01' },
    { id: 'u1', name: 'Upside Case', scenario_type: 'upside', created_at: '2026-01-01' },
    { id: 'p1', name: 'Plan — Shell 50MW', scenario_type: 'custom', created_at: '2026-05-29' },
    { id: 'p2', name: 'Plan — Shell 50MW', scenario_type: 'custom', created_at: '2026-06-06' },
    { id: 'q1', name: 'Qatar 50MW', scenario_type: 'custom', created_at: '2026-02-01' },
  ];

  it('keeps newest canonical row per type', () => {
    const canon = groupCanonicalScenarios(scenarios);
    expect(canon.map((s) => s.id)).toEqual(['b2', 'd1', 'u1']);
  });

  it('dedupes saved plans by name', () => {
    const plans = dedupeSavedPlans(scenarios);
    expect(plans.map((s) => s.id)).toEqual(['p2', 'q1']);
  });

  it('defaults to active, else base canonical', () => {
    expect(pickDefaultPrimaryScenarioId(scenarios)).toBe('b2');
    expect(pickDefaultPrimaryScenarioId([
      { id: 'x', is_active: true, scenario_type: 'custom' },
      ...scenarios,
    ])).toBe('x');
  });
});
