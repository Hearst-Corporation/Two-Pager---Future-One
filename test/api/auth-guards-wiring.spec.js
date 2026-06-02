// test/api/auth-guards-wiring.spec.js
// Verify that lib/auth-guards.js → requireRowOwnership is actually wired into
// the destructive DELETE handlers of the routes that were flagged in the
// IDOR audit. We assert on the source so the wiring can't silently regress
// without us noticing.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../../');

describe('requireRowOwnership wired into destructive routes', () => {
  it('sources [id] DELETE imports auth-guards', () => {
    const src = readFileSync(path.join(root, 'app/api/admin/hearst/sources/[id]/route.js'), 'utf8');
    expect(src).toMatch(/requireRowOwnership/);
  });

});
