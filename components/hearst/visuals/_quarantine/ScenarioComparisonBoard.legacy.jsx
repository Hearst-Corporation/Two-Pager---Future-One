/**
 * ScenarioComparisonBoard.jsx
 * Institutional side-by-side comparison of N deployment scenarios.
 * Light-paper, card-based matrix (HTML/CSS grid — not SVG). McKinsey/Equinix grade.
 *
 * Props:
 *   scenarios: Array<{
 *     id, name, archetype,
 *     irr_pct, moic, capex_m, mw, cod_months, risk_score, confidence
 *   }>
 *   selectedId: string (optional, highlights one scenario)
 *
 * Layout discipline:
 *   - Responsive CSS grid: first column = metric labels, then 1fr per scenario.
 *     minWidth:0 + box-sizing:border-box let columns shrink so ALL N fit the
 *     container width — never horizontal-clipped.
 *   - Per-metric winner is accented (best IRR/MOIC/Confidence = max;
 *     CAPEX/MW, Risk, COD = min). A subtle tint + ★ marks the winning cell.
 *   - One "BEST FIT" summary line names the recommended scenario.
 *   - No debug grey bars: values read as clean numbers in a calm grid.
 */

import React, { useState } from 'react';
import { TOKENS } from '@/lib/spatial/tokens';

const C = {
  accent: TOKENS.dataHall.base.var,
  accentSoft: TOKENS.dataHall.soft.var,
  gold: TOKENS.warning.var,
  text: TOKENS.text.var,
  textSecondary: TOKENS.textSecondary.var,
  textMuted: TOKENS.textMuted.var,
  surface: TOKENS.surface.var,
  surfaceAlt: TOKENS.surfaceAlt.var,
  border: TOKENS.border.var,
  borderLight: TOKENS.borderLight.var,
  inverse: TOKENS.textInverse.var,
  background: TOKENS.background.var,
};

/* Archetype chip palette — cycles through semantic accents so any archetype
   string gets a stable, distinct color (data uses Powered Shell / AI Factory /
   Hyperscale / GPU Cloud / Sovereign, none of which are fixed keywords). */
const CHIP_PALETTE = [
  TOKENS.cooling.strong.var,
  TOKENS.network.strong.var,
  TOKENS.sovereign.base.var,
  TOKENS.security.strong.var,
  TOKENS.power.base.var,
];

function chipColor(archetype, index) {
  return CHIP_PALETTE[index % CHIP_PALETTE.length];
}

/* Metric definitions. fmt -> display string; lower=true means smaller wins. */
const METRICS = [
  { key: 'irr_pct',    label: 'IRR',         lower: false, fmt: (v) => `${v.toFixed(1)}%` },
  { key: 'moic',       label: 'MOIC',        lower: false, fmt: (v) => `${v.toFixed(1)}×` },
  { key: 'capex_mw',   label: 'CAPEX / MW',  lower: true,  fmt: (v) => `$${v.toFixed(1)}M` },
  { key: 'risk_score', label: 'Risk',        lower: true,  fmt: (v) => `${v.toFixed(1)} / 10` },
  { key: 'confidence', label: 'Confidence',  lower: false, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'cod_months', label: 'Time to COD', lower: true,  fmt: (v) => `M+${v}` },
  { key: 'mw',         label: 'Capacity',    lower: null,  fmt: (v) => `${v} MW` },
];

function deriveCapexPerMw(s) {
  if (s.mw && s.capex_m) return +(s.capex_m / s.mw).toFixed(2);
  return s.capex_mw ?? 0;
}

/* Winner index per metric (null for metrics with no "best", e.g. capacity). */
function winnerIndexFor(metric, rows) {
  if (metric.lower === null) return -1;
  let bestI = -1;
  let bestV = metric.lower ? Infinity : -Infinity;
  rows.forEach((s, i) => {
    const v = s[metric.key];
    if (v == null || Number.isNaN(v)) return;
    if (metric.lower ? v < bestV : v > bestV) {
      bestV = v;
      bestI = i;
    }
  });
  return bestI;
}

/* Recommended scenario = best IRR × confidence composite. */
function recommendedIndex(rows) {
  if (!rows.length) return 0;
  let bestI = 0;
  let bestScore = -Infinity;
  rows.forEach((s, i) => {
    const score = (s.irr_pct ?? 0) * 0.6 + (s.confidence ?? 0) * 100 * 0.4;
    if (score > bestScore) {
      bestScore = score;
      bestI = i;
    }
  });
  return bestI;
}

