// test/lib/cross-surface-consistency.spec.js
//
// P0-5 — CROSS-SURFACE METRIC CONSISTENCY GUARD.
//
// Given ONE projection, every board surface (Results decision band, ORACLE
// Advisor, Financial KPIs, Dossier KPI strip, Memo / persisted key_financial_
// metrics, PDF) must render the SAME board metric with the SAME value, tax basis,
// rounding and glyph. This test pins that contract: it fails if any surface
//   • reverts to a pre-tax value under a board label,
//   • formats with the "×" glyph instead of canonical "x",
//   • rounds USD differently, or
//   • renders payback as "yrs" instead of "yr".
//
// Surfaces are exercised through the exact functions each consumes:
//   • Contract / Advisor / Financial → lib/hearst-board-metrics (boardFormatted/boardValue)
//   • Results decision band          → lib/hearst-results-view (DECISION_METRICS)
//   • Dossier KPI strip              → lib/dossier-derive (deriveKpis)
//   • Memo / persisted KFM           → lib/engine-reconcile (reconcileMetricsWithEngine)
//   • PDF                            → lib/hearst-format (the same formatters the route imports)

import { describe, it, expect } from 'vitest';
import { boardFormatted } from '../../lib/hearst-board-metrics.js';
import { DECISION_METRICS } from '../../lib/hearst-results-view.js';
import { deriveKpis } from '../../lib/dossier-derive.js';
import { reconcileMetricsWithEngine } from '../../lib/engine-reconcile.js';
import { fmtUSD, fmtPctFromRatio, fmtX, fmtYears } from '../../lib/hearst-format.js';

// Pre-tax and post-tax values are deliberately DISTINCT so any surface that
// silently reverts to pre-tax is caught by a value mismatch.
function projection() {
  return {
    irr: 0.238,  irr_post_tax: 0.236,
    npv: 150_000_000, npv_post_tax: 142_900_000,
    moic: 6.75, moic_post_tax: 6.51,
    payback_years: 10,
    total_capex: 148_200_000,
    terminal_value: 467_300_000,
    dscr_stabilized: 3.71,
    stabilized_revenue: 66_700_000,
    stabilized_ebitda: 44_800_000,
  };
}

// Canonical expected strings — POST-TAX basis, hearst-format formatters.
function expected(p) {
  return {
    irr: fmtPctFromRatio(p.irr_post_tax), // "23.6%"
    npv: fmtUSD(p.npv_post_tax),          // "$142.9M"
    moic: fmtX(p.moic_post_tax),          // "6.51x"
    payback: fmtYears(p.payback_years),   // "10 yr"
    capex: fmtUSD(p.total_capex),         // "$148.2M"
  };
}

