// test/lib/dossier-verdict.spec.js
// Vitest — financial gate tests for deriveVerdict

import { describe, it, expect } from 'vitest';
import { deriveVerdict } from '../../lib/dossier-derive.js';

/** Wrap a raw projection object into the memo shape deriveVerdict reads. */
function makeMemo(proj = {}, {
  risks = [],
  flags = [],
  conf = 'HIGH',
  fresh = 'FRESH',
  headline = 'Proceed to execution.',
} = {}) {
  return {
    _exec_projection: proj,
    key_financial_metrics: { metrics: [] },
    risks_constraints: { items: risks },
    deployment_roadmap: { reality_check_flags: flags },
    confidence_block: { confidence_level: conf },
    data_freshness: { overall_status: fresh },
    executive_summary: { headline },
  };
}

describe('deriveVerdict — financial gates', () => {

  // ── REJECT: capital-destroyer (NPV -$128M, MOIC 0.89×) ───────────────────
  it('REJECT — moic < 1 (capital destruction, e.g. NPV -$128M / MOIC 0.89×)', () => {
    const memo = makeMemo({
      irr: 0.04,
      moic: 0.89,
      npv: -128e6,
      payback_years: null,
      dscr_stabilized: 2.8,
    });
    const result = deriveVerdict(memo);
    expect(result.key).toBe('REJECT');
  });

  // ── REJECT: negative IRR (even if MOIC > 1) ──────────────────────────────
  it('REJECT — negative IRR overrides positive MOIC', () => {
    const memo = makeMemo({
      irr: -0.02,
      moic: 1.3,
      npv: -900e6,
      payback_years: null,
      dscr_stabilized: null,
    });
    const result = deriveVerdict(memo);
    expect(result.key).toBe('REJECT');
  });

  // ── REVIEW: SC1-like — irr > 0, moic > 1 but npv < 0 AND no payback ─────
  it('REVIEW — npv < 0 AND no payback (must NOT be PROCEED/PROCEED_WITH_CONDITIONS)', () => {
    const memo = makeMemo({
      irr: 0.085,
      moic: 2.24,
      npv: -22e6,
      payback_years: null,
      dscr_stabilized: 2.0,
    });
    const result = deriveVerdict(memo);
    expect(result.key).toBe('REVIEW');
    expect(result.key).not.toBe('PROCEED');
    expect(result.key).not.toBe('PROCEED_WITH_CONDITIONS');
  });

  // ── REVIEW: low DSCR breaches covenant (< 1.25) ──────────────────────────
  it('REVIEW — DSCR below covenant (1.1 < 1.25)', () => {
    const memo = makeMemo({
      irr: 0.15,
      moic: 2.0,
      npv: 50e6,
      payback_years: 6,
      dscr_stabilized: 1.1,
    });
    const result = deriveVerdict(memo);
    expect(result.key).toBe('REVIEW');
  });

  // ── PROCEED: all gates clear, no conditions ───────────────────────────────
  it('PROCEED — strong returns, no risks, fresh data, high confidence', () => {
    const memo = makeMemo({
      irr: 0.18,
      moic: 2.5,
      npv: 300e6,
      payback_years: 6,
      dscr_stabilized: 1.6,
    }, {
      risks: [],
      flags: [],
      conf: 'HIGH',
      fresh: 'FRESH',
      headline: 'Strong opportunity.',
    });
    const result = deriveVerdict(memo);
    expect(result.key).toBe('PROCEED');
  });

  // ── PROCEED_WITH_CONDITIONS: strong returns but one HIGH risk ─────────────
  it('PROCEED_WITH_CONDITIONS — strong returns but one HIGH-severity risk', () => {
    const memo = makeMemo({
      irr: 0.18,
      moic: 2.5,
      npv: 300e6,
      payback_years: 6,
      dscr_stabilized: 1.6,
    }, {
      risks: [{ severity: 'HIGH', label: 'Grid connection risk' }],
      flags: [],
      conf: 'HIGH',
      fresh: 'FRESH',
      headline: 'Strong opportunity.',
    });
    const result = deriveVerdict(memo);
    expect(result.key).toBe('PROCEED_WITH_CONDITIONS');
  });

  // ── INSUFFICIENT_DATA: no financials at all ───────────────────────────────
  it('INSUFFICIENT_DATA — empty memo object', () => {
    const result = deriveVerdict({});
    expect(result.key).toBe('INSUFFICIENT_DATA');
  });

});
