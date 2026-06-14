// test/lib/oracle-deal-grounding.spec.js
//
// Unit tests for buildDealGroundingBlock (Task C5 — deal grounding).
//
// Pure tests: no Next.js runtime, no DB, no LLM calls.

import { describe, it, expect } from 'vitest';
import { buildDealGroundingBlock } from '../../lib/oracle-deal-grounding.js';

// ── SC1-like deal (borderline: NPV < 0, no payback within horizon) ──────────
// Post-tax values < pre-tax values; NPV post-tax is negative → REVIEW verdict.
const SC1_DEAL = {
  scenario: {
    total_mw: 50,
    pue: 1.45,
    debt_pct: 45,
    archetype_id: 'powered_shell',
  },
  projection: {
    irr: 0.085,
    irr_post_tax: 0.072,
    moic: 2.24,
    moic_post_tax: 2.10,
    npv: -22e6,
    npv_post_tax: -30e6,
    payback_years: null,
    dscr_stabilized: 2.0,
  },
  warnings: ['CAPEX reconciliation — source figure diverges from engine total'],
};

// ── Strong deal (all gates pass → PROCEED) ──────────────────────────────────
// Post-tax IRR 16.2% ≥ 10% hurdle, MOIC > 1, NPV post-tax > 0, payback set, DSCR ok.
const STRONG_DEAL = {
  projection: {
    irr: 0.18,
    irr_post_tax: 0.162,
    moic: 2.5,
    moic_post_tax: 2.30,
    npv: 3e8,
    npv_post_tax: 2.8e8,
    payback_years: 6,
    dscr_stabilized: 1.6,
  },
};

// ── Legacy deal — only pre-tax fields (no post-tax layer) ───────────────────
const LEGACY_DEAL = {
  projection: {
    irr: 0.15,
    moic: 2.0,
    npv: 1e8,
    payback_years: 7,
    dscr_stabilized: 1.4,
  },
};

// ── SC1-like block ──────────────────────────────────────────────────────────

describe('buildDealGroundingBlock — SC1-like deal', () => {
  let block;
  it('produces a non-empty string', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(typeof block).toBe('string');
    expect(block.length).toBeGreaterThan(0);
  });

  it('contains the POST-TAX IRR as headline (7.2%)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    // fmtPctFromRatio(0.072) → "7.2%"
    expect(block).toContain('7.2%');
  });

  it('contains the PRE-TAX IRR as sub-figure (8.5%)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toContain('pre-tax');
    expect(block).toContain('8.5%');
  });

  it('contains the POST-TAX MOIC (2.10)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toContain('2.10');
  });

  it('contains the REVIEW verdict (NPV < 0 + no payback triggers REVIEW gate)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toMatch(/REVIEW/i);
  });

  it('contains the grounding rule ("overrides" or "engine numbers are correct")', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    const hasOverrides = block.includes('overrides');
    const hasEngineNumbers = block.includes('engine numbers are correct');
    expect(hasOverrides || hasEngineNumbers).toBe(true);
  });

  it('lists the warning text', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toContain('CAPEX reconciliation');
  });

  it('includes scenario params (MW, PUE, debt, archetype)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toContain('50 MW');
    expect(block).toContain('PUE 1.45');
    expect(block).toContain('debt 45%');
    expect(block).toContain('powered_shell');
  });

  it('labels the engine line as post-tax basis', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toContain('post-tax');
  });
});

// ── Null / empty inputs → empty string ──────────────────────────────────────

describe('buildDealGroundingBlock — null / missing projection', () => {
  it('returns "" for null', () => {
    expect(buildDealGroundingBlock(null)).toBe('');
  });

  it('returns "" for undefined', () => {
    expect(buildDealGroundingBlock(undefined)).toBe('');
  });

  it('returns "" for {} (no projection key)', () => {
    expect(buildDealGroundingBlock({})).toBe('');
  });

  it('returns "" for { scenario: {...} } without projection', () => {
    expect(buildDealGroundingBlock({ scenario: { total_mw: 50 } })).toBe('');
  });

  it('returns "" for { projection: undefined }', () => {
    expect(buildDealGroundingBlock({ projection: undefined })).toBe('');
  });
});

// ── Strong deal → PROCEED ────────────────────────────────────────────────────

