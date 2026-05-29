import React from 'react';
import { iso, isoPath, IsoBox } from '@/lib/spatial/iso';
import { ISO_ORIGIN, PX_PER_UNIT } from '@/lib/spatial/grid';
import { TOKENS, PHASE_PALETTE } from '@/lib/spatial/tokens';

// Local token aliases (readability) — every color routes through TOKENS.
const C = {
  ground: TOKENS.surfaceAlt.var,
  groundStroke: TOKENS.borderLight.var,
  groundBg: TOKENS.surface.var,
  inverse: TOKENS.textInverse.var,
  text: TOKENS.power.base.var,
  textStroke: TOKENS.borderStrong.var,
  muted: TOKENS.annotation.var,
  steam: TOKENS.textMuted.var,
  cooling: TOKENS.cooling.base.var,
  expansion: TOKENS.phase.expansion.var,
  substationRoof: TOKENS.power.base.var,
  substationWallL: TOKENS.power.soft.var,
  substationWallR: TOKENS.power.base.var,
  substationStroke: TOKENS.power.strong.var,
  hallStroke: TOKENS.power.strong.var,
  header: TOKENS.dataHall.base.var,
  archetype: TOKENS.dataHall.base.var,
  infraPower: TOKENS.power.base.var,
};

// Phase color arrays derived from the shared phase palette.
const PHASE_COLORS = PHASE_PALETTE.map((p) => p.var);
const ROOF_COLORS = PHASE_PALETTE.map((p) => p.var);
const WALL_L = PHASE_PALETTE.map((p) => p.var);
const WALL_R = PHASE_PALETTE.map((p) => p.var);

// Floating text label above iso point
function IsoLabel({ gx, gy, gz, text, subtext, fill = C.text, fontSize = 9, fontWeight = '700' }) {
  const pt = iso(gx, gy, gz);
  return (
    <g>
      <text
        x={pt.x}
        y={pt.y}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={fill}
        style={{ pointerEvents: 'none' }}
      >
        {text}
      </text>
      {subtext && (
        <text
          x={pt.x}
          y={pt.y + 11}
          textAnchor="middle"
          fontSize={fontSize - 1.5}
          fontWeight="500"
          fill={fill}
          opacity="0.8"
        >
          {subtext}
        </text>
      )}
    </g>
  );
}

// Phase badge above a building
function PhaseBadge({ gx, gy, gz, phase, color }) {
  const pt = iso(gx, gy, gz);
  return (
    <g>
      <rect x={pt.x - 14} y={pt.y - 11} width="28" height="14" rx="3" fill={color} />
      <text x={pt.x} y={pt.y} textAnchor="middle" fontSize="8" fontWeight="800" fill={C.inverse}>
        P{phase}
      </text>
    </g>
  );
}

// MW badge
function MWBadge({ gx, gy, gz, mw, color }) {
  const pt = iso(gx, gy, gz);
  const label = `${mw}MW`;
  const w = label.length * 6.5 + 12;
  return (
    <g>
      <rect x={pt.x - w / 2} y={pt.y - 9} width={w} height="16" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="0.8" />
      <text x={pt.x} y={pt.y + 3} textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>
        {label}
      </text>
    </g>
  );
}

// Cooling tower (cylinder-ish in iso)
function IsoCoolingTower({ gx, gy, gz = 0, size = 10, color = C.cooling }) {
  const base = iso(gx, gy, gz);
  const top = iso(gx, gy, gz + size * 1.5);
  const rx = size * 0.5;
  const ry = size * 0.25;
  return (
    <g>
      {/* Barrel body */}
      <ellipse cx={base.x} cy={base.y} rx={rx} ry={ry} fill={color} opacity="0.2" stroke={color} strokeWidth="0.8" />
      <line x1={base.x - rx} y1={base.y} x2={top.x - rx} y2={top.y} stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1={base.x + rx} y1={base.y} x2={top.x + rx} y2={top.y} stroke={color} strokeWidth="0.8" opacity="0.5" />
      <ellipse cx={top.x} cy={top.y} rx={rx} ry={ry} fill={color} opacity="0.35" stroke={color} strokeWidth="0.8" />
      {/* Steam wisps */}
      <path d={`M ${top.x - 4} ${top.y - 3} Q ${top.x - 2} ${top.y - 8} ${top.x} ${top.y - 5}`}
        fill="none" stroke={C.steam} strokeWidth="0.8" opacity="0.5" />
      <path d={`M ${top.x + 2} ${top.y - 4} Q ${top.x + 4} ${top.y - 9} ${top.x + 1} ${top.y - 6}`}
        fill="none" stroke={C.steam} strokeWidth="0.8" opacity="0.4" />
    </g>
  );
}

