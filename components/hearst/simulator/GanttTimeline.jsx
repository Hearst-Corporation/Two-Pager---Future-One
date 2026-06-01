'use client';

import { SITE_READINESS } from '@/lib/hearst-constants';

/**
 * Board-style deployment timeline.
 * The previous SVG used small milestone dots that looked like rendering noise.
 * This keeps the same scheduling logic but presents it as readable phase rows.
 */
export default function GanttTimeline({ scenario, exit_year = 10 }) {
  const readiness = SITE_READINESS[scenario?.site_readiness] || SITE_READINESS.greenfield;
  const dev_months = readiness.dev_months;
  const cod_offset_months = readiness.cod_offset_months;

  const X_MIN = -(cod_offset_months + 6);
  const X_MAX = exit_year * 12;
  const span = Math.max(1, X_MAX - X_MIN);
  const launchFrac = (0 - X_MIN) / span;
  const pos = (month) => `${((month - X_MIN) / span) * 100}%`;
  const widthPct = (start, end) => `${Math.max(1.5, ((end - start) / span) * 100)}%`;

  const phases = [
    { label: 'Permits', start: X_MIN, end: X_MIN + 6, tone: 'muted', description: 'Site control, permits, utility coordination' },
    { label: 'Construction', start: -dev_months, end: 0, tone: 'build', description: 'Shell, power, cooling and commissioning' },
    { label: 'Lease-up', start: 0, end: 24, tone: 'ramp', description: 'Customer ramp and occupancy build-up' },
    { label: 'Stabilized operations', start: 24, end: Math.max(30, X_MAX - 12), tone: 'operate', description: 'Run-rate revenue and steady operations' },
    { label: 'Exit / refinance', start: Math.max(0, X_MAX - 6), end: X_MAX, tone: 'exit', description: 'Refinance or sale window' },
  ];

  const axisTicks = [
    { label: 'Pre-dev', month: X_MIN },
    { label: 'Launch', month: 0 },
    { label: `Y${Math.max(1, Math.round(exit_year / 2))}`, month: Math.round(exit_year * 6) },
    { label: `Y${exit_year}`, month: X_MAX },
  ];

  return (
    <>
    <style>{`
      @media (max-width: 760px) {
        [data-gantt-row] {
          gap: var(--cp-space-2, 8px) !important;
          padding-top: var(--cp-space-3, 12px) !important;
        }
        [data-gantt-copy] {
          grid-template-columns: 1fr !important;
          min-height: 52px !important;
        }
      }
    `}</style>
    <div style={S.wrap}>
      <div style={S.metaRow}>
        <span>{readiness.label}</span>
        <span>COD offset {cod_offset_months} months</span>
        <span>Exit year {exit_year}</span>
      </div>

      <div
        data-gantt-timeline
        style={{
          ...S.timeline,
          '--timeline-launch-frac': launchFrac,
        }}
      >
        <div data-gantt-axis style={S.axis}>
          {axisTicks.map(t => (
            <span key={t.label} style={{ ...S.tick, left: pos(t.month) }}>{t.label}</span>
          ))}
        </div>
        <div data-gantt-launch style={S.launchLine} aria-hidden="true" />
        {phases.map((phase) => (
          <div data-gantt-row key={phase.label} style={S.phaseRow}>
            <div data-gantt-copy style={S.phaseCopy}>
              <div style={S.phaseCopyText}>
                <strong style={S.phaseLabel}>{phase.label}</strong>
                <span style={S.phaseDesc}>{phase.description}</span>
              </div>
              <span style={S.phaseRange}>{formatRange(phase.start, phase.end)}</span>
            </div>
            <div style={S.track}>
              <div style={{
                ...S.phaseBar,
                ...S[`phase_${phase.tone}`],
                left: pos(phase.start),
                width: widthPct(phase.start, phase.end),
              }} aria-label={`${phase.label}: ${formatRange(phase.start, phase.end)}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

function formatRange(start, end) {
  if (end <= 0) return `${Math.abs(start)}-${Math.abs(end)} mo pre-launch`;
  if (start < 0) return `${Math.abs(start)} mo pre-launch to launch`;
  if (end < 24) return `${start}-${end} mo`;
  return `Y${Math.round(start / 12)}-Y${Math.round(end / 12)}`;
}

const S = {
  wrap: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4, 16px)',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--cp-space-2, 8px)',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 700,
  },
  timeline: {
    position: 'relative',
    width: '100%',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 10px)',
    background: 'var(--cp-surface-1)',
    padding: 'var(--cp-space-5, 20px) var(--cp-space-4, 16px) var(--cp-space-6, 24px)',
    overflow: 'hidden',
  },
  axis: {
    position: 'relative',
    height: 24,
    borderBottom: '1px solid var(--cp-border)',
  },
  tick: {
    position: 'absolute',
    top: 0,
    transform: 'translateX(-50%)',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro, 10px)',
    fontWeight: 800,
    letterSpacing: 'var(--cp-tracking-eyebrow, 0.14em)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  launchLine: {
    position: 'absolute',
    top: 'var(--cp-space-5, 20px)',
    bottom: 'var(--cp-space-6, 24px)',
    left: 'calc(var(--cp-space-4, 16px) + ((100% - var(--cp-space-8, 32px)) * var(--timeline-launch-frac, 0.25)))',
    width: 1,
    background: 'var(--cp-accent-maroon)',
    opacity: 0.75,
  },
  phaseRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--cp-space-2, 8px)',
  },
  phaseCopy: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'end',
    gap: 'var(--cp-space-4, 16px)',
    minHeight: 38,
  },
  phaseCopyText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1, 4px)',
    minWidth: 0,
  },
  phaseLabel: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 900,
    lineHeight: 'var(--cp-leading-tight, 1.3)',
  },
  phaseDesc: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
  },
  phaseRange: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro, 10px)',
    fontWeight: 900,
    letterSpacing: 'var(--cp-tracking-eyebrow, 0.14em)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  track: {
    position: 'relative',
    height: 30,
    borderRadius: 'var(--cp-radius-pill, 9999px)',
    background: 'var(--cp-surface-0)',
    overflow: 'hidden',
  },
  phaseBar: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    minWidth: 56,
    borderRadius: 'var(--cp-radius-pill, 9999px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--cp-text-strong)',
    fontWeight: 600,
    fontSize: 'var(--cp-font-micro, 10px)',
    whiteSpace: 'nowrap',
    padding: '0 var(--cp-space-2, 8px)',
  },
  phase_muted: { background: 'var(--cp-text-muted)' },
  phase_build: { background: 'var(--cp-accent-maroon)' },
  phase_ramp: { background: 'var(--cp-accent)' },
  phase_operate: { background: 'var(--cp-accent-maroon)' },
  phase_exit: { background: 'var(--cp-accent)' },
};
