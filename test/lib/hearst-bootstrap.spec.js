// Tests pour lib/hearst-bootstrap.js — pré-remplissage depuis PUBLIC_SOURCES_LIBRARY.

import { describe, it, expect } from 'vitest';
import { bootstrapScenarioFromSources } from '@/lib/hearst-bootstrap.js';

describe('bootstrapScenarioFromSources', () => {
  it('retourne un scenario avec au moins 5 metrics critiques remplies pour Qatar', () => {
    const r = bootstrapScenarioFromSources({ geography: 'qatar' });
    expect(r.metrics_filled).toBeGreaterThanOrEqual(5);
    expect(r.confidence_score).toBeGreaterThanOrEqual(50);
  });

  it('remplit les composants CAPEX MENA depuis Turner & Townsend', () => {
    const r = bootstrapScenarioFromSources({ geography: 'qatar' });
    expect(r.scenario.capex_shell_per_mw).toBeGreaterThan(3_000_000);
    expect(r.scenario.capex_shell_per_mw).toBeLessThan(6_000_000);
    expect(r.scenario.capex_mep_per_mw).toBeGreaterThan(3_000_000);
  });

  it('remplit KAHRAMAA pour électricité Qatar', () => {
    const r = bootstrapScenarioFromSources({ geography: 'qatar' });
    expect(r.scenario.electricity_price_mwh).toBeGreaterThan(20);
    expect(r.scenario.electricity_price_mwh).toBeLessThan(50);
  });

  it('garde defaults safe (équity split, contingency, escalation)', () => {
    const r = bootstrapScenarioFromSources({ geography: 'qatar' });
    expect(r.scenario.capex_contingency_pct).toBe(0.10);
    expect(r.scenario.annual_escalation_pct).toBe(0.02);
    expect(r.scenario.equity_hearst_pct).toBeGreaterThan(0);
    expect(r.scenario.equity_brookfield_pct).toBeGreaterThan(0);
    expect(r.scenario.equity_qatar_pct).toBeGreaterThan(0);
  });

  it('respecte mw_target', () => {
    const r = bootstrapScenarioFromSources({ geography: 'qatar', mw_target: 250 });
    expect(r.scenario.total_mw).toBe(250);
  });

  it('exclut MEP/cooling pour archetype powered_shell', () => {
    const r = bootstrapScenarioFromSources({
      geography: 'qatar',
      archetype_id: 'powered_shell',
    });
    expect(r.scenario.capex_mep_per_mw).toBe(0);
    expect(r.scenario.capex_cooling_per_mw).toBe(0);
  });

  it('expose source_map (mapping field → source id) pour traçabilité', () => {
    const r = bootstrapScenarioFromSources({ geography: 'qatar' });
    expect(typeof r.source_map).toBe('object');
    // Au moins une métrique doit être sourcée
    expect(Object.keys(r.source_map).length).toBeGreaterThan(0);
  });
});
