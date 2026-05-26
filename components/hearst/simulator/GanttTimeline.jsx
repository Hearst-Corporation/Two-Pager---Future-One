'use client';

import { QATAR_MILESTONES, MILESTONE_CATEGORY_COLOR } from '@/lib/hearst-qatar-milestones';
import { SITE_READINESS } from '@/lib/hearst-constants';

/**
 * Gantt SVG simple — DIY, pas de lib.
 * X axis : mois relatifs à la COD (négatif = avant COD, 0 = COD, positif = post-COD).
 */
export default function GanttTimeline({ scenario, exit_year = 10, height = 200 }) {
  const readiness = SITE_READINESS[scenario?.site_readiness] || SITE_READINESS.greenfield;
  const dev_months = readiness.dev_months;
  const cod_offset_months = readiness.cod_offset_months;

  const X_MIN = -(cod_offset_months + 6); // 6 mois de permits avant
  const X_MAX = exit_year * 12;
  const width = 800;
  const margin = { left: 12, right: 12, top: 30, bottom: 26 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const xScale = (m) => margin.left + ((m - X_MIN) / (X_MAX - X_MIN)) * innerW;

  const phases = [
    {
      label: 'Permits',
      start: X_MIN,
      end: X_MIN + 6,
      color: 'var(--cp-warning)',
      y: 0,
    },
    {
      label: 'Construction',
      start: -dev_months,
      end: 0,
      color: 'var(--cp-info)',
      y: 1,
    },
    {
      label: 'Filling up',
      start: 0,
      end: 24,
      color: 'var(--cp-violet)',
      y: 2,
    },
    {
      label: 'Running at full speed',
      start: 24,
      end: X_MAX - 12,
      color: 'var(--cp-success)',
      y: 3,
    },
    {
      label: 'Sale',
      start: X_MAX - 6,
      end: X_MAX,
      color: 'var(--cp-accent-strong)',
      y: 4,
    },
  ];

  const PHASE_H = 18;
  const PHASE_GAP = 6;

  return (
    <div style={{ width: '100%', overflowX: 'auto', background: 'var(--cp-surface-2)', borderRadius: 8, padding: '14px 16px' }}>
      <svg width={width} height={height + 60} viewBox={`0 0 ${width} ${height + 60}`}>
        {/* Year ticks */}
        {Array.from({ length: exit_year + 4 }).map((_, i) => {
          const month = (i - 3) * 12;
          if (month < X_MIN || month > X_MAX) return null;
          const x = xScale(month);
          return (
            <g key={i}>
              <line x1={x} y1={margin.top} x2={x} y2={margin.top + innerH}
                stroke="var(--cp-border)" strokeOpacity={0.3} strokeDasharray="2 2" />
              <text x={x} y={margin.top + innerH + 14} textAnchor="middle"
                fontSize="10" fill="var(--cp-text-muted)">
                {month === 0 ? 'Launch' : month < 0 ? `M${month}` : `Y${Math.round(month / 12)}`}
              </text>
            </g>
          );
        })}

        {/* COD line */}
        <line x1={xScale(0)} y1={margin.top - 8} x2={xScale(0)} y2={margin.top + innerH + 4}
          stroke="var(--cp-accent-strong)" strokeWidth={2} />

        {/* Phases */}
        {phases.map((p, i) => {
          const x0 = xScale(p.start);
          const x1 = xScale(p.end);
          const y = margin.top + p.y * (PHASE_H + PHASE_GAP);
          return (
            <g key={i}>
              <rect
                x={x0} y={y}
                width={Math.max(2, x1 - x0)}
                height={PHASE_H}
                fill={p.color}
                opacity={0.85}
                rx={3}
              />
              <text x={x0 + 6} y={y + PHASE_H - 5} fontSize="10" fontWeight="700"
                fill="var(--cp-text-strong)" style={{ pointerEvents: 'none' }}>
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Milestones */}
        {QATAR_MILESTONES.map((m, i) => {
          if (m.month_offset < X_MIN || m.month_offset > X_MAX) return null;
          const x = xScale(m.month_offset);
          const y = margin.top + 5 * (PHASE_H + PHASE_GAP) + 4;
          const color = MILESTONE_CATEGORY_COLOR[m.category] || 'var(--cp-text-muted)';
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill={color} stroke="var(--cp-surface-0)" strokeWidth={1.5} />
              <title>{m.label}</title>
            </g>
          );
        })}

        {/* Milestone legend (below) */}
        <text x={margin.left} y={height + 28} fontSize="9" fill="var(--cp-text-muted)" fontWeight="700"
          style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Qatar key dates (hover for details)
        </text>
      </svg>
    </div>
  );
}
