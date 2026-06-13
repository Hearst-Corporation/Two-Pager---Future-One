// test/api/strategic-memo-validation.spec.js
// Regression tests for Zod validation on POST /api/admin/hearst/strategic-memo.
//
// The route is imported directly; module-boundary mocks intercept auth and all
// heavy dependencies (OpenAI, Supabase, oracle-live, …) so the test stays fast.

import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────

vi.mock('@/lib/supabase-admin', () => ({
  authedWrite: vi.fn().mockResolvedValue({
    profile: { id: 'test-actor-uuid', role: 'editor' },
    actor: 'test-actor-uuid',
    supa: {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'memo-1' }, error: null }) })) })),
      })),
    },
  }),
}));

// Stub every heavy dependency the route imports at module level.
vi.mock('@/lib/llm/openai', () => ({
  openaiChatCompletion: vi.fn(),
  OPENAI_MEMO_MODEL: 'gpt-4.1',
}));
vi.mock('@/lib/oracle-system-prompt', () => ({ buildOracleSystemPrompt: vi.fn(() => 'sys') }));
vi.mock('@/lib/oracle-intelligence', () => ({ buildIntelligenceBrief: vi.fn(() => ({ datapoints: [], comparables: [], tensions: [], reality_violations: [], absorption: null, intelligence_layer_version: '1' })) }));
vi.mock('@/lib/oracle-live', () => ({
  getGpuPricingBrief: vi.fn().mockResolvedValue({}),
  getEnergyBrief: vi.fn().mockResolvedValue({}),
  getInfrastructureSignals: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/oracle-visualization', () => ({
  build2DDiagramSpec: vi.fn(() => ({})),
  buildTopologySpec: vi.fn(() => ({})),
  buildDeploymentPhaseSpec: vi.fn(() => ({})),
}));
vi.mock('@/lib/oracle-explainability', () => ({
  explainMetric: vi.fn(() => ({ short: '' })),
  simplifyTechnicalTerm: vi.fn(() => ''),
  SUPPORTED_AUDIENCES: ['beginner', 'investor', 'minister', 'operator'],
}));
vi.mock('@/lib/hearst-format', () => ({
  fmtUSD: vi.fn((v) => String(v)),
  fmtPctFromRatio: vi.fn((v) => String(v)),
  fmtX: vi.fn((v) => String(v)),
}));
vi.mock('@/lib/hearst-calculations', () => ({
  generateProjection: vi.fn(() => ({ years: [], irr: 0.15, npv: 1e6, moic: 1.5, payback_years: 5 })),
  foldGpuRevenue: vi.fn(),
}));
vi.mock('@/lib/hearst-constants', () => ({
  FINANCIAL_THRESHOLDS: { ic_hurdle_pct: 12, discount_rate_pct: 10 },
}));
vi.mock('@/lib/memo-confidence', () => ({
  assertNoPromises: vi.fn(),
  freshnessStatusFromTimestamp: vi.fn(() => 'FRESH'),
  computeDataFreshness: vi.fn(() => ({ overall_status: 'FRESH', data_as_of: '2026-01-01' })),
  computeConfidenceBlock: vi.fn(() => ({ confidence_level: 'HIGH', source_density: '5 / 5', mean_trust_score: 1, mean_freshness_score: 1 })),
}));
vi.mock('@/lib/strategic-memo-store', () => ({
  persistMemo: vi.fn().mockResolvedValue({ id: 'saved-memo-id' }),
}));
vi.mock('@/lib/engine-reconcile', () => ({
  reconcileMetricsWithEngine: vi.fn((metrics) => metrics),
}));

// ── Import route AFTER mocks ──────────────────────────────────────────────────

const { POST } = await import('../../app/api/admin/hearst/strategic-memo/route.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body) {
  return {
    json: async () => body,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/hearst/strategic-memo — Zod validation', () => {
  it('returns 400 validation_failed when payload is missing', async () => {
    const req = makeRequest({ title: 'Test memo' });
    const res = await POST(req);
    expect(res).toBeInstanceOf(NextResponse);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('validation_failed');
    expect(Array.isArray(json.issues)).toBe(true);
    expect(json.issues.length).toBeGreaterThan(0);
  });

  it('returns 400 validation_failed when payload has neither scenario nor projection', async () => {
    const req = makeRequest({ payload: { hardware_breakdown: {} } });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('validation_failed');
  });

  it('returns 400 invalid_json on malformed body', async () => {
    const req = { json: async () => { throw new SyntaxError('bad json'); } };
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('invalid_json');
  });

  it('returns 400 when unknown top-level key is sent (strict mode)', async () => {
    const req = makeRequest({
      payload: { scenario: { total_mw: 100 } },
      unknown_field: 'should be rejected',
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('validation_failed');
  });

  it('returns 400 when audience is not in the allowed enum', async () => {
    const req = makeRequest({
      payload: { scenario: { total_mw: 100 } },
      audience: 'politician',
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('validation_failed');
  });

  it('returns 400 when title exceeds 200 chars', async () => {
    const req = makeRequest({
      payload: { scenario: { total_mw: 100 } },
      title: 'A'.repeat(201),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('validation_failed');
  });
});
