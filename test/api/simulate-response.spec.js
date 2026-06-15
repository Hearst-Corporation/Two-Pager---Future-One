import { describe, expect, it } from 'vitest';

import { buildSimulateResponse } from '@/lib/hearst-simulate-response';

describe('POST /api/admin/hearst/simulate response shape', () => {
  it('exposes source_score for UI surfaces while preserving confidence_score', () => {
    const response = buildSimulateResponse({
      archResult: {
        scenario: { total_mw: 100 },
        score: 87,
      },
      archetype: {
        id: 'powered_shell',
        label: 'Powered Shell',
        code: 'B',
        scores: { bankability: 5 },
      },
      projection: { years: [] },
      waterfall: null,
      debt_schedule: null,
      hardware_breakdown: null,
      boot: {
        source_map: { pue: 'eqx_pue' },
        confidence_score: 89,
      },
      derived: { mode: 'mw_first' },
      solver: null,
    });

    expect(response.source_score).toBe(89);
    expect(response.confidence_score).toBe(89);
    expect(response.source_map).toEqual({ pue: 'eqx_pue' });
  });
});
