import { describe, expect, it } from 'vitest';
import { buildMemoPayloadFromSimResult } from '../../lib/hearst-memo-payload';
import { MemoPayloadSchema } from '../../lib/validators/hearst';

// Realistic /simulate response — includes all keys the engine emits,
// including the parasitic keys (waterfall, debt_schedule, solver, etc.)
// that must NOT leak into the memo payload.
const ALLOWED_KEYS = new Set(['scenario', 'projection', 'hardware_breakdown', 'archetype_outcome']);

const makeSimResult = (overrides = {}) => ({
  scenario: {
    archetype_id: 'compute',
    total_mw: 150,
    geography: 'qatar',
  },
  projection: {
    irr_post_tax: 0.173,
    npv_post_tax: 450_000_000,
    moic_post_tax: 2.1,
    total_capex: 900_000_000,
    stabilized_ebitda: 120_000_000,
    dscr_stabilized: 1.45,
  },
  hardware_breakdown: {
    mw_classic: 75,
    mw_liquid: 75,
    mw_ai: 0,
    capex_classic: 450_000_000,
    capex_liquid: 450_000_000,
    capex_hardware: 0,
    total_gpus: 0,
  },
  archetype_outcome: {
    id: 'compute',
    label: 'Compute Cloud',
    code: 'CC',
    score: 0.82,
    scores: { irr: 0.9, dscr: 0.75 },
    compute_as: 'standard',
  },
  // Parasitic keys — must be stripped by the builder
  waterfall: {
    summary: { total_equity: 300_000_000, total_debt: 600_000_000, terminal_value: 1_200_000_000 },
  },
  debt_schedule: [{ year: 1, balance: 580_000_000 }],
  source_map: { irr: ['source-1'], capex: ['source-2'] },
  source_score: 0.88,
  confidence_score: 0.91,
  derived: { equity_check: 300_000_000 },
  solver: { iterations: 12, converged: true },
  ...overrides,
});

describe('buildMemoPayloadFromSimResult', () => {
  it('satisfies MemoPayloadSchema.strict() on a full result', () => {
    const payload = buildMemoPayloadFromSimResult(makeSimResult());
    const parsed = MemoPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('contains only the four whitelisted keys', () => {
    const payload = buildMemoPayloadFromSimResult(makeSimResult());
    const keys = Object.keys(payload);
    for (const k of keys) {
      expect(ALLOWED_KEYS.has(k)).toBe(true);
    }
    // No parasitic key survives
    expect(payload).not.toHaveProperty('waterfall');
    expect(payload).not.toHaveProperty('debt_schedule');
    expect(payload).not.toHaveProperty('source_map');
    expect(payload).not.toHaveProperty('source_score');
    expect(payload).not.toHaveProperty('confidence_score');
    expect(payload).not.toHaveProperty('derived');
    expect(payload).not.toHaveProperty('solver');
  });

  it('archetype_outcome passthrough — extra fields (label, code, score) pass validation', () => {
    const payload = buildMemoPayloadFromSimResult(makeSimResult());
    const parsed = MemoPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    // extra fields on archetype_outcome are preserved (passthrough schema)
    expect(parsed.data.archetype_outcome.label).toBe('Compute Cloud');
    expect(parsed.data.archetype_outcome.code).toBe('CC');
  });

  it('passes refine when only projection is present (no scenario)', () => {
    const result = makeSimResult({ scenario: null });
    const payload = buildMemoPayloadFromSimResult(result);
    // scenario omitted because null
    expect(payload).not.toHaveProperty('scenario');
    expect(payload).toHaveProperty('projection');
    const parsed = MemoPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('passes refine when only scenario is present (no projection)', () => {
    const result = makeSimResult({ projection: null });
    const payload = buildMemoPayloadFromSimResult(result);
    expect(payload).not.toHaveProperty('projection');
    expect(payload).toHaveProperty('scenario');
    const parsed = MemoPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('fails the refine check when both scenario and projection are absent', () => {
    const result = makeSimResult({ scenario: null, projection: null });
    const payload = buildMemoPayloadFromSimResult(result);
    const parsed = MemoPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0].message).toMatch(/scenario or payload.projection is required/);
  });

  it('throws on non-object input', () => {
    expect(() => buildMemoPayloadFromSimResult(null)).toThrow();
    expect(() => buildMemoPayloadFromSimResult(undefined)).toThrow();
    expect(() => buildMemoPayloadFromSimResult('string')).toThrow();
  });

  // P1-a — archetype_outcome without a valid id must be dropped, not forwarded
  it('drops archetype_outcome when id is missing or empty (avoids 400)', () => {
    // Case 1: archetype_outcome present but id is undefined
    const withoutId = makeSimResult({ archetype_outcome: { label: 'No-ID Arch', code: 'X', score: 0.5 } });
    const payload1 = buildMemoPayloadFromSimResult(withoutId);
    expect(payload1).not.toHaveProperty('archetype_outcome');
    const parsed1 = MemoPayloadSchema.safeParse(payload1);
    expect(parsed1.success).toBe(true);

    // Case 2: archetype_outcome present but id is an empty string
    const withEmptyId = makeSimResult({ archetype_outcome: { id: '', label: 'Empty ID', code: 'Y', score: 0.4 } });
    const payload2 = buildMemoPayloadFromSimResult(withEmptyId);
    expect(payload2).not.toHaveProperty('archetype_outcome');
    const parsed2 = MemoPayloadSchema.safeParse(payload2);
    expect(parsed2.success).toBe(true);

    // Case 3: valid id — archetype_outcome IS included (regression guard)
    const withValidId = makeSimResult();
    const payload3 = buildMemoPayloadFromSimResult(withValidId);
    expect(payload3).toHaveProperty('archetype_outcome');
    expect(payload3.archetype_outcome.id).toBe('compute');
    const parsed3 = MemoPayloadSchema.safeParse(payload3);
    expect(parsed3.success).toBe(true);
  });
});
