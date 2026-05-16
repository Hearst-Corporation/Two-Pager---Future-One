// test/api/advisor-idor.spec.js
// Static-source regression test for the IDOR fix on the advisor GET route.
//
// The advisor GET handler has two branches:
//   1) ?conversation_id=<uuid>  → fetch a single conversation
//   2) ?project_id=<uuid>       → list recent conversations for the actor
//
// Both branches MUST scope the query by actor_id, otherwise any editor can
// read another user's advisor history. Because the route runs through the
// service-role Supabase client (RLS bypassed), the filter has to live in
// application code. We don't have an easy integration harness against
// Supabase here, so we assert the guard by reading the source file.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('advisor GET — IDOR guard', () => {
  const src = readFileSync(
    path.resolve(__dirname, '../../app/api/admin/hearst/advisor/route.js'),
    'utf8',
  );

  it('list branch filters by actor_id', () => {
    // The list branch builds a query on hearst_advisor_conversations and
    // must restrict it to the calling actor.
    expect(src).toMatch(/\.eq\(['"]actor_id['"]/);
  });

  it('single-conversation branch filters by actor_id', () => {
    // We need >= 2 occurrences of .eq('actor_id', …):
    //   • one for the single-row fetch (conversation_id branch)
    //   • one for the project_id list branch
    const matches = src.match(/\.eq\(['"]actor_id['"]/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
