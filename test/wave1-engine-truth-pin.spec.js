// test/wave1-engine-truth-pin.spec.js
//
// Unit tests for reconcileMetricsWithEngine (Task 1 — engine-truth pin).
//
// These tests are intentionally pure: they exercise only the exported function,
// with no Next.js runtime, no DB, no LLM calls.

import { describe, it, expect } from 'vitest';
import { reconcileMetricsWithEngine } from '../lib/engine-reconcile.js';

// ── helpers ────────────────────────────────────────────────────────────────

function makeProjection(overrides = {}) {
  return {
    irr: 0.182,
    npv: 440_000_000,
    moic: 2.35,
    total_capex: 550_000_000,
    payback_years: 4.5,
    dscr_stabilized: 1.42,
    stabilized_ebitda: 120_000_000,
    stabilized_revenue: 210_000_000,
    terminal_value: 900_000_000,
    ...overrides,
  };
}

// ── core reconciliation ──────────────────────────────────────────────────

describe('reconcileMetricsWithEngine — engine overrides LLM divergence', () => {
  it('overwrites an IRR row where LLM wrote 24% but engine says 18.2%', () => {
    const metrics = [
      { label: 'IRR', value: '24', unit: '%', confidence: 'MEDIUM', source: 'ASSUMED' },
      { label: 'NPV', value: '$500M', unit: '', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const projection = makeProjection({ irr: 0.182 });
    const result = reconcileMetricsWithEngine(metrics, projection);

    const irrRow = result.find(r => r.label === 'IRR');
    expect(irrRow).toBeDefined();
    // Fix 5: IRR value holds full "18.2%" string, unit is '' (no space in render)
    expect(irrRow.value).toBe('18.2%');
    expect(irrRow.unit).toBe('');
    expect(irrRow.source).toBe('engine');
    expect(irrRow.confidence).toBe('HIGH');
  });

  it('preserves a qualitative LLM-only row that has no engine equivalent', () => {
    const qualitativeRow = {
      label: 'Occupancy ramp',
      value: '65% → 90%',
      unit: 'by Yr 3',
      confidence: 'MEDIUM',
      source: 'ASSUMED',
    };
    const metrics = [
      { label: 'IRR', value: '24', unit: '%', confidence: 'LOW', source: 'ASSUMED' },
      qualitativeRow,
    ];
    const projection = makeProjection();
    const result = reconcileMetricsWithEngine(metrics, projection);

    const qualRow = result.find(r => r.label === 'Occupancy ramp');
    expect(qualRow).toBeDefined();
    // qualitative row must survive exactly as-is
    expect(qualRow.value).toBe('65% → 90%');
    expect(qualRow.unit).toBe('by Yr 3');
    expect(qualRow.source).toBe('ASSUMED');
    expect(qualRow.confidence).toBe('MEDIUM');
  });
});

// ── edge cases ─────────────────────────────────────────────────────────────

describe('reconcileMetricsWithEngine — edge cases', () => {
  it('inserts an engine row when no matching LLM row exists', () => {
    const metrics = [
      { label: 'Qualitative note', value: 'Strong demand', unit: '', confidence: 'LOW', source: null },
    ];
    const projection = makeProjection({ irr: 0.182 });
    const result = reconcileMetricsWithEngine(metrics, projection);

    const irrRow = result.find(r => r.label === 'IRR');
    expect(irrRow).toBeDefined();
    expect(irrRow.value).toBe('18.2%');
    expect(irrRow.source).toBe('engine');
  });

  it('skips engine fields that are null in the projection', () => {
    const metrics = [
      { label: 'IRR', value: '24', unit: '%', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const projection = makeProjection({ irr: null, npv: null });
    const result = reconcileMetricsWithEngine(metrics, projection);

    // IRR row should NOT be overwritten since engine returned null
    const irrRow = result.find(r => r.label === 'IRR');
    expect(irrRow.value).toBe('24');
    expect(irrRow.source).toBe('ASSUMED');
  });

  it('returns empty array when metrics is undefined and projection is null', () => {
    const result = reconcileMetricsWithEngine(undefined, null);
    expect(result).toEqual([]);
  });

  it('returns original rows unchanged when projection is null', () => {
    const metrics = [
      { label: 'IRR', value: '24', unit: '%', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const result = reconcileMetricsWithEngine(metrics, null);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('24');
  });

  it('does not mutate the original metrics array', () => {
    const original = [
      { label: 'IRR', value: '24', unit: '%', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const originalCopy = JSON.parse(JSON.stringify(original));
    reconcileMetricsWithEngine(original, makeProjection());
    expect(original).toEqual(originalCopy);
  });
});

// ── formatting spot checks ────────────────────────────────────────────────

describe('reconcileMetricsWithEngine — formatting matches fmtUsd / fmtPct / fmtX / fmtYears', () => {
  it('formats MOIC as "2.35x" with empty unit', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ moic: 2.35 }));
    const row = result.find(r => r.label === 'MOIC');
    expect(row.value).toBe('2.35x');
    expect(row.unit).toBe('');
  });

  it('formats total_capex as "$550M" with empty unit', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ total_capex: 550_000_000 }));
    const row = result.find(r => r.label === 'Total CAPEX');
    expect(row.value).toBe('$550.0M');
    expect(row.unit).toBe('');
  });

  it('formats payback_years=4.5 as value="4.5" unit="yr"', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ payback_years: 4.5 }));
    const row = result.find(r => r.label === 'Payback');
    expect(row.value).toBe('4.5');
    expect(row.unit).toBe('yr');
  });

  it('formats payback_years integer as value="5" unit="yr"', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ payback_years: 5 }));
    const row = result.find(r => r.label === 'Payback');
    expect(row.value).toBe('5');
    expect(row.unit).toBe('yr');
  });

  it('formats large NPV in billions', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ npv: 1_200_000_000 }));
    const row = result.find(r => r.label === 'NPV');
    expect(row.value).toBe('$1.20B');
  });

  it('formats IRR with one decimal place', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ irr: 0.1756 }));
    const row = result.find(r => r.label === 'IRR');
    // Fix 5: full pct string in value, empty unit
    expect(row.value).toBe('17.6%');
    expect(row.unit).toBe('');
  });
});