describe('buildDealGroundingBlock — strong deal', () => {
  it('contains PROCEED verdict', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    expect(block).toMatch(/PROCEED/i);
  });

  it('contains the POST-TAX IRR headline (16.2%)', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    // fmtPctFromRatio(0.162) → "16.2%"
    expect(block).toContain('16.2%');
  });

  it('contains the PRE-TAX IRR sub-figure (18.0%)', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    expect(block).toContain('18.0%');
    expect(block).toContain('pre-tax');
  });

  it('shows "none" warnings (no warnings key)', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    expect(block).toContain('Engine warnings: none');
  });

  it('shows the payback years', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    expect(block).toContain('6 yr');
  });
});

// ── Post-tax headline / verdict coherence ────────────────────────────────────

describe('buildDealGroundingBlock — post-tax / verdict coherence', () => {
  it('headline is post-tax and consistent with verdict label', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    // Engine line must explicitly say "post-tax"
    expect(block).toContain('post-tax');
    // Headline IRR is 16.2% (post-tax), not 18.0%
    // Ensure the post-tax value appears before pre-tax sub-figure
    const irrIdx = block.indexOf('16.2%');
    const preIdx = block.indexOf('18.0%');
    expect(irrIdx).toBeGreaterThan(-1);
    expect(preIdx).toBeGreaterThan(-1);
    // 16.2% (post-tax headline) appears before 18.0% (pre-tax sub-figure)
    expect(irrIdx).toBeLessThan(preIdx);
  });
});

// ── Legacy deal without post-tax fields ──────────────────────────────────────

describe('buildDealGroundingBlock — legacy deal (no post-tax fields)', () => {
  it('falls back to pre-tax and carries the predates-tax-layer note', () => {
    const block = buildDealGroundingBlock(LEGACY_DEAL);
    expect(block).toContain('predates tax layer');
  });

  it('shows the pre-tax IRR value (15.0%)', () => {
    const block = buildDealGroundingBlock(LEGACY_DEAL);
    // fmtPctFromRatio(0.15) → "15.0%"
    expect(block).toContain('15.0%');
  });

  it('does NOT show a pre-tax sub-figure (no post-tax to contrast with)', () => {
    const block = buildDealGroundingBlock(LEGACY_DEAL);
    // When there's no post-tax layer, the sub-figure notation should not appear
    // (the whole line is already pre-tax basis, no redundant "pre-tax X%" sub-figure)
    expect(block).not.toContain('(pre-tax 15.0%)');
  });

  it('labels the engine line as levered-equity (not post-tax)', () => {
    const block = buildDealGroundingBlock(LEGACY_DEAL);
    expect(block).toContain('levered-equity');
    // The post-tax label must NOT appear (it would be false)
    expect(block).not.toContain('post-tax, levered equity');
  });
});

// ── Returns composition line (years + terminal_value_to_equity present) ──────

describe('buildDealGroundingBlock — Returns composition', () => {
  // Projection with years FCFE and a terminal value that is terminal_dominant (>75%)
  const TERMINAL_DEAL = {
    projection: {
      irr: 0.16,
      irr_post_tax: 0.14,
      moic: 2.2,
      moic_post_tax: 2.0,
      npv: 2e8,
      npv_post_tax: 1.8e8,
      payback_years: 7,
      dscr_stabilized: 1.5,
      // years: net negative ops → terminal_dominant scenario
      years: [
        { free_cash_flow_post_tax: -5e6 },
        { free_cash_flow_post_tax: 10e6 },
      ],
      terminal_value_to_equity: 5e8,
    },
  };

  it('includes "Returns composition" line when years + terminal_value_to_equity are present', () => {
    const block = buildDealGroundingBlock(TERMINAL_DEAL);
    expect(block).toContain('Returns composition');
  });

  it('mentions "terminal value" in the composition note (case-insensitive)', () => {
    const block = buildDealGroundingBlock(TERMINAL_DEAL);
    expect(block).toMatch(/terminal value/i);
  });

  it('does NOT include "Returns composition" when years / terminal fields are absent', () => {
    // SC1_DEAL has no years[] or terminal_value_to_equity → rc.available = false
    const block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).not.toContain('Returns composition');
  });
});
