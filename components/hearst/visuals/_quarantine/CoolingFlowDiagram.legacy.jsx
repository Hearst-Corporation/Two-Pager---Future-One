import React from 'react';
import { TOKENS } from '@/lib/spatial/tokens';

/**
 * Local semantic alias map — every value resolves to a spatial token `.var`.
 * Cool/supply = cooling (blue) family. Warm/hot = error/warning (return heat).
 * Halls = dataHall (bordeaux). Rejection/arrow neutral = power/grey.
 * Light tints are rendered as the matching accent at low SVG opacity
 * (see LIGHT_OPACITY) rather than a separate hex tint.
 */
const C = {
  cool: TOKENS.cooling.base.var,
  coolBorder: TOKENS.cooling.strong.var,
  supply: TOKENS.cooling.soft.var,
  supplyBorder: TOKENS.cooling.strong.var,
  warm: TOKENS.error.var,
  warmBorder: TOKENS.dataHall.strong.var,
  hot: TOKENS.security.soft.var,
  hotBorder: TOKENS.security.strong.var,
  halls: TOKENS.dataHall.base.var,
  hallsBorder: TOKENS.dataHall.base.var,
  rejection: TOKENS.power.base.var,
  rejectionBorder: TOKENS.power.soft.var,
  arrow: TOKENS.power.base.var,
  arrowCool: TOKENS.cooling.base.var,
  arrowHot: TOKENS.error.var,
  text: TOKENS.text.var,
  bg: TOKENS.background.var,
  bgBorder: TOKENS.borderLight.var,
  pue: TOKENS.success.var,
  pueBorder: TOKENS.success.var,
  surface: TOKENS.surface.var,
};

/** Opacity applied to accent-tinted "light" backgrounds (was a pale hex tint). */
const LIGHT_OPACITY = 0.12;

function ArrowMarker({ id, color }) {
  return (
    <marker
      id={id}
      markerWidth="8"
      markerHeight="8"
      refX="6"
      refY="3"
      orient="auto"
    >
      <path d="M0,0 L0,6 L8,3 z" fill={color} />
    </marker>
  );
}

