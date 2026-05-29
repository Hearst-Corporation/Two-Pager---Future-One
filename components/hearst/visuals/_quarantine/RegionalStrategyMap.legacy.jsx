/**
 * RegionalStrategyMap.jsx
 * Schematic SVG map of the GCC region with scenario overlays.
 * Props:
 *   scenarios: Array<{id, region, mw, capex_m, irr_pct, risk_level, label}>
 */

import React, { useState } from 'react';
import { TOKENS } from '@/lib/spatial/tokens';

// Local token aliases (readability) — every color resolves to a cockpit var.
const C = {
  bg:          TOKENS.background.var,
  ocean:       TOKENS.info.var,
  gulf:        TOKENS.info.var,
  countryFill: TOKENS.surfaceAlt.var,
  countryEdge: TOKENS.border.var,
  countryText: TOKENS.security.strong.var,
  title:       TOKENS.text.var,
  subText:     TOKENS.textSecondary.var,
  legendBg:    TOKENS.surface.var,
  legendEdge:  TOKENS.borderLight.var,
  legendText:  TOKENS.textSecondary.var,
  muted:       TOKENS.textMuted.var,
};

// Schematic positions for GCC countries (x, y in viewBox 0 0 600 400)
const REGION_POSITIONS = {
  Kuwait:  { x: 270, y: 90,  w: 70,  h: 60  },
  KSA:     { x: 100, y: 130, w: 220, h: 200 },
  Qatar:   { x: 340, y: 180, w: 55,  h: 55  },
  Bahrain: { x: 310, y: 195, w: 28,  h: 22  },
  UAE:     { x: 390, y: 220, w: 120, h: 80  },
  Oman:    { x: 430, y: 280, w: 110, h: 100 },
};

// Dot anchor points (center of dot placement within each region)
const REGION_DOT_ANCHOR = {
  Kuwait:  { x: 305, y: 120 },
  KSA:     { x: 185, y: 225 },
  Qatar:   { x: 368, y: 210 },
  Bahrain: { x: 324, y: 207 },
  UAE:     { x: 450, y: 255 },
  Oman:    { x: 490, y: 330 },
};

const RISK_COLOR = {
  low:    TOKENS.success.var,
  medium: TOKENS.warning.var,
  high:   TOKENS.error.var,
};

const RISK_STROKE = {
  low:    TOKENS.success.var,
  medium: TOKENS.warning.var,
  high:   TOKENS.error.var,
};

// MW → radius mapping (min 8, max 28)
function mwToRadius(mw, allMw) {
  const minR = 8;
  const maxR = 26;
  const minMw = Math.min(...allMw);
  const maxMw = Math.max(...allMw);
  if (maxMw === minMw) return (minR + maxR) / 2;
  return minR + ((mw - minMw) / (maxMw - minMw)) * (maxR - minR);
}

