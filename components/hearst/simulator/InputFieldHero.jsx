'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, MISSING } from '@/lib/hearst-format';

// Per-mode config for the driven field (label / unit / placeholder / parse / format).
// Strings come from UI.* — no hardcoded copy. No invented numbers: every computed
// result is read from the live simResult, never derived in the UI.
const MODE_CONFIG = {
  capital_first: {
    label: UI.SIM_FIELD_BUDGET_LABEL,
    unit: UI.SIM_MODE_BUDGET_UNIT,
    placeholder: UI.SIM_FIELD_BUDGET_PLACEHOLDER,
    description: UI.SIM_FIELD_BUDGET_DESC,
    parseValue: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0,
    formatValue: (v) => (!v ? '' : v.toLocaleString('en-US')),
  },
  mw_first: {
    label: UI.SIM_FIELD_SIZE_LABEL,
    unit: UI.SIM_MODE_SIZE_UNIT,
    placeholder: UI.SIM_FIELD_SIZE_PLACEHOLDER,
    description: UI.SIM_FIELD_SIZE_DESC,
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
  target_irr_first: {
    label: UI.SIM_FIELD_RETURN_LABEL,
    unit: UI.SIM_MODE_RETURN_UNIT,
    placeholder: UI.SIM_FIELD_RETURN_PLACEHOLDER,
    description: UI.SIM_FIELD_RETURN_DESC,
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
};

// The two quantities the engine computes for the active mode. All values are read
// from the live simResult (projection/scenario/derived/solver) — never invented.
// Returns [{ key, label, value }, ...] or [] when nothing is computed yet.
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
  // target_irr_first — the solver may not converge; show MISSING then, never a fake number.
  // The lever lives on `derived` (not `solver`); when it's 'mw' the solved size is lever_value.
  const solvedMw = solver?.converged && derived?.lever === 'mw' ? solver.lever_value : null;
  return [
    { key: 'size', label: UI.SIM_RESULT_SIZE, value: solvedMw != null ? fmtMW(solvedMw, 0) : (scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING) },
    { key: 'budget', label: UI.SIM_RESULT_BUDGET, value: capex != null ? fmtUSD(capex) : MISSING },
  ];
}

/**
 * InputFieldHero — the driven number for the active mode, with the two other
 * quantities shown as engine-computed results riveted to its right (stacked below
 * on mobile). Layout only: all numbers come from the live simResult.
 */
export default function InputFieldHero({ mode, value, onChange, projection, scenario, derived, solver, embedded = false }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.mw_first;
  const results = computedResults(mode, { projection, scenario, derived, solver });
  const noSolution = mode === 'target_irr_first' && solver && !solver.converged;

  const solverNote = noSolution
    ? UI.SIM_SOLVER_NO_SOLUTION
    : (mode === 'target_irr_first' && solver?.converged && solver?.iterations != null
      ? UI.SIM_SOLVER_SOLVED(solver.iterations)
      : null);

  const body = (
      <div data-brief-bar-row style={S.row}>
        <div style={S.fieldCol}>
          <div style={S.fieldHead}>
            <span style={S.choiceTag} title={`${UI.SIM_YOUR_CHOICE} · ${cfg.label}`}>
              {cfg.label}
            </span>
            <span style={S.desc}>{cfg.description}</span>
          </div>
          <div style={S.inputRow}>
            <input
              type="text"
              value={cfg.formatValue(value)}
              onChange={(e) => onChange?.(cfg.parseValue(e.target.value))}
              placeholder={cfg.placeholder}
              style={S.input}
            />
            <span style={S.unit}>{cfg.unit}</span>
          </div>
        </div>

        <div data-brief-results style={S.resultsCol}>
          <div style={S.resultsTag}>{UI.SIM_COMPUTED}</div>
          <div style={S.resultsGrid}>
            {results.map((r) => (
              <div key={r.key} style={S.resultItem}>
                <div style={S.resultLabelCol}>
                  <span style={S.resultLabel}>{r.label}</span>
                  {r.note ? <span style={S.resultNote}>{r.note}</span> : null}
                </div>
                <strong style={S.resultValue}>{r.value}</strong>
              </div>
            ))}
          </div>
          {solverNote ? (
            <div style={S.solverNoteSlot} aria-live="polite">
              <span style={S.solverNote}>{solverNote}</span>
            </div>
          ) : null}
        </div>
      </div>
  );

  if (embedded) {
    return <div data-sim-input-hero style={S.bar}>{body}</div>;
  }

  return (
    <Card surface={0} padding="lg" style={S.bar}>
      {body}
    </Card>
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
  embedded: PropTypes.bool,
};

const S = {
  bar: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-surface-1)',
    overflow: 'hidden',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 200px)',
    alignItems: 'stretch',
    minWidth: 0,
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    justifyContent: 'center',
    minWidth: 0,
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    borderRight: '1px solid var(--cp-border)',
  },
  fieldHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
  },
  choiceTag: {
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-accent-maroon)',
    textTransform: 'uppercase',
    lineHeight: 'var(--cp-leading-none)',
    flexShrink: 0,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-1)',
    minHeight: 'auto',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 'var(--cp-font-fluid-input)',
    lineHeight: 'var(--cp-leading-snug)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    minWidth: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  unit: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
  },
  desc: {
    fontSize: 'var(--cp-font-nano)',
    lineHeight: 'var(--cp-leading-heading)',
    color: 'var(--cp-text-faint)',
    textAlign: 'right',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resultsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    minWidth: 0,
    background: 'var(--cp-surface-2)',
    justifyContent: 'center',
  },
  resultsTag: {
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    lineHeight: 'var(--cp-leading-none)',
  },
  resultsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-hair)',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-2)',
  },
  resultLabelCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    minWidth: 0,
  },
  resultLabel: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
    lineHeight: 'var(--cp-leading-heading)',
  },
  resultNote: {
    fontSize: 'var(--cp-font-nano)',
    lineHeight: 'var(--cp-leading-none)',
    color: 'var(--cp-text-muted)',
    opacity: 'var(--cp-opacity-tertiary)',
  },
  resultValue: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
  },
  solverNoteSlot: {
    minHeight: 'auto',
    marginTop: 'var(--cp-space-hair)',
    flexShrink: 0,
  },
  solverNote: {
    display: 'block',
    fontSize: 'var(--cp-font-nano)',
    lineHeight: 'var(--cp-leading-none)',
    color: 'var(--cp-text-muted)',
  },
};