export default function ScenarioComparisonBoard({ scenarios = [], selectedId }) {
  const rows = scenarios.map((s) => ({ ...s, capex_mw: deriveCapexPerMw(s) }));
  const recIdx = recommendedIndex(rows);
  const recId = rows[recIdx]?.id ?? null;

  const [sel, setSel] = useState(selectedId ?? null);
  const activeId = sel ?? recId;

  // Winner column index per metric (computed once).
  const winners = METRICS.map((m) => winnerIndexFor(m, rows));

  const n = rows.length;
  const gridCols = `minmax(110px, 150px) repeat(${n}, minmax(0, 1fr))`;

  const rec = rows[recIdx];

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        color: C.text,
        background: C.surface,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 12,
        padding: '18px 18px 16px',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2, color: C.text }}>
          Scenario Comparison
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, letterSpacing: 0.3, marginTop: 1 }}>
          {n} deployment scenarios &middot; best value per metric marked &#9733;
        </div>
      </div>

      {/* BEST FIT summary line */}
      {rec && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '12px 0 14px',
            padding: '8px 12px',
            background: C.background,
            border: `1px solid ${C.borderLight}`,
            borderLeft: `3px solid ${C.gold}`,
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: 0.6,
              color: C.inverse,
              background: C.gold,
              padding: '3px 8px',
              borderRadius: 10,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            BEST FIT
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.text }}>
            {rec.name ?? rec.id}
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 500, color: C.textSecondary, minWidth: 0 }}>
            &mdash; highest IRR &times; confidence ({rec.irr_pct?.toFixed(1)}% &middot;{' '}
            {Math.round((rec.confidence ?? 0) * 100)}% conviction)
          </span>
        </div>
      )}

      {/* Header row: metric-label spacer + scenario column cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          columnGap: 6,
          alignItems: 'stretch',
          marginBottom: 6,
        }}
      >
        <div /> {/* empty corner above metric labels */}
        {rows.map((s, i) => {
          const isActive = activeId === s.id;
          const isRec = s.id === recId;
          return (
            <div
              key={s.id}
              onClick={() => setSel(s.id === sel ? null : s.id)}
              title={s.name ?? s.id}
              style={{
                minWidth: 0,
                boxSizing: 'border-box',
                position: 'relative',
                cursor: 'pointer',
                background: isActive ? C.accent : C.surfaceAlt,
                border: `1.5px solid ${isActive ? C.accent : C.borderLight}`,
                borderRadius: 8,
                padding: isRec ? '14px 8px 8px' : '8px 8px',
                transition: 'background 0.15s, border-color 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                minHeight: 58,
              }}
            >
              {isRec && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: C.gold,
                    color: C.inverse,
                    fontSize: 7,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    padding: '2px 6px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    boxShadow: `0 0 0 2px ${isActive ? C.accent : C.surfaceAlt}`,
                  }}
                >
                  RECOMMENDED
                </div>
              )}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  textAlign: 'center',
                  color: isActive ? C.inverse : C.text,
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {s.name ?? s.id}
              </div>
              {s.archetype && (
                <div
                  style={{
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    fontSize: 7.5,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    color: C.inverse,
                    background: isActive ? 'rgba(255,255,255,0.22)' : chipColor(s.archetype, i),
                    borderRadius: 4,
                    padding: '2px 6px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.archetype}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Metric rows */}
      <div
        style={{
          border: `1px solid ${C.borderLight}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {METRICS.map((m, mi) => {
          const winIdx = winners[mi];
          return (
            <div
              key={m.key}
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                columnGap: 6,
                alignItems: 'stretch',
                background: mi % 2 === 0 ? C.surface : C.background,
                borderTop: mi === 0 ? 'none' : `1px solid ${C.borderLight}`,
              }}
            >
              {/* metric label */}
              <div
                style={{
                  minWidth: 0,
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: C.textSecondary,
                  textAlign: 'right',
                  padding: '9px 10px 9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.label}
              </div>
              {/* scenario values */}
              {rows.map((s, i) => {
                const raw = s[m.key];
                const isWinner = i === winIdx && raw != null;
                const isActive = activeId === s.id;
                const display = raw == null || Number.isNaN(raw) ? '—' : m.fmt(raw);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSel(s.id === sel ? null : s.id)}
                    style={{
                      minWidth: 0,
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      padding: '8px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      fontSize: 10.5,
                      fontWeight: isWinner ? 800 : 600,
                      color: isWinner ? C.accent : C.text,
                      background: isWinner
                        ? C.surfaceAlt
                        : isActive
                          ? C.background
                          : 'transparent',
                      borderLeft:
                        i === 0 ? `1px solid ${C.borderLight}` : `1px solid ${C.borderLight}`,
                      textAlign: 'center',
                      lineHeight: 1.1,
                    }}
                  >
                    {isWinner && (
                      <span style={{ fontSize: 8, color: C.gold, lineHeight: 1 }}>&#9733;</span>
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <div
        style={{
          marginTop: 10,
          fontSize: 8,
          fontWeight: 500,
          color: C.textMuted,
          textAlign: 'right',
          letterSpacing: 0.2,
        }}
      >
        Click a column to highlight &middot; &#9733; marks the best value per metric &middot;
        gold badge = recommended (IRR &times; confidence)
      </div>
    </div>
  );
}
