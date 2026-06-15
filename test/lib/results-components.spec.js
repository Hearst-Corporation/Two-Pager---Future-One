/**
 * results-components.spec.js — Results widgets use CSS, not const S inline blob.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const resultsSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/results/index.jsx', import.meta.url)),
  'utf-8',
);

const cssSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/results/results-components.css', import.meta.url)),
  'utf-8',
);

describe('results/index — CSS migration', () => {
  it('imports results-components.css and exposes data hooks', () => {
    expect(resultsSrc).toMatch(/import\s+['"]\.\/results-components\.css['"]/);
    expect(resultsSrc).toMatch(/data-decision-header/);
    expect(resultsSrc).toMatch(/data-kpi-value/);
    expect(resultsSrc).toMatch(/data-capital-donut/);
  });

  it('does not use inline style object blob', () => {
    expect(resultsSrc).not.toMatch(/const S = \{/);
    expect(resultsSrc).not.toMatch(/style=\{S\./);
  });

  it('styles live in results-components.css', () => {
    expect(cssSrc).toMatch(/\.res-kpi-cell/);
    expect(cssSrc).toMatch(/\[data-decision-kpis\]/);
    expect(cssSrc).toMatch(/\.res-board-metric/);
  });
});
