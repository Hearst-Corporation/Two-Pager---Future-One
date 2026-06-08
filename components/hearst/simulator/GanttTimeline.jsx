'use client';

import { memo } from 'react';
import { SITE_READINESS } from '@/lib/hearst-constants';
import { UI } from '@/lib/ui-strings';

const PERMIT_MONTHS = 6;

function pctInSpan(month, spanStart, spanEnd) {
  const span = Math.max(1, spanEnd - spanStart);
  return ((month - spanStart) / span) * 100;
}

function pos(month, spanStart, spanEnd) {
  return `${pctInSpan(month, spanStart, spanEnd)}%`;
}

function widthPct(start, end, spanStart, spanEnd) {
  const span = Math.max(1, spanEnd - spanStart);
  return `${Math.max(1.5, ((end - start) / span) * 100)}%`;
}

/** Keep axis labels inside the rail — no clipped Start/Launch at the edges. */
function tickStyle(pct) {
  if (pct <= 6) return { left: '0%', transform: 'translateX(0)' };
  if (pct >= 94) return { left: '100%', transform: 'translateX(-100%)' };
  return { left: `${pct}%`, transform: 'translateX(-50%)' };
}

function formatDuration(start, end, mode) {
  const dur = end - start;
  if (mode === 'mo') return UI.GANTT_RANGE_MO(dur);
  if (dur < 12) return UI.GANTT_RANGE_TAIL(Math.max(1, Math.round(end / 12)));
  const y0 = Math.max(0, Math.round(start / 12));
  const y1 = Math.max(y0 + 1, Math.round(end / 12));
  return UI.GANTT_RANGE_YR(y0, y1);
}

