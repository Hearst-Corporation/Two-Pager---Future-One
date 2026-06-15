/**
 * Guards stale-while-revalidate: projection must not be wiped on every config tick.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pageSrc = readFileSync(
  fileURLToPath(new URL('../../app/(cockpit)/admin/hearst/simulator/page.jsx', import.meta.url)),
  'utf-8',
);

describe('simulator page — projection stale guard', () => {
  it('tracks resultSimKey vs configSimKey (no sync setSimResult(null) on state)', () => {
    expect(pageSrc).toMatch(/const configSimKey = useMemo/);
    expect(pageSrc).toMatch(/const \[resultSimKey, setResultSimKey\]/);
    expect(pageSrc).toMatch(/const projectionStale = resultSimKey !== configSimKey/);
    expect(pageSrc).not.toMatch(/setDirtySinceSave\(true\)[\s\S]{0,120}setSimResult\(null\)/);
  });

  it('blocks validate while projection is stale', () => {
    expect(pageSrc).toMatch(/projectionStale \|\| !projectId/);
    expect(pageSrc).toMatch(/validateBlocked = !projection \|\| projectionStale/);
  });
});

describe('simulator page — URL sync', () => {
  it('debounces router.replace and skips unchanged query strings', () => {
    expect(pageSrc).toMatch(/const shareableSearch = useMemo/);
    expect(pageSrc).toMatch(/shareableSearch === lastSyncedUrlRef\.current/);
    expect(pageSrc).toMatch(/urlSyncRef\.current = setTimeout/);
    expect(pageSrc).not.toMatch(/\},\s*\[state,\s*savedScenarioId,\s*router\]\s*\);\s*\n\s*const projection/);
  });
});
