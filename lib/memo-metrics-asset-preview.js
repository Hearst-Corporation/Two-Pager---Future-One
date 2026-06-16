// lib/memo-metrics-asset-preview.js
//
// M.5-C/D producer — derive an AssetPreview metrics fragment from REAL strategic
// memo data, for the client-only render gate.
//
// Source of truth: the persisted memo's engine snapshot (memo_json._exec_projection),
// read through BOARD_METRICS so the preview shows the EXACT same canonical, post-tax
// numbers as Results / Dossier / PDF — no re-derivation, no LLM strings as HTML.
//
// Safety (server-side, no DOMPurify, no jsdom):
//   • Every interpolated value is escaped via esc() (own copy — intentionally NOT
//     shared with the PDF route, so this file cannot affect PDF output).
//   • The output is a FRAGMENT: a single <section> with a small <dl>. It never
//     emits <!DOCTYPE>/<html>/<head>/<body>, <script>, event-handler attributes,
//     or javascript: URLs. Class names are static literals; values are escaped.
//   • SafeHtmlPreview still re-sanitizes on the client (defense in depth).

import { BOARD_METRICS, boardValue, boardFormatted, boardLabel } from '@/lib/hearst-board-metrics';

// Local HTML-escape — escapes the characters that matter for HTML text +
// quoted attributes. Mirrors the PDF route's esc() but is a separate copy on
// purpose (zero coupling → zero PDF-output risk). Exported for direct testing.
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

// The compact, calm set of metrics for a preview — in board-reading order.
// Only those actually present (non-null engine value) are rendered.
const PREVIEW_METRIC_IDS = ['irr', 'moic', 'npv', 'payback', 'capex', 'dscr'];

/**
 * Derive an AssetPreview ({ sanitizedHtml, fallbackLabel }) from a persisted memo.
 * Returns null when there is no usable engine snapshot / no present metrics, so
 * the consumer renders nothing.
 *
 * @param {object|null|undefined} memo  persisted memo row ({ memo_json, version, region, ... })
 * @returns {{ sanitizedHtml: string, fallbackLabel: string }|null}
 */
export function deriveMemoMetricsAssetPreview(memo) {
  const projection = memo?.memo_json?._exec_projection;
  if (!projection || typeof projection !== 'object') return null;

  // Keep only metrics whose engine value is a finite number. This both skips
  // absent metrics AND defends against a corrupt/legacy snapshot (a non-numeric
  // value would otherwise throw in the numeric formatters) — never fabricate.
  const rows = PREVIEW_METRIC_IDS
    .filter((id) => BOARD_METRICS[id] && Number.isFinite(boardValue(projection, id)))
    .map((id) => ({ label: boardLabel(id), value: boardFormatted(projection, id) }));

  if (rows.length === 0) return null;

  const items = rows
    .map(
      (r) =>
        `<div class="ct-asset-metric">` +
        `<dt class="ct-asset-metric-label">${esc(r.label)}</dt>` +
        `<dd class="ct-asset-metric-value">${esc(r.value)}</dd>` +
        `</div>`,
    )
    .join('');

  const sanitizedHtml =
    `<section class="ct-asset-metrics" aria-label="Key financial metrics summary">` +
    `<p class="ct-asset-eyebrow">Metrics summary</p>` +
    `<dl class="ct-asset-metrics-list">${items}</dl>` +
    `</section>`;

  return { sanitizedHtml, fallbackLabel: 'Metrics summary' };
}
