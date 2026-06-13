// test/api/project-seed.spec.js
// Verifies GET /api/admin/hearst/project cold-start auto-seed is idempotent:
// concurrent calls must not produce duplicate inserts.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist: block server-only and noisy deps ───────────────────────────────────
vi.mock('server-only', () => ({}));

vi.mock('@/lib/hearst-constants', () => ({
  DATA_ROOM_REQUIRED: [],
  PUBLIC_SOURCES_LIBRARY: [],
}));

vi.mock('@/lib/validators/withValidation', () => ({
  withValidation: (_schema, fn) => fn,
}));

vi.mock('@/lib/validators/hearst', () => ({
  ProjectUpdateSchema: {},
}));

// ── Mutable state shared across tests ────────────────────────────────────────
const state = {
  // Each fetchProject call pops from this array; last entry is reused when empty.
  fetchQueue: [],
  insertResult: null,
  insertCallCount: 0,
};

// ── Module-level mock for supabase-admin ──────────────────────────────────────
vi.mock('@/lib/supabase-admin', () => ({
  requireProfile: vi.fn(async () => ({ profile: { id: 'u1', role: 'viewer' } })),
  authedWrite: vi.fn(),
  getAdminClient: vi.fn(() => {
    const makeChain = () => {
      const self = {
        select: () => self,
        limit: () => ({
          // fetchProject awaits the query object directly (chain without .single())
          then: (resolve) => {
            const queue = state.fetchQueue;
            const result = queue.length > 1 ? queue.shift() : queue[0];
            return Promise.resolve({ data: result ?? [] }).then(resolve);
          },
        }),
        insert: () => {
          state.insertCallCount++;
          return {
            select: () => ({
              single: () => Promise.resolve(state.insertResult),
            }),
          };
        },
        update: () => ({ eq: () => ({}) }),
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        single: () => Promise.resolve({ data: null, error: null }),
      };
      return self;
    };
    return { from: () => makeChain() };
  }),
}));

// ── Import route AFTER mocks ──────────────────────────────────────────────────
import { GET } from '@/app/api/admin/hearst/project/route.js';

const SEEDED_PROJECT = {
  id: 'proj-1',
  name: 'HEARST Qatar AI & Data Center Hub',
  hearst_scenarios: [
    { id: 's-1', name: 'Base Case', scenario_type: 'base', is_active: true },
  ],
};

describe('GET /api/admin/hearst/project — cold-start idempotency', () => {
  beforeEach(() => {
    state.fetchQueue = [];
    state.insertResult = null;
    state.insertCallCount = 0;
  });

  it('returns existing project without inserting when project already exists', async () => {
    // fetchProject returns a row immediately — no seed path entered
    state.fetchQueue = [[SEEDED_PROJECT]];

    const res = await GET();
    const body = await res.json();

    expect(state.insertCallCount).toBe(0);
    expect(body.project.id).toBe('proj-1');
  });

  it('does NOT double-insert when raceCheck finds row before insert', async () => {
    // Sequence: initial fetchProject → empty, raceCheck → has row (other request seeded)
    state.fetchQueue = [[], [SEEDED_PROJECT]];
    state.insertResult = { data: SEEDED_PROJECT, error: null };

    const res = await GET();
    const body = await res.json();

    // raceCheck found the row so insert was skipped
    expect(state.insertCallCount).toBe(0);
    expect(body.project.id).toBe('proj-1');
  });

  it('handles unique_violation (23505) by re-fetching and returning existing row', async () => {
    // initial fetch: empty, raceCheck: empty (narrow window), insert: 23505,
    // then recovery re-fetch: has project
    state.fetchQueue = [[], [], [SEEDED_PROJECT]];
    state.insertResult = {
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    };

    const res = await GET();
    const body = await res.json();

    expect(state.insertCallCount).toBe(1); // insert attempted once
    expect(body.project.id).toBe('proj-1'); // graceful recovery
  });

  it('returns 500 on unexpected insert error', async () => {
    state.fetchQueue = [[], []]; // initial + raceCheck both empty
    state.insertResult = {
      data: null,
      error: { code: '42501', message: 'permission denied' },
    };

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    // dbErrorResponse returns a sanitised { error: 'database_error' } — not the raw message
    expect(body.error).toBe('database_error');
  });
});
