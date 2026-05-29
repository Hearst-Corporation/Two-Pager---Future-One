'use client';

/**
 * InfrastructureDiagram.jsx
 * Lightweight inline SVG renderer for oracle-visualization specs.
 * Supports: '2d_floorplan' | 'topology' | 'gantt_phases'
 * No external dependencies. Tokens via var(--cp-*) only.
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Color helpers (no hex hardcoded)
// ---------------------------------------------------------------------------
const KIND_STROKE = {
  // floorplan kinds
  classic:      'var(--cp-accent)',
  liquid:       'var(--cp-surface-2)',
  ai:           'var(--cp-highlight)',
  air:          'var(--cp-surface-1)',
  hybrid:       'var(--cp-surface-3)',
  // topology node kinds
  utility:      'var(--cp-accent)',
  substation:   'var(--cp-highlight)',
  mep:          'var(--cp-surface-2)',
  whitespace:   'var(--cp-surface-3)',
  fabric:       'var(--cp-accent)',
  interconnect: 'var(--cp-highlight)',
};

const EDGE_STROKE = {
  power:   'var(--cp-accent)',
  fiber:   'var(--cp-highlight)',
  cooling: 'var(--cp-surface-2)',
};

const PHASE_FILL = [
  'var(--cp-accent)',
  'var(--cp-highlight)',
  'var(--cp-surface-2)',
  'var(--cp-surface-3)',
  'var(--cp-surface-1)',
];

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

/** 2D floorplan — rack blocks, power zones, cooling zones */
function FloorplanView({ spec, vw, vh }) {
  const CANVAS = 1000;
  const scaleX = vw / CANVAS;
  const scaleY = vh / CANVAS;
  const sx = n => n * scaleX;
  const sy = n => n * scaleY;

  return (
    <g>
      {/* Power zones */}
      {spec.power_zones.map((z, i) => (
        <g key={`pz-${i}`}>
          <rect
            x={sx(z.x)} y={sy(z.y)} width={sx(z.w)} height={sy(z.h)}
            fill="none"
            stroke="var(--cp-accent)"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <text
            x={sx(z.x + z.w / 2)} y={sy(z.y + z.h / 2)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(8, sy(14))}
            fill="var(--cp-accent)"
            opacity="0.7"
          >
            {z.label}
          </text>
          <text
            x={sx(z.x + z.w / 2)} y={sy(z.y + z.h / 2) + Math.max(8, sy(14)) + 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(7, sy(11))}
            fill="var(--cp-accent)"
            opacity="0.5"
          >
            {z.mw_capacity} MW
          </text>
        </g>
      ))}

      {/* Rack blocks */}
      {spec.rack_blocks.map((b, i) => (
        <g key={`rb-${i}`}>
          <rect
            x={sx(b.x)} y={sy(b.y)} width={sx(b.w)} height={sy(b.h)}
            fill={KIND_STROKE[b.kind] ?? 'var(--cp-surface-1)'}
            fillOpacity="0.12"
            stroke={KIND_STROKE[b.kind] ?? 'var(--cp-surface-1)'}
            strokeWidth="1.5"
            rx="3"
          />
          {/* MW label */}
          <text
            x={sx(b.x + b.w / 2)} y={sy(b.y + b.h / 2) - Math.max(8, sy(14))}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(9, sy(16))}
            fill={KIND_STROKE[b.kind] ?? 'var(--cp-surface-1)'}
            fontWeight="600"
          >
            {b.mw} MW
          </text>
          {/* Kind label */}
          <text
            x={sx(b.x + b.w / 2)} y={sy(b.y + b.h / 2)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(7, sy(11))}
            fill={KIND_STROKE[b.kind] ?? 'var(--cp-surface-1)'}
            opacity="0.75"
          >
            {b.kind.charAt(0).toUpperCase() + b.kind.slice(1)}
          </text>
          {/* Density label — 9-10px muted, shown when spec carries the field */}
          {b.density_kw_per_rack != null && (
            <text
              x={sx(b.x + b.w / 2)} y={sy(b.y + b.h / 2) + Math.max(8, sy(13))}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(7, sy(10))}
              fill="var(--cp-text-muted, var(--cp-accent))"
              opacity="0.55"
            >
              {b.density_kw_per_rack} kW/rack
            </text>
          )}
        </g>
      ))}

      {/* Cooling zones — distinct visual per kind */}
      {spec.cooling_zones.map((z, i) => (
        <g key={`cz-${i}`}>
          <rect
            x={sx(z.x)} y={sy(z.y)} width={sx(z.w)} height={sy(z.h)}
            fill={KIND_STROKE[z.kind] ?? 'var(--cp-surface-1)'}
            fillOpacity={z.kind === 'liquid' ? 0.25 : z.kind === 'hybrid' ? 0.2 : 0.1}
            stroke={KIND_STROKE[z.kind] ?? 'var(--cp-surface-1)'}
            strokeWidth={z.kind === 'air' ? 1 : 1.5}
            strokeDasharray={z.kind === 'air' ? '3 3' : z.kind === 'hybrid' ? '6 2' : 'none'}
          />
          <text
            x={sx(z.x + z.w / 2)} y={sy(z.y + z.h / 2)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.max(7, sy(11))}
            fill={KIND_STROKE[z.kind] ?? 'var(--cp-surface-1)'}
            opacity="0.8"
          >
            {z.label ?? z.kind}
          </text>
        </g>
      ))}

      {/* Legend */}
      {spec.legend && spec.legend.map((item, i) => {
        const lx = sx(20 + i * 200);
        const ly = sy(1000) - 4;
        return (
          <g key={`leg-${i}`}>
            <rect x={lx} y={ly - sy(18)} width={sx(18)} height={sy(12)} fill={item.color_token} fillOpacity="0.6" rx="2" />
            <text x={lx + sx(24)} y={ly - sy(18) + sy(7)} dominantBaseline="middle" fontSize={Math.max(7, sy(10))} fill="var(--cp-accent)" opacity="0.7">
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Topology graph — nodes as circles, edges as lines */
function TopologyView({ spec, vw, vh }) {
  const CANVAS = 1000;
  const sx = n => (n / CANVAS) * vw;
  const sy = n => (n / CANVAS) * vh;

  // Build node lookup for edge rendering
  const nodeMap = {};
  spec.nodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <g>
      {/* Edges first (behind nodes) */}
      {spec.edges.map((e, i) => {
        const from = nodeMap[e.from];
        const to   = nodeMap[e.to];
        if (!from || !to) return null;
        return (
          <g key={`edge-${i}`}>
            <line
              x1={sx(from.x)} y1={sy(from.y)}
              x2={sx(to.x)}   y2={sy(to.y)}
              stroke={EDGE_STROKE[e.kind] ?? 'var(--cp-surface-2)'}
              strokeWidth={e.kind === 'power' ? 2 : 1}
              strokeDasharray={e.kind === 'cooling' ? '4 3' : e.kind === 'fiber' ? '2 2' : 'none'}
              opacity="0.6"
            />
            {e.label && (
              <text
                x={(sx(from.x) + sx(to.x)) / 2}
                y={(sy(from.y) + sy(to.y)) / 2 - 4}
                textAnchor="middle"
                fontSize={Math.max(6, (vw / CANVAS) * 9)}
                fill="var(--cp-accent)"
                opacity="0.55"
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {spec.nodes.map(node => {
        const r  = Math.max(6, (vw / CANVAS) * 22);
        const fs = Math.max(6, (vw / CANVAS) * 10);
        return (
          <g key={`node-${node.id}`}>
            <circle
              cx={sx(node.x)} cy={sy(node.y)} r={r}
              fill={KIND_STROKE[node.kind] ?? 'var(--cp-surface-1)'}
              fillOpacity="0.18"
              stroke={KIND_STROKE[node.kind] ?? 'var(--cp-surface-1)'}
              strokeWidth="1.5"
            />
            <text
              x={sx(node.x)} y={sy(node.y) + r + fs + 1}
              textAnchor="middle"
              fontSize={fs}
              fill="var(--cp-accent)"
              opacity="0.85"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Gantt phases — horizontal bars with gating event mini-labels */
function GanttView({ spec, vw, vh }) {
  const total  = spec.total_months || 1;
  const phases = spec.phases || [];
  const BAR_H   = Math.max(16, (vh / (phases.length + 2)) * 0.6);
  const GAP     = Math.max(6,  (vh / (phases.length + 2)) * 0.4);
  const LABEL_W = vw * 0.25;
  const BAR_W   = vw - LABEL_W - 8;
  const TOP_PAD = Math.max(10, vh * 0.08);

  return (
    <g>
      {/* Axis ticks (yearly) */}
      {Array.from({ length: Math.floor(total / 12) + 1 }, (_, i) => {
        const x = LABEL_W + (i * 12 / total) * BAR_W;
        return (
          <g key={`tick-${i}`}>
            <line x1={x} y1={TOP_PAD - 6} x2={x} y2={vh - 8} stroke="var(--cp-accent)" strokeWidth="0.5" opacity="0.2" />
            <text x={x} y={TOP_PAD - 8} textAnchor="middle" fontSize={Math.max(6, vw * 0.018)} fill="var(--cp-accent)" opacity="0.4">
              Y{i}
            </text>
          </g>
        );
      })}

      {/* Phase bars */}
      {phases.map((p, i) => {
        const barX = LABEL_W + (p.start_month / total) * BAR_W;
        const barW = Math.max(2, (p.duration_months / total) * BAR_W);
        const barY = TOP_PAD + i * (BAR_H + GAP);
        const fill = PHASE_FILL[i % PHASE_FILL.length];
        const fs   = Math.max(7, BAR_H * 0.5);

        // Gating events: up to 2 mini-labels beneath the bar
        const gatingLabels = (p.gating_events ?? []).slice(0, 2);

        return (
          <g key={`phase-${p.id}`}>
            {/* Phase label */}
            <text
              x={LABEL_W - 6} y={barY + BAR_H / 2}
              textAnchor="end" dominantBaseline="middle"
              fontSize={fs}
              fill="var(--cp-accent)"
              opacity="0.8"
            >
              {p.label}
            </text>
            {/* Bar */}
            <rect
              x={barX} y={barY} width={barW} height={BAR_H}
              fill={fill} fillOpacity="0.25"
              stroke={fill} strokeWidth="1"
              rx="2"
            />
            {/* Duration label inside bar if wide enough */}
            {barW > 40 && (
              <text
                x={barX + barW / 2} y={barY + BAR_H / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(6, fs * 0.8)}
                fill={fill}
                opacity="0.9"
              >
                {p.duration_months}m
              </text>
            )}
            {/* Gating event mini-labels below bar */}
            {gatingLabels.map((ev, gi) => (
              <text
                key={`gate-${i}-${gi}`}
                x={barX + 4}
                y={barY + BAR_H + Math.max(7, fs * 0.75) * (gi + 1) + 1}
                fontSize={Math.max(5, fs * 0.65)}
                fill="var(--cp-text-muted, var(--cp-accent))"
                opacity="0.45"
              >
                {'>'} {ev}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// DiagramHeader — 1-line mini-summary strip above the SVG
// ---------------------------------------------------------------------------
function DiagramHeader({ summary }) {
  if (!summary) return null;
  return (
    <div style={{
      padding:      '3px 10px',
      fontSize:     10,
      fontWeight:   500,
      color:        'var(--cp-accent)',
      opacity:      0.7,
      letterSpacing:'0.03em',
      borderBottom: '1px solid var(--cp-accent)',
      whiteSpace:   'nowrap',
      overflow:     'hidden',
      textOverflow: 'ellipsis',
    }}>
      {summary}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * @param {{ spec: object, height?: number }} props
 */
export default function InfrastructureDiagram({ spec, height = 280 }) {
  if (!spec) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
        <span style={{ fontSize: 12, color: 'var(--cp-accent)' }}>no spec</span>
      </div>
    );
  }

  const vw = 540;  // internal SVG viewport width
  const vh = height;

  return (
    <div style={{ transition: 'all 220ms var(--cp-ease, ease)', width: '100%' }}>
      <DiagramHeader summary={spec.summary} />
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label={spec.type ?? 'infrastructure diagram'}
      >
        {spec.type === '2d_floorplan' && <FloorplanView spec={spec} vw={vw} vh={vh} />}
        {spec.type === 'topology'     && <TopologyView  spec={spec} vw={vw} vh={vh} />}
        {spec.type === 'gantt_phases' && <GanttView     spec={spec} vw={vw} vh={vh} />}
        {!['2d_floorplan','topology','gantt_phases'].includes(spec.type) && (
          <text x={vw / 2} y={vh / 2} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="var(--cp-accent)" opacity="0.5">
            Unknown spec type: {spec.type}
          </text>
        )}
      </svg>
    </div>
  );
}
