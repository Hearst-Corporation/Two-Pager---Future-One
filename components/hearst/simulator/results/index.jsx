'use client';

import { memo } from 'react';
import PropTypes from 'prop-types';
import { fmtPctFromRatio, fmtPctRaw, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';
import { DECISION_METRICS } from '@/lib/hearst-results-view';
import { deriveReturnsComposition } from '@/lib/returns-composition';
import InfoHint from '@/components/hearst/InfoHint';

// LabelWithHint — label + a subtle (i) education affordance on one baseline.
// `hint` keys into UI.KPI_EDU; absent → plain label (no behaviour change).
function LabelWithHint({ label, hint, labelStyle }) {
  if (!hint) return <span style={labelStyle}>{label}</span>;
  return (
    <span style={S.labelRow}>
      <span style={labelStyle}>{label}</span>
      <InfoHint id={hint} label={label} />
    </span>
  );
}
LabelWithHint.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  labelStyle: PropTypes.object,
};

// ── InlineMetric ─────────────────────────────────────────────────────────────
/**
 * Single label + value row used in the capital panel sidebar.
 * @param {{ label: string, value: string|null }} props
 */
export const InlineMetric = memo(function InlineMetric({ label, value, hint }) {
  return (
    <div style={S.inlineMetric}>
      <LabelWithHint label={label} hint={hint} labelStyle={S.metricLabel} />
      <strong style={S.inlineMetricValue}>{value ?? MISSING}</strong>
    </div>
  );
});
InlineMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  hint: PropTypes.string,
};

// ── BoardMetric ──────────────────────────────────────────────────────────────
/**
 * KPI card for the economics band (label + value + note).
 * @param {{ label: string, value: string|null, note: string }} props
 */
export const BoardMetric = memo(function BoardMetric({ label, value, note, hint }) {
  return (
    <div style={S.boardMetric}>
      <LabelWithHint label={label} hint={hint} labelStyle={S.metricLabel} />
      <strong style={S.boardMetricValue}>{value ?? MISSING}</strong>
      <span style={S.boardMetricNote}>{note}</span>
    </div>
  );
});
BoardMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  note: PropTypes.string,
  hint: PropTypes.string,
};

// ── CapitalDonut ─────────────────────────────────────────────────────────────
/**
 * Conic-gradient donut showing capital stack breakdown.
 * @param {{ segments: Array<{label:string, pct:number, value:number, color:string}> }} props
 */
export const CapitalDonut = memo(function CapitalDonut({ segments }) {
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
      <div data-donut-legend style={S.donutLegend}>
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
});
CapitalDonut.propTypes = {
  segments: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    pct: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
  })).isRequired,
};

// ── CapitalStructureGrid ─────────────────────────────────────────────────────
/** Structure metrics — 2 colonnes fixes (gauche / droite), ordre board screenshot. */
export const CapitalStructureGrid = memo(function CapitalStructureGrid({ projection, scenario }) {
  const occupancy = scenario?.target_occupancy_pct != null
    ? fmtPctRaw(scenario.target_occupancy_pct)
    : MISSING;
  const exitYear = scenario?.exit_year
    ? UI.RESULTS_IM_EXIT_YEAR(scenario.exit_year)
    : MISSING;

  return (
    <div data-structure-rows style={S.structureGrid}>
      <InlineMetric label={UI.RESULTS_IM_BUILD_COST} value={fmtUSD(projection?.total_capex)} hint="capex" />
      <InlineMetric label={UI.RESULTS_IM_EQUITY_IDC} value={fmtUSD(projection?.equity_invested)} hint="equity" />
      <InlineMetric label={UI.RESULTS_IM_TERMINAL} value={fmtUSD(projection?.terminal_value)} hint="terminal_value" />
      <InlineMetric
        label={UI.RESULTS_IM_TERMINAL_EQUITY}
        value={fmtUSD(projection?.terminal_value_to_equity)}
        hint="terminal_value_to_equity"
      />
      <InlineMetric
        label={UI.RESULTS_DM_IRR}
        value={fmtPctFromRatio(projection?.irr_post_tax ?? projection?.irr)}
        hint="irr"
      />
      <InlineMetric label={UI.RESULTS_IM_DSCR} value={fmtX(projection?.dscr_stabilized)} hint="dscr" />
      <InlineMetric label={UI.RESULTS_IM_OCCUPANCY} value={occupancy} hint="occupancy" />
      <InlineMetric label={UI.RESULTS_IM_EXIT_LABEL} value={exitYear} hint="exit_year" />
    </div>
  );
});
CapitalStructureGrid.propTypes = {
  projection: PropTypes.object,
  scenario: PropTypes.object,
};

