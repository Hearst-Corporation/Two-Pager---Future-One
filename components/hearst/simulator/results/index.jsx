'use client';

import PropTypes from 'prop-types';
import { fmtPctRaw, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';
import { DECISION_METRICS, verdictDecision } from '@/lib/hearst-results-view';
import { deriveReturnsComposition } from '@/lib/returns-composition';

// Tone → token color for the decision verdict / warnings. Presentation only.
const TONE_COLOR = {
  positive: 'var(--cp-success)',
  caution: 'var(--cp-warning)',
  negative: 'var(--cp-error)',
};
const TONE_SOFT = {
  positive: 'var(--cp-success-bg)',
  caution: 'var(--cp-warning-bg)',
  negative: 'var(--cp-error-bg)',
};

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
            {metric.subValue?.(projection) && (
              <span style={S.decisionMetricSub}>{metric.subValue(projection)}</span>
            )}
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

// ── DecisionKpiTile ──────────────────────────────────────────────────────────
/**
 * One promoted KPI in the decision row: dominant number, secondary label.
 * Tabular numerics so the four tiles align on the decimal.
 * @param {{ label: string, value: string, sub?: string|null, note?: string }} props
 */
export function DecisionKpiTile({ label, value, sub, note }) {
  return (
    <div style={S.kpiTile}>
      <span style={S.kpiLabel}>{label}</span>
      <strong style={S.kpiValue}>{value ?? MISSING}</strong>
      {sub ? <span style={S.kpiSub}>{sub}</span> : null}
      {note ? <span style={S.kpiNote}>{note}</span> : null}
    </div>
  );
}
DecisionKpiTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  sub: PropTypes.string,
  note: PropTypes.string,
};

// ── DecisionHeader ───────────────────────────────────────────────────────────
/**
 * Decision-first header (UI V2 — Phase 1). The verdict (APPROVE / REVIEW / REJECT)
 * is the largest object on screen; the case header sits above it; the IRR / MOIC /
 * NPV / CAPITAL row dominates directly below; Returns Composition sits above the
 * fold with an immediate warning when terminal dependence exceeds 75%.
 *
 * PRESENTATION ONLY — every value comes from existing engine fields via
 * verdictDecision() / DECISION_METRICS / deriveReturnsComposition(). No new math.
 *
 * @param {{ projection: object|null, caseHeader: string }} props
 */
export function DecisionHeader({ projection, caseHeader }) {
  const v = verdictDecision(projection);
  const color = TONE_COLOR[v.tone] || 'var(--cp-text-primary)';
  const soft = TONE_SOFT[v.tone] || 'var(--cp-surface-1)';

  const capital = fmtUSD(projection?.total_capex);
  const irr = DECISION_METRICS.find(m => m.id === 'irr');
  const moic = DECISION_METRICS.find(m => m.id === 'moic');
  const npv = DECISION_METRICS.find(m => m.id === 'npv');

  const rc = deriveReturnsComposition(projection);
  const tvPct = rc.available && rc.terminalPct != null ? Math.round(rc.terminalPct * 100) : null;
  const tvAlarm = tvPct != null && tvPct > 75;

  return (
    <div data-decision-header style={S.dhWrap}>
      {/* Case header — above the verdict */}
      <div style={S.caseHeader}>{caseHeader}</div>

      {/* Verdict — the largest object on screen */}
      <div style={{ ...S.verdictBlock, borderColor: color, background: soft }}>
        <span style={S.verdictEyebrow}>{UI.RESULTS_DECISION_EYEBROW}</span>
        <strong data-verdict style={{ ...S.verdictWord, color }}>{v.decision}</strong>
        <span style={S.verdictDetail}>{v.detail}</span>
      </div>

      {/* KPI row — numbers dominate, directly below verdict */}
      <div data-decision-kpis style={S.kpiRow}>
        <DecisionKpiTile label={UI.RESULTS_KPI_IRR} value={irr?.value(projection)} sub={irr?.subValue?.(projection)} note={irr?.note} />
        <DecisionKpiTile label={UI.RESULTS_KPI_MOIC} value={moic?.value(projection)} sub={moic?.subValue?.(projection)} note={moic?.note} />
        <DecisionKpiTile label={UI.RESULTS_KPI_NPV} value={npv?.value(projection)} sub={npv?.subValue?.(projection)} note={npv?.note} />
        <DecisionKpiTile label={UI.RESULTS_KPI_CAPITAL} value={capital} note={UI.RESULTS_KPI_CAPITAL_NOTE} />
      </div>

      {/* Returns Composition — above the fold, directly under KPI row */}
      <ReturnsComposition projection={projection} />
      {tvAlarm ? (
        <div data-tv-warning style={{ ...S.tvWarning, borderColor: 'var(--cp-warning)', background: 'var(--cp-warning-bg)' }}>
          {UI.RESULTS_TV_WARNING(tvPct)}
        </div>
      ) : null}

      {/* Risk guardrail — DSCR sits below returns in the hierarchy (preserved from
          the previous decision panel; not promoted, but never dropped). */}
      <div data-risk-strip style={S.riskStrip}>
        <span style={S.riskLabel}>{UI.RESULTS_RISK_GUARDRAIL}</span>
        <strong style={S.riskValue}>DSCR {fmtX(projection?.dscr_stabilized)}</strong>
        <span style={S.riskNote}>{UI.RESULTS_RISK_NOTE}</span>
      </div>
    </div>
  );
}
DecisionHeader.propTypes = {
  projection: PropTypes.object,
  caseHeader: PropTypes.string.isRequired,
};

