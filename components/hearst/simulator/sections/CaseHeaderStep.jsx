'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { fmtUSD, fmtPctRaw, fmtMW } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';

const ARCH_LABEL = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a.label]));

function prettyGeo(g) {
  if (!g) return null;
  return String(g).charAt(0).toUpperCase() + String(g).slice(1);
}

const MODE_LABEL = {
  mw_first: "Capacity Constraint",
  capital_first: "Capital Constraint",
  target_irr_first: "Return Target",
};

export default function CaseHeaderStep({ archetypeId, geography, totalMw, mode, scenario, projection }) {
  const model = ARCH_LABEL[archetypeId] || archetypeId;
  const geo = prettyGeo(geography);
  
  const capex = scenario?.total_capex_usd;
  const irr = projection?.return_metrics?.irr_pct;
  const capacity = scenario?.total_mw || totalMw;
  const constraint = MODE_LABEL[mode] || mode;

  return (
    <Card as="section" data-sim-case variant="card" surface={1} padding="lg" style={S.case}>
      <span style={S.eyebrow}>INVESTMENT CASE</span>
      
      <div style={S.narrative}>
        <h1 className="sim-case-sentence" style={S.sentence}>
          Deploy <strong>{capex ? fmtUSD(capex) : UI.STATE_CALCULATING}</strong> into a <strong>{model}</strong> in <strong>{geo}</strong> targeting <strong>{irr != null ? fmtPctRaw(irr, 1) : UI.STATE_CALCULATING}</strong> IRR.
        </h1>
        <div style={S.meta}>
          <span>{capacity != null ? fmtMW(capacity, 0) : UI.STATE_CALCULATING} Capacity</span>
          <span style={S.dot}>•</span>
          <span>Driven by {constraint}</span>
        </div>
      </div>
    </Card>
  );
}

CaseHeaderStep.propTypes = {
  archetypeId: PropTypes.string,
  geography: PropTypes.string,
  totalMw: PropTypes.number,
  mode: PropTypes.string,
  scenario: PropTypes.object,
  projection: PropTypes.object,
};

const S = {
  case: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  eyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    opacity: 'var(--cp-opacity-subtle)',
  },
  narrative: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  sentence: {
    margin: 0,
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-hero-h1)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-medium)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-medium)',
  },
  dot: {
    opacity: 'var(--cp-opacity-ghost)',
  },
};