function FlowNode({ x, y, w, h, label, sublabel, fill, lightFill, border, icon }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" ry="6" fill={C.surface} stroke={border} strokeWidth="1.5" />
      <rect x={x} y={y} width={w} height={h} rx="6" ry="6" fill={lightFill} opacity={LIGHT_OPACITY} />
      <rect x={x} y={y} width={w} height={6} rx="3" ry="3" fill={fill} />
      <rect x={x} y={y + 3} width={w} height={3} fill={fill} />
      {icon && (
        <text
          x={x + w / 2}
          y={y + h / 2 - 7}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fill={fill}
        >
          {icon}
        </text>
      )}
      <text
        x={x + w / 2}
        y={icon ? y + h / 2 + 6 : y + h / 2 - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={C.text}
        letterSpacing="0.4"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={x + w / 2}
          y={icon ? y + h / 2 + 17 : y + h / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={C.text}
          opacity="0.7"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

function TempBadge({ x, y, temp, side }) {
  const color = side === 'supply' ? C.supply : C.warm;
  const label = `${temp}°C`;
  return (
    <g>
      <rect x={x - 14} y={y - 8} width={28} height={16} rx="4" fill={C.surface} stroke={color} strokeWidth="1" />
      <rect x={x - 14} y={y - 8} width={28} height={16} rx="4" fill={color} opacity={LIGHT_OPACITY} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="700" fill={color} fontFamily="system-ui, -apple-system, sans-serif">
        {label}
      </text>
    </g>
  );
}

export default function CoolingFlowDiagram({ pue = 1.45, cooling_type = 'hybrid' }) {
  const isLiquid = cooling_type === 'liquid' || cooling_type === 'hybrid';
  const isAir = cooling_type === 'air' || cooling_type === 'hybrid';
  const isHybrid = cooling_type === 'hybrid';

  // Layout constants
  const NODE_W = 80;
  const NODE_H = 64;

  // For hybrid/split layout we use two rows; for single type, one row
  const TOP_Y = isHybrid ? 28 : 68;
  const BOT_Y = isHybrid ? 104 : 68;
  const MID_Y = (TOP_Y + BOT_Y) / 2 + NODE_H / 2;

  // Node X positions (left to right)
  const PLANT_X = 12;
  const DIST_X = 120;
  const UNIT_X = 240;      // CDU or AHU
  const UNIT2_X = 240;     // second unit for hybrid
  const HALLS_X = 360;
  const REJECT_X = 500;

  // Shared center Y for single-row nodes
  const SINGLE_Y = 68;

  const supplyTemp = cooling_type === 'liquid' ? 18 : cooling_type === 'air' ? 14 : 16;
  const returnTemp = cooling_type === 'liquid' ? 28 : cooling_type === 'air' ? 24 : 26;

  return (
    <svg
      width="100%"
      viewBox="0 0 800 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', fontFamily: 'system-ui, -apple-system, sans-serif' }}
      aria-label={`Cooling flow diagram: PUE ${pue}, ${cooling_type} cooling`}
    >
      <defs>
        <ArrowMarker id="cool-arrow" color={C.arrowCool} />
        <ArrowMarker id="hot-arrow" color={C.arrowHot} />
        <ArrowMarker id="neutral-arrow" color={C.arrow} />
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="800" height="200" rx="8" fill={C.bg} stroke={C.bgBorder} strokeWidth="1" />

      {/* Title */}
      <text x="12" y="14" fontSize="9" fontWeight="700" fill={C.text} letterSpacing="1" fontFamily="system-ui, -apple-system, sans-serif">
        COOLING FLOW — {cooling_type.toUpperCase()} · PUE {pue}
      </text>

      {/* PUE Badge */}
      <rect x="600" y="4" width="60" height="22" rx="4" fill={C.surface} stroke={C.pueBorder} strokeWidth="1.2" />
      <rect x="600" y="4" width="60" height="22" rx="4" fill={C.pue} opacity={LIGHT_OPACITY} />
      <text x="630" y="15.5" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill={C.pue} fontFamily="system-ui, -apple-system, sans-serif">
        PUE {pue}
      </text>

      {isHybrid ? (
        // HYBRID layout — two parallel paths
        <>
          {/* Cooling Plant — center left */}
          <FlowNode
            x={PLANT_X} y={MID_Y - NODE_H / 2 - 20}
            w={NODE_W} h={NODE_H}
            label="COOLING" sublabel="PLANT"
            fill={C.cool} lightFill={C.cool} border={C.coolBorder}
            icon="❄"
          />

          {/* Distribution — center */}
          <FlowNode
            x={DIST_X} y={MID_Y - NODE_H / 2 - 20}
            w={NODE_W} h={NODE_H}
            label="DISTRIB." sublabel="LOOP"
            fill={C.supply} lightFill={C.supply} border={C.supplyBorder}
            icon="⇄"
          />

          {/* Split indicator */}
          <text x={DIST_X + NODE_W + 12} y={MID_Y - 20} textAnchor="middle" fontSize="8" fill={C.arrow} fontFamily="system-ui, -apple-system, sans-serif">SPLIT</text>
          <line x1={DIST_X + NODE_W} y1={MID_Y - 20} x2={UNIT_X} y2={TOP_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#cool-arrow)" />
          <line x1={DIST_X + NODE_W} y1={MID_Y - 20} x2={UNIT2_X} y2={BOT_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#cool-arrow)" />

          {/* Liquid path — top */}
          <FlowNode
            x={UNIT_X} y={TOP_Y}
            w={NODE_W} h={NODE_H}
            label="CDU" sublabel="Liquid Cool"
            fill={C.cool} lightFill={C.cool} border={C.coolBorder}
            icon="💧"
          />
          <TempBadge x={UNIT_X + NODE_W / 2} y={TOP_Y - 10} temp={supplyTemp} side="supply" />

          {/* Air path — bottom */}
          <FlowNode
            x={UNIT2_X} y={BOT_Y}
            w={NODE_W} h={NODE_H}
            label="AHU" sublabel="Air Cool"
            fill={C.supply} lightFill={C.supply} border={C.supplyBorder}
            icon="💨"
          />

          {/* CDU → Data Halls arrow */}
          <line x1={UNIT_X + NODE_W} y1={TOP_Y + NODE_H / 2} x2={HALLS_X} y2={TOP_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" markerEnd="url(#cool-arrow)" />
          {/* AHU → Data Halls arrow */}
          <line x1={UNIT2_X + NODE_W} y1={BOT_Y + NODE_H / 2} x2={HALLS_X} y2={BOT_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" markerEnd="url(#cool-arrow)" />

          {/* Data Halls */}
          <FlowNode
            x={HALLS_X} y={MID_Y - NODE_H / 2 - 20}
            w={NODE_W} h={NODE_H}
            label="DATA HALLS" sublabel="IT Load"
            fill={C.halls} lightFill={C.halls} border={C.hallsBorder}
            icon="🏢"
          />
          <TempBadge x={HALLS_X + NODE_W / 2} y={MID_Y - 20 + NODE_H + 10} temp={returnTemp} side="return" />

          {/* Halls → Heat Rejection */}
          <line x1={HALLS_X + NODE_W} y1={MID_Y - 20 + NODE_H / 2} x2={REJECT_X} y2={MID_Y - 20 + NODE_H / 2} stroke={C.arrowHot} strokeWidth="1.5" strokeDasharray="5,2" markerEnd="url(#hot-arrow)" />

          {/* Heat Rejection */}
          <FlowNode
            x={REJECT_X} y={MID_Y - NODE_H / 2 - 20}
            w={NODE_W} h={NODE_H}
            label="HEAT" sublabel="REJECTION"
            fill={C.warm} lightFill={C.warm} border={C.warmBorder}
            icon="♨"
          />

          {/* Return loop arrow */}
          <path
            d={`M${REJECT_X + NODE_W / 2},${MID_Y - 20 + NODE_H + 4} Q${REJECT_X + NODE_W / 2},${MID_Y + NODE_H} ${PLANT_X + NODE_W / 2},${MID_Y + NODE_H} Q${PLANT_X + NODE_W / 2},${MID_Y - 20 + NODE_H + 4} ${PLANT_X + NODE_W / 2},${MID_Y - 20 + NODE_H + 4}`}
            fill="none"
            stroke={C.arrowCool}
            strokeWidth="1.2"
            strokeDasharray="4,3"
            markerEnd="url(#cool-arrow)"
          />
          <text x={(REJECT_X + PLANT_X) / 2 + NODE_W / 2} y={MID_Y + NODE_H + 12} textAnchor="middle" fontSize="7" fill={C.arrowCool} fontFamily="system-ui, -apple-system, sans-serif">
            return loop
          </text>

          {/* Supply/Return legend */}
          <rect x="660" y="30" width="130" height="50" rx="4" fill={C.surface} stroke={C.bgBorder} strokeWidth="1" />
          <text x="672" y="44" fontSize="7.5" fill={C.supply} fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">— Supply (cool)</text>
          <text x="672" y="56" fontSize="7.5" fill={C.warm} fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">— Return (warm)</text>
          <text x="672" y="68" fontSize="7.5" fill={C.arrowCool} fontFamily="system-ui, -apple-system, sans-serif">- - return loop</text>
        </>
      ) : (
        // SINGLE PATH layout (liquid or air)
        <>
          {/* Cooling Plant */}
          <FlowNode
            x={PLANT_X} y={SINGLE_Y}
            w={NODE_W} h={NODE_H}
            label="COOLING" sublabel="PLANT"
            fill={C.cool} lightFill={C.cool} border={C.coolBorder}
            icon="❄"
          />

          {/* Distribution */}
          <line x1={PLANT_X + NODE_W} y1={SINGLE_Y + NODE_H / 2} x2={DIST_X} y2={SINGLE_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" markerEnd="url(#cool-arrow)" />
          <FlowNode
            x={DIST_X} y={SINGLE_Y}
            w={NODE_W} h={NODE_H}
            label="DISTRIB." sublabel="LOOP"
            fill={C.supply} lightFill={C.supply} border={C.supplyBorder}
            icon="⇄"
          />
          <TempBadge x={DIST_X + NODE_W / 2} y={SINGLE_Y - 10} temp={supplyTemp} side="supply" />

          {/* CDU / AHU */}
          <line x1={DIST_X + NODE_W} y1={SINGLE_Y + NODE_H / 2} x2={UNIT_X} y2={SINGLE_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" markerEnd="url(#cool-arrow)" />
          <FlowNode
            x={UNIT_X} y={SINGLE_Y}
            w={NODE_W} h={NODE_H}
            label={isLiquid ? 'CDU' : 'AHU'}
            sublabel={isLiquid ? 'Liquid Cool' : 'Air Cool'}
            fill={isLiquid ? C.cool : C.supply}
            lightFill={isLiquid ? C.cool : C.supply}
            border={isLiquid ? C.coolBorder : C.supplyBorder}
            icon={isLiquid ? '💧' : '💨'}
          />

          {/* Data Halls */}
          <line x1={UNIT_X + NODE_W} y1={SINGLE_Y + NODE_H / 2} x2={HALLS_X} y2={SINGLE_Y + NODE_H / 2} stroke={C.arrowCool} strokeWidth="1.5" markerEnd="url(#cool-arrow)" />
          <FlowNode
            x={HALLS_X} y={SINGLE_Y}
            w={NODE_W} h={NODE_H}
            label="DATA HALLS" sublabel="IT Load"
            fill={C.halls} lightFill={C.halls} border={C.hallsBorder}
            icon="🏢"
          />
          <TempBadge x={HALLS_X + NODE_W / 2} y={SINGLE_Y + NODE_H + 10} temp={returnTemp} side="return" />

          {/* Heat Rejection */}
          <line x1={HALLS_X + NODE_W} y1={SINGLE_Y + NODE_H / 2} x2={REJECT_X} y2={SINGLE_Y + NODE_H / 2} stroke={C.arrowHot} strokeWidth="1.5" strokeDasharray="5,2" markerEnd="url(#hot-arrow)" />
          <FlowNode
            x={REJECT_X} y={SINGLE_Y}
            w={NODE_W} h={NODE_H}
            label="HEAT" sublabel="REJECTION"
            fill={C.warm} lightFill={C.warm} border={C.warmBorder}
            icon="♨"
          />

          {/* Return loop */}
          <path
            d={`M${REJECT_X + NODE_W / 2},${SINGLE_Y + NODE_H + 4} Q${REJECT_X + NODE_W / 2},${SINGLE_Y + NODE_H + 30} ${PLANT_X + NODE_W / 2},${SINGLE_Y + NODE_H + 30} Q${PLANT_X + NODE_W / 2},${SINGLE_Y + NODE_H + 4} ${PLANT_X + NODE_W / 2},${SINGLE_Y + NODE_H + 4}`}
            fill="none"
            stroke={C.arrowCool}
            strokeWidth="1.2"
            strokeDasharray="4,3"
            markerEnd="url(#cool-arrow)"
          />
          <text x={(REJECT_X + PLANT_X) / 2 + NODE_W / 2} y={SINGLE_Y + NODE_H + 42} textAnchor="middle" fontSize="7" fill={C.arrowCool} fontFamily="system-ui, -apple-system, sans-serif">
            return loop
          </text>

          {/* Legend */}
          <rect x="620" y="68" width="130" height="50" rx="4" fill={C.surface} stroke={C.bgBorder} strokeWidth="1" />
          <text x="632" y="82" fontSize="7.5" fill={C.supply} fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">— Supply ({supplyTemp}°C)</text>
          <text x="632" y="94" fontSize="7.5" fill={C.warm} fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">— Return ({returnTemp}°C)</text>
          <text x="632" y="106" fontSize="7.5" fill={C.arrowCool} fontFamily="system-ui, -apple-system, sans-serif">- - return loop</text>
        </>
      )}
    </svg>
  );
}
