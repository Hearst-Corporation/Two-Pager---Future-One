'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSimulation } from '@/lib/hearst-simulation-context';
import { fmtPctFromRatio, fmtX, MISSING } from '@/lib/hearst-format';

const PROMPTS = [
  'Why REVIEW?',
  'Explain CAPEX',
  'Improve Returns',
  'Build Conservative Case',
  'Compare Operating Models',
  'What blocks approval?',
];

function verdictFor(projection) {
  if (!projection) return { label: 'UNKNOWN', risk: 'Unknown', confidence: 'Unknown' };
  const irr = projection.irr;
  const npv = projection.npv;
  const dscr = projection.dscr_stabilized;
  if (irr >= 0.18 && npv > 0 && dscr >= 1.5) {
    return { label: 'APPROVE', risk: 'Moderate', confidence: 'Modeled' };
  }
  if (irr >= 0.12 && npv > 0 && dscr >= 1.2) {
    return { label: 'REVIEW', risk: 'Medium', confidence: 'Modeled' };
  }
  return { label: 'REWORK', risk: 'High', confidence: 'Modeled' };
}

function advisoryFor(ctx) {
  const projection = ctx?.projection;
  const state = ctx?.state;
  const warnings = Array.isArray(projection?.warnings) ? projection.warnings : [];
  const hardware = state?.hardware_mix || {};

  if (!projection) {
    return {
      concern: { label: 'Current projection not available.', provenance: 'UNKNOWN' },
      driver: { label: 'Run the simulator to surface value drivers.', provenance: 'UNKNOWN' },
      nextStep: { label: 'Complete configuration, then ask what blocks approval.', provenance: 'HEURISTIC' },
    };
  }

  let concern = warnings[0] || 'No critical warning surfaced by the engine.';
  let concernProv = warnings[0] ? 'MODELED' : 'INTERPRETATION';
  if (!warnings[0] && projection.irr != null && projection.irr < 0.12) {
    concern = 'Returns are below the investment committee threshold.';
    concernProv = 'INTERPRETATION';
  } else if (!warnings[0] && projection.payback_years != null && projection.payback_years > 9) {
    concern = 'Payback is long for an IC-ready base case.';
    concernProv = 'INTERPRETATION';
  }

  const driver = hardware.ai_pct >= 25
    ? 'AI allocation and utilization assumptions.'
    : 'Utilization, lease structure and capital intensity.';

  const nextStep = state?.primary_archetype_id === 'powered_shell'
    ? 'Stress utilization and CAPEX sensitivity before IC.'
    : 'Test powered-shell structure as the lower-risk benchmark.';

  return {
    concern: { label: concern, provenance: concernProv },
    driver: { label: driver, provenance: 'INTERPRETATION' },
    nextStep: { label: nextStep, provenance: 'HEURISTIC' },
  };
}

function Provenance({ children }) {
  return <span style={S.provenance}>{children}</span>;
}

function SnapshotMetric({ label, value, provenance = 'MODELED' }) {
  return (
    <div style={S.metric}>
      <div style={S.metricLabel}>{label}</div>
      <div style={S.metricValue}>{value}</div>
      <Provenance>{provenance}</Provenance>
    </div>
  );
}

function AdvisoryRow({ title, item }) {
  return (
    <div style={S.advisoryRow}>
      <div style={S.rowTitle}>{title}</div>
      <p style={S.rowText}>{item.label}</p>
      <Provenance>{item.provenance}</Provenance>
    </div>
  );
}

function sendPrompt(prompt) {
  const input = document.querySelector('.ct-chat-input');
  const form = document.querySelector('.ct-chat-form');
  if (!input || !form) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(input, prompt);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  window.setTimeout(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, 0);
}

