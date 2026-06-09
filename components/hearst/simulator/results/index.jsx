'use client';

import PropTypes from 'prop-types';
import { fmtPctRaw, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';
import { DECISION_METRICS } from '@/lib/hearst-results-view';
import { computeReturnsComposition, returnsCompositionLabel } from '@/lib/returns-composition';

// ── InlineMetric ─────────────────────────────────────────────────────────────
/**
 * Single label + value row used in the capital panel sidebar.
 * @param {{ label: string, value: string|null }} props
 */
export function InlineMetric({ label, value }) {
  return (
    <div style={S.inlineMetric}>
      <span style={S.metricLabel}>{label}</span>
      <strong style={S.inlineMetricValue}>{value ?? MISSING}</strong>
    </div>
  );
}
InlineMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

// ── BoardMetric ──────────────────────────────────────────────────────────────
/**
 * KPI card for the economics band (label + value + note).
 * @param {{ label: string, value: string|null, note: string }} props
 */
export function BoardMetric({ label, value, note }) {
  return (
    <div style={S.boardMetric}>
      <span style={S.metricLabel}>{label}</span>
      <strong style={S.boardMetricValue}>{value ?? MISSING}</strong>
      <span style={S.boardMetricNote}>{note}</span>
    </div>
  );
}
BoardMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  note: PropTypes.string,
};

// ── CapitalDonut ─────────────────────────────────────────────────────────────
/**
 * Conic-gradient donut showing capital stack breakdown.
 * @param {{ segments: Array<{label:string, pct:number, value:number, color:string}> }} props
 */
