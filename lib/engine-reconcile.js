// lib/engine-reconcile.js
//
// Engine-truth pin — pure ESM module (no Next.js runtime dependency).
//
// Reconciles LLM-authored key_financial_metrics.metrics rows against the
// engine-computed _exec_projection. Extracted from route.js (Fix 1) so that
// route.js only exports valid Next.js route handlers.
//
// Fix 2: per-field `exclude` regex prevents substring keyword collisions
//   (e.g. "capex" keyword must not overwrite "CAPEX per MW" rows).
// Fix 3: all matching rows for a field are replaced, not just findIndex[0],
//   so no duplicate concept rows survive with divergent LLM numbers.
// Fix 5: IRR formatter keeps fmtPct's full output ("18.2%") in value and
//   sets unit:'', matching how USD/× fields are handled and eliminating the
//   "18.2 %" space artefact in the dossier render.

import { fmtUsd, fmtPct, fmtX, fmtYears } from '@/lib/dossier-derive';

// ── Engine field map ────────────────────────────────────────────────────────
//
// Each entry:
//   field    : key in _exec_projection
//   keywords : label substrings that identify this concept (case-insensitive)
//   exclude  : (optional) RegExp — if the label matches, skip this row even
//              when a keyword matched. Prevents per-unit / qualified rows from
//              being overwritten with total figures.
//   label    : canonical label used when inserting a missing row
//   fmt      : (engineValue) => { value: string, unit: string } | null
//
// Fix 5: IRR — value holds the full "18.2%" string, unit is '' so the dossier
// renders "18.2%" with no extra space.
// Canonical (audit P0-1): the board-facing headline returns IRR / NPV / MOIC are
// pinned to the engine's POST-TAX equity values (`*_post_tax`), falling back to
// the pre-tax field only for projections that predate the tax layer (`fallback`).
// This keeps the persisted key_financial_metrics table on the SAME tax basis as
// the Dossier KPI strip, Results decision band, Memo and PDF — no surface shows a
// different "IRR". Formatters delegate to lib/hearst-format via dossier-derive.
export const ENGINE_FIELD_MAP = [
  {
    field: 'irr_post_tax',
    fallback: 'irr',
    keywords: ['irr'],
    // Fix 2: exclude sensitivity rows and unlevered variants
    exclude: /sensitivit|unlever/i,
    label: 'IRR',
    fmt: (v) => {
      const s = fmtPct(v); // "18.2%"
      if (!s) return null;
      // Fix 5: keep full pct string in value, empty unit → no space in render
      return { value: s, unit: '' };
    },
  },
  {
    field: 'npv_post_tax',
    fallback: 'npv',
    keywords: ['npv'],
    label: 'NPV',
    fmt: (v) => {
      const s = fmtUsd(v); // "$440.0M"
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
  {
    field: 'moic_post_tax',
    fallback: 'moic',
    // Fix 2: remove 'multiple' keyword — it collides with "Exit multiple",
    // "EBITDA multiple", "Revenue multiple". Only 'moic' is unambiguous.
    keywords: ['moic'],
    label: 'MOIC',
    fmt: (v) => {
      const s = fmtX(v); // "2.35x"
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
  {
    field: 'total_capex',
    keywords: ['capex'],
    // Fix 2: exclude per-unit rows ("CAPEX per MW", "GPU capex per unit", etc.)
    exclude: /\bper\b|\/\s*mw|\bmw\b/i,
    label: 'Total CAPEX',
    fmt: (v) => {
      const s = fmtUsd(v);
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
  {
    field: 'payback_years',
    keywords: ['payback'],
    label: 'Payback',
    fmt: (v) => {
      const s = fmtYears(v); // "4.5 yr"
      if (!s) return null;
      const parts = s.split(' ');
      return { value: parts[0], unit: parts.slice(1).join(' ') || 'yr' };
    },
  },
  {
    field: 'dscr_stabilized',
    keywords: ['dscr'],
    label: 'DSCR',
    fmt: (v) => {
      const s = fmtX(v); // "1.45×"
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
  {
    field: 'stabilized_ebitda',
    keywords: ['ebitda'],
    // Fix 2: exclude per-unit rows ("EBITDA per MW", etc.)
    exclude: /\bper\b|\/\s*mw|\bmw\b/i,
    label: 'Stabilized EBITDA',
    fmt: (v) => {
      const s = fmtUsd(v);
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
  {
    field: 'stabilized_revenue',
    keywords: ['revenue'],
    // Fix 2: exclude per-unit rows ("Revenue per MW", "Annual revenue (per MW)", etc.)
    exclude: /\bper\b|\/\s*mw|\bmw\b/i,
    label: 'Stabilized Revenue',
    fmt: (v) => {
      const s = fmtUsd(v);
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
  {
    field: 'terminal_value',
    keywords: ['terminal'],
    label: 'Terminal Value',
    fmt: (v) => {
      const s = fmtUsd(v);
      if (!s) return null;
      return { value: s, unit: '' };
    },
  },
];

/**
 * Reconcile key_financial_metrics.metrics against the engine's _exec_projection.
 *
 * For every engine field that is non-null:
 *   - Find ALL rows matching this field's keywords (and not excluded by the
 *     field's `exclude` regex). Fix 3: overwrite the FIRST match and DROP any
 *     additional matches so exactly one engine-pinned row per concept remains.
 *   - If no matching row exists, insert a new one.
 *
 * LLM rows with no engine equivalent (qualitative rows) are preserved unchanged.
 *
 * Pure function — no side effects, fully unit-testable.
 *
 * @param {Array}  metrics    - memo.key_financial_metrics.metrics (not mutated)
 * @param {Object} projection - memo._exec_projection
 * @returns {Array}           - reconciled metrics array
 */
export function reconcileMetricsWithEngine(metrics, projection) {
  if (!projection) return metrics || [];
  let rows = Array.isArray(metrics) ? metrics.map(r => ({ ...r })) : [];

  for (const spec of ENGINE_FIELD_MAP) {
    // Canonical post-tax field, falling back to the pre-tax field for older
    // projections that predate the tax layer (spec.fallback).
    const engineValue = projection[spec.field] ?? (spec.fallback != null ? projection[spec.fallback] : null);
    if (engineValue == null) continue; // engine didn't compute this field — skip

    const formatted = spec.fmt(engineValue);
    if (!formatted) continue; // formatter returned null (e.g. non-finite) — skip

    // Fix 2: matcher — keyword hit AND (no exclude regex, OR exclude doesn't match)
    const matches = (label) => {
      const lower = (label || '').toLowerCase();
      if (!spec.keywords.some(kw => lower.includes(kw))) return false;
      if (spec.exclude && spec.exclude.test(label || '')) return false;
      return true;
    };

    // Find indices of ALL rows that match this field
    const matchingIndices = rows.reduce((acc, r, i) => {
      if (matches(r.label)) acc.push(i);
      return acc;
    }, []);

    if (matchingIndices.length > 0) {
      // Fix 3: overwrite the FIRST match with the engine-pinned row
      const firstIdx = matchingIndices[0];
      rows[firstIdx] = {
        label: rows[firstIdx].label, // preserve original label casing
        value: formatted.value,
        unit: formatted.unit,
        confidence: 'HIGH',
        source: 'engine',
      };
      // Fix 3: drop any additional duplicate matches (descending order to preserve indices)
      for (let k = matchingIndices.length - 1; k >= 1; k--) {
        rows.splice(matchingIndices[k], 1);
      }
    } else {
      // No existing row — insert a new engine row
      rows.push({
        label: spec.label,
        value: formatted.value,
        unit: formatted.unit,
        confidence: 'HIGH',
        source: 'engine',
      });
    }
  }

  return rows;
}