// ── ReturnsComposition ───────────────────────────────────────────────────────
/**
 * Board-facing disclosure: how much of equity value comes from operations vs the
 * terminal sale. Presentation-only — reads deriveReturnsComposition (existing
 * engine fields). Not a tooltip; sits in the decision flow near the headline.
 * @param {{ projection: object|null }} props
 */
export function ReturnsComposition({ projection }) {
  const c = deriveReturnsComposition(projection);
  const hasSplit = c.available && c.operationsPct != null && c.terminalPct != null;
  const opsW = hasSplit ? Math.max(0, Math.min(100, c.operationsPct * 100)) : 0;
  const tvW = hasSplit ? Math.max(0, Math.min(100, c.terminalPct * 100)) : 0;
  const strong = c.tier === 'terminal_dominant' || c.tier === 'terminal_only' || c.tier === 'no_positive_proceeds';
  return (
    <div data-returns-composition style={S.rcWrap}>
      <span style={S.rcTitle}>{UI.RESULTS_RC_TITLE}</span>
      {hasSplit ? (
        <>
          <div style={S.rcRows}>
            <span style={S.rcCell}><span style={S.rcLabel}>{UI.RESULTS_RC_OPERATIONS}</span><strong style={S.rcValue}>{Math.round(c.operationsPct * 100)}%</strong></span>
            <span style={S.rcCell}><span style={S.rcLabel}>{UI.RESULTS_RC_TERMINAL}</span><strong style={S.rcValue}>{Math.round(c.terminalPct * 100)}%</strong></span>
          </div>
          <div style={S.rcBar}>
            <div style={{ ...S.rcSeg, width: `${opsW}%`, background: 'var(--cp-text-muted)' }} />
            <div style={{ ...S.rcSeg, width: `${tvW}%`, background: 'var(--cp-accent)' }} />
          </div>
        </>
      ) : null}
      <span style={{ ...S.rcNote, color: strong ? 'var(--cp-text-primary)' : 'var(--cp-text-muted)' }}>{c.note}</span>
    </div>
  );
}
ReturnsComposition.propTypes = {
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

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  // Decision-first header (UI V2 — Phase 1)
  dhWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-5)',
    minWidth: 0,
  },
  caseHeader: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-tight)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  verdictBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-6)',
    border: '1px solid var(--cp-border)',
    borderLeftWidth: 'var(--cp-space-1)',
    borderRadius: 'var(--cp-radius-lg)',
  },
  verdictEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  verdictWord: {
    fontSize: 'clamp(48px, 6vw, 80px)',
    lineHeight: 0.95,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  verdictDetail: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'var(--cp-space-4)',
  },
  kpiTile: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-4) var(--cp-space-5)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
  },
  kpiLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  kpiValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(30px, 3vw, 44px)',
    lineHeight: 1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  kpiSub: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  kpiNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  tvWarning: {
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  rcWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-4)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
  },
  rcTitle: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  rcRows: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
  },
  rcCell: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
  },
  rcLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  rcValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  rcBar: {
    display: 'flex',
    width: '100%',
    height: 'var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-pill)',
    overflow: 'hidden',
    background: 'var(--cp-surface-2)',
  },
  rcSeg: {
    height: '100%',
  },
  rcNote: {
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
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
  decisionMetricSub: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
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
};