function OracleAdvisorContent() {
  const { advisorContext } = useSimulation();
  const projection = advisorContext?.projection;
  const verdict = useMemo(() => verdictFor(projection), [projection]);
  const advisory = useMemo(() => advisoryFor(advisorContext), [advisorContext]);
  const irr = projection ? fmtPctFromRatio(projection.irr) : MISSING;
  const moic = projection ? fmtX(projection.moic) : MISSING;
  const payback = projection?.payback_years != null ? `${projection.payback_years} years` : MISSING;

  return (
    <aside style={S.wrap} aria-label="ORACLE Investment Committee Advisor">
      <header style={S.header}>
        <div>
          <div style={S.brand}>ORACLE</div>
          <div style={S.sub}>Investment Committee Advisor</div>
        </div>
        <div style={S.mode}>IC</div>
      </header>

      <section style={S.snapshot}>
        <div style={S.sectionKicker}>Decision Snapshot</div>
        <div style={S.verdictBlock}>
          <span style={S.verdictLabel}>Current Verdict</span>
          <strong style={S.verdict}>{verdict.label}</strong>
          <Provenance>{projection ? 'INTERPRETATION' : 'UNKNOWN'}</Provenance>
        </div>
        <div style={S.triple}>
          <div>
            <span style={S.smallLabel}>Risk Level</span>
            <strong style={S.smallValue}>{verdict.risk}</strong>
            <Provenance>{projection ? 'INTERPRETATION' : 'UNKNOWN'}</Provenance>
          </div>
          <div>
            <span style={S.smallLabel}>Confidence</span>
            <strong style={S.smallValue}>{verdict.confidence}</strong>
            <Provenance>{projection ? 'MODELED' : 'UNKNOWN'}</Provenance>
          </div>
        </div>
        <div style={S.metrics}>
          <SnapshotMetric label="IRR" value={irr} provenance={projection?.irr == null ? 'UNKNOWN' : 'MODELED'} />
          <SnapshotMetric label="MOIC" value={moic} provenance={projection?.moic == null ? 'UNKNOWN' : 'MODELED'} />
          <SnapshotMetric label="Payback" value={payback} provenance={projection?.payback_years == null ? 'UNKNOWN' : 'MODELED'} />
        </div>
      </section>

      <section style={S.advisory}>
        <AdvisoryRow title="Main Concern" item={advisory.concern} />
        <AdvisoryRow title="Largest Value Driver" item={advisory.driver} />
        <AdvisoryRow title="Recommended Next Step" item={advisory.nextStep} />
      </section>

      <section style={S.ask}>
        <div style={S.sectionKicker}>Ask ORACLE</div>
        <div style={S.promptGrid}>
          {PROMPTS.map(prompt => (
            <button key={prompt} type="button" onClick={() => sendPrompt(prompt)} style={S.promptBtn}>
              {prompt}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

export default function OracleAdvisorRail() {
  const [mount, setMount] = useState(null);

  useEffect(() => {
    const findMount = () => {
      const body = document.querySelector('.ct-rail-right-body');
      if (!body) {
        setMount(null);
        return;
      }
      let slot = body.querySelector('[data-oracle-advisor-slot]');
      if (!slot) {
        slot = document.createElement('div');
        slot.setAttribute('data-oracle-advisor-slot', '');
        body.insertBefore(slot, body.firstChild);
      }
      setMount(slot);
    };
    findMount();
    const observer = new MutationObserver(findMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.querySelector('[data-oracle-advisor-slot]')?.remove();
    };
  }, []);

  if (!mount) return null;
  return createPortal(<OracleAdvisorContent />, mount);
}

const S = {
  wrap: {
    order: -1,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    padding: 'var(--cp-space-4)',
    borderBottom: '1px solid var(--cp-border)',
    background: 'linear-gradient(180deg, color-mix(in srgb, var(--cp-accent-maroon) 10%, transparent), transparent 42%)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
  },
  brand: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 800,
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-strong)',
  },
  sub: {
    marginTop: 2,
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  mode: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 800,
    color: 'var(--cp-accent-strong)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-xs)',
    padding: '2px 6px',
  },
  snapshot: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    background: 'var(--cp-surface-1)',
  },
  sectionKicker: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 800,
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
  },
  verdictBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    paddingBottom: 'var(--cp-space-3)',
    borderBottom: '1px solid var(--cp-border-soft)',
  },
  verdictLabel: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
  },
  verdict: {
    fontSize: 30,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    color: 'var(--cp-text-strong)',
  },
  triple: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--cp-space-3)',
  },
  smallLabel: {
    display: 'block',
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  smallValue: {
    display: 'block',
    marginTop: 3,
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-primary)',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-2)',
  },
  metric: {
    minWidth: 0,
    padding: 'var(--cp-space-2)',
    border: '1px solid var(--cp-border-soft)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-surface-0)',
  },
  metricLabel: {
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 800,
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
  },
  provenance: {
    display: 'inline-flex',
    width: 'max-content',
    marginTop: 5,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  advisory: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  advisoryRow: {
    padding: 'var(--cp-space-3)',
    borderLeft: '2px solid var(--cp-border-strong)',
    background: 'var(--cp-surface-0)',
  },
  rowTitle: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 800,
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wider)',
  },
  rowText: {
    margin: '5px 0 0',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 1.45,
    color: 'var(--cp-text-primary)',
  },
  ask: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  promptGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--cp-space-2)',
  },
  promptBtn: {
    minHeight: 34,
    padding: 'var(--cp-space-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-surface-1)',
    color: 'var(--cp-text-body)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 700,
    textAlign: 'left',
    cursor: 'pointer',
  },
};
