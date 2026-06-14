'use client';

import PropTypes from 'prop-types';
import { Button } from '@/components/hearst/ui';
import { PROJECT_TIMELINE_DEFAULTS } from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, fmtX, MISSING } from '@/lib/hearst-format';

function MetricTile({ label, value }) {
  return (
    <div data-sim-metric-tile>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

MetricTile.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};

export default function InvestmentCaseSurface({
  state,
  scenario,
  projection,
  selectedArchetype,
  validateBlocked,
  validateLabel,
  onValidate,
}) {
  const capacity = scenario?.total_mw ?? state.total_mw;
  const capex = projection?.total_capex ?? scenario?.total_capex_usd ?? state.capital_usd;
  const irr = projection?.irr ?? projection?.return_metrics?.irr;
  const moic = projection?.moic;
  const startYear = scenario?.start_year ?? PROJECT_TIMELINE_DEFAULTS.start_year;
  const codOffsetMonths = scenario?.cod_offset_months ?? 30;
  const codYear = startYear + Math.ceil(codOffsetMonths / 12);
  const exitYear = startYear + (scenario?.exit_year ?? 10) - 1;

  return (
    <div data-sim-case-surface>
      <div data-sim-case-copy>
        <span data-sim-kicker>{UI.SIM_PAGE_EYEBROW}</span>
        <h1>
          {UI.SIM_CASE_VERB} <strong>{fmtUSD(capex)}</strong> {UI.SIM_CASE_INTO}{' '}
          <strong>{fmtMW(capacity, 0)}</strong> {UI.SIM_CASE_IN_QATAR_WITH}{' '}
          <strong>{selectedArchetype?.label || state.primary_archetype_id}</strong>
        </h1>
        <p>{UI.SIM_PAGE_SUBTITLE}</p>
      </div>

      <div data-sim-case-metrics>
        <MetricTile label={UI.SIM_RESULT_RETURN} value={irr != null ? fmtPctFromRatio(irr) : MISSING} />
        <MetricTile label={UI.SIM_METRIC_CAPITAL} value={fmtUSD(capex)} />
        <MetricTile label={UI.SIM_METRIC_CAPACITY} value={fmtMW(capacity, 0)} />
        <MetricTile label={UI.SIM_METRIC_MOIC} value={fmtX(moic)} />
      </div>

      <div data-sim-case-timeline>
        <div data-sim-timeline-rail>
          <span />
          <span />
          <span />
        </div>
        <div data-sim-timeline-labels>
          <div><strong>{startYear}</strong><span>{UI.SIM_TIMELINE_START}</span></div>
          <div><strong>{codYear}</strong><span>{UI.SIM_TIMELINE_COD}</span></div>
          <div><strong>{exitYear}</strong><span>{UI.SIM_TIMELINE_EXIT}</span></div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        disabled={validateBlocked}
        onClick={onValidate}
        className="sim-hero-cta"
      >
        {validateLabel}
      </Button>
    </div>
  );
}

InvestmentCaseSurface.propTypes = {
  state: PropTypes.object.isRequired,
  scenario: PropTypes.object,
  projection: PropTypes.object,
  selectedArchetype: PropTypes.object,
  validateBlocked: PropTypes.bool,
  validateLabel: PropTypes.string,
  onValidate: PropTypes.func,
};
