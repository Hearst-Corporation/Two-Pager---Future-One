'use client';

import { QATAR_MILESTONES, MILESTONE_CATEGORY_COLOR } from '@/lib/hearst-qatar-milestones';
import { SITE_READINESS } from '@/lib/hearst-constants';

/**
 * Gantt SVG simple — DIY, pas de lib. Responsive (viewBox).
 * X axis : mois relatifs à la COD (négatif = avant COD, 0 = COD, positif = post-COD).
 */
export default function GanttTimeline({ scenario, exit_year = 10, height = 260 }) {
  const readiness = SITE_READINESS[scenario?.site_readiness] || SITE_READINESS.greenfield;
  const dev_months = readiness.dev_months;
  const cod_offset_months = readiness.cod_offset_months;

  const X_MIN = -(cod_offset_months + 6);
  const X_MAX = exit_year * 12;
  const width = 1140;
  const margin = { left: 16, right: 16, top: 28, bottom: 42 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const xScale = (m) => margin.left + ((m - X_MIN) / (X_MAX - X_MIN)) * innerW;

  const phases = [
    { label: 'Permits',              start: X_MIN,      end: X_MIN + 6, color: 'var(--cp-text-muted)',    y: 0 },
    { label: 'Construction',         start: -dev_months, end: 0,         color: 'var(--cp-accent-maroon)', y: 1 },
    { label: 'Filling up',           start: 0,          end: 24,         color: 'var(--cp-accent)',        y: 2 },
    { label: 'Running at full speed', start: 24,        end: X_MAX - 12, color: 'var(--cp-accent-maroon)', y: 3 },
    { label: 'Sale',                 start: X_MAX - 6,  end: X_MAX,      color: 'var(--cp-accent)',        y: 4 },
  ];

  const PHASE_H = 22;
  const PHASE_GAP = 8;

  return (
    <div style={S.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={S.svg}
      >
        {/* Year ticks */}
        {Array.from({ length: exit_year + 4 }).map((_, i) => {
          const month = (i - 3) * 12;
          if (month < X_MIN || month > X_MAX) return null;
          const x = xScale(month);
          return (
            <g key={i}>
              <line x1={x} y1={margin.top} x2={x} y2={margin.top + innerH}
                stroke="var(--cp-border)" strokeOpacity={0.35} strokeDasharray="2 3" />
              <text x={x} y={margin.top + innerH + 16} textAnchor="middle"
                fontSize="11" fill="var(--cp-text-muted)" fontWeight="600">
                {month === 0 ? 'Launch' : month < 0 ? `M${month}` : `Y${Math.round(month / 12)}`}
              </text>
            </g>
          );
        })}

        {/* COD line */}
        <line x1={xScale(0)} y1={margin.top - 6} x2={xScale(0)} y2={margin.top + innerH + 6}
          stroke="var(--cp-accent-maroon)" strokeWidth={2} />

        {/* Phases */}
        {phases.map((p, i) => {
          const x0 = xScale(p.start);
          const x1 = xScale(p.end);
          const w = Math.max(2, x1 - x0);
          const y = margin.top + p.y * (PHASE_H + PHASE_GAP);
          // Place text outside the bar when bar too narrow (e.g. Sale at far right)
          const textInside = w > 70;
          return (
            <g key={i}>
              <rect
                x={x0} y={y}
                width={w}
                height={PHASE_H}
                fill={p.color}
                opacity={0.9}
                rx={4}
              />
              <text
                x={textInside ? x0 + 8 : x0 - 6}
                y={y + PHASE_H / 2 + 4}
                textAnchor={textInside ? 'start' : 'end'}
                fontSize="11"
                fontWeight="700"
                fill={textInside ? 'var(--cp-text-strong)' : 'var(--cp-text-primary)'}
                style={{ pointerEvents: 'none' }}>
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Milestones */}
        {QATAR_MILESTONES.map((m, i) => {
          if (m.month_offset < X_MIN || m.month_offset > X_MAX) return null;
          const x = xScale(m.month_offset);
          const y = margin.top + 5 * (PHASE_H + PHASE_GAP) + 6;
          const color = MILESTONE_CATEGORY_COLOR[m.category] || 'var(--cp-text-muted)';
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5} fill={color} stroke="var(--cp-surface-0)" strokeWidth={1.5} />
              <title>{m.label}</title>
            </g>
          );
        })}
      </svg>

      <div style={S.legend}>Qatar key dates (hover the dots for details)</div>
    </div>
  );
}

const S = {
  wrap: {
    width: '100%',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  legend: {
    fontSize: 11,
    color: 'var(--cp-text-muted)',
    fontWeight: 600,
    letterSpacing: 0.3,
  },
};
