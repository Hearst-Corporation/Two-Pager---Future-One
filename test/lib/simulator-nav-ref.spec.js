/**
 * simulator-nav-ref.spec.js
 *
 * Source-level guard: verifies that page.jsx resets resultsNavigationRef.current
 * to false when the pathname leaves /results, so the URL sync resumes on back-nav.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  fileURLToPath(new URL('../../app/(cockpit)/admin/hearst/simulator/page.jsx', import.meta.url)),
  'utf-8',
);

describe('SimulatorPage — resultsNavigationRef reset on back-navigation', () => {
  it('imports usePathname from next/navigation', () => {
    expect(src).toMatch(/usePathname/);
    expect(src).toMatch(/from ['"]next\/navigation['"]/);
  });

  it('declares resultsNavigationRef as useRef(false)', () => {
    expect(src).toMatch(/resultsNavigationRef\s*=\s*useRef\(false\)/);
  });

  it('resets resultsNavigationRef.current to false in a pathname-watching useEffect', () => {
    expect(src).toMatch(/resultsNavigationRef\.current\s*=\s*false/);

    // The dependency array of that effect must include pathname
    const pathnameEffectBlock = src.match(
      /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?resultsNavigationRef\.current\s*=\s*false[\s\S]*?\},\s*\[pathname\]\)/,
    );
    expect(pathnameEffectBlock).not.toBeNull();
  });

  it('guards the reset so it only fires when not on /results', () => {
    expect(src).toMatch(/!pathname\.includes\(['"]\/results['"]\)/);
  });

  it('URL-sync effect still guards on resultsNavigationRef.current', () => {
    // Regression: the existing guard must still be present
    expect(src).toMatch(/if\s*\(\s*resultsNavigationRef\.current\s*\)\s*return/);
  });

  it('URL sync depends on shareableSearch, not raw state', () => {
    expect(src).toMatch(/const shareableSearch = useMemo/);
    expect(src).toMatch(/\},\s*\[shareableSearch,\s*router\]\)/);
  });
});
