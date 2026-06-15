'use client';

import PropTypes from 'prop-types';
import { Button } from '@/components/hearst/ui';
import { PROJECT_TIMELINE_DEFAULTS } from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, fmtX, MISSING } from '@/lib/hearst-format';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';

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
}) {
  const capacity = scenario?.total_mw ?? state.total_mw;
  const capex = projection?.total_capex ?? scenario?.total_capex_usd ?? state.capital_usd;
  const irr = projection?.irr ?? projection?.return_metrics?.irr;
  const moic = projection?.moic;
  const npv = projection?.npv ?? projection?.return_metrics?.npv;

  const meta = PRESET_META[state.primary_archetype_id];

  return (
    <div className="hw-screen">
      <h1 className="hw-screen-title">
        {UI.SIM_CASE_VERB} <strong>{fmtUSD(capex)}</strong> {UI.SIM_CASE_INTO}{' '}
        <strong>{fmtMW(capacity, 0)}</strong> {UI.SIM_CASE_IN_QATAR_WITH}{' '}
        <strong>{selectedArchetype?.label || state.primary_archetype_id}</strong>
      </h1>

      <div className="hw-screen-metrics">
        <div className="hw-metric">
          <div className="hw-metric-label">{UI.SIM_RESULT_RETURN}</div>
          <div className="hw-metric-value">{irr != null ? fmtPctFromRatio(irr) : MISSING}</div>
        </div>
        
        <div className="hw-metric">
          <div className="hw-metric-label">{UI.SIM_METRIC_CAPITAL}</div>
          <div className="hw-metric-value">{fmtUSD(capex)}</div>
        </div>

        <div className="hw-metric">
          <div className="hw-metric-label">Risk Profile</div>
          <div className="hw-metric-value" style={{ color: '#00ffcc', textShadow: '0 0 8px rgba(0,255,204,0.4)' }}>
            {meta ? LEVEL_LABEL[meta.risk] : MISSING}
          </div>
        </div>

        <div className="hw-metric">
          <div className="hw-metric-label">NPV</div>
          <div className="hw-metric-value">{npv != null ? fmtUSD(npv) : (moic != null ? `${fmtX(moic)}x` : MISSING)}</div>
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