export default function RegionalStrategyMap({ scenarios = [] }) {
  const [hovered, setHovered] = useState(null);

  const allMw = scenarios.map(s => s.mw);

  // Group scenarios by region to offset multiple dots
  const byRegion = {};
  scenarios.forEach(s => {
    if (!byRegion[s.region]) byRegion[s.region] = [];
    byRegion[s.region].push(s);
  });

  const dotData = [];
  Object.entries(byRegion).forEach(([region, group]) => {
    const anchor = REGION_DOT_ANCHOR[region] || { x: 300, y: 200 };
    const count = group.length;
    group.forEach((s, i) => {
      const offset = count > 1 ? (i - (count - 1) / 2) * 22 : 0;
      dotData.push({
        ...s,
        cx: anchor.x + offset,
        cy: anchor.y,
        r: mwToRadius(s.mw, allMw),
      });
    });
  });

  return (
    <div style={{ width: '100%', position: 'relative', fontFamily: 'inherit' }}>
      <svg
        viewBox="0 0 600 400"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', background: C.bg, borderRadius: 8 }}
        aria-label="GCC Regional Strategy Map"
      >
        {/* Ocean / background */}
        <rect x="0" y="0" width="600" height="400" fill={C.ocean} opacity="0.18" rx="8" />

        {/* Gulf water body (Persian Gulf schematic) */}
        <ellipse cx="350" cy="190" rx="90" ry="55" fill={C.gulf} opacity="0.32" />

        {/* Country shapes — simplified rectangles/polygons */}
        {/* KSA */}
        <rect
          x={REGION_POSITIONS.KSA.x} y={REGION_POSITIONS.KSA.y}
          width={REGION_POSITIONS.KSA.w} height={REGION_POSITIONS.KSA.h}
          fill={C.countryFill} stroke={C.countryEdge} strokeWidth="1.5" rx="6"
        />
        <text x="145" y="242" textAnchor="middle" fontSize="11" fontWeight="700"
          fill={C.countryText} letterSpacing="0.5">KSA</text>

        {/* Kuwait */}
        <rect
          x={REGION_POSITIONS.Kuwait.x} y={REGION_POSITIONS.Kuwait.y}
          width={REGION_POSITIONS.Kuwait.w} height={REGION_POSITIONS.Kuwait.h}
          fill={C.countryFill} stroke={C.countryEdge} strokeWidth="1.5" rx="5"
        />
        <text x="305" y="115" textAnchor="middle" fontSize="10" fontWeight="600"
          fill={C.countryText}>Kuwait</text>

        {/* Qatar */}
        <rect
          x={REGION_POSITIONS.Qatar.x} y={REGION_POSITIONS.Qatar.y}
          width={REGION_POSITIONS.Qatar.w} height={REGION_POSITIONS.Qatar.h}
          fill={C.countryFill} stroke={C.countryEdge} strokeWidth="1.5" rx="4"
        />
        <text x="368" y="248" textAnchor="middle" fontSize="9" fontWeight="600"
          fill={C.countryText}>Qatar</text>

        {/* Bahrain */}
        <rect
          x={REGION_POSITIONS.Bahrain.x} y={REGION_POSITIONS.Bahrain.y}
          width={REGION_POSITIONS.Bahrain.w} height={REGION_POSITIONS.Bahrain.h}
          fill={C.countryFill} stroke={C.countryEdge} strokeWidth="1.5" rx="3"
        />
        <text x="324" y="226" textAnchor="middle" fontSize="8" fontWeight="500"
          fill={C.countryText}>BH</text>

        {/* UAE */}
        <rect
          x={REGION_POSITIONS.UAE.x} y={REGION_POSITIONS.UAE.y}
          width={REGION_POSITIONS.UAE.w} height={REGION_POSITIONS.UAE.h}
          fill={C.countryFill} stroke={C.countryEdge} strokeWidth="1.5" rx="5"
        />
        <text x="450" y="268" textAnchor="middle" fontSize="10" fontWeight="600"
          fill={C.countryText}>UAE</text>

        {/* Oman */}
        <rect
          x={REGION_POSITIONS.Oman.x} y={REGION_POSITIONS.Oman.y}
          width={REGION_POSITIONS.Oman.w} height={REGION_POSITIONS.Oman.h}
          fill={C.countryFill} stroke={C.countryEdge} strokeWidth="1.5" rx="5"
        />
        <text x="485" y="352" textAnchor="middle" fontSize="10" fontWeight="600"
          fill={C.countryText}>Oman</text>

        {/* Scenario dots */}
        {dotData.map(d => (
          <g key={d.id} onMouseEnter={() => setHovered(d.id)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}>
            {/* Glow ring on hover */}
            {hovered === d.id && (
              <circle cx={d.cx} cy={d.cy} r={d.r + 7}
                fill="none" stroke={RISK_COLOR[d.risk_level]} strokeWidth="2" opacity="0.4" />
            )}
            <circle
              cx={d.cx} cy={d.cy} r={d.r}
              fill={RISK_COLOR[d.risk_level]}
              stroke={RISK_STROKE[d.risk_level]}
              strokeWidth="1.5"
              opacity={hovered === null || hovered === d.id ? 0.92 : 0.45}
            />
            {/* Label above dot */}
            <text
              x={d.cx} y={d.cy - d.r - 5}
              textAnchor="middle" fontSize="8.5" fontWeight="700"
              fill={C.title}
            >
              {d.label}
            </text>
            <text
              x={d.cx} y={d.cy - d.r - 5 + 11}
              textAnchor="middle" fontSize="7.5" fill={C.subText}
            >
              {d.mw}MW · {d.irr_pct}% IRR
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(18, 320)">
          <rect x="0" y="0" width="130" height="68" fill={C.legendBg} opacity="0.85" rx="5" stroke={C.legendEdge} strokeWidth="1" />
          <text x="8" y="14" fontSize="9" fontWeight="700" fill={C.legendText} letterSpacing="0.3">RISK LEVEL</text>
          {[['low','Low Risk'],['medium','Medium Risk'],['high','High Risk']].map(([r, label], i) => (
            <g key={r} transform={`translate(8, ${22 + i * 16})`}>
              <circle cx="6" cy="6" r="5" fill={RISK_COLOR[r]} stroke={RISK_STROKE[r]} strokeWidth="1" />
              <text x="16" y="10" fontSize="9" fill={C.legendText}>{label}</text>
            </g>
          ))}
          <text x="8" y="63" fontSize="8" fill={C.muted}>● size = MW capacity</text>
        </g>

        {/* Title */}
        <text x="300" y="22" textAnchor="middle" fontSize="13" fontWeight="800"
          fill={C.title} letterSpacing="0.5">
          GCC DEPLOYMENT SCENARIOS
        </text>
        <text x="300" y="36" textAnchor="middle" fontSize="9" fill={C.subText}>
          Schematic — not geographic projection
        </text>
      </svg>
    </div>
  );
}
