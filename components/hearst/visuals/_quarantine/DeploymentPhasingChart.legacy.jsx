/**
 * DeploymentPhasingChart.jsx
 * Horizontal Gantt-style deployment timeline — pure SVG.
 * Light-paper institutional infographic (boardroom / PDF grade):
 * white board, dark ink, thin muted grid, one clear title, clean legend.
 *
 * Props:
 *   phases: Array<{
 *     name,
 *     start_month,
 *     duration_months,
 *     mw_delivered,
 *     cod_date        (string, e.g. "Q3 2026")
 *   }>
 */

import React, { useState } from 'react';
import { TOKENS } from '@/lib/spatial/tokens';
import {
  SAFE_MARGIN,
  TITLE_BAND,
  FOOT_BAND,
  RADIUS,
  STROKE,
  safeArea,
} from '@/lib/spatial/board';
import {
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
} from '@/lib/spatial/typography';

// Local readability aliases — all resolve to cockpit CSS variables (.var).
const C = {
  board: TOKENS.surface.var,         // white paper board
  barDeep: TOKENS.dataHall.deep.var, // P1 darkest burgundy
  barBase: TOKENS.dataHall.base.var, // P2 medium burgundy
  barStrong: TOKENS.dataHall.strong.var, // P3 light burgundy
  barSoft: TOKENS.dataHall.soft.var, // P4+ lightest burgundy
  textInverse: TOKENS.textInverse.var, // white text on bars
  textDark: TOKENS.text.var,         // dark ink
  textSecondary: TOKENS.textSecondary.var,
  gridLine: TOKENS.borderLight.var,  // muted hair grid
  axisLine: TOKENS.border.var,       // baseline axis
  axisLabel: TOKENS.textMuted.var,   // month tick labels
  codFill: TOKENS.warning.var,       // COD diamond fill (amber)
  codStroke: TOKENS.surface.var,     // COD diamond stroke (paper, for contrast ring)
  codText: TOKENS.security.strong.var, // COD date label
  ink: TOKENS.borderStrong.var,      // title / dark slate
  chipFill: TOKENS.background.var,    // summary chip background
  chipBorder: TOKENS.borderLight.var, // summary chip border
};

const PHASE_COLORS = [
  { bar: C.barDeep, text: C.textInverse, label: C.barDeep },   // P1 darkest
  { bar: C.barBase, text: C.textInverse, label: C.barBase },   // P2 medium
  { bar: C.barStrong, text: C.textInverse, label: C.barStrong }, // P3 light
  { bar: C.barSoft, text: C.textDark, label: C.barBase },      // P4+
];

// Generous frame so the time axis + final COD label/diamond fit with margin.
const VIEW_W = 720;
const VIEW_H = 248;

// Left gutter inside the safe area for phase labels.
const LABEL_GUTTER = 84;
// Right reserve inside the safe area so the last COD diamond + date never clip.
const RIGHT_RESERVE = 78;

function computeTotalMonths(phases) {
  if (!phases.length) return 24;
  return Math.max(...phases.map((p) => (p.start_month ?? 0) + (p.duration_months ?? 6)));
}

// Rough text-width estimate (px) for right-edge clip detection.
function approxTextWidth(str, fontPx) {
  return String(str ?? '').length * fontPx * 0.56;
}

