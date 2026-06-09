// Unit tests for lib/returns-composition.js
//
// Covers:
//   1. Sale-mode short-circuit (sale_mode flag) → valid:false, saleMode:true, note present.
//   2. Sale-mode short-circuit (sale_proceeds_net without terminal_value_to_equity) → same.
//   3. Recurring hold (terminal_value_to_equity present) → valid:true, pcts sum to 1.
//   4. No-data path → valid:false, no saleMode.

import { describe, it, expect } from 'vitest';
import { computeReturnsComposition, returnsCompositionLabel } from '@/lib/returns-composition.js';

// ── Sale-mode tests ───────────────────────────────────────────────────────────

describe('computeReturnsComposition — sale-mode', () => {
  it('returns valid:false + saleMode:true when sale_mode flag is set', () => {
    const proj = {
      sale_mode: true,
      sale_proceeds_net: 50_000_000,
      terminal_value: 55_000_000,
      years: [
        { free_cash_flow: 5_000_000 },
        { free_cash_flow: 6_000_000 },
      ],
    };
    const result = computeReturnsComposition(proj);
    expect(result.valid).toBe(false);
    expect(result.saleMode).toBe(true);
    expect(result.operationsPct).toBeNull();
    expect(result.terminalPct).toBeNull();
    expect(typeof result.note).toBe('string');
    expect(result.note.length).toBeGreaterThan(0);
  });

  it('returns valid:false + saleMode:true when sale_proceeds_net present without terminal_value_to_equity', () => {
    // This covers sale_leaseback projections that expose sale_proceeds_net
    // but no terminal_value_to_equity (the recurring-hold field).
    const proj = {
      sale_proceeds_net: 80_000_000,
      // no sale_mode flag, no terminal_value_to_equity
      years: [
        { free_cash_flow_post_tax: 4_000_000 },
        { free_cash_flow_post_tax: 5_000_000 },
      ],
      remaining_debt_at_exit: 20_000_000,
    };
    const result = computeReturnsComposition(proj);
    expect(result.valid).toBe(false);
    expect(result.saleMode).toBe(true);
    expect(result.operationsPct).toBeNull();
    expect(result.terminalPct).toBeNull();
    expect(typeof result.note).toBe('string');
  });

  it('does NOT trigger sale-mode when terminal_value_to_equity is also present (recurring hold with sale_proceeds_net set by mistake)', () => {
    // terminal_value_to_equity takes precedence — this is a recurring hold deal, not a flip.
    const proj = {
      sale_proceeds_net: 10_000_000,
      terminal_value_to_equity: 40_000_000,
      years: [
        { free_cash_flow_post_tax: 5_000_000 },
        { free_cash_flow_post_tax: 5_000_000 },
      ],
    };
    const result = computeReturnsComposition(proj);
    // Should take the recurring path — sale_proceeds_net ignored because terminal_value_to_equity present
    expect(result.saleMode).toBeUndefined();
    expect(result.valid).toBe(true);
  });
});

// ── Recurring hold tests ──────────────────────────────────────────────────────

describe('computeReturnsComposition — recurring hold', () => {
  it('returns valid:true with pcts summing to 1 for a normal deal', () => {
    const proj = {
      terminal_value_to_equity: 60_000_000,
      years: [
        { free_cash_flow_post_tax: 5_000_000 },
        { free_cash_flow_post_tax: 5_000_000 },
        { free_cash_flow_post_tax: 5_000_000 },
      ],
    };
    const result = computeReturnsComposition(proj);
    expect(result.valid).toBe(true);
    expect(result.saleMode).toBeUndefined();
    expect(result.note).toBeUndefined();
    // Sum of pcts should be exactly 1 (floating-point tolerance)
    expect(result.operationsPct + result.terminalPct).toBeCloseTo(1, 10);
    // Ops = 15M / 75M = 0.2; Terminal = 60M / 75M = 0.8
    expect(result.operationsPct).toBeCloseTo(15_000_000 / 75_000_000, 10);
    expect(result.terminalPct).toBeCloseTo(60_000_000 / 75_000_000, 10);
  });

  it('falls back from terminal_value_to_equity to gross TV minus debt when needed', () => {
    const proj = {
      terminal_value: 50_000_000,
      remaining_debt_at_exit: 10_000_000,
      years: [
        { free_cash_flow: 5_000_000 },
        { free_cash_flow: 5_000_000 },
      ],
    };
    const result = computeReturnsComposition(proj);
    expect(result.valid).toBe(true);
    // terminalEquityValue = max(0, 50M - 10M) = 40M; opsValue = 10M; total = 50M
    expect(result.operationsPct).toBeCloseTo(10_000_000 / 50_000_000, 10);
    expect(result.terminalPct).toBeCloseTo(40_000_000 / 50_000_000, 10);
  });

  it('returns valid:false (no note, no saleMode) when no terminal data at all', () => {
    const proj = {
      years: [{ free_cash_flow: 5_000_000 }],
    };
    const result = computeReturnsComposition(proj);
    expect(result.valid).toBe(false);
    expect(result.saleMode).toBeUndefined();
    expect(result.note).toBeUndefined();
  });

  it('returns valid:false when total is zero or negative', () => {
    const proj = {
      terminal_value_to_equity: 0,
      years: [{ free_cash_flow_post_tax: 0 }],
    };
    const result = computeReturnsComposition(proj);
    expect(result.valid).toBe(false);
  });
});

// ── returnsCompositionLabel smoke-test ────────────────────────────────────────

describe('returnsCompositionLabel', () => {
  it('returns Undetermined for non-finite inputs', () => {
    expect(returnsCompositionLabel(NaN, NaN)).toBe('Undetermined');
    expect(returnsCompositionLabel(null, null)).toBe('Undetermined');
  });

  it('classifies terminal-dominant', () => {
    expect(returnsCompositionLabel(0.1, 0.9)).toBe('Terminal-dominant');
  });

  it('classifies operations-dominant', () => {
    expect(returnsCompositionLabel(0.85, 0.15)).toBe('Operations-dominant');
  });
});
