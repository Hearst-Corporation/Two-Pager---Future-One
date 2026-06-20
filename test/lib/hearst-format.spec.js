import { describe, expect, it } from 'vitest';
import {
  MISSING,
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtX,
  fmtMW,
  fmtYears,
} from '../../lib/hearst-format';

describe('hearst-format', () => {
  it('uses the shared missing token', () => {
    expect(MISSING).toBe('—');
    expect(fmtUSD(null)).toBe(MISSING);
  });

  it('formats USD with sign before currency', () => {
    expect(fmtUSD(-1_200_000_000)).toBe('-$1.20B');
    expect(fmtUSD(45_000_000)).toBe('$45.0M');
  });

  it('formats ratios and multipliers consistently', () => {
    expect(fmtPctFromRatio(0.125)).toBe('12.5%');
    expect(fmtPctRaw(60)).toBe('60.0%');
    expect(fmtX(2.345)).toBe('2.35×');
  });

  it('formats MW and years', () => {
    expect(fmtMW(150, 0)).toBe('150 MW');
    expect(fmtYears(4.5)).toBe('4.5 yrs');
  });
});
