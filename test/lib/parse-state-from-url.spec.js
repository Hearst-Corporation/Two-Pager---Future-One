/**
 * Unit tests for parseStateFromUrl() in lib/hearst-simulator-state.js
 *
 * Covers:
 *   - Invalid ?mode= values are ignored (not passed through)
 *   - Valid ?mode= values are present in the result
 *   - ?mw=0 is hydrated as 0, not replaced by the fallback (Number(0) || fallback bug)
 *   - ?cap=0 is hydrated as 0, not replaced by the fallback
 *   - ?lever=invalid is ignored
 *   - ?lever=equity_pct is present in result
 *   - ?arch=bogus is ignored
 *   - ?arch=powered_shell is present in result
 *   - null searchParams returns null
 */

import { describe, it, expect } from 'vitest';
import { parseStateFromUrl, INITIAL_STATE } from '../../lib/hearst-simulator-state.js';

/**
 * Helper: build a URLSearchParams-like object from a query string or object.
 * URLSearchParams is available in Node ≥18.
 */
function sp(input) {
  return new URLSearchParams(typeof input === 'string' ? input : new URLSearchParams(input));
}

describe('parseStateFromUrl', () => {
  it('returns null when searchParams is null', () => {
    expect(parseStateFromUrl(null)).toBeNull();
  });

  it('returns null when searchParams is undefined', () => {
    expect(parseStateFromUrl(undefined)).toBeNull();
  });

  // ── mode whitelist ────────────────────────────────────────────────────────

  it('ignores ?mode=bogus — mode key absent from result', () => {
    const result = parseStateFromUrl(sp('mode=bogus'));
    expect(result).not.toHaveProperty('mode');
  });

  it('accepts ?mode=mw_first', () => {
    const result = parseStateFromUrl(sp('mode=mw_first'));
    expect(result.mode).toBe('mw_first');
  });

  it('accepts ?mode=capital_first', () => {
    const result = parseStateFromUrl(sp('mode=capital_first'));
    expect(result.mode).toBe('capital_first');
  });

  it('accepts ?mode=target_irr_first', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first'));
    expect(result.mode).toBe('target_irr_first');
  });

  // ── zero-value numeric params (falsy-zero bug) ────────────────────────────

  it('?mw=0 hydrates total_mw as 0 (not replaced by fallback)', () => {
    const result = parseStateFromUrl(sp('mode=mw_first&mw=0'));
    expect(result.total_mw).toBe(0);
    expect(result.total_mw).not.toBe(INITIAL_STATE.total_mw);
  });

  it('?mw=50 hydrates total_mw as 50', () => {
    const result = parseStateFromUrl(sp('mode=mw_first&mw=50'));
    expect(result.total_mw).toBe(50);
  });

  it('?cap=0 hydrates capital_usd as 0 (not replaced by fallback)', () => {
    const result = parseStateFromUrl(sp('mode=capital_first&cap=0'));
    expect(result.capital_usd).toBe(0);
  });

  it('?cap=1000000 hydrates capital_usd as 1 000 000', () => {
    const result = parseStateFromUrl(sp('mode=capital_first&cap=1000000'));
    expect(result.capital_usd).toBe(1_000_000);
  });

  it('?irr=0 hydrates target_irr_pct as 0', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first&irr=0'));
    expect(result.target_irr_pct).toBe(0);
  });

  it('non-numeric ?mw=abc falls back to INITIAL_STATE.total_mw', () => {
    const result = parseStateFromUrl(sp('mode=mw_first&mw=abc'));
    expect(result.total_mw).toBe(INITIAL_STATE.total_mw);
  });

  // ── lever whitelist ───────────────────────────────────────────────────────

  it('?lever=invalid is ignored — target_irr_lever absent', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first&lever=invalid'));
    expect(result).not.toHaveProperty('target_irr_lever');
  });

  it('?lever=equity_pct is present in result', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first&lever=equity_pct'));
    expect(result.target_irr_lever).toBe('equity_pct');
  });

  it('?lever=debt_rate is present in result', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first&lever=debt_rate'));
    expect(result.target_irr_lever).toBe('debt_rate');
  });

  it('?lever=exit_cap_rate is present in result', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first&lever=exit_cap_rate'));
    expect(result.target_irr_lever).toBe('exit_cap_rate');
  });

  it('?lever=exit_year is present in result', () => {
    const result = parseStateFromUrl(sp('mode=target_irr_first&lever=exit_year'));
    expect(result.target_irr_lever).toBe('exit_year');
  });

  it('lever param is ignored when mode is not target_irr_first', () => {
    const result = parseStateFromUrl(sp('mode=mw_first&lever=equity_pct'));
    // lever only applies to target_irr_first mode — should not leak into result
    expect(result).not.toHaveProperty('target_irr_lever');
  });

  // ── archetype whitelist ───────────────────────────────────────────────────

  it('?arch=bogus is ignored — primary_archetype_id absent', () => {
    const result = parseStateFromUrl(sp('arch=bogus'));
    expect(result).not.toHaveProperty('primary_archetype_id');
  });

  it('?arch=powered_shell is present in result', () => {
    const result = parseStateFromUrl(sp('arch=powered_shell'));
    expect(result.primary_archetype_id).toBe('powered_shell');
  });

  it('?arch=neocloud_gpu is present in result', () => {
    const result = parseStateFromUrl(sp('arch=neocloud_gpu'));
    expect(result.primary_archetype_id).toBe('neocloud_gpu');
  });

  it('?arch=sovereign_ai is present in result', () => {
    const result = parseStateFromUrl(sp('arch=sovereign_ai'));
    expect(result.primary_archetype_id).toBe('sovereign_ai');
  });

  it('?arch=hyperscaler_self_build is present in result', () => {
    const result = parseStateFromUrl(sp('arch=hyperscaler_self_build'));
    expect(result.primary_archetype_id).toBe('hyperscaler_self_build');
  });

  it('?arch=branded_jv is present in result (non-primary but valid)', () => {
    const result = parseStateFromUrl(sp('arch=branded_jv'));
    expect(result.primary_archetype_id).toBe('branded_jv');
  });

  // ── empty searchParams ────────────────────────────────────────────────────

  it('empty searchParams returns an object (not null)', () => {
    const result = parseStateFromUrl(sp(''));
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('empty searchParams does not inject stale keys', () => {
    const result = parseStateFromUrl(sp(''));
    expect(result).not.toHaveProperty('mode');
    expect(result).not.toHaveProperty('total_mw');
    expect(result).not.toHaveProperty('primary_archetype_id');
  });
});
