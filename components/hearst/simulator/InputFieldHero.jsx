'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, MISSING } from '@/lib/hearst-format';
import './simulator-config.css';

const MODE_CONFIG = {
  capital_first: {
    label: UI.SIM_FIELD_BUDGET_LABEL,
    unit: UI.SIM_MODE_BUDGET_UNIT,
    placeholder: UI.SIM_FIELD_BUDGET_PLACEHOLDER,
    parseValue: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0,
    formatValue: (v) => (!v ? '' : v.toLocaleString('en-US')),
  },
  mw_first: {
    label: UI.SIM_FIELD_SIZE_LABEL,
    unit: UI.SIM_MODE_SIZE_UNIT,
    placeholder: UI.SIM_FIELD_SIZE_PLACEHOLDER,
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
  target_irr_first: {
    label: UI.SIM_FIELD_RETURN_LABEL,
    unit: UI.SIM_MODE_RETURN_UNIT,
    placeholder: UI.SIM_FIELD_RETURN_PLACEHOLDER,
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
};

function computedResults(mode, { projection, scenario, derived, solver }) {
  const mw = derived?.mw ?? scenario?.total_mw;
  const capex = projection?.total_capex;
  const irr = projection?.irr;

  if (mode === 'capital_first') {
    return [
      { key: 'size', label: UI.SIM_RESULT_SIZE, value: mw != null ? fmtMW(mw, 0) : MISSING },
      { key: 'return', label: UI.SIM_RESULT_RETURN, note: UI.SIM_RESULT_RETURN_NOTE, value: irr != null ? fmtPctFromRatio(irr) : MISSING },
    ];
  }
  if (mode === 'mw_first') {
    return [
      { key: 'budget', label: UI.SIM_RESULT_BUDGET, value: capex != null ? fmtUSD(capex) : MISSING },
      { key: 'return', label: UI.SIM_RESULT_RETURN, note: UI.SIM_RESULT_RETURN_NOTE, value: irr != null ? fmtPctFromRatio(irr) : MISSING },
    ];
  }
  const solvedMw = solver?.converged && derived?.lever === 'mw' ? solver.lever_value : null;
  return [
    { key: 'size', label: UI.SIM_RESULT_SIZE, value: solvedMw != null ? fmtMW(solvedMw, 0) : (scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING) },
    { key: 'budget', label: UI.SIM_RESULT_BUDGET, value: capex != null ? fmtUSD(capex) : MISSING },
  ];
}

export default function InputFieldHero({
  mode,
  value,
  onChange,
  projection,
  scenario,
  derived,
  solver,
  projectionStale = false,
  loading = false,
}) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.mw_first;
  const results = computedResults(mode, { projection, scenario, derived, solver });
  const stale = projectionStale || loading;
  const noSolution = mode === 'target_irr_first' && solver && !solver.converged;

  const solverNote = noSolution
    ? UI.SIM_SOLVER_NO_SOLUTION
    : (mode === 'target_irr_first' && solver?.converged && solver?.iterations != null
      ? UI.SIM_SOLVER_SOLVED(solver.iterations)
      : null);

  return (
    <div data-sim-input-hero>
      <div data-brief-bar-row data-embedded="true">
        <div className="sim-input-primary">
          <div className="sim-input-field-head">
            <span className="sim-input-field-label">{cfg.label}</span>
          </div>
          <div className="sim-input-field-row">
            <input
              type="text"
              className="sim-input-field-value"
              value={cfg.formatValue(value)}
              onChange={(e) => onChange?.(cfg.parseValue(e.target.value))}
              placeholder={cfg.placeholder}
              aria-label={cfg.label}
            />
            <span className="sim-input-field-unit">{cfg.unit}</span>
          </div>
        </div>

        <div
          data-brief-results
          data-stale={stale ? 'true' : undefined}
          aria-busy={loading || undefined}
        >
          <span className="sim-input-results-heading">{UI.SIM_COMPUTED}</span>
          <div className="sim-input-results-grid">
            {results.map((r) => (
              <div key={r.key} className="sim-input-result-item">
                <div className="sim-input-result-label-col">
                  <span className="sim-input-result-label">{r.label}</span>
                  {r.note ? <span className="sim-input-result-note">{r.note}</span> : null}
                </div>
                <strong className="sim-input-result-value">
                  {stale ? UI.SIM_RESULT_PENDING : r.value}
                </strong>
              </div>
            ))}
          </div>
          {solverNote && !stale ? (
            <div className="sim-input-solver-note" aria-live="polite">
              {solverNote}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

InputFieldHero.propTypes = {
  mode: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  projection: PropTypes.object,
  scenario: PropTypes.object,
  derived: PropTypes.object,
  solver: PropTypes.object,
  projectionStale: PropTypes.bool,
  loading: PropTypes.bool,
};
