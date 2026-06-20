// Vérifie que les payloads que le simulator (page.jsx) construit pour CHAQUE
// levier du moteur passent SimulateRequestSchema, et que les overrides profonds
// traversent réellement le pipeline (bootstrap → solveur → archétype).

import { describe, it, expect } from 'vitest';
import { SimulateRequestSchema } from '@/lib/validators/hearst';
import {
  OVERRIDE_KEYS,
  ARCHETYPE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  GEOGRAPHY_OPTIONS,
  OPERATOR_STRATEGY_OPTIONS,
} from '@/app/admin/hearst/utils/sim-levers';
import { bootstrapScenarioFromSources } from '@/lib/hearst-bootstrap';
import { solveScenarioForMode } from '@/lib/hearst-solver';

const baseHardware = {
  classic_pct: 25, liquid_pct: 25, ai_pct: 50,
  gpu_sku_id: 'h100_sxm5', gpu_hour_price: 2.5, utilization_pct: 75,
};

describe('simulator levers → SimulateRequestSchema', () => {
  it('mw_first payload is valid', () => {
    const payload = {
      input_mode: 'mw_first',
      input_value: { total_mw: 150 },
      archetype_id: 'neocloud_gpu',
      geography: 'qatar',
      hardware_mix: baseHardware,
    };
    expect(() => SimulateRequestSchema.parse(payload)).not.toThrow();
  });

  it('capital_first payload is valid', () => {
    const payload = {
      input_mode: 'capital_first',
      input_value: { total_capex_usd: 1_500_000_000 },
      archetype_id: 'powered_shell',
      geography: 'uae',
      hardware_mix: { ...baseHardware, num_racks: 200 },
    };
    expect(() => SimulateRequestSchema.parse(payload)).not.toThrow();
  });

  it('target_irr_first payload (all 4 levers) is valid', () => {
    for (const lever of ['capex_per_mw', 'pricing', 'leverage', 'mw']) {
      const payload = {
        input_mode: 'target_irr_first',
        input_value: { target_irr_pct: 15, lever, total_mw: 150 },
        archetype_id: 'sovereign_ai',
        geography: 'gcc',
        hardware_mix: baseHardware,
      };
      expect(() => SimulateRequestSchema.parse(payload), lever).not.toThrow();
    }
  });

  it('every OVERRIDE_KEY + operator_strategy is accepted in scenario_overrides', () => {
    const scenario_overrides = {};
    for (const k of OVERRIDE_KEYS) scenario_overrides[k] = 5; // arbitrary in-range value
    scenario_overrides.start_year = 2030; // YearInt: must be a real year (≥2000)
    scenario_overrides.operator_strategy = 'multi_operator';
    const payload = {
      input_mode: 'mw_first',
      input_value: { total_mw: 150 },
      archetype_id: 'neocloud_gpu',
      business_model_id: 'gpu_cloud',
      geography: 'qatar',
      hardware_mix: baseHardware,
      scenario_overrides,
    };
    expect(() => SimulateRequestSchema.parse(payload)).not.toThrow();
  });

  it('all 8 archetype ids are valid enum values', () => {
    for (const a of ARCHETYPE_OPTIONS) {
      const payload = {
        input_mode: 'mw_first',
        input_value: { total_mw: 100 },
        archetype_id: a.id,
        geography: 'qatar',
        hardware_mix: baseHardware,
      };
      expect(() => SimulateRequestSchema.parse(payload), a.id).not.toThrow();
    }
  });

  it('all non-empty business models + geographies + operator strategies are valid', () => {
    for (const b of BUSINESS_MODEL_OPTIONS.filter(x => x.id)) {
      expect(() => SimulateRequestSchema.parse({
        input_mode: 'mw_first', input_value: { total_mw: 100 },
        archetype_id: 'neocloud_gpu', business_model_id: b.id,
        geography: 'qatar', hardware_mix: baseHardware,
      }), b.id).not.toThrow();
    }
    for (const g of GEOGRAPHY_OPTIONS) {
      expect(() => SimulateRequestSchema.parse({
        input_mode: 'mw_first', input_value: { total_mw: 100 },
        archetype_id: 'neocloud_gpu', geography: g.id, hardware_mix: baseHardware,
      }), g.id).not.toThrow();
    }
    for (const o of OPERATOR_STRATEGY_OPTIONS.filter(x => x.id)) {
      expect(() => SimulateRequestSchema.parse({
        input_mode: 'mw_first', input_value: { total_mw: 100 },
        archetype_id: 'neocloud_gpu', geography: 'qatar', hardware_mix: baseHardware,
        scenario_overrides: { operator_strategy: o.id },
      }), o.id).not.toThrow();
    }
  });
});

describe('scenario_overrides actually flow through the engine', () => {
  it('user override beats the bootstrap default after merge', () => {
    const boot = bootstrapScenarioFromSources({
      geography: 'qatar', mw_target: 150, archetype_id: 'neocloud_gpu',
    });
    const overrideElec = (Number(boot.scenario.electricity_price_mwh) || 50) + 25;
    const merged = { ...boot.scenario, electricity_price_mwh: overrideElec };
    const { scenario } = solveScenarioForMode('mw_first', { total_mw: 150 }, merged);
    expect(scenario.electricity_price_mwh).toBe(overrideElec);
    expect(scenario.total_mw).toBe(150);
  });
});
