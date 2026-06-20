'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSimulation } from '@/lib/hearst-simulation-context';
import { boardFormatted, boardValue } from '@/lib/hearst-board-metrics';
import { deriveReturnsComposition } from '@/lib/returns-composition';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import { hasAdvisorProjection } from '@/lib/advisor-context-from-scenario';
import { getAdvisorRailMode } from '@/lib/oracle-advisor-routes';
import { COCKPIT_CHAT_SEND_EVENT } from '@/lib/cockpit-chat-payload';
import { UI } from '@/lib/ui-strings';

// First prompt is generated verdict-aware in the component (Why APPROVE? / REVIEW? / REWORK?).
const PROMPTS = [
  'Explain CAPEX',
  'Improve Returns',
  'Build Conservative Case',
  'Compare Operating Models',
  'What blocks approval?',
];

function verdictFor(projection) {
  if (!projection) return { label: 'UNKNOWN', risk: 'Unknown', confidence: 'Unknown' };
  // Canonical board basis: POST-TAX returns (same fields Results' decisionVerdict
  // reads) so the Advisor verdict can never diverge from the headline. Threshold
  // logic unchanged.
  const irr = boardValue(projection, 'irr');
  const npv = boardValue(projection, 'npv');
  const dscr = projection.dscr_stabilized;
  if (irr == null || npv == null) {
    return { label: UI.RESULTS_VERDICT_NO_DATA, risk: 'Unknown', confidence: 'Unknown' };
  }
  if (irr >= FINANCIAL_THRESHOLDS.investment_grade_pct / 100 && npv > 0 && dscr != null && dscr >= FINANCIAL_THRESHOLDS.dscr_strong_threshold) {
    return { label: 'APPROVE', risk: 'Moderate', confidence: 'Modeled' };
  }
  if (irr >= FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100 && npv > 0 && (dscr == null || dscr >= FINANCIAL_THRESHOLDS.dscr_breach_threshold)) {
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
      concern: 'Current projection not available.',
      driver: 'Run the simulator to surface value drivers.',
      nextStep: 'Complete configuration, then ask what blocks approval.',
    };
  }

  let concern = warnings[0] || 'No critical warning surfaced by the engine.';
  if (!warnings[0] && boardValue(projection, 'irr') != null && boardValue(projection, 'irr') < FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100) {
    concern = 'Returns are below the investment committee threshold.';
  } else if (!warnings[0] && projection.payback_years != null && projection.payback_years > 9) {
    concern = 'Payback is long for an IC-ready base case.';
  }

  const driver = hardware.ai_pct >= 25
    ? 'AI allocation and utilization assumptions.'
    : 'Utilization, lease structure and capital intensity.';

  let nextStep = state?.primary_archetype_id === 'powered_shell'
    ? 'Stress utilization and CAPEX sensitivity before IC.'
    : 'Test powered-shell structure as the lower-risk benchmark.';

  // Returns-composition disclosure (audit P0): when most of the equity return is
  // realized at the terminal sale, that exit dependence is the IC's first concern.
  const comp = deriveReturnsComposition(projection);
  if (comp.available && comp.terminalPct != null && comp.terminalPct > 0.5) {
    concern = comp.note;
    nextStep = comp.diligence || nextStep;
  }

  return { concern, driver, nextStep };
}

function SnapshotMetric({ label, value }) {
  return (
    <div style={S.metric}>
      <div style={S.metricLabel}>{label}</div>
      <div style={S.metricValue}>{value}</div>
    </div>
  );
}

function AdvisoryRow({ title, text }) {
  return (
    <div style={S.advisoryRow}>
      <div style={S.rowTitle}>{title}</div>
      <p style={S.rowText}>{text}</p>
    </div>
  );
}

function sendPrompt(prompt) {
  window.dispatchEvent(
    new CustomEvent(COCKPIT_CHAT_SEND_EVENT, { detail: { message: prompt } }),
  );
}

function OracleAdvisorContent() {
  const { advisorContext } = useSimulation();
  const projection = advisorContext?.projection;
  const verdict = useMemo(() => verdictFor(projection), [projection]);
  const advisory = useMemo(() => advisoryFor(advisorContext), [advisorContext]);
  // Canonical post-tax board values via the metric contract — identical to the
  // Results decision band (audit P0-3).
  const irr = boardFormatted(projection, 'irr');
  const moic = boardFormatted(projection, 'moic');
  const payback = boardFormatted(projection, 'payback');

  return (
    <aside style={S.wrap} aria-label={UI.ADVISOR_RAIL_ARIA}>
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
        </div>
        <div style={S.triple}>
          <div>
            <span style={S.smallLabel}>Risk Level</span>
            <strong style={S.smallValue}>{verdict.risk}</strong>
          </div>
          <div>
            <span style={S.smallLabel}>Confidence</span>
            <strong style={S.smallValue}>{verdict.confidence}</strong>
          </div>
        </div>
        <div style={S.metrics}>
          <SnapshotMetric label="IRR" value={irr} />
          <SnapshotMetric label="MOIC" value={moic} />
          <SnapshotMetric label="Payback" value={payback} />
        </div>
      </section>

      <section style={S.advisory}>
        <AdvisoryRow title="Main Concern" text={advisory.concern} />
        <AdvisoryRow title="Largest Value Driver" text={advisory.driver} />
        <AdvisoryRow title="Recommended Next Step" text={advisory.nextStep} />
      </section>

      <section style={S.ask}>
        <div style={S.sectionKicker}>Ask ORACLE</div>
        <div style={S.promptGrid}>
          {[`Why ${verdict.label}?`, ...PROMPTS].map(prompt => (
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { advisorContext } = useSimulation();
  const railMode = useMemo(
    () => getAdvisorRailMode(pathname, searchParams),
    [pathname, searchParams],
  );
  const routeAllowsAdvisor = railMode === 'full';
  const showAdvisor = routeAllowsAdvisor && hasAdvisorProjection(advisorContext);

  const [mount, setMount] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('oracle-advisor-chat-only', !showAdvisor);
    return () => document.body.classList.remove('oracle-advisor-chat-only');
  }, [showAdvisor]);

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
      const slot = document.querySelector('[data-oracle-advisor-slot]');
      slot?.remove();
    };
  }, []);

  if (!mount || !showAdvisor) return null;
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
    background: 'var(--cp-surface-1)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
  },
  brand: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-strong)',
  },
  sub: {
    marginTop: 'var(--cp-space-1)',
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  mode: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-accent-strong)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-xs)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
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
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
  },
  verdictBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    paddingBottom: 'var(--cp-space-3)',
    borderBottom: '1px solid var(--cp-border-soft)',
  },
  verdictLabel: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
  },
  verdict: {
    fontSize: 'var(--cp-font-2xl)',
    fontWeight: 'var(--cp-weight-black)',
    lineHeight: 1,
    letterSpacing: 'var(--cp-tracking-tight)',
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
    marginTop: 'var(--cp-space-1)',
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
    marginTop: 'var(--cp-space-1)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
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
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wider)',
  },
  rowText: {
    margin: 'var(--cp-space-2) 0 0',
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
    minHeight: 'var(--cp-btn-height-md)',
    padding: 'var(--cp-space-2)',
    border: '1px solid var(--cp-border-strong)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    textAlign: 'left',
    cursor: 'pointer',
  },
};
