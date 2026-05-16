// test/api/idor.spec.js
// Behavioural regression tests for the IDOR guards wired into destructive
// admin routes via `lib/auth-guards.js → requireRowOwnership`.
//
// These tests import the route handlers directly and call them with a
// mocked `authedWrite` / `getAdminClient` so we exercise the actual
// branch logic without standing up a database.
//
// Mock pattern follows docs/testing.md — module-boundary mocks via vi.mock.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mutable state the mocked helpers will read from. Each test mutates these
// before invoking the route handler.
const state = {
  auth: null,           // value returned by authedWrite (route-side)
  lookupResult: null,   // { data, error } returned by the helper's maybeSingle()
};

// --- Module-level mocks (hoisted by Vitest) ----------------------------------

vi.mock('@/lib/supabase-admin', () => {
  // The route's `auth.supa` chain needs to be callable but inert: any
  // mutation after the ownership guard returns success is exercised here
  // and must resolve cleanly.
  const supa = {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  };

  return {
    // requireRowOwnership() uses this client for the lookup.
    getAdminClient: () => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(state.lookupResult),
      })),
    }),
    // Routes call authedWrite() to grab actor + supabase client.
    authedWrite: vi.fn(async () => ({
      ...state.auth,
      supa,
    })),
    requireProfile: vi.fn(),
  };
});

// --- Helpers -----------------------------------------------------------------

function buildJsonRequest(body) {
  // Minimal stub mimicking the surface the route handlers touch.
  return { json: async () => body };
}

async function readResponse(res) {
  // Both NextResponse.json() and `new Response(JSON.stringify(...))` carry
  // a json body we can parse from text().
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* keep null */ }
  return { status: res.status, body: parsed };
}

// --- Tests -------------------------------------------------------------------

describe('IDOR — DELETE /api/admin/documents', () => {
  beforeEach(() => {
    state.auth = null;
    state.lookupResult = null;
  });

  it('returns 403 when a non-owner editor tries to delete another user\'s document', async () => {
    state.auth = { actor: 'userB', profile: { id: 'userB', role: 'editor' } };
    state.lookupResult = { data: { id: 'doc1', actor_id: 'userA' }, error: null };

    const { DELETE } = await import('@/app/api/admin/documents/route.js');
    const res = await DELETE(buildJsonRequest({ id: 'doc1' }));
    const { status, body } = await readResponse(res);

    expect(status).toBe(403);
    expect(body).toEqual({ error: 'forbidden' });
  });

  it('allows an admin to delete a document uploaded by another user (bypass)', async () => {
    state.auth = { actor: 'adminUser', profile: { id: 'adminUser', role: 'admin' } };
    state.lookupResult = { data: { id: 'doc1', actor_id: 'userA' }, error: null };

    const { DELETE } = await import('@/app/api/admin/documents/route.js');
    const res = await DELETE(buildJsonRequest({ id: 'doc1' }));
    const { status, body } = await readResponse(res);

    expect(status).not.toBe(403);
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });
});

describe('IDOR — DELETE /api/admin/hearst/sources/[id]', () => {
  beforeEach(() => {
    state.auth = null;
    state.lookupResult = null;
  });

  it('returns 404 when the source does not exist', async () => {
    state.auth = { actor: 'userA', profile: { id: 'userA', role: 'editor' } };
    state.lookupResult = { data: null, error: null };

    const mod = await import('@/app/api/admin/hearst/sources/[id]/route.js');
    const res = await mod.DELETE(buildJsonRequest({}), { params: { id: 'missing' } });
    const { status, body } = await readResponse(res);

    expect(status).toBe(404);
    expect(body).toEqual({ error: 'not_found' });
  });
});

describe('DELETE /api/admin/hearst/contracts/[id]', () => {
  beforeEach(() => {
    state.auth = null;
    state.lookupResult = null;
  });

  it('returns 404 when the contract does not exist', async () => {
    // requireRowOwnership() → getAdminClient().from(...).maybeSingle() resolves
    // to { data: null }, which the guard turns into a 404 Response.
    state.auth = { actor: 'adminUser', profile: { id: 'adminUser', role: 'admin' } };
    state.lookupResult = { data: null, error: null };

    const mod = await import('@/app/api/admin/hearst/contracts/[id]/route.js');
    const res = await mod.DELETE(buildJsonRequest({}), { params: { id: 'missing' } });
    const { status, body } = await readResponse(res);

    expect(status).toBe(404);
    expect(body).toEqual({ error: 'not_found' });
  });

  it('returns 200 ok on the happy path (existing row, guard passes)', async () => {
    // Existence-only check (allowSharedWorkspace: true). The supa mock's
    // delete().eq() chain resolves with { error: null } so the route returns
    // { ok: true }.
    state.auth = { actor: 'editorUser', profile: { id: 'editorUser', role: 'editor' } };
    state.lookupResult = { data: { id: 'contract1', actor_id: 'someoneElse' }, error: null };

    const mod = await import('@/app/api/admin/hearst/contracts/[id]/route.js');
    const res = await mod.DELETE(buildJsonRequest({}), { params: { id: 'contract1' } });
    const { status, body } = await readResponse(res);

    expect(status).not.toBe(403);
    expect(status).not.toBe(404);
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('still allows any editor to delete (shared-workspace model, no ownership check)', async () => {
    // Different actor than the lookup row — allowSharedWorkspace: true must
    // skip the ownership check so this should still succeed (NOT 403).
    state.auth = { actor: 'editorB', profile: { id: 'editorB', role: 'editor' } };
    state.lookupResult = { data: { id: 'contract2', actor_id: 'totallyDifferentUser', owner_id: 'someOtherUser' }, error: null };

    const mod = await import('@/app/api/admin/hearst/contracts/[id]/route.js');
    const res = await mod.DELETE(buildJsonRequest({}), { params: { id: 'contract2' } });
    const { status, body } = await readResponse(res);

    expect(status).not.toBe(403);
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });
});
