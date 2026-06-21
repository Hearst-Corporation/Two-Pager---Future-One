'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, MISSING } from '@/lib/hearst-format';

// The two quantities the engine computes for the active mode. All values are read
// from the live simResult (projection/scenario/derived/solver) — never invented.
// Returns [{ key, label, value, note? }, ...] or [] when nothing is computed yet.
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
 * InvestmentResultSummary — displays the quantities the engine computes for the
 * active mode (Size / Budget / IRR). Separated from the config card so investors
 * see "what I configure" and "what the engine calculates" as two distinct blocks.
 *
 * Props:
 *   mode       — active solver mode ('capital_first' | 'mw_first' | 'target_irr_first')
 *   projection — simResult.projection (live, from /api/simulate)
 *   scenario   — simResult.scenario
 *   derived    — simResult.derived
 *   solver     — simResult.solver
 *   loading    — boolean; true while /simulate is in flight
 *   children   — rendered at the bottom (CTA slot, e.g. Generate Memo button)
 */
export default function InvestmentResultSummary({ mode, projection, scenario, derived, solver, loading, children }) {
  const results = computedResults(mode, { projection, scenario, derived, solver });
  const noSolution = mode === 'target_irr_first' && solver && !solver.converged;

  const solverNote = noSolution
    ? UI.SIM_SOLVER_NO_SOLUTION
    : (mode === 'target_irr_first' && solver?.converged && solver?.iterations != null
      ? UI.SIM_SOLVER_SOLVED(solver.iterations)
      : null);

  return (
    <Card
      data-sim-result-summary
      variant="card"
      surface={1}
      padding="lg"
      style={S.card}
    >
      {/* Header */}
      <div style={S.header}>
        <span style={S.eyebrow}>{UI.SIM_RESULT_SUMMARY_EYEBROW}</span>
        <span style={S.title}>{UI.SIM_RESULT_SUMMARY_TITLE}</span>
      </div>

      {/* Results grid */}
      <div
        data-brief-results
        style={S.resultsPanel}
        className="cp-surface-accent-soft"
        aria-busy={loading || undefined}
      >
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

        {/* Solver convergence note (target_irr_first only) */}
        <div style={S.solverNoteSlot} aria-live="polite">
          <span style={solverNote ? S.solverNote : S.solverNoteGhost}>
            {solverNote || ' '}
          </span>
        </div>
      </div>

      {/* CTA slot — e.g. Generate Memo button + hint passed as children */}
      {children ? (
        <div data-sim-result-footer style={S.footer}>
          {children}
        </div>
      ) : null}
    </Card>
  );
}

InvestmentResultSummary.propTypes = {
  mode: PropTypes.string.isRequired,
  projection: PropTypes.object,
  scenario: PropTypes.object,
  derived: PropTypes.object,
  solver: PropTypes.object,
  loading: PropTypes.bool,
  children: PropTypes.node,
};

const S = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  title: {
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-primary)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  resultsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-4)',
    borderRadius: 'var(--cp-radius-md)',
    minWidth: 0,
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
  resultLabelCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-0)',
    minWidth: 0,
  },
  resultLabel: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
  },
  resultNote: {
    fontSize: 'var(--cp-font-micro)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-muted)',
    opacity: 'var(--cp-opacity-dim)',
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
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    paddingTop: 'var(--cp-space-4)',
    borderTop: '1px solid var(--cp-border-base)',
  },
};