// ── case-insensitive label matching ──────────────────────────────────────

describe('reconcileMetricsWithEngine — label matching is case-insensitive', () => {
  it('matches "Levered IRR" row via "irr" keyword', () => {
    const metrics = [
      { label: 'Levered IRR', value: '24', unit: '%', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const result = reconcileMetricsWithEngine(metrics, makeProjection({ irr: 0.182 }));
    const row = result.find(r => r.label === 'Levered IRR');
    expect(row.value).toBe('18.2%');
    expect(row.source).toBe('engine');
  });

  it('matches "Total CAPEX (USD)" row via "capex" keyword', () => {
    const metrics = [
      { label: 'Total CAPEX (USD)', value: '$600M', unit: '', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const result = reconcileMetricsWithEngine(metrics, makeProjection({ total_capex: 550_000_000 }));
    const row = result.find(r => r.label === 'Total CAPEX (USD)');
    expect(row.value).toBe('$550.0M');
    expect(row.source).toBe('engine');
  });
});

// ── Fix 2: collision tests — per-unit / qualified rows must NOT be overwritten ──

describe('reconcileMetricsWithEngine — Fix 2: keyword collision exclusions', () => {
  it('(a) "CAPEX per MW" is NOT overwritten with total capex', () => {
    const metrics = [
      { label: 'CAPEX per MW', value: '$5.5M', unit: '', confidence: 'MEDIUM', source: 'ASSUMED' },
      { label: 'Total CAPEX', value: '$600M', unit: '', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const projection = makeProjection({ total_capex: 550_000_000 });
    const result = reconcileMetricsWithEngine(metrics, projection);

    // Per-unit row must NOT be touched
    const perMwRow = result.find(r => r.label === 'CAPEX per MW');
    expect(perMwRow).toBeDefined();
    expect(perMwRow.value).toBe('$5.5M');
    expect(perMwRow.source).toBe('ASSUMED');

    // Total CAPEX row must be overwritten
    const totalRow = result.find(r => r.label === 'Total CAPEX');
    expect(totalRow).toBeDefined();
    expect(totalRow.value).toBe('$550.0M');
    expect(totalRow.source).toBe('engine');
  });

  it('(b) "Exit multiple" is NOT overwritten with MOIC (only "moic" keyword kept)', () => {
    const metrics = [
      { label: 'Exit multiple', value: '3.5×', unit: '', confidence: 'MEDIUM', source: 'ASSUMED' },
      { label: 'MOIC', value: '2.0×', unit: '', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const projection = makeProjection({ moic: 2.35 });
    const result = reconcileMetricsWithEngine(metrics, projection);

    // "Exit multiple" must NOT be touched — 'multiple' keyword was removed from MOIC
    const exitRow = result.find(r => r.label === 'Exit multiple');
    expect(exitRow).toBeDefined();
    expect(exitRow.value).toBe('3.5×');
    expect(exitRow.source).toBe('ASSUMED');

    // The MOIC row must be engine-pinned
    const moicRow = result.find(r => r.label === 'MOIC');
    expect(moicRow).toBeDefined();
    expect(moicRow.value).toBe('2.35x');
    expect(moicRow.source).toBe('engine');
  });

  it('(c) two "IRR" rows → exactly one engine-pinned row remains (dedup)', () => {
    const metrics = [
      { label: 'IRR', value: '24', unit: '%', confidence: 'MEDIUM', source: 'ASSUMED' },
      { label: 'Levered IRR', value: '22', unit: '%', confidence: 'LOW', source: 'ASSUMED' },
    ];
    const projection = makeProjection({ irr: 0.182 });
    const result = reconcileMetricsWithEngine(metrics, projection);

    // Exactly one engine-pinned IRR row (first match overwritten, second dropped)
    const engineIrrRows = result.filter(r => r.source === 'engine' && /irr/i.test(r.label));
    expect(engineIrrRows).toHaveLength(1);
    expect(engineIrrRows[0].value).toBe('18.2%');

    // Total IRR-matching rows should be exactly 1
    const allIrrRows = result.filter(r => /irr/i.test(r.label));
    expect(allIrrRows).toHaveLength(1);
  });

  it('(d) IRR row renders with no space — value="18.2%" unit=""', () => {
    const result = reconcileMetricsWithEngine([], makeProjection({ irr: 0.182 }));
    const irrRow = result.find(r => r.label === 'IRR');
    expect(irrRow).toBeDefined();
    // Fix 5: full "18.2%" in value, empty unit → dossier renders "18.2%" with no space
    expect(irrRow.value).toBe('18.2%');
    expect(irrRow.unit).toBe('');
    // Sanity: value must NOT split the % sign
    expect(irrRow.value).not.toBe('18.2');
    expect(irrRow.unit).not.toBe('%');
  });
});
