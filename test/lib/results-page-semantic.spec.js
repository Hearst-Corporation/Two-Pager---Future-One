/**
 * Guard: results page uses semantic landmarks (not div as="header").
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pageSrc = readFileSync(
  fileURLToPath(new URL('../../app/(cockpit)/admin/hearst/simulator/results/page.jsx', import.meta.url)),
  'utf-8',
);

describe('Results page — semantic landmarks', () => {
  it('uses <header data-results-hero>', () => {
    expect(pageSrc).toMatch(/<header\s+data-results-hero/);
    expect(pageSrc).not.toMatch(/<div\s+as="header"/);
  });

  it('uses <section> for content blocks', () => {
    expect(pageSrc).toMatch(/<section\s+style=/);
    expect(pageSrc).not.toMatch(/<div\s+as="section"/);
  });
});