export function CapitalDonut({ segments }) {
  let cursor = 0;
  const gradient = segments.map((s) => {
    const start = cursor;
    const end = cursor + s.pct;
    cursor = end;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div data-capital-donut style={S.donutWrap}>
      <div style={{ ...S.donut, background: `conic-gradient(${gradient || 'var(--cp-border) 0% 100%'})` }}>
        <div style={S.donutHole}>
          <span style={S.donutLabel}>{UI.RESULTS_DONUT_LABEL}</span>
          <strong style={S.donutValue}>{UI.RESULTS_DONUT_VALUE}</strong>
        </div>
      </div>
      <div style={S.donutLegend}>
        {segments.map(s => (
          <div key={s.label} style={S.donutLegendRow}>
            <span style={{ ...S.donutDot, background: s.color }} />
            <span style={S.donutLegendLabel}>{s.label}</span>
            <strong style={S.donutLegendValue}>{fmtPctRaw(s.pct, 0)} · {fmtUSD(s.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
CapitalDonut.propTypes = {
  segments: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    pct: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
  })).isRequired,
};

// ── DecisionKpis ─────────────────────────────────────────────────────────────
/**
 * Decision metrics panel: IRR / NPV / MOIC + DSCR risk guardrail.
 * @param {{ projection: object|null }} props
 */
export function DecisionKpis({ projection }) {
  return (
    <div data-decision-panel style={S.decisionPanel}>
      <span style={S.decisionEyebrow}>{UI.RESULTS_DECISION_METRICS}</span>
      <div data-decision-metrics style={S.decisionMetrics}>
        {DECISION_METRICS.map(metric => (
          <div key={metric.id} style={S.decisionMetric}>
            <span style={S.decisionMetricLabel}>{metric.label}</span>
            <strong style={S.decisionMetricValue}>{metric.value(projection)}</strong>
            <span style={S.decisionMetricNote}>{metric.note}</span>
          </div>
        ))}
      </div>
      <div data-risk-strip style={S.riskStrip}>
        <span style={S.riskLabel}>{UI.RESULTS_RISK_GUARDRAIL}</span>
        <strong style={S.riskValue}>DSCR {fmtX(projection?.dscr_stabilized)}</strong>
        <span style={S.riskNote}>{UI.RESULTS_RISK_NOTE}</span>
      </div>
    </div>
  );
}
DecisionKpis.propTypes = {
  projection: PropTypes.object,
};

// ── LayerCard ─────────────────────────────────────────────────────────────────
/**
 * One of the 4 scenario layer cards (Starting Point / Operating Model / Hardware / Industry).
 * @param {{ index: string, title: string, rows: Array<[string, string|null]> }} props
 */
export function LayerCard({ index, title, rows }) {
  return (
    <div style={S.layerCard}>
      <div style={S.layerHead}>
        <span style={S.layerIndex}>{index}</span>
        <h3 style={S.layerTitle}>{title}</h3>
      </div>
      <div style={S.layerRows}>
        {rows.map(([label, value]) => (
          <div key={label} style={S.layerRow}>
            <span style={S.layerLabel}>{label}</span>
            <strong style={S.layerValue}>{value ?? MISSING}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
LayerCard.propTypes = {
  index: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
};

// ── ReturnsComposition ───────────────────────────────────────────────────────
/**
 * Bar visualization showing the Operations vs Terminal split of total return.
 * Labels are clamped to [0, 100]% — when terminalPct > 1 a textual note replaces
 * the numeric label to avoid rendering ">100%".
 * @param {{ projection: object|null }} props
 */
export function ReturnsComposition({ projection }) {
  const { operationsPct, terminalPct, valid } = computeReturnsComposition(projection);
  const label = returnsCompositionLabel(operationsPct, terminalPct);

  // Bar widths: clamped to [0, 100] for display
  const opsBarPct   = Math.max(0, Math.min(100, (operationsPct * 100)));
  const termBarPct  = Math.max(0, Math.min(100, (terminalPct  * 100)));

  // Label integers: clamped to [0, 100]; when terminal exceeds 100%, show note instead
  const opsLabelPct  = Math.max(0, Math.min(100, Math.round(operationsPct * 100)));
  const termLabelPct = Math.max(0, Math.min(100, Math.round(terminalPct   * 100)));
  const terminalExceeds = valid && terminalPct > 1;

  if (!valid) {
    return (
      <div style={S.rcWrap}>
        <span style={S.rcEyebrow}>Returns Composition</span>
        <span style={{ color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)' }}>{MISSING}</span>
      </div>
    );
  }

  return (
    <div style={S.rcWrap}>
      <div style={S.rcHeader}>
        <span style={S.rcEyebrow}>Returns Composition</span>
        <span style={S.rcLabel}>{label}</span>
      </div>
      <div style={S.rcBar}>
        <div style={{ ...S.rcBarOps,      width: `${opsBarPct}%`  }} title={`Operations: ${opsLabelPct}%`} />
        <div style={{ ...S.rcBarTerminal, width: `${termBarPct}%` }} title={`Terminal: ${terminalExceeds ? '>100%' : termLabelPct + '%'}`} />
      </div>
      <div style={S.rcLegend}>
        <div style={S.rcLegendItem}>
          <span style={{ ...S.rcDot, background: 'var(--cp-accent)' }} />
          <span style={S.rcLegendLabel}>Operations</span>
          <strong style={S.rcLegendValue}>{opsLabelPct}%</strong>
        </div>
        <div style={S.rcLegendItem}>
          <span style={{ ...S.rcDot, background: 'var(--cp-text-muted)' }} />
          <span style={S.rcLegendLabel}>Terminal</span>
          <strong style={S.rcLegendValue}>
            {terminalExceeds ? 'Exit-driven (>100%)' : `${termLabelPct}%`}
          </strong>
        </div>
      </div>
    </div>
  );
}
ReturnsComposition.propTypes = {
  projection: PropTypes.object,
};

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  donutWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--cp-space-4)',
  },
  donut: {
    width: 150,
    height: 150,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 0 0 1px var(--cp-border)',
  },
  donutHole: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  donutValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-lg)',
  },
  donutLegend: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  donutLegendRow: {
    display: 'grid',
    gridTemplateColumns: 'var(--cp-space-3) minmax(0, 1fr) auto',
    gap: 'var(--cp-space-2)',
    alignItems: 'center',
  },
  donutDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
  },
  donutLegendLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  donutLegendValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    whiteSpace: 'nowrap',
  },
  inlineMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 0,
  },
  metricLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    fontWeight: 700,
  },
  inlineMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-base)',
    lineHeight: 'var(--cp-leading-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  boardMetric: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-4)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
  },
  boardMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-xl)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  boardMetricNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  decisionPanel: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    paddingLeft: 'var(--cp-space-6)',
    borderLeft: '1px solid var(--cp-border)',
  },
  decisionEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  decisionMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-5)',
  },
  decisionMetric: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  decisionMetricLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  decisionMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(28px, 2.15vw, 34px)',
    lineHeight: 1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  decisionMetricNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  riskStrip: {
    display: 'grid',
    gridTemplateColumns: 'auto auto minmax(0, 1fr)',
    gap: 'var(--cp-space-3)',
    alignItems: 'center',
    paddingTop: 'var(--cp-space-3)',
    borderTop: '1px solid var(--cp-border)',
  },
  riskLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  riskValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  riskNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  layerCard: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-4)',
    minWidth: 0,
  },
  layerHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-3)',
    marginBottom: 'var(--cp-space-3)',
  },
  layerIndex: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  layerTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-base)',
    fontWeight: 800,
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
  },
  layerRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  layerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)',
    gap: 'var(--cp-space-3)',
  },
  layerLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  layerValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    textAlign: 'right',
    overflowWrap: 'anywhere',
  },
  // ReturnsComposition styles
  rcWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  rcHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
  },
  rcEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  rcLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  rcBar: {
    display: 'flex',
    height: 8,
    borderRadius: 'var(--cp-radius-xs)',
    overflow: 'hidden',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
  },
  rcBarOps: {
    background: 'var(--cp-accent)',
    height: '100%',
    transition: 'width 0.3s ease',
  },
  rcBarTerminal: {
    background: 'var(--cp-text-muted)',
    height: '100%',
    transition: 'width 0.3s ease',
  },
  rcLegend: {
    display: 'flex',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  rcLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
  },
  rcDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  rcLegendLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  rcLegendValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontVariantNumeric: 'tabular-nums',
  },
};
