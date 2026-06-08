'use client';

import PropTypes from 'prop-types';
import { MapPin, Ruler, SlidersHorizontal, Workflow } from 'lucide-react';
import { Card } from '@/components/hearst/ui';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { fmtMW } from '@/lib/hearst-format';
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
const MODE_LABEL = {
  mw_first: UI.SIM_MODE_SIZE,
  capital_first: UI.SIM_MODE_BUDGET,
  target_irr_first: UI.SIM_MODE_RETURN,
};

export default function CaseHeaderStep({ archetypeId, geography, totalMw, mode }) {
  const model = ARCH_LABEL[archetypeId] || archetypeId;
  const geo = prettyGeo(geography);

  return (
    <Card as="section" data-sim-case variant="card" surface={1} padding="lg" style={S.case}>
      <div style={S.hero}>
        <div style={S.iconShell} aria-hidden="true"><Workflow size={22} strokeWidth={1.8} /></div>
        <div style={S.heroText}>
          <span style={S.eyebrow}>{UI.SIM_CASE_EYEBROW}</span>
          <h1 data-sim-case-sentence style={S.sentence}>{UI.SIM_CASE_TITLE}</h1>
          <p style={S.subtitle}>{UI.SIM_CASE_SUBTITLE}</p>
        </div>
      </div>

      <div data-sim-case-grid style={S.grid}>
        <SetupPill icon={<SlidersHorizontal size={16} />} label={UI.SIM_CASE_MODEL_LABEL} value={model} />
        <SetupPill icon={<MapPin size={16} />} label={UI.SIM_CASE_MARKET_LABEL} value={geo || geography} />
        <SetupPill icon={<Ruler size={16} />} label={UI.SIM_CASE_SIZE_LABEL} value={totalMw != null ? fmtMW(totalMw, 0) : null} />
        <SetupPill icon={<Workflow size={16} />} label={UI.SIM_CASE_MODE_LABEL} value={MODE_LABEL[mode] || mode} />
      </div>
    </Card>
  );
}

function SetupPill({ icon, label, value }) {
  return (
    <div style={S.metric}>
      <span style={S.metricIcon} aria-hidden="true">{icon}</span>
      <span style={S.metricText}>
        <span style={S.metricLabel}>{label}</span>
        <strong style={S.metricValue}>{value || '—'}</strong>
      </span>
    </div>
  );
}

SetupPill.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

CaseHeaderStep.propTypes = {
  archetypeId: PropTypes.string,
  geography: PropTypes.string,
  totalMw: PropTypes.number,
  mode: PropTypes.string,
};

const S = {
  case: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-5)',
    minWidth: 0,
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  iconShell: {
    width: 48,
    height: 48,
    flex: '0 0 48px',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-lg)',
  },
  heroText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
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
    fontSize: 'clamp(24px, 2.4vw, 36px)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  subtitle: {
    margin: 0,
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-md)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    alignItems: 'stretch',
    gap: 'var(--cp-space-3)',
    paddingTop: 'var(--cp-space-4)',
    borderTop: '1px solid var(--cp-border)',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    minWidth: 0,
  },
  metricIcon: {
    width: 34,
    height: 34,
    flex: '0 0 34px',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--cp-accent-maroon)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-md)',
  },
  metricText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(var(--cp-space-1) / 2)',
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
    fontSize: 'var(--cp-font-base)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
