// test/lib/oracle-deal-grounding.spec.js
//
// Unit tests for buildDealGroundingBlock (Task C5 — deal grounding).
//
// Pure tests: no Next.js runtime, no DB, no LLM calls.

import { describe, it, expect } from 'vitest';
import { buildDealGroundingBlock } from '../../lib/oracle-deal-grounding.js';

// ── SC1-like deal (borderline: NPV < 0, no payback within horizon) ──────────
const SC1_DEAL = {
  scenario: {
    total_mw: 50,
    pue: 1.45,
    debt_pct: 45,
    archetype_id: 'powered_shell',
  },
  projection: {
    irr: 0.085,
    moic: 2.24,
    npv: -22e6,
    payback_years: null,
    dscr_stabilized: 2.0,
  },
  warnings: ['CAPEX reconciliation — source figure diverges from engine total'],
};

// ── Strong deal (all gates pass → PROCEED) ──────────────────────────────────
const STRONG_DEAL = {
  projection: {
    irr: 0.18,
    moic: 2.5,
    npv: 3e8,
    payback_years: 6,
    dscr_stabilized: 1.6,
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

  it('contains the formatted IRR (8.5%)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    // fmtPctFromRatio(0.085) → "8.5%"
    expect(block).toContain('8.5%');
  });

  it('contains the formatted MOIC (2.24)', () => {
    block = buildDealGroundingBlock(SC1_DEAL);
    expect(block).toContain('2.24');
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

  it('contains the formatted IRR (18.0%)', () => {
    const block = buildDealGroundingBlock(STRONG_DEAL);
    // fmtPctFromRatio(0.18) → "18.0%"
    expect(block).toContain('18.0%');
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