function PhaseTrack({ title, hint, spanStart, spanEnd, phases, ticks, durationMode, codMonth = null }) {
  const showCod = codMonth != null && codMonth >= spanStart && codMonth <= spanEnd;
  const codPct = showCod ? pctInSpan(codMonth, spanStart, spanEnd) : null;

  return (
    <section data-gantt-track style={S.trackSection}>
      <header style={S.trackHead}>
        <strong style={S.trackTitle}>{title}</strong>
        <span style={S.trackHint}>{hint}</span>
      </header>

      <div data-gantt-track-body style={S.trackBody}>
        <div data-gantt-rail style={S.rail}>
          <div data-gantt-axis style={S.axis}>
            {ticks.map((t) => (
              <span
                key={`${title}-${t.month}-${t.label}`}
                style={{ ...S.tick, ...tickStyle(pctInSpan(t.month, spanStart, spanEnd)) }}
              >
                {t.label}
              </span>
            ))}
          </div>

          {showCod ? (
            <div
              data-gantt-cod-line
              style={{ ...S.codLine, ...tickStyle(codPct) }}
              aria-hidden="true"
            />
          ) : null}

          <div data-gantt-rows style={S.rows}>
            {phases.map((phase) => (
              <div data-gantt-row key={phase.label} style={S.row}>
                <div data-gantt-label style={S.labelCol}>
                  <strong style={S.phaseLabel}>{phase.label}</strong>
                  <span style={S.phaseDesc}>{phase.description}</span>
                  <span style={S.phaseRange}>{formatDuration(phase.start, phase.end, durationMode)}</span>
                </div>
                <div data-gantt-bar-track style={S.barTrack}>
                  <div
                    style={{
                      ...S.phaseBar,
                      ...S[`phase_${phase.tone}`],
                      left: pos(phase.start, spanStart, spanEnd),
                      width: widthPct(phase.start, phase.end, spanStart, spanEnd),
                    }}
                    aria-label={`${phase.label}: ${formatDuration(phase.start, phase.end, durationMode)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Board deployment timeline — two rails (pre-COD / post-COD) sharing COD as month 0.
 */
function GanttTimeline({ scenario, exit_year = 10 }) {
  const readiness = SITE_READINESS[scenario?.site_readiness] || SITE_READINESS.greenfield;
  const cod_offset_months = readiness.cod_offset_months;
  const dev_months = readiness.dev_months;

  const permitStart = -(cod_offset_months + PERMIT_MONTHS);
  const constructionStart = -dev_months;
  const preStart = Math.min(permitStart, constructionStart);
  const preEnd = 0;
  const preSpanMo = Math.abs(preStart);

  const opsEnd = exit_year * 12;
  const stabilizedEnd = Math.max(30, opsEnd - 12);
  const exitStart = Math.max(stabilizedEnd, opsEnd - 6);

  const prePhases = [
    {
      label: UI.GANTT_PHASE_PERMITS,
      description: UI.GANTT_PHASE_PERMITS_DESC,
      start: permitStart,
      end: permitStart + PERMIT_MONTHS,
      tone: 'prep',
    },
    {
      label: UI.GANTT_PHASE_CONSTRUCTION,
      description: UI.GANTT_PHASE_CONSTRUCTION_DESC,
      start: constructionStart,
      end: 0,
      tone: 'build',
    },
  ];

  const opsPhases = [
    {
      label: UI.GANTT_PHASE_LEASEUP,
      description: UI.GANTT_PHASE_LEASEUP_DESC,
      start: 0,
      end: 24,
      tone: 'ramp',
    },
    {
      label: UI.GANTT_PHASE_STABILIZED,
      description: UI.GANTT_PHASE_STABILIZED_DESC,
      start: 24,
      end: stabilizedEnd,
      tone: 'operate',
    },
    {
      label: UI.GANTT_PHASE_EXIT,
      description: UI.GANTT_PHASE_EXIT_DESC,
      start: exitStart,
      end: opsEnd,
      tone: 'exit',
    },
  ];

  const midPre = Math.round(preStart / 2);

  return (
    <div data-gantt-root style={S.wrap}>
      <div style={S.metaRow}>
        <span>{readiness.label}</span>
        <span>{UI.GANTT_META_COD(cod_offset_months)}</span>
        <span>{UI.GANTT_META_EXIT(exit_year)}</span>
      </div>
      <p style={S.codNote}>{UI.GANTT_COD_NOTE}</p>

      <div data-gantt-timeline style={S.timelineStack}>
        <PhaseTrack
          title={UI.GANTT_TRACK_PRE}
          hint={UI.GANTT_TRACK_PRE_HINT}
          spanStart={preStart}
          spanEnd={preEnd}
          phases={prePhases}
          durationMode="mo"
          codMonth={0}
          ticks={[
            { label: UI.GANTT_TICK_KICKOFF, month: preStart },
            ...(preSpanMo >= 18 ? [{ label: UI.GANTT_TICK_BEFORE_COD(Math.round(preSpanMo / 2)), month: midPre }] : []),
            { label: UI.GANTT_TICK_COD, month: 0 },
          ]}
        />

        <PhaseTrack
          title={UI.GANTT_TRACK_OPS}
          hint={UI.GANTT_TRACK_OPS_HINT}
          spanStart={0}
          spanEnd={opsEnd}
          phases={opsPhases}
          durationMode="yr"
          codMonth={0}
          ticks={[
            { label: UI.GANTT_TICK_COD, month: 0 },
            ...(exit_year >= 6 ? [{ label: `Y${Math.round(exit_year / 2)}`, month: Math.round(exit_year * 6) }] : []),
            { label: UI.GANTT_TICK_EXIT(exit_year), month: opsEnd },
          ]}
        />
      </div>
    </div>
  );
}

export default memo(GanttTimeline);

const S = {
  wrap: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--cp-space-2) var(--cp-space-4)',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
  },
  codNote: {
    margin: 0,
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  timelineStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    width: '100%',
    minWidth: 0,
  },
  trackSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
  },
  trackHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2) var(--cp-space-3)',
  },
  trackTitle: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
  },
  trackHint: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    fontStyle: 'italic',
  },
  trackBody: {
    width: '100%',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    background: 'var(--cp-surface-1)',
    padding: 'var(--cp-space-4)',
    minWidth: 0,
  },
  rail: {
    position: 'relative',
    width: '100%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  axis: {
    position: 'relative',
    height: 24,
    borderBottom: '1px solid var(--cp-border)',
    marginBottom: 'var(--cp-space-1)',
  },
  tick: {
    position: 'absolute',
    top: 0,
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  codLine: {
    position: 'absolute',
    top: 24,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    background: 'var(--cp-accent-maroon)',
    opacity: 0.5,
    pointerEvents: 'none',
    zIndex: 1,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 'var(--cp-space-2)',
    alignItems: 'center',
  },
  labelCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  phaseLabel: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  phaseDesc: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  phaseRange: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
  },
  barTrack: {
    position: 'relative',
    height: 14,
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    overflow: 'hidden',
  },
  phaseBar: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    borderRadius: 'var(--cp-radius-pill)',
  },
  phase_prep: {
    background: 'var(--cp-surface-3)',
    border: '1px solid var(--cp-border-strong)',
  },
  phase_build: {
    background: 'var(--cp-accent-maroon)',
  },
  phase_ramp: {
    background: 'var(--cp-accent)',
    opacity: 0.75,
  },
  phase_operate: {
    background: 'var(--cp-accent-maroon)',
    opacity: 0.9,
  },
  phase_exit: {
    background: 'var(--cp-accent)',
  },
};