// Connecting infrastructure line (pipe / cable tray)
function InfraLine({ p1, p2, color = C.infraPower, dashed = false }) {
  const a = iso(p1.x, p1.y, p1.z || 0);
  const b = iso(p2.x, p2.y, p2.z || 0);
  return (
    <line
      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke={color}
      strokeWidth="1.2"
      strokeDasharray={dashed ? '5 3' : undefined}
      opacity="0.55"
    />
  );
}

function getMWPerHall(mw, phases) {
  if (phases === 1) return [mw];
  if (phases === 2) return [Math.round(mw * 0.6), Math.round(mw * 0.4)];
  return [Math.round(mw * 0.5), Math.round(mw * 0.3), Math.round(mw * 0.2)];
}

// Grid origin for the whole scene (SVG coords) — sourced from shared grid.
const ORIGIN_X = ISO_ORIGIN.x;
const ORIGIN_Y = ISO_ORIGIN.y;
const SCALE = PX_PER_UNIT.iso; // grid unit in pixels

export default function Campus3DIsometric({ mw = 100, phases = 2, archetype = 'ai_factory', style = {} }) {
  const hallCount = Math.min(phases, 3);
  const mwPerHall = getMWPerHall(mw, hallCount);

  // Hall layout in grid coords (x along iso-x, y along iso-y, z=0 base)
  // Place halls spaced along the y-axis (back-to-front)
  const hallDefs = mwPerHall.map((mwVal, i) => ({
    gx: 2,
    gy: i * 7,
    gz: 0,
    w: 6,
    d: 5,
    h: 3.5,
    mw: mwVal,
    phase: i + 1,
  }));

  // Substation: smaller, to the left
  const substation = { gx: -4, gy: 4, gz: 0, w: 3, d: 3, h: 2.5 };

  // Cooling towers: right side
  const coolingTowers = [
    { gx: 10, gy: 1, gz: 0 },
    { gx: 10, gy: 3.5, gz: 0 },
    { gx: 10, gy: 6, gz: 0 },
  ];

  // Connection lines between halls and substation
  const infraLines = [
    { p1: { x: 2, y: 2.5 }, p2: { x: -1, y: 4.5 }, color: C.infraPower, dashed: false },
    { p1: { x: 8, y: 2.5 }, p2: { x: 10, y: 2.5 }, color: C.cooling, dashed: true }, // cooling
    { p1: { x: 8, y: 9.5 }, p2: { x: 10, y: 6 }, color: C.cooling, dashed: true },
  ];

  // Translate iso points to SVG with scene origin
  function toSVG(gx, gy, gz = 0) {
    const p = iso(gx * SCALE, gy * SCALE, gz * SCALE);
    return { x: p.x + ORIGIN_X, y: p.y + ORIGIN_Y };
  }

  function makeIsoPath(gx, gy, gz, dx, dy, dz, path) {
    // path is array of [gx_off, gy_off, gz_off]
    return path.map(([ox, oy, oz]) => {
      const p = iso((gx + ox) * SCALE, (gy + oy) * SCALE, (gz + oz) * SCALE);
      return { x: p.x + ORIGIN_X, y: p.y + ORIGIN_Y };
    });
  }

  // Build a box face path in SVG coords
  function boxFace(gx, gy, gz, corners) {
    // corners: array of [x, y, z] offsets in grid units
    const pts = corners.map(([ox, oy, oz]) => {
      const p = iso((gx + ox) * SCALE, (gy + oy) * SCALE, (gz + oz) * SCALE);
      return { x: p.x + ORIGIN_X, y: p.y + ORIGIN_Y };
    });
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  }

  function renderBox({ gx, gy, gz = 0, w, d, h, roofColor, wallColorL, wallColorR, strokeColor = C.text, sw = 0.8 }) {
    const roof = boxFace(gx, gy, gz, [[0, 0, h], [w, 0, h], [w, d, h], [0, d, h]]);
    const wallLeft = boxFace(gx, gy, gz, [[0, 0, 0], [0, 0, h], [0, d, h], [0, d, 0]]);
    const wallFront = boxFace(gx, gy, gz, [[0, 0, 0], [w, 0, 0], [w, 0, h], [0, 0, h]]);
    const wallRight = boxFace(gx, gy, gz, [[w, 0, 0], [w, d, 0], [w, d, h], [w, 0, h]]);

    return (
      <>
        {/* Left wall */}
        <path d={wallLeft} fill={wallColorL} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
        {/* Front wall */}
        <path d={wallFront} fill={wallColorL} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
        {/* Right wall */}
        <path d={wallRight} fill={wallColorR} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
        {/* Roof */}
        <path d={roof} fill={roofColor} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
      </>
    );
  }

  function renderCoolingTower(gx, gy, gz = 0, r = 0.6, h = 2.2, color = C.cooling) {
    // Ellipse at base and top, connected by vertical lines
    const basePt = toSVG(gx, gy, gz);
    const topPt = toSVG(gx, gy, gz + h);
    const rx = r * SCALE * 0.866;
    const ryBase = r * SCALE * 0.4;
    const ryTop = ryBase * 0.85;

    return (
      <>
        <ellipse cx={basePt.x} cy={basePt.y} rx={rx} ry={ryBase}
          fill={color} opacity="0.15" stroke={color} strokeWidth="0.7" />
        <line x1={basePt.x - rx} y1={basePt.y} x2={topPt.x - rx} y2={topPt.y}
          stroke={color} strokeWidth="0.8" opacity="0.5" />
        <line x1={basePt.x + rx} y1={basePt.y} x2={topPt.x + rx} y2={topPt.y}
          stroke={color} strokeWidth="0.8" opacity="0.5" />
        <ellipse cx={topPt.x} cy={topPt.y} rx={rx} ry={ryTop}
          fill={color} opacity="0.4" stroke={color} strokeWidth="0.7" />
        {/* Steam */}
        <path d={`M ${topPt.x - 5} ${topPt.y - 3} Q ${topPt.x - 3} ${topPt.y - 10} ${topPt.x} ${topPt.y - 7}`}
          fill="none" stroke={C.steam} strokeWidth="0.7" opacity="0.45" />
        <path d={`M ${topPt.x + 3} ${topPt.y - 4} Q ${topPt.x + 5} ${topPt.y - 11} ${topPt.x + 2} ${topPt.y - 8}`}
          fill="none" stroke={C.steam} strokeWidth="0.7" opacity="0.35" />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 600 400"
      width="100%"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', background: C.groundBg, overflow: 'visible', ...style }}
      aria-label={`Campus 3D Isometric — ${mw}MW, ${phases} phase${phases > 1 ? 's' : ''}, ${archetype}`}
    >
      {/* Ground plane */}
      {(() => {
        const corners = [
          toSVG(-5, -1), toSVG(13, -1), toSVG(13, hallCount * 7 + 2), toSVG(-5, hallCount * 7 + 2)
        ];
        const d = corners.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path d={d} fill={C.ground} stroke={C.groundStroke} strokeWidth="0.8" />;
      })()}

      {/* Infrastructure lines (behind buildings) */}
      {infraLines.map((l, i) => {
        const a = toSVG(l.p1.x, l.p1.y, l.p1.z || 0);
        const b = toSVG(l.p2.x, l.p2.y, l.p2.z || 0);
        return (
          <line key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={l.color}
            strokeWidth="2"
            strokeDasharray={l.dashed ? '6 4' : undefined}
            opacity="0.4"
          />
        );
      })}

      {/* Substation */}
      {renderBox({
        gx: substation.gx, gy: substation.gy, gz: substation.gz,
        w: substation.w, d: substation.d, h: substation.h,
        roofColor: C.substationRoof,
        wallColorL: C.substationWallL,
        wallColorR: C.substationWallR,
        strokeColor: C.substationStroke,
        sw: 0.8,
      })}
      {/* Substation label */}
      {(() => {
        const top = toSVG(substation.gx + substation.w / 2, substation.gy + substation.d / 2, substation.gz + substation.h + 1.2);
        return (
          <g>
            <text x={top.x} y={top.y} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={C.text}>132kV</text>
            <text x={top.x} y={top.y + 9} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={C.text}>Substation</text>
          </g>
        );
      })()}

      {/* Data Halls */}
      {hallDefs.map((hall, i) => (
        <g key={i}>
          {renderBox({
            gx: hall.gx, gy: hall.gy, gz: hall.gz,
            w: hall.w, d: hall.d, h: hall.h,
            roofColor: ROOF_COLORS[i],
            wallColorL: WALL_L[i],
            wallColorR: WALL_R[i],
            strokeColor: C.hallStroke,
            sw: 0.9,
          })}
          {/* Window stripes on front face */}
          {[0.5, 1.1, 1.7, 2.3, 2.9].map((wx) => {
            const bot = toSVG(hall.gx + wx, hall.gy, 0.5);
            const top2 = toSVG(hall.gx + wx, hall.gy, hall.h - 0.4);
            return (
              <line key={wx}
                x1={bot.x} y1={bot.y} x2={top2.x} y2={top2.y}
                stroke={C.inverse}
                strokeWidth="0.6"
                opacity="0.25"
              />
            );
          })}
          {/* Phase badge */}
          {(() => {
            const badgePt = toSVG(hall.gx + hall.w / 2, hall.gy, hall.gz + hall.h + 1.8);
            return (
              <g>
                <rect x={badgePt.x - 16} y={badgePt.y - 10} width="32" height="16" rx="4" fill={PHASE_COLORS[i]} />
                <text x={badgePt.x} y={badgePt.y + 1} textAnchor="middle" fontSize="8.5" fontWeight="800" fill={C.inverse}>
                  P{hall.phase}
                </text>
              </g>
            );
          })()}
          {/* MW badge */}
          {(() => {
            const mwPt = toSVG(hall.gx + hall.w / 2, hall.gy, hall.gz + hall.h + 0.7);
            const label = `${hall.mw}MW IT`;
            const bw = label.length * 5.5 + 10;
            return (
              <g>
                <rect x={mwPt.x - bw / 2} y={mwPt.y - 8} width={bw} height="14" rx="3"
                  fill={PHASE_COLORS[i]} opacity="0.15" stroke={PHASE_COLORS[i]} strokeWidth="0.8" />
                <text x={mwPt.x} y={mwPt.y + 2} textAnchor="middle" fontSize="8" fontWeight="700" fill={PHASE_COLORS[i]}>
                  {label}
                </text>
              </g>
            );
          })()}
          {/* Hall name on roof */}
          {(() => {
            const rpt = toSVG(hall.gx + hall.w / 2, hall.gy + hall.d / 2, hall.gz + hall.h);
            return (
              <text x={rpt.x} y={rpt.y + 2} textAnchor="middle" fontSize="7" fontWeight="600" fill={C.inverse} opacity="0.9">
                Data Hall {hall.phase}
              </text>
            );
          })()}
        </g>
      ))}

      {/* Cooling towers */}
      {coolingTowers.slice(0, hallCount).map((t, i) => (
        <g key={i}>
          {renderCoolingTower(t.gx, t.gy, t.gz, 0.65, 2.5, C.cooling)}
        </g>
      ))}
      {/* Cooling label */}
      {(() => {
        const clPt = toSVG(10.8, coolingTowers.slice(0, hallCount).length * 2.5 - 1, 0);
        return (
          <text x={clPt.x} y={clPt.y} textAnchor="middle" fontSize="7" fontWeight="600" fill={C.cooling} opacity="0.75">
            Cooling / CDU
          </text>
        );
      })()}

      {/* Expansion zone indicator (dashed outline) */}
      {phases < 3 && (() => {
        const expCorners = [
          toSVG(2, hallCount * 7 + 0.5),
          toSVG(8, hallCount * 7 + 0.5),
          toSVG(8, hallCount * 7 + 5),
          toSVG(2, hallCount * 7 + 5),
        ];
        const d = expCorners.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
        const midPt = toSVG(5, hallCount * 7 + 2.5);
        return (
          <g>
            <path d={d} fill="none" stroke={C.expansion} strokeWidth="1.2" strokeDasharray="8 5" opacity="0.5" />
            <text x={midPt.x} y={midPt.y} textAnchor="middle" fontSize="8" fontWeight="700" fill={C.expansion} opacity="0.65">
              Phase {phases + 1} Expansion
            </text>
            <text x={midPt.x} y={midPt.y + 11} textAnchor="middle" fontSize="7" fill={C.expansion} opacity="0.5">
              +{Math.round(mw * 0.3)}MW reserved
            </text>
          </g>
        );
      })()}

      {/* Total MW header badge */}
      <rect x="16" y="16" width="120" height="30" rx="5" fill={C.header} />
      <text x="76" y="27" textAnchor="middle" fontSize="7.5" fill={C.inverse} opacity="0.8" fontWeight="600">TOTAL CAPACITY</text>
      <text x="76" y="40" textAnchor="middle" fontSize="12" fill={C.inverse} fontWeight="800">{mw}MW IT LOAD</text>

      {/* Archetype tag */}
      <rect x="148" y="20" width={archetype.replace(/_/g, ' ').length * 6 + 14} height="18" rx="3"
        fill="none" stroke={C.archetype} strokeWidth="0.9" />
      <text x={148 + 7} y="33" fontSize="7.5" fontWeight="600" fill={C.archetype}>
        {archetype.replace(/_/g, ' ').toUpperCase()}
      </text>

      {/* Compass / orientation hint */}
      <g transform="translate(570, 30)">
        <circle cx="0" cy="0" r="14" fill={C.groundBg} stroke={C.groundStroke} strokeWidth="0.8" />
        <text x="0" y="-5" textAnchor="middle" fontSize="7" fontWeight="700" fill={C.text}>N</text>
        <line x1="0" y1="-2" x2="0" y2="2" stroke={C.text} strokeWidth="0.8" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke={C.text} strokeWidth="0.8" />
        <text x="6" y="4" fontSize="5.5" fill={C.muted}>E</text>
      </g>
    </svg>
  );
}
