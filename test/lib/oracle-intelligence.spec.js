// Regression guards for lib/oracle-intelligence/query.js
// Recovered from wave1-advisor-and-intelligence.spec.js (reality + comparables only).
// No dependency on app/api/admin/hearst/advisor/route.js.

import { describe, it, expect } from 'vitest';
import { detectRealityViolations, selectComparableProfiles } from '@/lib/oracle-intelligence/query.js';

describe('Reality layer — timeline violation detection still works', () => {
  it('flags supply-chain/grid violations on an aggressive 12-month COD', () => {
    const violations = detectRealityViolations({
      months_to_cod: 12, region: 'qatar', has_liquid_cooling: true, gpu_sku: 'gb200',
    });
    expect(Array.isArray(violations)).toBe(true);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toHaveProperty('constraint');
    expect(violations[0]).toHaveProperty('severity');
  });
});

describe('Comparables — archetype selection returns structured peers', () => {
  it('returns GPU-cloud peers for a neocloud archetype', () => {
    const profiles = selectComparableProfiles({ archetype_id: 'neocloud_gpu', gpu_focus: true });
    expect(profiles.length).toBeGreaterThan(0);
    profiles.forEach(p => { expect(p).toHaveProperty('entity_id'); expect(p).toHaveProperty('profile'); });
    expect(profiles.map(p => p.entity_id)).toContain('coreweave');
  });
});
