import { describe, it, expect } from 'vitest';
import {
  buildAdvisorContextFromScenarioRow,
  hasAdvisorProjection,
} from '../lib/advisor-context-from-scenario.js';

describe('advisor-context-from-scenario', () => {
  const row = {
    id: 'sc-1',
    name: 'Base Case',
    primary_archetype_id: 'powered_shell',
    total_mw: 50,
  };
  const projection = { years: [{ year: 1 }], irr: 0.18, moic: 2.1 };

  it('builds context when projection has years', () => {
    const ctx = buildAdvisorContextFromScenarioRow({
      row,
      projection,
      surface: 'financial',
    });
    expect(ctx.surface).toBe('financial');
    expect(ctx.state.primary_archetype_id).toBe('powered_shell');
    expect(ctx.savedScenarioId).toBe('sc-1');
  });

  it('returns null without projection years', () => {
    expect(buildAdvisorContextFromScenarioRow({ row, projection: {}, surface: 'financial' })).toBeNull();
  });

  it('detects projection presence', () => {
    expect(hasAdvisorProjection({ projection: { years: [{}] } })).toBe(true);
    expect(hasAdvisorProjection({ projection: {} })).toBe(false);
  });
});
