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
 * CaseHeaderStep — THE CASE. The single mental object the page is built around:
 * the live scenario read as an investment case, not a configuration. Pure
 * regrouping of existing values — archetype label, MW, geography, capex, IRR —
 * promoted above every editor so the case is visible before its parameters.
 *
 * No engine, solver, calculation or new data: every value is read straight off
 * the live projection/scenario/state that the page already holds.
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

  const identity = [
    mw != null ? fmtMW(mw, 0) : null,
    geo,
  ].filter(Boolean).join(' · ');

  return (
    <Card as="section" data-sim-case variant="card" surface={1} padding="lg" style={S.case}>
      <span style={S.eyebrow}>{UI.SIM_CASE_EYEBROW}</span>

      <div data-sim-case-grid style={S.grid}>
        {/* Identity — what this investment IS */}
        <div data-sim-case-identity style={S.identity}>
          <span data-sim-case-model style={S.model}>{model}</span>
          {identity && <span style={S.sub}>{identity}</span>}
        </div>

        {/* The two headline numbers — capital in, return out */}
        <div style={S.metric}>
          <span style={S.metricLabel}>{UI.SIM_CASE_CAPITAL_LABEL}</span>
          <strong style={S.metricValue}>{capital != null ? fmtUSD(capital) : MISSING}</strong>
        </div>
        <div style={S.metric}>
          <span style={S.metricLabel}>{UI.SIM_CASE_RETURN_LABEL}</span>
          <strong style={S.metricValue}>{irr != null ? fmtPctFromRatio(irr) : MISSING}</strong>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr)',
    alignItems: 'center',
    gap: 'var(--cp-space-6)',
  },
  identity: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 0,
  },
  model: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(26px, 3vw, 40px)',
    lineHeight: 1.05,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  sub: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    fontVariantNumeric: 'tabular-nums',
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
    fontSize: 'clamp(24px, 2.6vw, 34px)',
    lineHeight: 1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
};
