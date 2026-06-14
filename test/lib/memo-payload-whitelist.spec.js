// test/lib/memo-payload-whitelist.spec.js
//
// Regression guard for the P0: "Generate Strategic Memo" from the Results page.
//
// The Results page used to POST the RAW /api/admin/hearst/simulate response
// (~10 keys) straight into the memo route, whose MemoPayloadSchema is .strict()
// and only allows { scenario, projection, hardware_breakdown, archetype_outcome }.
// The extra live keys (waterfall, debt_schedule, source_map, confidence_score,
// derived, solver) made every request fail with 400 validation_failed — the only
// UI path to create a memo was dead.
//
// buildMemoPayloadFromSimResult whitelists the response down to the strict shape.
// This test proves the real /simulate response shape converts into a payload the
// strict schema accepts, and that the raw response does NOT — so the break can
// never silently regress again.

import { describe, it, expect } from 'vitest';
import { buildMemoPayloadFromSimResult } from '@/lib/hearst-memo-job-store';
import { MemoPayloadSchema } from '@/lib/validators/hearst';

// A faithful copy of the POST /api/admin/hearst/simulate response shape
// (app/api/admin/hearst/simulate/route.js:188-214) — the four allowed keys
// plus the six extra live keys that .strict() rejects.
function makeSimResult() {
  return {
    scenario: { total_mw: 100, pue: 1.2, electricity_price_mwh: 45 },
    projection: { irr_post_tax: 0.162, npv_post_tax: 4.4e8, moic_post_tax: 2.3, years: [{ y: 1 }] },
    archetype_outcome: { id: 'hyperscale', label: 'Hyperscale Campus', code: 'HS', score: 0.9, compute_as: 'recurring_revenue' },
    hardware_breakdown: { classic_pct: 40, liquid_pct: 30, ai_pct: 30 },
    // ── extra live keys the strict schema must NOT receive ──
    waterfall: [{ tier: 'senior', amount: 1e8 }],
    debt_schedule: [{ year: 1, interest: 2e7 }],
    source_map: { official: 12, imputed: 3 },
    confidence_score: 82,
    derived: { ebitda_margin: 0.61 },
    solver: { converged: true, iterations: 7, lever_value: 100, achieved_irr: 0.162 },
  };
}

const ALLOWED_KEYS = ['scenario', 'projection', 'hardware_breakdown', 'archetype_outcome'];
const EXTRA_KEYS = ['waterfall', 'debt_schedule', 'source_map', 'confidence_score', 'derived', 'solver'];

describe('buildMemoPayloadFromSimResult — strict memo payload whitelist (P0 regression)', () => {
  it('produces a payload with exactly the four allowed keys', () => {
    const payload = buildMemoPayloadFromSimResult(makeSimResult());
    expect(Object.keys(payload).sort()).toEqual([...ALLOWED_KEYS].sort());
  });

  it('drops every extra live /simulate key', () => {
    const payload = buildMemoPayloadFromSimResult(makeSimResult());
    for (const k of EXTRA_KEYS) {
      expect(payload).not.toHaveProperty(k);
    }
  });

  it('output is accepted by the strict MemoPayloadSchema', () => {
    const payload = buildMemoPayloadFromSimResult(makeSimResult());
    const result = MemoPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('the raw /simulate response is REJECTED by the strict schema (proves the break)', () => {
    const raw = makeSimResult();
    const result = MemoPayloadSchema.safeParse(raw);
    expect(result.success).toBe(false);
  });

  it('does not mutate the input object', () => {
    const input = makeSimResult();
    const snapshot = JSON.stringify(input);
    buildMemoPayloadFromSimResult(input);
    expect(JSON.stringify(input)).toBe(snapshot);
    // extra keys still present on the original
    for (const k of EXTRA_KEYS) expect(input).toHaveProperty(k);
  });

  it('copies value references through unchanged (no recomputation client-side)', () => {
    const input = makeSimResult();
    const payload = buildMemoPayloadFromSimResult(input);
    expect(payload.scenario).toBe(input.scenario);
    expect(payload.projection).toBe(input.projection);
    expect(payload.archetype_outcome).toBe(input.archetype_outcome);
    expect(payload.hardware_breakdown).toBe(input.hardware_breakdown);
  });

  it('only copies allowed keys that are present (never fabricates undefined keys)', () => {
    const payload = buildMemoPayloadFromSimResult({ projection: { irr_post_tax: 0.1 } });
    expect(Object.keys(payload)).toEqual(['projection']);
    expect(MemoPayloadSchema.safeParse(payload).success).toBe(true); // projection satisfies the refine
  });

  it('handles null/undefined input without throwing', () => {
    expect(buildMemoPayloadFromSimResult(null)).toEqual({});
    expect(buildMemoPayloadFromSimResult(undefined)).toEqual({});
  });
});
