'use client';

import { useMemo, useState } from 'react';
import { OPERATORS } from '@/lib/hearst-constants';
import { ECOSYSTEM_EDGES, EDGE_KIND_COLOR } from '@/lib/hearst-ecosystem-edges';

// Layout radial déterministe groupé par type. Zéro animation, zéro lib.

const TYPE_GROUPS = [
  { type: 'hyperscaler', angle_start: -90, angle_end: -30, radius: 220, label: 'Tech Giants' },
  { type: 'broker',      angle_start: -20, angle_end: 30,  radius: 220, label: 'Brokers' },
  { type: 'operator',    angle_start: 40,  angle_end: 100, radius: 220, label: 'Operators' },
  { type: 'regulator',   angle_start: 110, angle_end: 140, radius: 200, label: 'Regulators' },
  { type: 'telco',       angle_start: 145, angle_end: 165, radius: 200, label: 'Telcos' },
  { type: 'legal',       angle_start: 170, angle_end: 200, radius: 220, label: 'Legal' },
  { type: 'investor',    angle_start: 210, angle_end: 250, radius: 220, label: 'Investors' },
  { type: 'standards',   angle_start: 260, angle_end: 280, radius: 220, label: 'Standards' },
];

const CX = 360;
const CY = 280;

function polarToXY(angleDeg, r) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function operatorColor(id) {
  return `var(--cp-op-${id}, var(--cp-op-default))`;
}

function layoutNodes() {
  const positions = {};
  // HEARST au centre
  positions.hearst = { x: CX, y: CY, color: 'var(--cp-accent-maroon)', type: 'self', label: 'HEARST', big: true };

  for (const group of TYPE_GROUPS) {
    const matches = OPERATORS.filter(o => o.type === group.type);
    if (matches.length === 0) continue;
    const span = group.angle_end - group.angle_start;
    matches.forEach((op, i) => {
      const angle = group.angle_start + (span * (i + 0.5)) / matches.length;
      const { x, y } = polarToXY(angle, group.radius);
      positions[op.id] = { x, y, color: operatorColor(op.id), type: op.type, label: op.name, big: false };
    });
  }
  return positions;
}

export default function EcosystemNetwork({ width = 720, height = 420, activeArchetypeId: _activeArchetypeId = null, onNodeClick }) {
  const [hover, setHover] = useState(null);
  const positions = useMemo(layoutNodes, []);

  const visibleEdges = useMemo(() => {
    // Si un archétype actif → highlight ses partenaires "naturels"
    return ECOSYSTEM_EDGES.map((e, i) => {
      const from = positions[e.from];
      const to = positions[e.to];
      if (!from || !to) return null;
      return { ...e, idx: i, from, to };
    }).filter(Boolean);
  }, [positions]);

  const visibleNodes = Object.entries(positions);

  return (
    <div style={{ width: '100%', overflow: 'hidden', background: 'var(--cp-surface-2)', borderRadius: 'var(--cp-radius-sm)', padding: 'var(--cp-space-3)' }}>
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', maxHeight: height }}
      >
        {/* Group labels */}
        {TYPE_GROUPS.map(g => {
          const mid = (g.angle_start + g.angle_end) / 2;
          const labelPos = polarToXY(mid, g.radius + 35);
          return (
            <text key={g.type} x={labelPos.x} y={labelPos.y} textAnchor="middle"
              fill="var(--cp-text-muted)" fontSize="10" fontWeight="var(--cp-weight-bold)"
              style={{ textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-eyebrow)' }}>
              {g.label}
            </text>
          );
        })}

        {/* Edges */}
        {visibleEdges.map(e => {
          const color = EDGE_KIND_COLOR[e.kind] || 'var(--cp-border)';
          const isHovered = hover && (hover.fromId === e.from_id || hover.toId === e.to_id);
          return (
            <line
              key={e.idx}
              x1={e.from.x} y1={e.from.y}
              x2={e.to.x} y2={e.to.y}
              stroke={color}
              strokeOpacity={isHovered ? 0.85 : 0.30}
              strokeWidth={e.kind === 'jv' ? 2 : 1}
            />
          );
        })}

        {/* Nodes */}
        {visibleNodes.map(([id, n]) => {
          const r = n.big ? 24 : 10;
          const isHovered = hover === id;
          return (
            <g key={id} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)}
              onClick={() => onNodeClick?.(id)} style={{ cursor: onNodeClick ? 'pointer' : 'default' }}>
              <circle
                cx={n.x} cy={n.y} r={r}
                fill={n.color}
                fillOpacity={isHovered ? 1 : 0.85}
                stroke="var(--cp-surface-0)"
                strokeWidth={2}
              />
              <text
                x={n.x} y={n.y + r + 12}
                textAnchor="middle"
                fontSize={n.big ? 12 : 10}
                fontWeight={n.big ? 800 : 600}
                fill="var(--cp-text-primary)"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={S.legend}>
        {Object.entries(EDGE_KIND_COLOR).map(([kind, color]) => (
          <div key={kind} style={S.legendItem}>
            <div style={{ ...S.legendDot, background: color }} />
            <span style={{ textTransform: 'capitalize' }}>{kind}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  legend: {
    display: 'flex',
    gap: 'var(--cp-space-4)',
    paddingTop: 'var(--cp-space-2)',
    flexWrap: 'wrap',
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-muted)',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)' },
  legendDot: { width: 10, height: 10, borderRadius: 'var(--cp-radius-xs)' },
};
