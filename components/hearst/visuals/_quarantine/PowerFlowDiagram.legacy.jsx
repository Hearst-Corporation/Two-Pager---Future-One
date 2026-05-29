import React from 'react';
import { TOKENS } from '@/lib/spatial/tokens';
import { SAFE_MARGIN, TITLE_BAND, RADIUS, STROKE, safeArea } from '@/lib/spatial/board';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING } from '@/lib/spatial/typography';

// Local alias map — every value resolves to a cockpit `var(--color-*)` token.
// Roles: grid=blue(info/cooling), line/substation/racks=power greys,
// ups=amber(security/warning), pdu=violet(sovereign), halls=bordeaux(dataHall).
// Light tints are recreated from the same accent token + a low SVG opacity.
const COLORS = {
  grid: TOKENS.cooling.base.var,
  gridBorder: TOKENS.cooling.strong.var,
  line: TOKENS.power.base.var,
  lineBorder: TOKENS.power.strong.var,
  substation: TOKENS.power.soft.var,
  substationBorder: TOKENS.power.base.var,
  ups: TOKENS.security.base.var,
  upsBorder: TOKENS.security.strong.var,
  pdu: TOKENS.sovereign.base.var,
  pduBorder: TOKENS.sovereign.strong.var,
  halls: TOKENS.dataHall.base.var,
  hallsBorder: TOKENS.dataHall.strong.var,
  racks: TOKENS.power.strong.var,
  racksBorder: TOKENS.borderStrong.var,
  // Single consistent flow color/weight for every arrow.
  flow: TOKENS.power.soft.var,
  text: TOKENS.text.var,
  textLight: TOKENS.textInverse.var,
  mwLabel: TOKENS.textSecondary.var,
  delta: TOKENS.textMuted.var,
  background: TOKENS.surface.var,
  backgroundBorder: TOKENS.borderLight.var,
};

function ArrowMarker({ id, color }) {
  return (
    <marker
      id={id}
      markerWidth="7"
      markerHeight="7"
      refX="5.5"
      refY="3"
      orient="auto"
    >
      <path d="M0,0 L0,6 L7,3 z" fill={color} />
    </marker>
  );
}

