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

// ── Tornado ──────────────────────────────────────────────────────────────────
/**
 * Horizontal tornado: one bar per driver, sorted by IRR swing. Each bar is a
 * 0-centred track; the segment spans from the downside delta to the upside delta
 * (in percentage points of IRR).
 * @param {{ tornado: { base_irr: number, bars: Array }|null }} props
 */
export const Tornado = memo(function Tornado({ tornado }) {
  if (!tornado || !tornado.bars?.length) {
    return <div style={S.tornadoEmpty}>{UI.RESULTS_TORNADO_NODATA}</div>;
  }
  const pp = (d) => `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}`;
  // Axis half-width = largest single-sided IRR move across all bars.
  const halfMax = Math.max(
    ...tornado.bars.map((b) => Math.max(Math.abs(b.delta_low), Math.abs(b.delta_high))),
    0.0001,
  );
  const toPct = (d) => 50 + (d / halfMax) * 50;

  return (
    <div style={S.tornadoWrap}>
      <div style={S.tornadoTopRow}>
        <span style={S.tornadoBaseLabel}>{UI.RESULTS_TORNADO_BASE_IRR}</span>
        <strong style={S.tornadoBaseValue}>{fmtPctFromRatio(tornado.base_irr)}</strong>
      </div>
      <div style={S.tornadoRows}>
        {tornado.bars.map((b) => {
          const left = Math.min(b.delta_low, b.delta_high);
          const right = Math.max(b.delta_low, b.delta_high);
          const leftPct = Math.max(0, Math.min(100, toPct(left)));
          const rightPct = Math.max(0, Math.min(100, toPct(right)));
          const mid = (b.delta_low + b.delta_high) / 2;
          const barColor = mid >= 0 ? 'var(--cp-status-success)' : 'var(--cp-status-danger)';
          return (
            <div key={b.param} style={S.tornadoRow}>
              <span style={S.tornadoLabel} title={`±${Math.round(b.range_pct * 100)}%`}>{b.label}</span>
              <span style={{ ...S.tornadoDelta, color: 'var(--cp-status-danger)' }}>{pp(b.delta_low)}</span>
              <div style={S.tornadoTrack}>
                <span style={S.tornadoCenter} />
                <span
                  style={{
                    ...S.tornadoBar,
                    left: `${leftPct}%`,
                    width: `${Math.max(rightPct - leftPct, 0.6)}%`,
                    background: barColor,
                  }}
                />
              </div>
              <span style={{ ...S.tornadoDelta, color: 'var(--cp-status-success)' }}>{pp(b.delta_high)}</span>
              <span style={S.tornadoSwing}>{(b.swing * 100).toFixed(1)} pp</span>
            </div>
          );
        })}
      </div>
      <p style={S.tornadoNote}>{UI.RESULTS_TORNADO_NOTE}</p>
    </div>
  );
});
Tornado.propTypes = {
  tornado: PropTypes.shape({
    base_irr: PropTypes.number,
    bars: PropTypes.array,
  }),
};

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  tornadoEmpty: {
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-muted)',
    padding: 'var(--cp-space-4)',
  },
  tornadoWrap: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)', minWidth: 0 },
  tornadoTopRow: { display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-2)' },
  tornadoBaseLabel: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wide)',
    color: 'var(--cp-text-faint)',
  },
  tornadoBaseValue: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
  },
  tornadoRows: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)' },
  tornadoRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1.4fr) 48px minmax(0, 4fr) 48px 64px',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
  },
  tornadoLabel: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tornadoDelta: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
  },
  tornadoTrack: {
    position: 'relative',
    height: 'var(--cp-space-4)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-xs)',
    minWidth: 0,
  },
  tornadoCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '1px',
    background: 'var(--cp-border-strong)',
  },
  tornadoBar: {
    position: 'absolute',
    top: '20%',
    bottom: '20%',
    borderRadius: 'var(--cp-radius-xs)',
    opacity: 'var(--cp-opacity-dim)',
  },
  tornadoSwing: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-strong)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  tornadoNote: {
    margin: 0,
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-faint)',
    lineHeight: 'var(--cp-leading-snug)',
  },
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
    alignItems: 'stretch',
    gap: 'var(--cp-space-4)',
    padding: 'var(--cp-space-4) var(--cp-space-5)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
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
    lineHeight: 1.05,
    fontWeight: 'var(--cp-weight-bold)',
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
  rcWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
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
    fontWeight: 'var(--cp-weight-bold)',
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
    fontWeight: 'var(--cp-weight-bold)',
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
    padding: 'var(--cp-space-4) var(--cp-space-5)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
  },
  boardMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-xl)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-bold)',
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
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-4) var(--cp-space-5)',
    minWidth: 0,
  },
  layerHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-3)',
    marginBottom: 'var(--cp-space-4)',
    paddingBottom: 'var(--cp-space-3)',
    borderBottom: '1px solid var(--cp-border)',
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
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
  },
  layerRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    flex: 1,
  },
  layerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
    gap: 'var(--cp-space-3)',
    alignItems: 'baseline',
  },
  layerLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  layerValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-bold)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
};
