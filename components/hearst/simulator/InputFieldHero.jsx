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
      { key: 'return', label: UI.SIM_RESULT_RETURN, value: irr != null ? fmtPctFromRatio(irr) : MISSING },
    ];
  }
  if (mode === 'mw_first') {
    return [
      { key: 'budget', label: UI.SIM_RESULT_BUDGET, value: capex != null ? fmtUSD(capex) : MISSING },
      { key: 'return', label: UI.SIM_RESULT_RETURN, value: irr != null ? fmtPctFromRatio(irr) : MISSING },
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
        {/* Driven field — the one number the user controls */}
        <div style={S.fieldCol}>
          <div style={S.choiceTag} title={`${UI.SIM_YOUR_CHOICE} · ${cfg.label}`}>
            {UI.SIM_YOUR_CHOICE} · {cfg.label}
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
          <div style={S.desc}>{cfg.description}</div>
        </div>

        {/* Computed results — the two quantities the engine derives */}
        <div data-brief-results style={S.resultsCol} className="cp-surface-accent-soft">
          <div style={S.resultsTag}>{UI.SIM_COMPUTED}</div>
          <div style={S.resultsGrid}>
            {results.map((r) => (
              <div key={r.key} style={S.resultItem}>
                <span style={S.resultLabel}>{r.label}</span>
                <strong style={S.resultValue}>{r.value}</strong>
              </div>
            ))}
          </div>
          <div style={S.solverNoteSlot} aria-live="polite">
            <span style={solverNote ? S.solverNote : S.solverNoteGhost}>
              {solverNote || '\u00a0'}
            </span>
          </div>
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
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
    gap: 'var(--cp-space-5)',
    alignItems: 'stretch',
    minHeight: 'var(--cp-sim-hero-row-min, 11.5rem)',
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    justifyContent: 'flex-start',
    minWidth: 0,
    minHeight: '100%',
  },
  choiceTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-accent-maroon)',
    textTransform: 'uppercase',
    minHeight: '2.75em',
    lineHeight: 'var(--cp-leading-tight)',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    paddingBottom: 'var(--cp-space-2)',
    borderBottom: '2px solid var(--cp-border-accent)',
    minHeight: 'var(--cp-space-12)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 'var(--cp-display-input)',
    lineHeight: 'var(--cp-space-12)',
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
    fontSize: 'var(--cp-display-unit)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
  },
  desc: {
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-muted)',
    minHeight: 'calc(var(--cp-leading-tight) * 2 * 1em)',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  // Computed-results panel — flat accent-soft band (no nested card), riveted right.
  resultsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-4)',
    borderRadius: 'var(--cp-radius-md)',
    minWidth: 0,
    minHeight: '100%',
  },
  resultsTag: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  resultsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
  },
  resultLabel: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
  },
  resultValue: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
  },
  solverNoteSlot: {
    minHeight: 'calc(var(--cp-leading-tight) * 2 * 1em)',
    marginTop: 'auto',
    flexShrink: 0,
  },
  solverNote: {
    display: 'block',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-muted)',
  },
  solverNoteGhost: {
    display: 'block',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'transparent',
    userSelect: 'none',
  },
};
