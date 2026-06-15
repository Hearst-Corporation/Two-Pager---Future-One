/**
 * Guard: simulator cockpit uses flex height chain (no 100dvh hacks).
 * Scroll owner = [data-sim-config-v2] only.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function read(rel) {
  return readFileSync(`${root}/${rel}`, 'utf8');
}

describe('Simulator layout — flex chain, no viewport height hack', () => {
  const simCss = read('app/(cockpit)/admin/hearst/simulator/simulator.css');
  const responsive = read('app/(cockpit)/admin/hearst/oracle-responsive.css');
  const layout = read('app/(cockpit)/admin/hearst/oracle-layout.css');
  const configCss = read('components/hearst/simulator/simulator-config.css');

  it('does not use 100dvh on data-sim-cockpit', () => {
    expect(simCss).not.toMatch(/100dvh/);
    expect(simCss).not.toMatch(/sim-chrome-h/);
  });

  it('cockpit fills parent via flex, not fixed viewport height', () => {
    expect(simCss).toMatch(/\[data-sim-cockpit\][\s\S]*flex:\s*1\s+1\s+auto/);
    expect(simCss).toMatch(/\[data-sim-wrap\][\s\S]*flex:\s*1\s+1\s+auto/);
  });

  it('page-area does not scroll when simulator is mounted', () => {
    expect(responsive).toMatch(/\.ct-page-area:has\(\.oracle-simulator-page\)[\s\S]*overflow:\s*hidden/);
  });

  it('simulator page does not claim page-level scroll', () => {
    expect(layout).toMatch(/\.oracle-page\.oracle-simulator-page[\s\S]*overflow:\s*hidden/);
    expect(responsive).toMatch(/\.oracle-page\.oracle-simulator-page[\s\S]*overflow:\s*hidden/);
  });

  it('config panel is the internal scroller', () => {
    expect(configCss).toMatch(/\[data-sim-config-v2\][\s\S]*overflow-y:\s*auto/);
  });

  it('2-col right panel pins decision CTA while KPIs scroll', () => {
    expect(simCss).toMatch(/@container sim \(min-width: 860px\)[\s\S]*\[data-decision-ctrl\][\s\S]*flex:\s*0\s+0\s+auto/);
  });
});
