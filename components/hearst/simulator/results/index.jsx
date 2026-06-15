'use client';

import { memo } from 'react';
import PropTypes from 'prop-types';
import { fmtPctFromRatio, fmtPctRaw, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';
import { DECISION_METRICS } from '@/lib/hearst-results-view';
import { deriveReturnsComposition } from '@/lib/returns-composition';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import InfoHint from '@/components/hearst/InfoHint';
import './results-components.css';

function LabelWithHint({ label, hint, labelClassName = 'res-metric-label', title }) {
  if (!hint && !title) return <span className={labelClassName}>{label}</span>;
  return (
    <span className="res-label-row" title={title}>
      <span className={labelClassName}>{label}</span>
      {hint && <InfoHint id={hint} label={label} />}
    </span>
  );
}
LabelWithHint.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  labelClassName: PropTypes.string,
  title: PropTypes.string,
};

const InlineMetric = memo(function InlineMetric({ label, value, hint }) {
  return (
    <div className="res-inline-metric">
      <LabelWithHint label={label} hint={hint} />
      <strong className="res-inline-metric-value">{value ?? MISSING}</strong>
    </div>
  );
});
InlineMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  hint: PropTypes.string,
};

export const BoardMetric = memo(function BoardMetric({ label, value, note, hint, title }) {
  return (
    <div className="res-board-metric">
      <LabelWithHint label={label} hint={hint} title={title} />
      <strong className="res-board-metric-value">{value ?? MISSING}</strong>
      <span className="res-board-metric-note">{note}</span>
    </div>
  );
});
BoardMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  note: PropTypes.string,
  hint: PropTypes.string,
  title: PropTypes.string,
};

export const CapitalDonut = memo(function CapitalDonut({ segments }) {
  let cursor = 0;
  const gradient = segments.map((s) => {
    const start = cursor;
    const end = cursor + s.pct;
    cursor = end;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div data-capital-donut className="res-donut-wrap">
      <div
        className="res-donut-ring"
        style={{ background: `conic-gradient(${gradient || 'var(--cp-border) 0% 100%'})` }}
      >
        <div className="res-donut-hole">
          <span className="res-donut-hole-label">{UI.RESULTS_DONUT_LABEL}</span>
          <strong className="res-donut-hole-value">{UI.RESULTS_DONUT_VALUE}</strong>
        </div>
      </div>
      <div data-donut-legend className="res-donut-legend">
        {segments.map((s) => (
          <div key={s.label} className="res-donut-legend-row">
            <span className="res-donut-dot" style={{ background: s.color }} />
            <span className="res-donut-legend-label">{s.label}</span>
            <strong className="res-donut-legend-value">{fmtPctRaw(s.pct, 0)} · {fmtUSD(s.value)}</strong>
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

export const CapitalStructureGrid = memo(function CapitalStructureGrid({ projection, scenario }) {
  const occupancy = scenario?.target_occupancy_pct != null
    ? fmtPctRaw(scenario.target_occupancy_pct)
    : MISSING;
  const exitYear = scenario?.exit_year
    ? UI.RESULTS_IM_EXIT_YEAR(scenario.exit_year)
    : MISSING;

  return (
    <div data-structure-rows>
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

const DecisionKpiCell = memo(function DecisionKpiCell({ label, value, sub, hint, title }) {
  return (
    <div className="res-kpi-cell">
      <LabelWithHint label={label} hint={hint} title={title} />
      <strong data-kpi-value title={value ?? undefined}>{value ?? MISSING}</strong>
      {sub ? <span className="res-kpi-sub">{sub}</span> : null}
    </div>
  );
});
DecisionKpiCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  sub: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  hint: PropTypes.string,
  title: PropTypes.string,
};

export const DecisionHeader = memo(function DecisionHeader({ projection }) {
  const capital = fmtUSD(projection?.total_capex);
  const irr = DECISION_METRICS.find((m) => m.id === 'irr');
  const moic = DECISION_METRICS.find((m) => m.id === 'moic');

  const irrVal = projection?.irr_post_tax ?? projection?.irr;
  let irrDeltaSub = irr?.subValue?.(projection);

  if (irrVal != null) {
    const hurdle = FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100;
    const bps = Math.round((irrVal - hurdle) * 10000);
    const sign = bps > 0 ? '+' : '';
    irrDeltaSub = (
      <span className="res-kpi-delta">
        <span>{irrDeltaSub}</span>
        <span className="res-kpi-delta-badge" data-tone={bps >= 0 ? 'ok' : 'warn'}>
          {sign}{bps}bps vs hurdle
        </span>
      </span>
    );
  }

  return (
    <div data-decision-header>
      <div data-decision-kpis>
        <DecisionKpiCell label={UI.RESULTS_DM_IRR} value={irr?.value(projection)} sub={irrDeltaSub} hint="irr" title="Internal Rate of Return (Post-tax). The discount rate that makes the net present value of all cash flows equal to zero." />
        <DecisionKpiCell label={UI.RESULTS_KPI_MOIC} value={moic?.value(projection)} sub={moic?.subValue?.(projection)} hint="moic" title="Multiple on Invested Capital. Total cash returned divided by total equity invested." />
        <DecisionKpiCell label={UI.RESULTS_KPI_CAPITAL} value={capital} hint="capex" title="Peak Capital Required. Maximum negative cash flow before the project becomes cash-flow positive." />
      </div>
    </div>
  );
});
DecisionHeader.propTypes = {
  projection: PropTypes.object,
};

export const RiskInline = memo(function RiskInline({ projection }) {
  const warnings = projection?.warnings || [];
  if (warnings.length === 0) return null;

  return (
    <div data-risk-inline>
      {warnings.map((w, i) => (
        <div key={i} className="res-risk-item">
          <span className="res-risk-icon" aria-hidden="true">⚠</span>
          <span>{w}</span>
        </div>
      ))}
    </div>
  );
});

export const ReturnsComposition = memo(function ReturnsComposition({ projection }) {
  const c = deriveReturnsComposition(projection);
  const hasSplit = c.available && c.operationsPct != null && c.terminalPct != null;
  if (!hasSplit) return null;

  const terminalPct = Math.round(c.terminalPct * 100);

  return (
    <div data-returns-note>
      Returns are {terminalPct}% terminal-value dependent.
    </div>
  );
});
ReturnsComposition.propTypes = {
  projection: PropTypes.object,
};

export const LayerCard = memo(function LayerCard({ index, title, rows }) {
  return (
    <div className="res-layer-card">
      <div className="res-layer-head">
        <span className="res-layer-index">{index}</span>
        <h3 className="res-layer-title">{title}</h3>
      </div>
      <div className="res-layer-rows">
        {rows.map(([label, value, rowTitle]) => (
          <div key={label} className="res-layer-row">
            <span className="res-layer-label" title={rowTitle}>{label}</span>
            <strong className="res-layer-value">{value ?? MISSING}</strong>
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
