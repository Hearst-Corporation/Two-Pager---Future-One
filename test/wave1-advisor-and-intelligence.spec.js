// Wave 1 — advisor route C3 fix (static smoke) + reality-layer / comparables
// regression guards (surfaces kept in the safe-demo set).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detectRealityViolations, selectComparableProfiles } from '../lib/oracle-intelligence/query.js';

const here = dirname(fileURLToPath(import.meta.url));
const advisorSrc = readFileSync(join(here, '../app/api/admin/hearst/advisor/route.js'), 'utf8');

describe('C3 — advisor no longer references an undeclared `body`', () => {
  it('uses the validated `parsed` object for oracle context', () => {
    expect(advisorSrc).toMatch(/parsed\?\.oracle\?\.stakeholder/);
  });
  it('contains no bare `body?.oracle` reference (the ReferenceError source)', () => {
    expect(advisorSrc).not.toMatch(/\bbody\?\.oracle/);
  });
  it('is gated by SAFE_DEMO_MODE', () => {
    expect(advisorSrc).toMatch(/isSafeDemoMode\(\)/);
  });
});

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
