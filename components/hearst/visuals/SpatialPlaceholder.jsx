/**
 * SpatialPlaceholder.jsx — ORACLE institutional spatial placeholder
 * ------------------------------------------------------------------
 * A clean, correctly-proportioned placeholder shown for any spatial view
 * until APPROVED production-grade assets exist. It deliberately contains NO
 * fake geometry and NO pretend 3D — only a reserved canvas, the future input
 * contract, the assets it will require, and explicit "not for presentation"
 * messaging. Pure SVG → fixed aspect ratio, no clipping, PDF-safe.
 *
 * Props (the future expected input contract — all optional, shown as metadata):
 *   kind            SpatialViewKind ('campus2d' | 'campus3d' | ... )
 *   scenarioId, region, mw, archetype, phases
 *   rendererStatus  e.g. 'placeholder' (default) | 'awaiting-approval'
 *   lastValidatedAt ISO string | null
 */
import React from 'react';
import { TOKENS } from '@/lib/spatial/tokens';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING } from '@/lib/spatial/typography';
import { SAFE_MARGIN, TITLE_BAND, RADIUS, STROKE } from '@/lib/spatial/board';
import { VIEW_META } from '@/lib/spatial/placeholder-mode';
import { viewAssetStatus } from '@/lib/spatial/assets/manifest';

const STATUS_COLOR = {
  missing: TOKENS.textMuted.var,
  candidate: TOKENS.warning.var,
  approved: TOKENS.success.var,
  deprecated: TOKENS.error.var,
};

