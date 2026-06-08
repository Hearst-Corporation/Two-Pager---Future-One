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

// ── DecisionKpiCell ──────────────────────────────────────────────────────────
/**
 * One KPI inside the investment-case header grid. Sits as a co-equal member next
 * to the verdict — same row, same baseline. Value clamps and never wraps; the
 * cell is minmax(0,1fr) so four of them stay on one stable grid with no overflow.
 * @param {{ label: string, value: string, sub?: string|null }} props
 */
export function DecisionKpiCell({ label, value, sub }) {
  return (
    <div style={S.kpiCell}>
      <span style={S.kpiLabel}>{label}</span>
      <strong style={S.kpiValue} title={value ?? undefined}>{value ?? MISSING}</strong>
      {sub ? <span style={S.kpiSub}>{sub}</span> : null}
    </div>
  );
}
DecisionKpiCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  sub: PropTypes.string,
};

// ── DecisionHeader ───────────────────────────────────────────────────────────
/**
 * Investment-case header (UI V2 — Phase 1, refactored). The PRIMARY OBJECT is the
 * full line "APPROVE + IRR + MOIC + NPV + CAPITAL" — verdict and KPIs are co-equal
 * members of ONE stable grid, not a banner over a separate row. A thin case-header
 * line sits at the top; a compact meta strip (returns composition · terminal-value
 * flag · DSCR) sits below — no full-width stacked chunks, no duplicated hierarchy.
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
  const opsPct = rc.available && rc.operationsPct != null ? Math.round(rc.operationsPct * 100) : null;
  const tvAlarm = tvPct != null && tvPct > 75;

  return (
    <div data-decision-header style={S.dhWrap}>
      {/* Case header — thin line at the top of the same card */}
      <div style={S.caseHeader}>{caseHeader}</div>

      {/* Investment-case header: verdict + 4 KPIs on ONE grid. Primary object. */}
      <div data-decision-kpis style={S.caseGrid}>
        <div data-verdict-cell style={{ ...S.verdictCell, borderColor: color }}>
          <span style={S.verdictEyebrow}>{UI.RESULTS_DECISION_EYEBROW}</span>
          <strong data-verdict style={{ ...S.verdictWord, color }}>{v.decision}</strong>
          <span style={{ ...S.verdictDetail, background: soft, color }}>{v.detail}</span>
        </div>
        <DecisionKpiCell label={UI.RESULTS_KPI_IRR} value={irr?.value(projection)} sub={irr?.subValue?.(projection)} />
        <DecisionKpiCell label={UI.RESULTS_KPI_MOIC} value={moic?.value(projection)} sub={moic?.subValue?.(projection)} />
        <DecisionKpiCell label={UI.RESULTS_KPI_NPV} value={npv?.value(projection)} sub={npv?.subValue?.(projection)} />
        <DecisionKpiCell label={UI.RESULTS_KPI_CAPITAL} value={capital} />
      </div>

      {/* Meta strip — returns composition · terminal-value flag · DSCR. Compact,
          single row, above the fold; not a stack of full-width chunks. */}
      <div data-decision-meta style={{ ...S.metaStrip, ...(tvAlarm ? { borderColor: 'var(--cp-warning)', background: 'var(--cp-warning-bg)' } : null) }}>
        <span style={S.metaItem}>
          <span style={S.metaLabel}>{UI.RESULTS_RC_TITLE}</span>
          <strong style={S.metaValue}>
            {opsPct != null && tvPct != null
              ? `${UI.RESULTS_RC_OPERATIONS} ${opsPct}% · ${UI.RESULTS_RC_TERMINAL} ${tvPct}%`
              : rc.note}
          </strong>
        </span>
        {tvAlarm ? <span data-tv-warning style={{ ...S.metaFlag }}>{UI.RESULTS_TV_WARNING(tvPct)}</span> : null}
        <span style={S.metaRisk}>
          <span style={S.metaLabel}>{UI.RESULTS_RISK_GUARDRAIL}</span>
          <strong style={S.metaValue}>DSCR {fmtX(projection?.dscr_stabilized)}</strong>
        </span>
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
  // Investment-case header (UI V2 — Phase 1, refactored)
  dhWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  caseHeader: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-md)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-tight)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  // ONE grid: verdict cell + 4 KPI cells. Single stable row; the verdict column
  // sizes to content, KPIs share the rest as equal minmax(0,1fr) tracks so they
  // never overflow or wrap. This whole line is the primary object.
  caseGrid: {
    display: 'grid',
    // Verdict column is fixed/bounded so it can't starve the KPI tracks; the four
    // KPIs share the remaining width as equal minmax(0,1fr) tracks.
    gridTemplateColumns: 'clamp(150px, 15vw, 200px) repeat(4, minmax(0, 1fr))',
    alignItems: 'stretch',
    gap: 'var(--cp-space-4)',
    padding: 'var(--cp-space-4)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
  },
  verdictCell: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 'var(--cp-space-1)',
    paddingRight: 'var(--cp-space-4)',
    borderLeft: 'var(--cp-space-1) solid currentColor',
    paddingLeft: 'var(--cp-space-3)',
    borderRight: '1px solid var(--cp-border)',
  },
  verdictEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  // ~35% smaller than the previous 48–80px banner and bounded to fit the verdict
  // column so it never collides with the KPIs; cell height ~half the old block.
  verdictWord: {
    fontSize: 'clamp(24px, 2.3vw, 34px)',
    lineHeight: 0.95,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  verdictDetail: {
    width: 'fit-content',
    maxWidth: '100%',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    padding: 'calc(var(--cp-space-1) / 2) var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-pill)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  kpiCell: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 'calc(var(--cp-space-1) / 2)',
  },
  kpiLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  // Numbers dominate but stay bounded; clamp sized so the widest value ($142.9M)
  // fits its track. nowrap + ellipsis is a hard backstop, never the normal state.
  kpiValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(18px, 1.5vw, 24px)',
    lineHeight: 1.05,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  kpiSub: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    lineHeight: 'var(--cp-leading-tight)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  // Compact meta strip — returns composition · TV flag · DSCR on one row.
  metaStrip: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--cp-space-2) var(--cp-space-5)',
    padding: 'var(--cp-space-2) var(--cp-space-4)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    background: 'var(--cp-surface-1)',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
  },
  metaRisk: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    marginLeft: 'auto',
  },
  metaLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    fontVariantNumeric: 'tabular-nums',
  },
  metaFlag: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    lineHeight: 'var(--cp-leading-tight)',
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
