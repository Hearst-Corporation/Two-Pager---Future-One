/**
 * input-mode-switcher.spec.js — text segmented control, scoped CSS, toggle semantics.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const switcherSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/InputModeSwitcher.jsx', import.meta.url)),
  'utf-8',
);

const cssSrc = readFileSync(
  fileURLToPath(new URL('../../components/hearst/simulator/simulator-config.css', import.meta.url)),
  'utf-8',
);

describe('InputModeSwitcher — subtractive UI', () => {
  it('renders text-only segmented control (no icons, no unit spans)', () => {
    expect(switcherSrc).toMatch(/data-input-mode-segment/);
    expect(switcherSrc).toMatch(/data-input-mode-option/);
    expect(switcherSrc).toMatch(/\{m\.label\}/);
    expect(switcherSrc).not.toMatch(/<svg/);
    expect(switcherSrc).not.toMatch(/data-input-mode-icon/);
    expect(switcherSrc).not.toMatch(/data-input-mode-unit/);
    expect(switcherSrc).not.toMatch(/SIM_MODE_.*_UNIT/);
  });

  it('keeps canonical mode ids', () => {
    expect(switcherSrc).toMatch(/capital_first/);
    expect(switcherSrc).toMatch(/mw_first/);
    expect(switcherSrc).toMatch(/target_irr_first/);
  });

  it('uses scoped CSS, not inline styles', () => {
    expect(switcherSrc).toMatch(/import\s+['"]\.\/simulator-config\.css['"]/);
    expect(switcherSrc).not.toMatch(/style=\{\{/);
    expect(switcherSrc).not.toMatch(/cp-styles/);
  });

  it('defines segment styles under [data-input-mode-*] in simulator-config.css', () => {
    expect(cssSrc).toMatch(/\[data-input-mode-segment\]/);
    expect(cssSrc).toMatch(/\[data-input-mode-option\]\[aria-pressed="true"\]/);
    expect(cssSrc).not.toMatch(/\[data-input-mode-icon\]/);
    expect(cssSrc).not.toMatch(/--cp-tile-minh/);
  });
});

describe('InputModeSwitcher — accessibility', () => {
  it('uses toggle button group (aria-pressed)', () => {
    expect(switcherSrc).toMatch(/role="group"/);
    expect(switcherSrc).toMatch(/aria-pressed=\{pressed\}/);
    expect(switcherSrc).toMatch(/type="button"/);
    expect(switcherSrc).not.toMatch(/role="radio"/);
  });

  it('exposes focus-visible styles in scoped CSS', () => {
    expect(cssSrc).toMatch(/\[data-input-mode-option\]:focus-visible/);
  });
});