// ── DecisionKpiCell ──────────────────────────────────────────────────────────
/**
 * One KPI inside the investment-case header grid. Value clamps and never wraps;
 * four cells share one stable grid with no overflow.
 * @param {{ label: string, value: string, sub?: string|null }} props
 */
export const DecisionKpiCell = memo(function DecisionKpiCell({ label, value, sub, hint }) {
  return (
    <div style={S.kpiCell}>
      <LabelWithHint label={label} hint={hint} labelStyle={S.kpiLabel} />
      <strong data-kpi-value style={S.kpiValue} title={value ?? undefined}>{value ?? MISSING}</strong>
      {sub ? <span style={S.kpiSub}>{sub}</span> : null}
    </div>
  );
});
DecisionKpiCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  sub: PropTypes.string,
  hint: PropTypes.string,
};

// ── DecisionHeader ───────────────────────────────────────────────────────────
/**
 * Investment-case header (UI V2 — Phase 1, refactored). The PRIMARY OBJECT is the
 * KPI strip IRR + MOIC + NPV + CAPITAL. Investment-case narrative lives in the
 * hero above — no duplicate meta line here.
 *
 * PRESENTATION ONLY — every value comes from existing engine fields via
 * DECISION_METRICS / deriveReturnsComposition(). No new math.
 *
 * @param {{ projection: object|null }} props
 */
export const DecisionHeader = memo(function DecisionHeader({ projection }) {
  const capital = fmtUSD(projection?.total_capex);
  const irr = DECISION_METRICS.find(m => m.id === 'irr');
  const moic = DECISION_METRICS.find(m => m.id === 'moic');
  const npv = DECISION_METRICS.find(m => m.id === 'npv');

  return (
    <div data-decision-header style={S.dhWrap}>
      <div data-decision-kpis style={S.caseGrid}>
        <DecisionKpiCell label={UI.RESULTS_DM_IRR} value={irr?.value(projection)} sub={irr?.subValue?.(projection)} hint="irr" />
        <DecisionKpiCell label={UI.RESULTS_KPI_MOIC} value={moic?.value(projection)} sub={moic?.subValue?.(projection)} hint="moic" />
        <DecisionKpiCell label={UI.RESULTS_KPI_NPV} value={npv?.value(projection)} sub={npv?.subValue?.(projection)} hint="npv" />
        <DecisionKpiCell label={UI.RESULTS_KPI_CAPITAL} value={capital} hint="capex" />
      </div>
    </div>
  );
});
DecisionHeader.propTypes = {
  projection: PropTypes.object,
};

// ── ReturnsComposition ───────────────────────────────────────────────────────
/**
 * Board-facing disclosure: how much of equity value comes from operations vs the
 * terminal sale. Presentation-only — reads deriveReturnsComposition (existing
 * engine fields). Not a tooltip; sits in the decision flow near the headline.
 * @param {{ projection: object|null }} props
 */
