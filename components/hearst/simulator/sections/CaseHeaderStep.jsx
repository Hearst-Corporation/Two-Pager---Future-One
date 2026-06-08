'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { fmtUSD, fmtMW, fmtPctFromRatio, MISSING } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';

const ARCH_LABEL = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a.label]));

// Presentation-only: "qatar" → "Qatar". Never invents a value.
function prettyGeo(g) {
  if (!g) return null;
  return String(g).charAt(0).toUpperCase() + String(g).slice(1);
}

/**
 * CaseHeaderStep — THE CASE. The single mental object: the live scenario read as
 * an investment decision, stated as one sentence — "Deploy $798M into a Government
 * AI Cluster in Qatar" — with Expected Return and Capacity beneath it.
 *
 * Pure regrouping of existing live values (archetype label, capex, IRR, MW,
 * geography). No engine, solver, calculation or new data.
 *
 * @param {{ archetypeId: string, geography: string, scenario: object|null,
 *           projection: object|null, totalMw: number }} props
 */
export default function CaseHeaderStep({ archetypeId, geography, scenario, projection, totalMw }) {
  const model = ARCH_LABEL[archetypeId] || archetypeId;
  const mw = scenario?.total_mw ?? totalMw;
  const geo = prettyGeo(geography);
  const capital = projection?.total_capex;
  const irr = projection?.irr;

  // The case as a single board-readable sentence. Falls back to a "size it"
  // prompt when capital is not computed yet — never prints a fake number.
  const sentence = capital != null
    ? UI.SIM_CASE_DEPLOY_INTO(fmtUSD(capital), model, geo)
    : UI.SIM_CASE_DEPLOY_NEEDS_INPUT(model, geo);

  return (
    <Card as="section" data-sim-case variant="card" surface={1} padding="lg" style={S.case}>
      <span style={S.eyebrow}>{UI.SIM_CASE_EYEBROW}</span>

      <h1 data-sim-case-sentence style={S.sentence}>{sentence}</h1>

      <div data-sim-case-grid style={S.grid}>
        <div style={S.metric}>
          <span style={S.metricLabel}>{UI.SIM_CASE_RETURN_LABEL}</span>
          <strong style={S.metricValue}>{irr != null ? fmtPctFromRatio(irr) : MISSING}</strong>
        </div>
        <div style={S.metric}>
          <span style={S.metricLabel}>{UI.SIM_CASE_CAPACITY_LABEL}</span>
          <strong style={S.metricValue}>{mw != null ? fmtMW(mw, 0) : MISSING}</strong>
        </div>
        <div style={S.metric}>
          <span style={S.metricLabel}>{UI.SIM_CASE_CAPITAL_LABEL}</span>
          <strong style={S.metricValue}>{capital != null ? fmtUSD(capital) : MISSING}</strong>
        </div>
      </div>
    </Card>
  );
}

CaseHeaderStep.propTypes = {
  archetypeId: PropTypes.string,
  geography: PropTypes.string,
  scenario: PropTypes.object,
  projection: PropTypes.object,
  totalMw: PropTypes.number,
};

const S = {
  case: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  eyebrow: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  sentence: {
    margin: 0,
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(19px, 1.9vw, 26px)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    alignItems: 'start',
    gap: 'var(--cp-space-6)',
    paddingTop: 'var(--cp-space-2)',
    borderTop: '1px solid var(--cp-border)',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 0,
  },
  metricLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(18px, 1.8vw, 24px)',
    lineHeight: 1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
};
