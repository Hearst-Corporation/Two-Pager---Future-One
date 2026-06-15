'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, fmtX, MISSING } from '@/lib/hearst-format';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';

export default function InvestmentCaseSurface({
  state,
  scenario,
  projection,
  selectedArchetype,
}) {
  const capacity = scenario?.total_mw ?? state.total_mw;
  const capex = projection?.total_capex ?? scenario?.total_capex_usd ?? state.capital_usd;
  const irr = projection?.irr ?? projection?.return_metrics?.irr;
  const moic = projection?.moic;
  const npv = projection?.npv ?? projection?.return_metrics?.npv;

  const meta = PRESET_META[state.primary_archetype_id];

  return (
    <div data-sim-case-surface className="is-assembling del-1">
      <div className="sim-surface-bg-grid" />
      <div className="sim-surface-content">
        <div data-sim-case-copy>
          <h1>
            {UI.SIM_CASE_VERB} <strong>{fmtUSD(capex)}</strong> {UI.SIM_CASE_INTO}{' '}
            <strong>{fmtMW(capacity, 0)}</strong> {UI.SIM_CASE_IN_QATAR_WITH}{' '}
            <strong>{selectedArchetype?.label || state.primary_archetype_id}</strong>
          </h1>
          <p>{meta?.tagline ? `${meta.tagline}. ` : ''}{UI.SIM_PAGE_SUBTITLE}</p>
        </div>

        <div data-sim-case-metrics>
          <div data-sim-metric-tile>
            <span>{UI.SIM_RESULT_RETURN}</span>
            <strong>{irr != null ? fmtPctFromRatio(irr) : MISSING}</strong>
          </div>
          <div data-sim-metric-tile>
            <span>{UI.SIM_METRIC_CAPITAL}</span>
            <strong>{fmtUSD(capex)}</strong>
          </div>
          <div data-sim-metric-tile>
            <span>{UI.SIM_METRIC_RISK_PROFILE}</span>
            <strong>{meta ? LEVEL_LABEL[meta.risk] : MISSING}</strong>
          </div>
          <div data-sim-metric-tile>
            <span>{UI.SIM_METRIC_NPV}</span>
            <strong>{npv != null ? fmtUSD(npv) : (moic != null ? `${fmtX(moic)}x` : MISSING)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

InvestmentCaseSurface.propTypes = {
  state: PropTypes.object.isRequired,
  scenario: PropTypes.object,
  projection: PropTypes.object,
  selectedArchetype: PropTypes.object,
};
