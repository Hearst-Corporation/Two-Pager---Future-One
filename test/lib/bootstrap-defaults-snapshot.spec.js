// test/lib/bootstrap-defaults-snapshot.spec.js
//
// ANTI-DRIFT GUARD — proves that relocating PUBLIC_SOURCES_LIBRARY to
// lib/oracle-intelligence/source-library.js produced ZERO change in the
// bootstrap engine defaults. Compares live output to the baseline captured
// BEFORE the migration.
//
// If this test fails: the relocation was NOT verbatim — fix the data, not the test.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bootstrapScenarioFromSources } from '@/lib/hearst-bootstrap.js';

// Versioned in-repo so the anti-drift guard runs on a fresh CI machine.
const BASELINE_PATH = fileURLToPath(new URL('../fixtures/bootstrap-baseline.json', import.meta.url));

const CASES = [
  { geography: 'qatar' },
  { geography: 'qatar', archetype_id: 'powered_shell' },
  { geography: 'mena' },
  { geography: 'global' },
  { geography: 'qatar', business_model_id: 'gpu_cloud' },
  { geography: 'qatar', mw_target: 250 },
];

describe('bootstrap-defaults-snapshot — zero drift after PSL relocation', () => {
  let baseline;

  try {
    baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));
  } catch (e) {
    throw new Error(`Cannot load baseline: ${BASELINE_PATH} — ${e.message}`);
  }

  for (const input of CASES) {
    const key = JSON.stringify(input);

    it(`matches baseline for ${key}`, async () => {
      const result = await bootstrapScenarioFromSources(input, []);
      const expected = baseline[key];

      if (!expected) {
        throw new Error(`No baseline entry for key: ${key}. Re-capture the baseline.`);
      }

      expect(result).toEqual(expected);
    });
  }
});