export const ReturnsComposition = memo(function ReturnsComposition({ projection }) {
  const c = deriveReturnsComposition(projection);
  const hasSplit = c.available && c.operationsPct != null && c.terminalPct != null;
  const opsW = hasSplit ? Math.max(0, Math.min(100, c.operationsPct * 100)) : 0;
  const tvW = hasSplit ? Math.max(0, Math.min(100, c.terminalPct * 100)) : 0;
  const strong = c.tier === 'terminal_dominant' || c.tier === 'terminal_only' || c.tier === 'no_positive_proceeds';
  return (
    <div data-returns-composition style={S.rcWrap}>
      <LabelWithHint label={UI.RESULTS_RC_TITLE} hint="returns_composition" labelStyle={S.cardEyebrow} />
      {hasSplit ? (
        <>
          <div data-rc-rows style={S.rcRows}>
            <span style={S.rcCell}><span style={S.rcLabel}>{UI.RESULTS_RC_OPERATIONS}</span><strong style={S.rcValue}>{Math.round(c.operationsPct * 100)}%</strong></span>
            <span style={S.rcCell}><span style={S.rcLabel}>{UI.RESULTS_RC_TERMINAL}</span><strong style={S.rcValue}>{Math.round(c.terminalPct * 100)}%</strong></span>
          </div>
          <div style={S.rcBar}>
            <div style={{ ...S.rcSeg, width: `${opsW}%`, background: 'var(--cp-text-muted)' }} />
            <div style={{ ...S.rcSeg, width: `${tvW}%`, background: 'var(--cp-accent)' }} />
          </div>
        </>
      ) : null}
      <span data-rc-note style={{ ...S.rcNote, color: strong ? 'var(--cp-text-primary)' : 'var(--cp-text-muted)' }}>{c.note}</span>
    </div>
  );
});
ReturnsComposition.propTypes = {
  projection: PropTypes.object,
};

// ── LayerCard ─────────────────────────────────────────────────────────────────
/**
 * One of the 4 scenario layer cards (Starting Point / Operating Model / Hardware / Industry).
 * @param {{ index: string, title: string, rows: Array<[string, string|null]> }} props
 */
export const LayerCard = memo(function LayerCard({ index, title, rows }) {
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
});
LayerCard.propTypes = {
  index: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
};

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  // Label + (i) hint on one baseline. The icon never grows the row height.
  labelRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-1)',
    minWidth: 0,
  },
  // Investment-case header (UI V2 — Phase 1, refactored)
  dhWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  caseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'var(--cp-space-4)',
    paddingTop: 'var(--cp-space-4)',
    width: '100%',
  },
  kpiCell: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 'var(--cp-space-1)',
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
    lineHeight: 1.05,
    fontSize: 'clamp(20px, 2.5vw, 32px)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: '-0.02em',
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
  rcWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
    alignItems: 'center',
  },
  cardEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  rcRows: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
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
    fontSize: 'clamp(20px, 1.5vw, 28px)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  rcBar: {
    display: 'flex',
    width: '100%',
    height: '4px',
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
    alignItems: 'flex-start',
    gap: 'var(--cp-space-4)',
    width: '100%',
    minWidth: 0,
  },
  donut: {
    width: 'var(--donut-size)',
    height: 'var(--donut-size)',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 0 0 1px var(--cp-border)',
    flexShrink: 0,
    alignSelf: 'center',
  },
  donutHole: {
    width: 'var(--donut-hole)',
    height: 'var(--donut-hole)',
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
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  donutValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    lineHeight: 1.1,
  },
  structureGrid: {
    width: '100%',
    minWidth: 0,
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
    width: 'var(--cp-space-2)',
    height: 'var(--cp-space-2)',
    borderRadius: '50%',
  },
  donutLegendLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  donutLegendValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    whiteSpace: 'nowrap',
  },
  inlineMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
    paddingBottom: 'var(--cp-space-1)',
  },
  metricLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  inlineMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-bold)',
    lineHeight: 'var(--cp-leading-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  boardMetric: {
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-3) 0 var(--cp-space-3) var(--cp-space-4)',
    borderLeft: '2px solid var(--cp-border-base)',
  },
  boardMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(18px, 1.5vw, 24px)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
  },
  boardMetricNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    marginTop: 'auto',
  },
  layerCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border-base)',
    borderRadius: 'var(--cp-radius-md)',
    minWidth: 0,
  },
  layerHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    marginBottom: 'var(--cp-space-3)',
    paddingBottom: 'var(--cp-space-2)',
    borderBottom: '1px solid var(--cp-border)',
  },
  layerIndex: {
    color: 'var(--cp-accent-maroon)',
    fontSize: '10px',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: '0.05em',
  },
  layerTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  layerRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    flex: 1,
  },
  layerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 'var(--cp-space-2)',
    alignItems: 'baseline',
  },
  layerLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: '10px',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  layerValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
};