function FlowNode({ x, y, w, h, label, sublabel, fill, border, icon }) {
  return (
    <g>
      {/* pale tint background = accent fill at low opacity */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={RADIUS.card}
        ry={RADIUS.card}
        fill={fill}
        fillOpacity="0.07"
        stroke={border}
        strokeWidth={STROKE.base}
      />
      {/* accent cap strip on top edge */}
      <rect x={x} y={y} width={w} height={6} rx={RADIUS.chip} ry={RADIUS.chip} fill={fill} />
      <rect x={x} y={y + 3} width={w} height={3} fill={fill} />
      {icon && (
        <text
          x={x + w / 2}
          y={y + h / 2 - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={FONT_SIZE.metric}
          fill={fill}
        >
          {icon}
        </text>
      )}
      <text
        x={x + w / 2}
        y={icon ? y + h / 2 + 7 : y + h / 2 - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={FONT_SIZE.label}
        fontWeight={FONT_WEIGHT.bold}
        fontFamily={FONT_FAMILY}
        fill={COLORS.text}
        letterSpacing="0.4"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={x + w / 2}
          y={icon ? y + h / 2 + 18 : y + h / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={FONT_SIZE.caption}
          fontWeight={FONT_WEIGHT.semibold}
          fontFamily={FONT_FAMILY}
          fill={COLORS.mwLabel}
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

// One arrow style for the whole flow: solid, STROKE.base, TOKENS.power.soft.
function ConnectingArrow({ x1, y1, x2, y2, markerId, label, delta }) {
  const mx = (x1 + x2) / 2;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - 7}
        y2={y2}
        stroke={COLORS.flow}
        strokeWidth={STROKE.base}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={mx}
          y={y1 - 7}
          textAnchor="middle"
          fontSize={FONT_SIZE.micro}
          fontWeight={FONT_WEIGHT.semibold}
          fontFamily={FONT_FAMILY}
          fill={COLORS.mwLabel}
          letterSpacing="0.3"
        >
          {label}
        </text>
      )}
      {delta && (
        <text
          x={mx}
          y={y1 + 13}
          textAnchor="middle"
          fontSize={FONT_SIZE.micro}
          fontFamily={FONT_FAMILY}
          fill={COLORS.delta}
        >
          {delta}
        </text>
      )}
    </g>
  );
}

export default function PowerFlowDiagram({ mw = 100, tier = 'III' }) {
  // ── Canvas discipline ───────────────────────────────────────────
  const FRAME_W = 800;
  const FRAME_H = 170; // grown so the N+1 badge below UPS clears SAFE_MARGIN
  const area = safeArea(FRAME_W, FRAME_H, { title: true });

  const COUNT = 7;
  const GAP = 26; // horizontal gap between nodes (carries the flow arrow)
  const NODE_W = (area.w - GAP * (COUNT - 1)) / COUNT;
  const NODE_H = 70;
  const BADGE_H = 13;
  const BADGE_GAP = 6;

  // Vertically center the node row inside the safe area, leaving room beneath
  // for the redundancy badge so nothing clips the bottom safe edge.
  const NODE_Y = area.y + (area.h - NODE_H - BADGE_GAP - BADGE_H) / 2;
  const Y_CENTER = NODE_Y + NODE_H / 2;

  const sub = (factor, suffix = ' MW') => `${Math.round(mw * factor)}${suffix}`;

  const nodes = [
    {
      key: 'grid',
      label: 'GRID',
      sublabel: sub(1.0),
      fill: COLORS.grid,
      border: COLORS.gridBorder,
      icon: '⚡',
    },
    {
      key: 'line',
      label: '132kV LINE',
      sublabel: 'Transmission',
      fill: COLORS.line,
      border: COLORS.lineBorder,
      icon: '〰',
    },
    {
      key: 'substation',
      label: 'SUBSTATION',
      sublabel: sub(0.98),
      fill: COLORS.substation,
      border: COLORS.substationBorder,
      icon: '⬛',
    },
    {
      key: 'ups',
      label: 'UPS BANKS',
      sublabel: `N+1 · ${sub(0.96)}`,
      fill: COLORS.ups,
      border: COLORS.upsBorder,
      icon: '🔋',
    },
    {
      key: 'pdu',
      label: 'PDUs',
      sublabel: sub(0.94),
      fill: COLORS.pdu,
      border: COLORS.pduBorder,
      icon: '⚙',
    },
    {
      key: 'halls',
      label: 'DATA HALLS',
      sublabel: sub(0.92),
      fill: COLORS.halls,
      border: COLORS.hallsBorder,
      icon: '🏢',
    },
    {
      key: 'racks',
      label: 'RACKS',
      sublabel: sub(0.9, ' MW IT'),
      fill: COLORS.racks,
      border: COLORS.racksBorder,
      icon: '▦',
    },
  ].map((n, i) => ({ ...n, x: area.x + i * (NODE_W + GAP) }));

  // Per-stage exec takeaway: MW carried into the next stage + loss/reserve.
  const upper = [undefined, '132kV', undefined, 'N+1', undefined, undefined];
  const deltas = [
    '−' + Math.round(mw * 0.02) + 'MW conv.',
    'transform',
    '−' + Math.round(mw * 0.02) + 'MW conv.',
    'N+1 reserve',
    '−' + Math.round(mw * 0.02) + 'MW dist.',
    '−' + Math.round(mw * 0.02) + 'MW IT',
  ];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', fontFamily: FONT_FAMILY }}
      aria-label={`Power flow diagram: ${mw}MW Tier ${tier} data center`}
    >
      <defs>
        <ArrowMarker id="arrow-main" color={COLORS.flow} />
      </defs>

      {/* Paper board */}
      <rect
        x="0.5"
        y="0.5"
        width={FRAME_W - 1}
        height={FRAME_H - 1}
        rx={RADIUS.board}
        fill={COLORS.background}
        stroke={COLORS.backgroundBorder}
        strokeWidth={STROKE.thin}
      />

      {/* Title band */}
      <text
        x={SAFE_MARGIN}
        y={SAFE_MARGIN + 8}
        fontSize={FONT_SIZE.heading}
        fontWeight={FONT_WEIGHT.heavy}
        fill={COLORS.text}
        letterSpacing={LETTER_SPACING.eyebrow}
        fontFamily={FONT_FAMILY}
      >
        POWER FLOW
      </text>
      <text
        x={SAFE_MARGIN}
        y={SAFE_MARGIN + 23}
        fontSize={FONT_SIZE.caption}
        fontWeight={FONT_WEIGHT.semibold}
        fill={COLORS.mwLabel}
        letterSpacing="0.5"
        fontFamily={FONT_FAMILY}
      >
        {mw} MW &#183; TIER {tier} &#183; END-TO-END UTILITY DELIVERY
      </text>

      {/* Flow arrows — single consistent weight + color */}
      {nodes.slice(0, -1).map((node, i) => (
        <ConnectingArrow
          key={`arrow-${i}`}
          x1={node.x + NODE_W}
          y1={Y_CENTER}
          x2={nodes[i + 1].x}
          y2={Y_CENTER}
          markerId="arrow-main"
          label={upper[i]}
          delta={deltas[i]}
        />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <FlowNode
          key={node.key}
          x={node.x}
          y={NODE_Y}
          w={NODE_W}
          h={NODE_H}
          label={node.label}
          sublabel={node.sublabel}
          fill={node.fill}
          border={node.border}
          icon={node.icon}
        />
      ))}

      {/* Redundancy badge under UPS — fully inside the bottom safe margin */}
      <g>
        <rect
          x={nodes[3].x + NODE_W / 2 - 24}
          y={NODE_Y + NODE_H + BADGE_GAP}
          width={48}
          height={BADGE_H}
          rx={RADIUS.chip}
          fill={COLORS.ups}
        />
        <text
          x={nodes[3].x + NODE_W / 2}
          y={NODE_Y + NODE_H + BADGE_GAP + BADGE_H / 2 + 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={FONT_SIZE.micro}
          fontWeight={FONT_WEIGHT.bold}
          fill={COLORS.textLight}
          fontFamily={FONT_FAMILY}
          letterSpacing="0.5"
        >
          +1 REDUNDANT
        </text>
      </g>
    </svg>
  );
}
