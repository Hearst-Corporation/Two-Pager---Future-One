// test/api/auth-guards-wiring.spec.js
// Verify that lib/auth-guards.js → requireRowOwnership is wired into [id] routes.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../../');

const ROUTES = [
  'app/api/admin/hearst/sources/[id]/route.js',
  'app/api/admin/hearst/scenarios/[id]/route.js',
  'app/api/admin/hearst/strategic-memos/[id]/route.js',
  'app/api/admin/hearst/strategic-memos/[id]/pdf/route.js',
];

describe('requireRowOwnership wired into [id] routes', () => {
  for (const rel of ROUTES) {
    it(`${rel} imports requireRowOwnership`, () => {
      const src = readFileSync(path.join(root, rel), 'utf8');
      expect(src).toMatch(/requireRowOwnership/);
    });
  }
});