export default function DeploymentPhasingChart({ phases = [] }) {
  const [hovered, setHovered] = useState(null);

  const safe = safeArea(VIEW_W, VIEW_H, { title: true, foot: true });
  const totalMonths = computeTotalMonths(phases);

  // Plot region (the actual time track) sits inside the safe area, after the
  // left label gutter and before the right reserve — guarantees no clipping.
  const plotX = safe.x + LABEL_GUTTER;
  const plotW = safe.w - LABEL_GUTTER - RIGHT_RESERVE;
  const plotY = safe.y;
  const plotH = safe.h;

  const n = Math.max(phases.length, 1);
  const ROW_GAP = 10;
  const ROW_H = Math.min(34, Math.max(20, (plotH - (n - 1) * ROW_GAP) / n));
  // Center the rows vertically inside the plot region (tightens rhythm,
  // removes wasted vertical background).
  const stackH = n * ROW_H + (n - 1) * ROW_GAP;
  const rowsTop = plotY + Math.max(0, (plotH - stackH) / 2);

  // Month tick marks (every 3 months) across the plot track only.
  const ticks = [];
  for (let m = 0; m <= totalMonths; m += 3) ticks.push(m);

  const xForMonth = (m) => plotX + (m / totalMonths) * plotW;
  const rowTop = (i) => rowsTop + i * (ROW_H + ROW_GAP);

  return (
    <div style={{ width: '100%', fontFamily: FONT_FAMILY }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
        aria-label="Deployment Phasing Gantt Chart"
      >
        {/* White paper board */}
        <rect
          x="0.5"
          y="0.5"
          width={VIEW_W - 1}
          height={VIEW_H - 1}
          fill={C.board}
          stroke={C.gridLine}
          strokeWidth={STROKE.thin}
          rx={RADIUS.board}
        />

        {/* Title band */}
        <text
          x={SAFE_MARGIN}
          y={SAFE_MARGIN + 8}
          fontSize={FONT_SIZE.heading}
          fontWeight={FONT_WEIGHT.heavy}
          fill={C.ink}
          letterSpacing={LETTER_SPACING.eyebrow}
        >
          DEPLOYMENT PHASING
        </text>
        <text
          x={SAFE_MARGIN}
          y={SAFE_MARGIN + 22}
          fontSize={FONT_SIZE.caption}
          fontWeight={FONT_WEIGHT.regular}
          fill={C.axisLabel}
        >
          Capacity build-out timeline with COD milestones
        </text>

        {/* Legend: COD diamond (top-right of title band) */}
        <g transform={`translate(${VIEW_W - SAFE_MARGIN - 96}, ${SAFE_MARGIN + 2})`}>
          <polygon
            points="5,0 10,5 5,10 0,5"
            fill={C.codFill}
            stroke={C.codStroke}
            strokeWidth={STROKE.thin}
          />
          <text
            x="16"
            y="9"
            fontSize={FONT_SIZE.caption}
            fontWeight={FONT_WEIGHT.semibold}
            fill={C.codText}
          >
            COD milestone
          </text>
        </g>

        {/* Muted hair grid (vertical, within plot track) */}
        {ticks.map((m) => (
          <line
            key={`g-${m}`}
            x1={xForMonth(m)}
            y1={rowsTop - 6}
            x2={xForMonth(m)}
            y2={rowsTop + stackH + 6}
            stroke={C.gridLine}
            strokeWidth={STROKE.hair}
            strokeDasharray={m === 0 ? '0' : '2,3'}
          />
        ))}

        {/* Baseline axis */}
        <line
          x1={plotX}
          y1={rowsTop + stackH + 6}
          x2={plotX + plotW}
          y2={rowsTop + stackH + 6}
          stroke={C.axisLine}
          strokeWidth={STROKE.thin}
        />

        {/* Month axis labels (foot band) */}
        {ticks.map((m) => (
          <text
            key={`t-${m}`}
            x={xForMonth(m)}
            y={VIEW_H - SAFE_MARGIN - 4}
            textAnchor="middle"
            fontSize={FONT_SIZE.micro}
            fill={C.axisLabel}
          >
            M+{m}
          </text>
        ))}

        {/* Phase bars */}
        {phases.map((p, i) => {
          const color = PHASE_COLORS[i % PHASE_COLORS.length];
          const startM = p.start_month ?? 0;
          const durM = p.duration_months ?? 6;
          const x = xForMonth(startM);
          const w = Math.max((durM / totalMonths) * plotW, 4);
          const y = rowTop(i);
          const isHov = hovered === i;
          const codX = xForMonth(startM + durM);
          const cy = y + ROW_H / 2;

          // COD date label: place to the RIGHT of the diamond, but if that
          // would clip past the safe edge, anchor it to the LEFT instead.
          const codFont = FONT_SIZE.caption;
          const labelW = approxTextWidth(p.cod_date, codFont);
          const rightOf = codX + 12 + labelW;
          const rightLimit = VIEW_W - SAFE_MARGIN;
          const labelRight = rightOf > rightLimit;
          const labelX = labelRight ? codX - 12 : codX + 12;
          const labelAnchor = labelRight ? 'end' : 'start';

          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              {/* Phase label (left gutter) */}
              <text
                x={safe.x + LABEL_GUTTER - 14}
                y={cy}
                textAnchor="end"
                fontSize={FONT_SIZE.label}
                fontWeight={FONT_WEIGHT.bold}
                fill={color.label}
                dominantBaseline="middle"
              >
                {p.name ?? `Phase ${i + 1}`}
              </text>

              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={w}
                height={ROW_H}
                fill={color.bar}
                rx={RADIUS.chip}
                opacity={isHov ? 1 : 0.94}
              />

              {/* MW label inside bar */}
              {w > 34 && (
                <text
                  x={x + w / 2}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={FONT_SIZE.emphasis}
                  fontWeight={FONT_WEIGHT.bold}
                  fill={color.text}
                >
                  {p.mw_delivered ?? ''} MW
                </text>
              )}

              {/* COD diamond milestone */}
              <polygon
                points={`${codX},${y - 5} ${codX + 6},${cy} ${codX},${y + ROW_H + 5} ${codX - 6},${cy}`}
                fill={C.codFill}
                stroke={C.codStroke}
                strokeWidth={STROKE.base}
              />

              {/* COD date label (clip-safe placement) */}
              {p.cod_date && (
                <text
                  x={labelX}
                  y={cy}
                  textAnchor={labelAnchor}
                  dominantBaseline="middle"
                  fontSize={codFont}
                  fontWeight={FONT_WEIGHT.bold}
                  fill={labelRight ? C.textInverse : C.codText}
                >
                  {p.cod_date}
                </text>
              )}

              {/* Hover tooltip strip */}
              {isHov && (
                <g>
                  <rect
                    x={Math.min(Math.max(x + w / 2 - 70, SAFE_MARGIN), VIEW_W - SAFE_MARGIN - 140)}
                    y={y - 26}
                    width="140"
                    height="20"
                    fill={C.ink}
                    rx={RADIUS.chip}
                    opacity="0.95"
                  />
                  <text
                    x={Math.min(Math.max(x + w / 2, SAFE_MARGIN + 70), VIEW_W - SAFE_MARGIN - 70)}
                    y={y - 13}
                    textAnchor="middle"
                    fontSize={FONT_SIZE.caption}
                    fontWeight={FONT_WEIGHT.semibold}
                    fill={C.textInverse}
                  >
                    {`${p.name} · ${durM}mo · ${p.mw_delivered}MW · COD ${p.cod_date ?? `M+${startM + durM}`}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Compact phase summary chips (caption row, foot zone) */}
        {phases.length > 0 && (
          <g>
            {(() => {
              const chipY = VIEW_H - SAFE_MARGIN - FOOT_BAND - 6;
              const chipH = 16;
              const slotW = (safe.w) / phases.length;
              return phases.map((p, i) => {
                const color = PHASE_COLORS[i % PHASE_COLORS.length];
                const cx = safe.x + i * slotW + 2;
                const cw = slotW - 6;
                const text = `${p.name ?? `Phase ${i + 1}`}  ·  ${p.mw_delivered ?? '—'} MW  ·  ${p.cod_date ?? '—'}`;
                return (
                  <g key={`chip-${i}`}>
                    <rect
                      x={cx}
                      y={chipY - chipH / 2}
                      width={cw}
                      height={chipH}
                      rx={RADIUS.chip}
                      fill={C.chipFill}
                      stroke={C.chipBorder}
                      strokeWidth={STROKE.hair}
                    />
                    {/* color swatch */}
                    <rect
                      x={cx + 6}
                      y={chipY - 4}
                      width="8"
                      height="8"
                      rx="2"
                      fill={color.bar}
                    />
                    <text
                      x={cx + 20}
                      y={chipY}
                      dominantBaseline="middle"
                      fontSize={FONT_SIZE.micro}
                      fontWeight={FONT_WEIGHT.semibold}
                      fill={C.textSecondary}
                    >
                      {text}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}