export default function SpatialPlaceholder({
  kind = 'campus2d',
  scenarioId = null,
  region = null,
  mw = null,
  archetype = null,
  phases = null,
  rendererStatus = 'placeholder',
  lastValidatedAt = null,
}) {
  const meta = VIEW_META[kind] || VIEW_META.campus2d;
  const { w: W, h: H } = meta.frame;
  const assets = viewAssetStatus(kind);

  const M = SAFE_MARGIN;
  const bandBottom = M + TITLE_BAND;
  const contentTop = bandBottom + 10;
  const contentBottom = H - M;

  // Right metadata panel + left reserved canvas
  const panelW = Math.min(Math.max(W * 0.34, 196), 264);
  const gap = 16;
  const canvasX = M;
  const canvasW = W - M * 2 - panelW - gap;
  const panelX = canvasX + canvasW + gap;
  const canvasH = contentBottom - contentTop;

  // Contract rows (only shown when provided, plus always-present kind)
  const contractRows = [
    ['scenario_id', scenarioId],
    ['region', region],
    ['mw', mw != null ? `${mw} MW` : null],
    ['archetype', archetype],
    ['phases', phases != null ? String(phases) : null],
  ];

  // Panel vertical cursor
  let cy = contentTop + 4;
  const line = (dy = 13) => (cy += dy);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', background: TOKENS.surface.var, borderRadius: RADIUS.board, fontFamily: FONT_FAMILY }}
      aria-label={`${meta.title} — placeholder (visual asset pending, not for presentation)`}
    >
      {/* Paper board */}
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx={RADIUS.board}
        fill={TOKENS.surface.var} stroke={TOKENS.borderLight.var} strokeWidth={STROKE.thin} />
      {/* Thin top accent */}
      <rect x="0.5" y="0.5" width={W - 1} height="3" rx="1.5" fill={TOKENS.dataHall.base.var} opacity="0.9" />

      {/* ── Title band ───────────────────────────────────────────── */}
      <text x={M} y={M + 14} fontSize={FONT_SIZE.heading} fontWeight={FONT_WEIGHT.bold}
        fill={TOKENS.text.var} letterSpacing={LETTER_SPACING.tight}>{meta.title}</text>
      <text x={M} y={M + 29} fontSize={FONT_SIZE.caption} fontWeight={FONT_WEIGHT.regular}
        fill={TOKENS.textMuted.var}>{meta.subtitle}</text>

      {/* NOT FOR PRESENTATION pill (top-right) */}
      {(() => {
        const pw = 132, ph = 18, px = W - M - pw, py = M;
        return (
          <g>
            <rect x={px} y={py} width={pw} height={ph} rx={RADIUS.chip}
              fill={TOKENS.warning.var} opacity="0.12" stroke={TOKENS.warning.var} strokeWidth={STROKE.thin} />
            <circle cx={px + 12} cy={py + ph / 2} r="3" fill={TOKENS.warning.var} />
            <text x={px + 21} y={py + 12.5} fontSize={FONT_SIZE.micro + 0.5} fontWeight={FONT_WEIGHT.bold}
              fill={TOKENS.warning.var} letterSpacing={LETTER_SPACING.eyebrow}>NOT FOR PRESENTATION</text>
          </g>
        );
      })()}

      {/* Band divider */}
      <line x1={M} y1={bandBottom} x2={W - M} y2={bandBottom} stroke={TOKENS.borderLight.var} strokeWidth={STROKE.hair} />

      {/* ── Reserved canvas area (NO fake geometry) ──────────────── */}
      <rect x={canvasX} y={contentTop} width={canvasW} height={canvasH} rx={RADIUS.card}
        fill={TOKENS.surfaceAlt.var} opacity="0.5"
        stroke={TOKENS.border.var} strokeWidth={STROKE.thin} strokeDasharray="6 5" />

      {/* Viewfinder corner brackets — signals 'reserved space', not content */}
      {(() => {
        const b = 14, ix = canvasX + 14, iy = contentTop + 14, rx = canvasX + canvasW - 14, ry = contentBottom - 14;
        const col = TOKENS.border.var, sw = STROKE.base;
        const corner = (x, y, dx, dy, k) => (
          <g key={k}>
            <line x1={x} y1={y} x2={x + dx} y2={y} stroke={col} strokeWidth={sw} strokeLinecap="round" />
            <line x1={x} y1={y} x2={x} y2={y + dy} stroke={col} strokeWidth={sw} strokeLinecap="round" />
          </g>
        );
        return (
          <g opacity="0.6">
            {corner(ix, iy, b, b, 'tl')}
            {corner(rx, iy, -b, b, 'tr')}
            {corner(ix, ry, b, -b, 'bl')}
            {corner(rx, ry, -b, -b, 'br')}
          </g>
        );
      })()}

      {/* Centered placeholder messaging */}
      {(() => {
        const cxc = canvasX + canvasW / 2;
        const cyc = contentTop + canvasH / 2;
        return (
          <g textAnchor="middle">
            <text x={cxc} y={cyc - 14} fontSize={FONT_SIZE.emphasis} fontWeight={FONT_WEIGHT.heavy}
              fill={TOKENS.textSecondary.var} letterSpacing={LETTER_SPACING.eyebrow}>VISUAL ASSET PENDING</text>
            <text x={cxc} y={cyc + 4} fontSize={FONT_SIZE.caption} fill={TOKENS.textMuted.var}>
              Approved asset required before this view renders
            </text>
            <text x={cxc} y={cyc + 22} fontSize={FONT_SIZE.micro + 0.5} fontWeight={FONT_WEIGHT.semibold}
              fill={TOKENS.textMuted.var} letterSpacing={LETTER_SPACING.wide} opacity="0.8">
              {meta.needs3D ? 'GEOMETRY PLACEHOLDER · 3D ASSET' : 'GEOMETRY PLACEHOLDER'}
            </text>
          </g>
        );
      })()}

      {/* ── Metadata / contract panel ────────────────────────────── */}
      {(() => {
        const px = panelX, pad = 12, lx = panelX + pad, vx = W - M - pad;
        const sectionLabel = (txt) => {
          cy += 9;            // lead gap so sections are clearly separated
          const y = cy;
          cy += 16;
          return (
            <text key={txt} x={lx} y={y + 8} fontSize={FONT_SIZE.micro + 0.5} fontWeight={FONT_WEIGHT.bold}
              fill={TOKENS.textMuted.var} letterSpacing={LETTER_SPACING.eyebrow}>{txt}</text>
          );
        };
        const kv = (k, v, i) => {
          const y = line(13);
          return (
            <g key={`${k}-${i}`}>
              <text x={lx} y={y} fontSize={FONT_SIZE.caption} fill={TOKENS.textMuted.var}>{k}</text>
              <text x={vx} y={y} textAnchor="end" fontSize={FONT_SIZE.caption} fontWeight={FONT_WEIGHT.semibold}
                fill={v == null ? TOKENS.border.var : TOKENS.text.var}>{v == null ? '—' : v}</text>
            </g>
          );
        };
        const els = [];
        // panel frame
        els.push(
          <rect key="pf" x={px} y={contentTop} width={panelW} height={canvasH} rx={RADIUS.card}
            fill={TOKENS.surface.var} stroke={TOKENS.borderLight.var} strokeWidth={STROKE.thin} />
        );
        // RENDERER STATUS
        els.push(sectionLabel('RENDERER STATUS'));
        {
          const y = line(15);
          els.push(
            <g key="rs">
              <rect x={lx} y={y - 10} width={panelW - pad * 2} height={15} rx={RADIUS.chip}
                fill={TOKENS.warning.var} opacity="0.10" />
              <circle cx={lx + 8} cy={y - 2.5} r="3" fill={TOKENS.warning.var} />
              <text x={lx + 16} y={y} fontSize={FONT_SIZE.caption} fontWeight={FONT_WEIGHT.bold}
                fill={TOKENS.warning.var} letterSpacing={LETTER_SPACING.eyebrow}>
                {String(rendererStatus).toUpperCase()}
              </text>
            </g>
          );
        }
        // INPUT CONTRACT
        els.push(sectionLabel('INPUT CONTRACT'));
        els.push(<g key="contract">{[['kind', kind], ...contractRows].map(([k, v], i) => kv(k, v, i))}</g>);
        // ASSETS REQUIRED
        els.push(sectionLabel(`ASSETS REQUIRED (${assets.length})`));
        if (assets.length === 0) {
          const y = line(13);
          els.push(
            <text key="noassets" x={lx} y={y} fontSize={FONT_SIZE.caption} fill={TOKENS.textMuted.var}>
              Data-driven view · no 3D geometry
            </text>
          );
        } else {
          els.push(
            <g key="assets">
              {assets.map((a, i) => {
                const y = line(13);
                return (
                  <g key={a.id}>
                    <circle cx={lx + 3} cy={y - 3} r="3" fill={STATUS_COLOR[a.status] || TOKENS.textMuted.var} />
                    <text x={lx + 12} y={y} fontSize={FONT_SIZE.caption} fill={TOKENS.textSecondary.var}>{a.id}</text>
                    <text x={vx} y={y} textAnchor="end" fontSize={FONT_SIZE.micro + 0.5} fontWeight={FONT_WEIGHT.semibold}
                      fill={STATUS_COLOR[a.status] || TOKENS.textMuted.var} letterSpacing={LETTER_SPACING.eyebrow}>
                      {a.status.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        }
        // footer: last validated (pin to bottom of panel)
        els.push(
          <g key="validated">
            <line x1={lx} y1={contentBottom - 22} x2={vx} y2={contentBottom - 22}
              stroke={TOKENS.borderLight.var} strokeWidth={STROKE.hair} />
            <text x={lx} y={contentBottom - 9} fontSize={FONT_SIZE.micro + 0.5} fill={TOKENS.textMuted.var}>
              last_validated_at
            </text>
            <text x={vx} y={contentBottom - 9} textAnchor="end" fontSize={FONT_SIZE.micro + 0.5}
              fontWeight={FONT_WEIGHT.semibold} fill={lastValidatedAt ? TOKENS.text.var : TOKENS.border.var}>
              {lastValidatedAt || 'never'}
            </text>
          </g>
        );
        return els;
      })()}
    </svg>
  );
}
