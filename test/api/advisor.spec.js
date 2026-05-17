// test/api/advisor.spec.js
// IDOR + error-mapping coverage for the advisor GET handler. The single-
// conversation fetch must scope by actor_id AND map PostgREST "no rows"
// (PGRST116) to a 404 so the IDOR-probe response is indistinguishable from
// a clean miss, while real DB errors surface as 500.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks for the GET handler tests below. The route module imports
// authedWrite at top-level, so we have to mock the module before the route
// import is evaluated.
vi.mock('@/lib/supabase-admin', () => ({
  authedWrite: vi.fn(),
}));

// The route also touches a handful of unrelated server-only modules at import
// time (Anthropic client, tools registry, etc.). They're not exercised by the
// GET path, but their import side-effects (env reads, etc.) shouldn't matter
// for these unit tests — the Anthropic client is constructed inside POST.

// ---------------------------------------------------------------------------
// GET handler — IDOR + error-mapping behaviour
// ---------------------------------------------------------------------------
//
// These tests guard the P0 fix: the single-conversation branch must
//   1) include actor_id in the .eq() chain
//   2) return 404 + { error: 'not_found' } when PostgREST reports "no rows"
//      (PGRST116) — which is what happens both when the id is bogus AND when
//      the row exists but belongs to a different actor (the actual IDOR leak)
//   3) return 500 + { error: 'lookup_failed' } for any other Supabase error
//   4) return 200 + { conversation: <row> } when the row is owned by the caller
//
// We build a chainable supabase-client stub so we can spy on every .eq() call
// and assert that `actor_id` ended up in the WHERE clause.

function buildSupaStub({ data, error }) {
  // Records every .eq(column, value) seen on hearst_advisor_conversations so
  // tests can assert on the filter shape (specifically: actor_id must be there).
  const eqCalls = [];
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((col, val) => { eqCalls.push([col, val]); return chain; }),
    single: vi.fn(async () => ({ data, error })),
    order: vi.fn(() => chain),
    limit: vi.fn(async () => ({ data: [], error: null })),
  };
  const supa = {
    from: vi.fn(() => chain),
  };
  return { supa, chain, eqCalls };
}

describe('advisor GET — single conversation fetch (IDOR + error mapping)', () => {
  let GET;
  let authedWrite;

  beforeEach(async () => {
    vi.resetModules();
    // Re-import the mocked module and the route under test fresh per test so
    // the mock function references are clean.
    const adminMod = await import('@/lib/supabase-admin');
    authedWrite = adminMod.authedWrite;
    authedWrite.mockReset();
    const routeMod = await import('@/app/api/admin/hearst/advisor/route.js');
    GET = routeMod.GET;
  });

  function makeReq(qs) {
    return new Request(`http://localhost/api/admin/hearst/advisor?${qs}`);
  }

  it('returns 404 not_found when the conversation belongs to another user (PGRST116)', async () => {
    // Simulate: row with id=X exists but actor_id != Y. The .eq('actor_id', Y)
    // filter makes PostgREST return zero rows → .single() yields PGRST116.
    const { supa, eqCalls } = buildSupaStub({
      data: null,
      error: { code: 'PGRST116', message: 'no rows' },
    });
    authedWrite.mockResolvedValue({ profile: { id: 'user-Y' }, actor: 'user-Y', supa });

    const res = await GET(makeReq('conversation_id=conv-X'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'not_found' });

    // The IDOR guard itself: actor_id must have been part of the WHERE clause.
    const cols = eqCalls.map(([c]) => c);
    expect(cols).toContain('id');
    expect(cols).toContain('actor_id');
    const actorEq = eqCalls.find(([c]) => c === 'actor_id');
    expect(actorEq?.[1]).toBe('user-Y');
  });

  it('returns 200 with the conversation when the row belongs to the caller', async () => {
    const row = { id: 'conv-X', actor_id: 'user-Y', title: 't', messages: [] };
    const { supa } = buildSupaStub({ data: row, error: null });
    authedWrite.mockResolvedValue({ profile: { id: 'user-Y' }, actor: 'user-Y', supa });

    const res = await GET(makeReq('conversation_id=conv-X'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ conversation: row });
  });

  it('returns 500 lookup_failed when supabase errors with a non-PGRST116 code', async () => {
    // 42P01 = undefined_table. Anything that isn't PGRST116 must NOT be
    // misclassified as a 404 — that would mask real outages as "not found".
    const { supa } = buildSupaStub({
      data: null,
      error: { code: '42P01', message: 'relation does not exist' },
    });
    authedWrite.mockResolvedValue({ profile: { id: 'user-Y' }, actor: 'user-Y', supa });

    const res = await GET(makeReq('conversation_id=conv-X'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'lookup_failed' });
  });
});
