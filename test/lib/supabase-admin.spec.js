// test/lib/supabase-admin.spec.js
// Security branch coverage for requireProfile() and authedWrite().
//
// Mechanism under test (lib/supabase-admin.js):
//   requireProfile — line 30: NextResponse.json({error:'Not authenticated'},{status:401})
//                    line 33: NextResponse.json({error:'Forbidden'},{status:403})
//                    line 35: return { profile: session.profile }  (success POJO)
//   authedWrite   — line 50: if (r instanceof NextResponse) return r  (propagate)
//                    line 51: return { profile, actor: r.profile.id, supa: getAdminClient() }
//
// The ONLY external dependency cut is getSessionProfile from @/lib/supabase-server.
// getAdminClient calls createClient — mocked to avoid missing env-var throws.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoisted module mocks ----------------------------------------------------

vi.mock('@/lib/supabase-server', () => ({
  getSessionProfile: vi.fn(),
}));

// Prevent getAdminClient() from throwing on missing env vars.
// The guard checks process.env before calling createClient, so set stubs.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

// Stub env vars required by getAdminClient's guard (lines 10-13).
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://stub.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';

// --- Lazy imports (after mocks are hoisted) ----------------------------------

import { getSessionProfile } from '@/lib/supabase-server';
import { requireProfile, authedWrite } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

// --- Helpers -----------------------------------------------------------------

/** Read status + json body from a NextResponse returned by the functions. */
async function readNR(nr) {
  return { status: nr.status, body: await nr.json() };
}

/** Build a mock session whose profile has the given role and id. */
function mockSession(role, id = 'u1') {
  return { profile: { id, role } };
}

// --- requireProfile ----------------------------------------------------------

describe('requireProfile', () => {
  beforeEach(() => vi.resetAllMocks());

  // 1. 401 — no session
  it('returns NextResponse 401 when getSessionProfile returns null', async () => {
    getSessionProfile.mockResolvedValue(null);
    const result = await requireProfile();
    expect(result instanceof NextResponse).toBe(true);
    const { status, body } = await readNR(result);
    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Not authenticated' });
  });

  // 2. 403 — viewer requesting editor
  it('returns NextResponse 403 when viewer calls requireProfile("editor")', async () => {
    getSessionProfile.mockResolvedValue(mockSession('viewer'));
    const result = await requireProfile('editor');
    expect(result instanceof NextResponse).toBe(true);
    const { status, body } = await readNR(result);
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  // 3. 403 — viewer requesting admin
  it('returns NextResponse 403 when viewer calls requireProfile("admin")', async () => {
    getSessionProfile.mockResolvedValue(mockSession('viewer'));
    const result = await requireProfile('admin');
    expect(result instanceof NextResponse).toBe(true);
    const { status, body } = await readNR(result);
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  // 4. 403 — editor requesting admin
  it('returns NextResponse 403 when editor calls requireProfile("admin")', async () => {
    getSessionProfile.mockResolvedValue(mockSession('editor'));
    const result = await requireProfile('admin');
    expect(result instanceof NextResponse).toBe(true);
    const { status, body } = await readNR(result);
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  // 5. success — exact role match (editor === editor)
  it('returns POJO {profile} when editor calls requireProfile("editor")', async () => {
    const session = mockSession('editor');
    getSessionProfile.mockResolvedValue(session);
    const result = await requireProfile('editor');
    expect(result instanceof NextResponse).toBe(false);
    expect(result).toEqual({ profile: session.profile });
  });

  // 6. success — admin >= editor (hierarchy)
  it('returns POJO {profile} when admin calls requireProfile("editor")', async () => {
    const session = mockSession('admin');
    getSessionProfile.mockResolvedValue(session);
    const result = await requireProfile('editor');
    expect(result instanceof NextResponse).toBe(false);
    expect(result).toEqual({ profile: session.profile });
  });

  // 7. success — default role is viewer (any authenticated user passes)
  it('returns POJO {profile} when viewer calls requireProfile() (default=viewer)', async () => {
    const session = mockSession('viewer');
    getSessionProfile.mockResolvedValue(session);
    const result = await requireProfile();
    expect(result instanceof NextResponse).toBe(false);
    expect(result).toEqual({ profile: session.profile });
  });
});

// --- authedWrite -------------------------------------------------------------

describe('authedWrite', () => {
  beforeEach(() => vi.resetAllMocks());

  // 8. propagates 401
  it('propagates NextResponse 401 when getSessionProfile returns null', async () => {
    getSessionProfile.mockResolvedValue(null);
    const result = await authedWrite('editor');
    expect(result instanceof NextResponse).toBe(true);
    const { status, body } = await readNR(result);
    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Not authenticated' });
  });

  // 9. propagates 403
  it('propagates NextResponse 403 when viewer calls authedWrite("editor")', async () => {
    getSessionProfile.mockResolvedValue(mockSession('viewer'));
    const result = await authedWrite('editor');
    expect(result instanceof NextResponse).toBe(true);
    const { status, body } = await readNR(result);
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  // 10. success — editor calling authedWrite('editor'), actor === profile.id
  it('returns {profile, actor, supa} when editor calls authedWrite("editor")', async () => {
    const session = mockSession('editor', 'u1');
    getSessionProfile.mockResolvedValue(session);
    const result = await authedWrite('editor');
    expect(result instanceof NextResponse).toBe(false);
    expect(result.profile).toEqual(session.profile);
    expect(result.actor).toBe('u1');
    expect(result.supa).toBeTruthy();
  });

  // 11. success — admin calling authedWrite('editor'), actor === profile.id
  it('returns {profile, actor, supa} when admin calls authedWrite("editor")', async () => {
    const session = mockSession('admin', 'adminId');
    getSessionProfile.mockResolvedValue(session);
    const result = await authedWrite('editor');
    expect(result instanceof NextResponse).toBe(false);
    expect(result.profile).toEqual(session.profile);
    expect(result.actor).toBe('adminId');
    expect(result.supa).toBeTruthy();
  });
});
