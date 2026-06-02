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

