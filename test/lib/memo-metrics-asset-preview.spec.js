// Tests for deriveMemoMetricsAssetPreview (M.5-C/D producer).
//
// The helper derives an AssetPreview metrics fragment from a persisted memo's
// engine snapshot (memo_json._exec_projection), routed through BOARD_METRICS so
// the numbers match Results / Dossier / PDF. It must produce a SAFE fragment:
// every value escaped, no document-level HTML, no scripts/handlers/js: URLs.

import { describe, it, expect } from 'vitest';
import { deriveMemoMetricsAssetPreview, esc } from '@/lib/memo-metrics-asset-preview.js';

// A realistic approved-memo engine snapshot (post-tax fields present).
const VALID_MEMO = {
  version: 3,
  region: 'qatar',
  memo_json: {
    _exec_projection: {
      irr: 0.182,
      irr_post_tax: 0.162,
      moic: 2.5,
      moic_post_tax: 2.3,
      npv: 3e8,
      npv_post_tax: 2.8e8,
      payback_years: 6,
      total_capex: 4.4e8,
      dscr_stabilized: 1.6,
    },
  },
};

describe('deriveMemoMetricsAssetPreview — valid memo', () => {
  const preview = deriveMemoMetricsAssetPreview(VALID_MEMO);

  it('returns an AssetPreview with sanitizedHtml + fallbackLabel', () => {
    expect(preview).not.toBeNull();
    expect(typeof preview.sanitizedHtml).toBe('string');
    expect(preview.sanitizedHtml.length).toBeGreaterThan(0);
    expect(typeof preview.fallbackLabel).toBe('string');
  });

  it('shows the POST-TAX board numbers (same source as Results/PDF)', () => {
    // boardFormatted(irr) = fmtPctFromRatio(0.162) → "16.2%"
    expect(preview.sanitizedHtml).toContain('16.2%');
    expect(preview.sanitizedHtml).toContain('2.30x'); // MOIC post-tax (fmtX → 2 decimals)
    expect(preview.sanitizedHtml).toContain('6 yr'); // payback
    expect(preview.sanitizedHtml).toContain('IRR (Post-tax)');
  });

  it('is a FRAGMENT — no document-level HTML', () => {
    const html = preview.sanitizedHtml.toLowerCase();
    expect(html).not.toContain('<!doctype');
    expect(html).not.toContain('<html');
    expect(html).not.toContain('<head');
    expect(html).not.toContain('<body');
    expect(preview.sanitizedHtml).toMatch(/^<section/); // starts as a fragment
  });

  it('contains no scripts / event handlers / javascript: URLs', () => {
    const html = preview.sanitizedHtml.toLowerCase();
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick=');
    expect(html).not.toContain('onerror=');
    expect(html).not.toContain('onload=');
    expect(html).not.toContain('javascript:');
  });
});

describe('deriveMemoMetricsAssetPreview — missing / empty data', () => {
  it('returns null for null / undefined memo', () => {
    expect(deriveMemoMetricsAssetPreview(null)).toBeNull();
    expect(deriveMemoMetricsAssetPreview(undefined)).toBeNull();
  });

  it('returns null when there is no engine snapshot', () => {
    expect(deriveMemoMetricsAssetPreview({})).toBeNull();
    expect(deriveMemoMetricsAssetPreview({ memo_json: {} })).toBeNull();
    expect(deriveMemoMetricsAssetPreview({ memo_json: { _exec_projection: null } })).toBeNull();
  });

  it('returns null when the snapshot has no present metrics', () => {
    expect(
      deriveMemoMetricsAssetPreview({ memo_json: { _exec_projection: {} } }),
    ).toBeNull();
    // Only absent/non-board fields → still null.
    expect(
      deriveMemoMetricsAssetPreview({
        memo_json: { _exec_projection: { irr_post_tax: null, total_capex: null } },
      }),
    ).toBeNull();
  });

  it('renders only the metrics that are actually present', () => {
    const partial = deriveMemoMetricsAssetPreview({
      memo_json: { _exec_projection: { irr_post_tax: 0.15, total_capex: 5e8 } },
    });
    expect(partial).not.toBeNull();
    expect(partial.sanitizedHtml).toContain('15.0%');
    expect(partial.sanitizedHtml).toContain('IRR (Post-tax)');
    expect(partial.sanitizedHtml).toContain('Total CAPEX');
    // No payback row when payback_years is absent.
    expect(partial.sanitizedHtml).not.toContain('Payback');
  });
});

describe('esc — escaping primitive (defense in depth)', () => {
  it('neutralizes all HTML-significant characters', () => {
    const out = esc('<img src=x onerror="alert(1)">');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('"');
    expect(out).toContain('&lt;img');
    expect(out).toContain('&gt;');
    expect(out).toContain('&quot;');
  });

  it('escapes & and single quotes', () => {
    expect(esc("a & b's <x>")).toBe('a &amp; b&#39;s &lt;x&gt;');
  });

  it('coerces null/undefined to empty string', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });
});

describe('deriveMemoMetricsAssetPreview — robust to a corrupt snapshot value', () => {
  it('excludes a non-numeric board value (never throws in the numeric formatter)', () => {
    // A legacy/corrupt snapshot could carry a non-number; the finite-number guard
    // must drop that metric rather than crash the dossier render.
    const preview = deriveMemoMetricsAssetPreview({
      memo_json: {
        _exec_projection: {
          irr_post_tax: 0.15,
          dscr_stabilized: '<img src=x onerror="alert(1)">', // corrupt / hostile
          total_capex: NaN, // also non-finite
        },
      },
    });
    expect(preview).not.toBeNull();
    expect(preview.sanitizedHtml).toContain('15.0%'); // the valid metric renders
    expect(preview.sanitizedHtml).not.toContain('DSCR'); // corrupt metric excluded
    expect(preview.sanitizedHtml).not.toContain('Total CAPEX'); // NaN excluded
    // No injected markup reaches the output.
    expect(preview.sanitizedHtml.toLowerCase()).not.toContain('<img');
    expect(preview.sanitizedHtml.toLowerCase()).not.toContain('onerror=');
  });
});
