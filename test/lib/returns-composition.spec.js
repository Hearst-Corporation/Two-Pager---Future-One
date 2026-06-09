// test/lib/returns-composition.spec.js
import { describe, it, expect } from 'vitest';
import { deriveReturnsComposition } from '../../lib/returns-composition.js';

// helper: build a projection whose operating FCFE sums to `ops`
const proj = (ops, tvEq, extra = {}) => ({
  years: [{ free_cash_flow_post_tax: ops }],
  terminal_value_to_equity: tvEq,
  ...extra,
});

describe('deriveReturnsComposition', () => {
  it('normal case: operations 60%, TV 40%', () => {
    const r = deriveReturnsComposition(proj(60, 40));
    expect(r.available).toBe(true);
    expect(r.tier).toBe('normal');
    expect(Math.round(r.terminalPct * 100)).toBe(40);
    expect(Math.round(r.operationsPct * 100)).toBe(60);
    expect(r.totalEquityProceeds).toBe(100);
  });

  it('exit_weighted: TV > 50%', () => {
    const r = deriveReturnsComposition(proj(40, 60));
    expect(r.tier).toBe('exit_weighted');
    expect(r.note).toContain('60%');
    expect(r.note).toMatch(/realized at sale/);
    expect(r.diligence).toMatch(/Stress the exit multiple/);
  });

  it('terminal_dominant: TV > 75%', () => {
    const r = deriveReturnsComposition(proj(16, 84));
    expect(r.tier).toBe('terminal_dominant');
    expect(r.note).toContain('84%');
    expect(r.note).toMatch(/depend primarily on terminal value/);
  });

  it('terminal_only: operations negative, TV positive, TV > 100%', () => {
    const r = deriveReturnsComposition(proj(-10, 50)); // total 40, terminalPct 1.25
    expect(r.tier).toBe('terminal_only');
    expect(r.terminalPct).toBeGreaterThan(1);
    expect(r.operationsPct).toBeLessThan(0);
    expect(r.note).toMatch(/net cash-negative/);
  });

  it('no positive proceeds: total <= 0', () => {
    const r = deriveReturnsComposition(proj(-100, 50)); // total -50
    expect(r.available).toBe(true);
    expect(r.tier).toBe('no_positive_proceeds');
    expect(r.operationsPct).toBeNull();
    expect(r.terminalPct).toBeNull();
  });

  it('missing projection → unavailable', () => {
    expect(deriveReturnsComposition(null).tier).toBe('unavailable');
    expect(deriveReturnsComposition(undefined).available).toBe(false);
    expect(deriveReturnsComposition({}).tier).toBe('unavailable');
  });

  it('missing TV fields → unavailable', () => {
    const r = deriveReturnsComposition({ years: [{ free_cash_flow_post_tax: 10 }] }); // no terminal fields
    expect(r.tier).toBe('unavailable');
  });

  it('derives TV→equity from gross terminal_value − remaining_debt_at_exit when *_to_equity absent', () => {
    const r = deriveReturnsComposition({ years: [{ free_cash_flow_post_tax: 40 }], terminal_value: 100, remaining_debt_at_exit: 40 });
    expect(r.terminalEquityValue).toBe(60); // max(0, 100-40)
    expect(r.tier).toBe('exit_weighted'); // 60/100
  });

  it('uses post-tax FCFE when both post-tax and pre-tax present', () => {
    const r = deriveReturnsComposition({ years: [{ free_cash_flow_post_tax: 30, free_cash_flow: 999 }], terminal_value_to_equity: 70 });
    expect(r.operatingValue).toBe(30);
    expect(Math.round(r.terminalPct * 100)).toBe(70);
  });

  it('reads snapshot shape (years[].fcf pre-tax) identically', () => {
    const live = deriveReturnsComposition({ years: [{ free_cash_flow_post_tax: 30 }, { free_cash_flow_post_tax: 30 }], terminal_value_to_equity: 140 });
    const snap = deriveReturnsComposition({ years: [{ fcf: 30 }, { fcf: 30 }], terminal_value_to_equity: 140 });
    expect(snap.operatingValue).toBe(60);
    expect(snap.tier).toBe(live.tier);
    expect(snap.terminalPct).toBeCloseTo(live.terminalPct, 10);
  });
});

// Cross-surface: Results/Advisor consume a LIVE projection; PDF/Dossier consume
// the persisted SNAPSHOT. Both call the same deriveReturnsComposition — so the
// same economics must yield the same disclosure on every surface.
describe('cross-surface returns-composition consistency', () => {
  const live = { years: [{ free_cash_flow_post_tax: -2.4 }, { free_cash_flow_post_tax: -5.3 }, { free_cash_flow_post_tax: 97.5 }], terminal_value_to_equity: 454.9 };
  const snap = { years: [{ fcf: -2.4 }, { fcf: -5.3 }, { fcf: 97.5 }], terminal_value_to_equity: 454.9 };

  it('live (Results/Advisor) and snapshot (PDF/Dossier) shapes agree on tier/label/note', () => {
    const a = deriveReturnsComposition(live);
    const b = deriveReturnsComposition(snap);
    expect(a.tier).toBe('terminal_dominant');
    expect(b.tier).toBe(a.tier);
    expect(b.label).toBe(a.label);
    expect(b.note).toBe(a.note);
    expect(Math.round(b.terminalPct * 100)).toBe(Math.round(a.terminalPct * 100)); // 84%
  });

  it('is deterministic — repeated calls return identical output', () => {
    const p = { years: [{ free_cash_flow_post_tax: 16 }], terminal_value_to_equity: 84 };
    expect(deriveReturnsComposition(p)).toEqual(deriveReturnsComposition(p));
  });
});