describe('cross-surface metric consistency — one scenario, identical board values', () => {
  const p = projection();
  const exp = expected(p);

  it('canonical contract returns are POST-TAX, not pre-tax', () => {
    expect(boardFormatted(p, 'irr')).toBe(exp.irr);
    expect(boardFormatted(p, 'npv')).toBe(exp.npv);
    expect(boardFormatted(p, 'moic')).toBe(exp.moic);
    // guard: in this fixture post-tax MUST differ from pre-tax
    expect(boardFormatted(p, 'irr')).not.toBe(fmtPctFromRatio(p.irr));
    expect(boardFormatted(p, 'moic')).not.toBe(fmtX(p.moic));
  });

  it('Results decision band == contract', () => {
    const dm = Object.fromEntries(DECISION_METRICS.map((m) => [m.id, m.value(p)]));
    expect(dm.irr).toBe(exp.irr);
    expect(dm.npv).toBe(exp.npv);
    expect(dm.moic).toBe(exp.moic);
  });

  it('Dossier KPI strip == contract', () => {
    const k = Object.fromEntries(deriveKpis({ _exec_projection: p }).map((c) => [c.key, c.value]));
    expect(k.irr).toBe(exp.irr);
    expect(k.npv).toBe(exp.npv);
    expect(k.moic).toBe(exp.moic);
    expect(k.capex).toBe(exp.capex);
    expect(k.payback).toBe(exp.payback);
  });

  it('Memo / persisted key_financial_metrics (reconciler) == contract', () => {
    const rows = reconcileMetricsWithEngine([], p);
    const find = (re) => rows.find((r) => re.test(r.label));
    expect(find(/^irr$/i).value).toBe(exp.irr);
    expect(find(/^npv$/i).value).toBe(exp.npv);
    expect(find(/^moic$/i).value).toBe(exp.moic);
    expect(find(/total capex/i).value).toBe(exp.capex);
  });

  it('NO surface uses the "×" glyph (canonical is lowercase "x")', () => {
    const strings = [
      boardFormatted(p, 'moic'), boardFormatted(p, 'dscr'),
      ...DECISION_METRICS.map((m) => m.value(p)),
      ...deriveKpis({ _exec_projection: p }).map((c) => c.value),
      ...reconcileMetricsWithEngine([], p).map((r) => r.value),
    ].filter((s) => typeof s === 'string');
    for (const s of strings) expect(s).not.toContain('×');
  });

  it('USD rounding identical (1-decimal M tier) for CAPEX across surfaces', () => {
    const capex = [
      boardFormatted(p, 'capex'),
      deriveKpis({ _exec_projection: p }).find((c) => c.key === 'capex').value,
      reconcileMetricsWithEngine([], p).find((r) => /total capex/i.test(r.label)).value,
    ];
    for (const s of capex) expect(s).toBe(exp.capex);
  });

  it('payback suffix is "yr" (never "yrs") across surfaces', () => {
    const recon = reconcileMetricsWithEngine([], p).find((r) => /payback/i.test(r.label));
    expect(`${recon.value} ${recon.unit}`.trim()).toBe(exp.payback);
    expect(boardFormatted(p, 'payback')).toBe(exp.payback);
    for (const s of [boardFormatted(p, 'payback'), exp.payback]) expect(s).not.toContain('yrs');
  });

  it('falls back to pre-tax ONLY when post-tax is absent (legacy projections)', () => {
    const legacy = { ...projection(), irr_post_tax: undefined, npv_post_tax: undefined, moic_post_tax: undefined };
    expect(boardFormatted(legacy, 'irr')).toBe(fmtPctFromRatio(legacy.irr)); // "23.8%"
    const rows = reconcileMetricsWithEngine([], legacy);
    expect(rows.find((r) => /^irr$/i.test(r.label)).value).toBe(fmtPctFromRatio(legacy.irr));
  });

  it('Results decision band suppresses the pre-tax sub-figure when post-tax == pre-tax (e.g. sale_leaseback)', () => {
    // sale_leaseback aliases post-tax to pre-tax (cash flows already net of capital-gains tax),
    // so the sub-figure must NOT repeat the same number. Headline still shows the value.
    const aliased = { irr: 0.182, irr_post_tax: 0.182, npv: 3e8, npv_post_tax: 3e8, moic: 2.4, moic_post_tax: 2.4 };
    const dm = Object.fromEntries(DECISION_METRICS.map((m) => [m.id, { value: m.value(aliased), sub: m.subValue(aliased) }]));
    expect(dm.irr.sub).toBeNull();
    expect(dm.npv.sub).toBeNull();
    expect(dm.moic.sub).toBeNull();
    expect(dm.irr.value).toBe(fmtPctFromRatio(0.182)); // headline still present
  });

  it('Results decision band shows the pre-tax sub-figure when post-tax differs from pre-tax', () => {
    const p2 = projection(); // fixture guarantees post-tax != pre-tax
    const irrMetric = DECISION_METRICS.find((m) => m.id === 'irr');
    expect(irrMetric.subValue(p2)).toContain(fmtPctFromRatio(p2.irr));
  });
});
