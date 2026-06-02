// test/lib/auth-guards.spec.js
//
// Unit tests for requireRowOwnership() in lib/auth-guards.js.
//
// The function THROWS a `Response` on every error path (404 / 403 / 500).
// Callers catch it and `return err` when `err instanceof Response`.
//
// Mock pattern mirrors test/api/idor.spec.js — module-boundary mock of
// `@/lib/supabase-admin` with a chainable builder whose `.maybeSingle()`
// resolves from mutable `state.lookupResult`.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mutable lookup result read by the mocked getAdminClient.
const state = {
  lookupResult: null, // { data, error }
};

// --- Module-level mock (hoisted by Vitest) ------------------------------------

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(state.lookupResult),
    })),
  }),
}));

// --- Helpers ------------------------------------------------------------------

async function readThrownResponse(fn) {
  try {
    await fn();
    return null; // did not throw
  } catch (err) {
    if (err instanceof Response) {
      const text = await err.text();
      let body = null;
      try { body = JSON.parse(text); } catch { /* keep null */ }
      return { status: err.status, body };
    }
    throw err; // unexpected non-Response throw — let Vitest surface it
  }
}

// Import after vi.mock so the hoisted mock is in place.
const { requireRowOwnership } = await import('@/lib/auth-guards');

// --- Tests --------------------------------------------------------------------

describe('requireRowOwnership()', () => {
  beforeEach(() => {
    state.lookupResult = null;
  });

  // -------------------------------------------------------------------------
  // 404 — row absent
  // -------------------------------------------------------------------------
  it('throws 404 not_found when the row does not exist', async () => {
    state.lookupResult = { data: null, error: null };

    const result = await readThrownResponse(() =>
      requireRowOwnership({
        table: 'comments',
        id: 'missing-id',
        actorId: 'userA',
        ownerColumn: 'author_id',
      }),
    );

    expect(result).not.toBeNull();
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: 'not_found' });
  });

  // -------------------------------------------------------------------------
  // 500 — DB error
  // -------------------------------------------------------------------------
  it('throws 500 lookup_failed when supabase returns an error', async () => {
    state.lookupResult = { data: null, error: { message: 'connection refused' } };

    const result = await readThrownResponse(() =>
      requireRowOwnership({
        table: 'comments',
        id: 'any-id',
        actorId: 'userA',
        ownerColumn: 'author_id',
      }),
    );

    expect(result).not.toBeNull();
    expect(result.status).toBe(500);
    expect(result.body.error).toBe('lookup_failed');
    expect(result.body.detail).toBe('connection refused');
  });

  // -------------------------------------------------------------------------
  // 403 — owner mismatch (the core security path)
  // -------------------------------------------------------------------------
  it('throws 403 forbidden when actorId does not match ownerColumn (allowSharedWorkspace omitted)', async () => {
    state.lookupResult = { data: { id: 'row1', author_id: 'userB', text: 'hello' }, error: null };

    const result = await readThrownResponse(() =>
      requireRowOwnership({
        table: 'comments',
        id: 'row1',
        actorId: 'userA',           // ≠ row.author_id ('userB')
        ownerColumn: 'author_id',
        // allowSharedWorkspace defaults to false
      }),
    );

    expect(result).not.toBeNull();
    expect(result.status).toBe(403);
    expect(result.body).toEqual({ error: 'forbidden' });
  });

  it('throws 403 forbidden when actorId does not match ownerColumn (allowSharedWorkspace:false explicit)', async () => {
    state.lookupResult = { data: { id: 'row2', owner_id: 'ownerX' }, error: null };

    const result = await readThrownResponse(() =>
      requireRowOwnership({
        table: 'hearst_advisor_conversations',
        id: 'row2',
        actorId: 'intruder',
        ownerColumn: 'owner_id',
        allowSharedWorkspace: false,
      }),
    );

    expect(result).not.toBeNull();
    expect(result.status).toBe(403);
    expect(result.body).toEqual({ error: 'forbidden' });
  });

  // -------------------------------------------------------------------------
  // Nominal — owner matches → returns the row
  // -------------------------------------------------------------------------
  it('returns the row when actorId matches ownerColumn', async () => {
    const row = { id: 'row3', author_id: 'userA', text: 'mine' };
    state.lookupResult = { data: row, error: null };

    const returned = await requireRowOwnership({
      table: 'comments',
      id: 'row3',
      actorId: 'userA',
      ownerColumn: 'author_id',
      allowSharedWorkspace: false,
    });

    expect(returned).toEqual(row);
  });

  // -------------------------------------------------------------------------
  // allowSharedWorkspace:true — foreign owner is fine, 403 never thrown
  // -------------------------------------------------------------------------
  it('returns the row without 403 when allowSharedWorkspace:true even if owner differs', async () => {
    const row = { id: 'row4', created_by: 'someoneElse', title: 'shared' };
    state.lookupResult = { data: row, error: null };

    const returned = await requireRowOwnership({
      table: 'hearst_scenarios',
      id: 'row4',
      actorId: 'userA',           // different from any owner column
      allowSharedWorkspace: true,
    });

    expect(returned).toEqual(row);
  });

  // -------------------------------------------------------------------------
  // Admin bypass — role:'admin' outrepassses ownership check
  // -------------------------------------------------------------------------
  it('returns the row for an admin even if ownerColumn does not match actorId', async () => {
    const row = { id: 'row5', author_id: 'userB', text: 'restricted' };
    state.lookupResult = { data: row, error: null };

    const returned = await requireRowOwnership({
      table: 'comments',
      id: 'row5',
      actorId: 'adminUser',
      ownerColumn: 'author_id',
      allowSharedWorkspace: false,
      adminProfile: { id: 'adminUser', role: 'admin' },
    });

    expect(returned).toEqual(row);
  });

  it('does NOT bypass ownership for a non-admin profile (role:editor)', async () => {
    state.lookupResult = { data: { id: 'row6', author_id: 'userC' }, error: null };

    const result = await readThrownResponse(() =>
      requireRowOwnership({
        table: 'comments',
        id: 'row6',
        actorId: 'userA',
        ownerColumn: 'author_id',
        allowSharedWorkspace: false,
        adminProfile: { id: 'userA', role: 'editor' },
      }),
    );

    expect(result).not.toBeNull();
    expect(result.status).toBe(403);
    expect(result.body).toEqual({ error: 'forbidden' });
  });

  // -------------------------------------------------------------------------
  // Bad args guard (missing required params)
  // -------------------------------------------------------------------------
  it('throws 500 bad_guard_args when required params are missing', async () => {
    const result = await readThrownResponse(() =>
      requireRowOwnership({
        table: 'comments',
        // id missing
        actorId: 'userA',
      }),
    );

    expect(result).not.toBeNull();
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: 'bad_guard_args' });
  });

  // -------------------------------------------------------------------------
  // Schema prefix stripping — 'crm.comments' must behave identically
  // -------------------------------------------------------------------------
  it('strips schema prefix from fully-qualified table names', async () => {
    const row = { id: 'row7', author_id: 'userA' };
    state.lookupResult = { data: row, error: null };

    const returned = await requireRowOwnership({
      table: 'crm.comments',      // fully-qualified — schema should be stripped
      id: 'row7',
      actorId: 'userA',
      ownerColumn: 'author_id',
    });

    expect(returned).toEqual(row);
  });
});
