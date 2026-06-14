'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { fmtUSD, fmtPctRaw, fmtMW } from '@/lib/hearst-format';

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

// What the user is actively setting, by mode. This is the live object the page
// exists to move — it leads the header, large, instead of a passive case summary.
const DRIVER_LABEL = {
  mw_first: 'Capacity',
  capital_first: 'Capital',
  target_irr_first: 'Target return',
};

export default function CaseHeaderStep({ archetypeId, geography, totalMw, mode, scenario, projection }) {
  const model = ARCH_LABEL[archetypeId] || archetypeId;
  const geo = prettyGeo(geography);

  const capex = scenario?.total_capex_usd;
  const irr = projection?.return_metrics?.irr_pct;
  const capacity = scenario?.total_mw || totalMw;
  const constraint = MODE_LABEL[mode] || mode;

  // The driven value = the number the active mode puts in the user's hands.
  // Capacity (MW) is the universally-available driver; capital/IRR refine it.
  const driverLabel = DRIVER_LABEL[mode] || 'Capacity';
  const driverValue =
    mode === 'capital_first'
      ? (capex != null ? fmtUSD(capex) : capacity != null ? fmtMW(capacity, 0) : null)
      : (capacity != null ? fmtMW(capacity, 0) : null);

  return (
    <Card as="section" data-sim-case variant="card" surface={1} padding="sm" style={S.case}>
      {/* LIVE OBJECT — what am I changing: the driven value, large, leads. */}
      <div style={S.leadRow}>
        <div style={S.driver}>
          <span style={S.driverLabel}>{driverLabel}</span>
          <span style={S.driverValue}>{driverValue ?? '—'}</span>
        </div>
        <div style={S.context}>
          <span style={S.contextModel}>{model}</span>
          <span style={S.dot}>·</span>
          <span>{geo || '—'}</span>
          <span style={S.dot}>·</span>
          <span style={S.constraint}>{constraint}</span>
        </div>
      </div>
      {/* IMMEDIATE CONSEQUENCE — what it implies: projected IRR, or an explicit
          awaiting state rather than a bare em-dash. */}
      <p className="sim-case-sentence" style={S.implies}>
        <span style={S.impliesLabel}>Implies</span>
        {irr != null
          ? <><strong style={S.impliesValue}>{fmtPctRaw(irr, 1)}</strong> projected IRR</>
          : <span style={S.impliesPending}>set scale below to project returns</span>}
      </p>
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
    gap: 'var(--cp-space-2)',
    minWidth: 0,
    border: '1px solid var(--cp-border)',
  },
  // Lead row: driven value (left, dominant) + config context (right).
  leadRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
    flexWrap: 'wrap',
  },
  driver: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(var(--cp-space-1) / 2)',
    minWidth: 0,
  },
  driverLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  driverValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-2xl)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    lineHeight: 'var(--cp-leading-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  context: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-1)',
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-bold)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wide)',
    flexShrink: 0,
  },
  contextModel: {
    color: 'var(--cp-text-body)',
  },
  constraint: {
    color: 'var(--cp-text-muted)',
  },
  // Consequence row: projected IRR (or awaiting state).
  implies: {
    margin: 0,
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    color: 'var(--cp-text-body)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-medium)',
    fontVariantNumeric: 'tabular-nums',
  },
  impliesLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  impliesValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
  },
  impliesPending: {
    color: 'var(--cp-text-faint)',
    fontStyle: 'italic',
  },
  dot: {
    opacity: 'var(--cp-opacity-faint)',
  },
};
