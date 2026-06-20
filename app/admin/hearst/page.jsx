'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './hearst.module.css';
import HearstPageShell from './components/HearstPageShell';
import { fmtUSD, fmtPctFromRatio, MISSING, parseApiError } from './utils/format';
import { ARCHETYPES, DEFAULT_GEOGRAPHY } from './utils/constants';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';

const PDF_STATUSES = new Set(['reviewed', 'approved', 'archived']);

// Map a scenario name → the simulator thesis used to recompute its live snapshot.
function thesisForScenario(name = '') {
  const n = name.toLowerCase();
  if (n.includes('government') || n.includes('sovereign') || n.includes('gov')) return 'gov';
  if (n.includes('shell') || n.includes('lease') || n.includes('powered')) return 'shell';
  return 'compute';
}

export default function HearstOverview() {
  const [state, setState] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Project + scenarios
        const projectRes = await fetch('/api/admin/hearst/project');
        if (!projectRes.ok) {
          throw new Error(await parseApiError(projectRes, 'Could not load the Hearst project.'));
        }
        const projectData = await projectRes.json();
        const project = projectData.project;
        if (!project?.id) throw new Error('No Hearst project is configured yet.');

        const scenarios = Array.isArray(project.hearst_scenarios) ? project.hearst_scenarios : [];
        const active_scenario =
          scenarios.find((s) => s.id === project.active_scenario_id) ||
          scenarios.find((s) => s.is_active) ||
          scenarios.find((s) => s.scenario_type === 'base') ||
          null;

        // 2. Sources + memos in parallel (independent reads)
        const [sourcesRes, memosRes] = await Promise.all([
          fetch(`/api/admin/hearst/sources?project_id=${encodeURIComponent(project.id)}`),
          fetch(`/api/admin/hearst/strategic-memos?project_id=${encodeURIComponent(project.id)}`),
        ]);

        const sourcesData = sourcesRes.ok ? await sourcesRes.json() : { sources: [] };
        const memosData = memosRes.ok ? await memosRes.json() : { memos: [] };
        const sources = Array.isArray(sourcesData.sources) ? sourcesData.sources : [];
        const memos = Array.isArray(memosData.memos) ? memosData.memos : [];

        if (!active) return;
        setState({
          project,
          scenarios,
          active_scenario,
          sources: {
            total: sources.length,
            used: sources.filter((s) => s.used_in_model).length,
            confidence: sources.length
              ? sources.reduce((a, s) => a + (Number(s.confidence_score) || 0), 0) / sources.length
              : null,
          },
          memos: {
            total: memos.length,
            ready: memos.filter((m) => PDF_STATUSES.has(m?.status)).length,
            draft: memos.filter((m) => m?.status === 'draft').length,
          },
        });

        // 3. Live projection snapshot for the active scenario (read-only preview).
        const thesis = thesisForScenario(active_scenario?.name);
        const projRes = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input_mode: 'mw_first',
            input_value: { total_mw: 150 },
            archetype_id: ARCHETYPES[thesis] ?? ARCHETYPES.compute,
            hardware_mix: { ai_pct: 50 },
            geography: DEFAULT_GEOGRAPHY,
          }),
        });
        if (projRes.ok && active) {
          const pj = await projRes.json();
          setProjection({ thesis, ...(pj.projection || {}) });
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const hurdle = FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100;
  const irr = projection?.irr_post_tax ?? projection?.irr ?? null;
  const npv = projection?.npv_post_tax ?? projection?.npv ?? null;
  const capex = projection?.total_capex ?? null;
  const dscr = projection?.dscr_stabilized ?? null;

  // Risk read: the engine's own go/no-go signals.
  const irrTone = irr == null ? 'neutral' : irr < 0 ? 'negative' : irr < hurdle ? 'elevated' : 'stable';
  const dscrBreach = dscr != null && dscr < FINANCIAL_THRESHOLDS.dscr_breach_threshold;

  // Next action = the weakest link in the decision chain.
  const nextAction = (() => {
    if (!state) return null;
    if (irrTone === 'negative' || irrTone === 'elevated') {
      return { label: 'Returns below IC hurdle — revise the structure', href: '/admin/hearst/simulator', cta: 'Open Projection' };
    }
    if (state.sources.used < state.sources.total) {
      return { label: `${state.sources.total - state.sources.used} source(s) not yet in model`, href: '/admin/hearst/sources', cta: 'Review Sources' };
    }
    if (state.memos.ready === 0) {
      return { label: 'No board-ready memo — produce the dossier', href: '/admin/hearst/dossier', cta: 'Open Dossier' };
    }
    return { label: 'Decision chain complete — review the base case', href: '/admin/hearst/financial', cta: 'Open Financial' };
  })();

  return (
    <HearstPageShell
      variant="home"
      eyebrow="Hearst Qatar AI Infrastructure"
      title="FUTUR ONE"
      context={state?.project?.name ?? 'Sovereign AI infrastructure — investment control surface'}
    >
      {error ? (
        <div className={styles.errorState}>
          <span>{error}</span>
          <Link href="/admin/hearst/simulator" className={styles.ctaButton}>Open Projection</Link>
        </div>
      ) : loading && !state ? (
        <div className={styles.loadingState}>Reading current investment state…</div>
      ) : (
        <div className={styles.cockpitOverview}>

          {/* ── State band: live projection snapshot of the active scenario ── */}
          <section className={styles.cockpitPanel}>
            <div className={styles.cockpitPanelHead}>
              <h2 className={styles.cockpitPanelTitle}>Current Investment State</h2>
              <span className={styles.cockpitPanelContext}>
                {state?.active_scenario?.name ?? 'Base Case'}
                {state?.active_scenario?.scenario_type ? ` · ${state.active_scenario.scenario_type}` : ''}
              </span>
            </div>
            <div className={styles.overviewStateGrid}>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Total CAPEX</div>
                <div className={styles.summaryValue}>{loading && capex == null ? MISSING : fmtUSD(capex)}</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>IRR (post-tax)</div>
                <div className={styles.summaryValue} data-tone={irrTone === 'stable' ? undefined : irrTone === 'negative' ? 'negative' : 'elevated'}>
                  {loading && irr == null ? MISSING : fmtPctFromRatio(irr)}
                </div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>NPV (post-tax)</div>
                <div className={styles.summaryValue} data-tone={npv != null && npv < 0 ? 'negative' : undefined}>
                  {loading && npv == null ? MISSING : fmtUSD(npv)}
                </div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>DSCR (stabilised)</div>
                <div className={styles.summaryValue} data-tone={dscrBreach ? 'negative' : undefined}>
                  {loading && dscr == null ? MISSING : dscr != null ? `${Number(dscr).toFixed(2)}×` : MISSING}
                </div>
              </div>
            </div>
          </section>

          {/* ── Read row: risk · evidence · dossier ── */}
          <div className={styles.overviewReadRow}>

            {/* Risk / downside read */}
            <section className={`${styles.cockpitPanel} ${styles.overviewReadCard}`}>
              <h2 className={styles.cockpitPanelTitle}>Risk Read</h2>
              <p className={styles.overviewReadLine} data-tone={irrTone === 'negative' || irrTone === 'elevated' ? 'negative' : 'stable'}>
                {irr == null
                  ? 'Projection pending.'
                  : irr < 0
                  ? `Base case returns negative (${fmtPctFromRatio(irr)}) — structure does not clear cost of capital.`
                  : irr < hurdle
                  ? `IRR ${fmtPctFromRatio(irr)} below IC hurdle (${FINANCIAL_THRESHOLDS.ic_hurdle_pct}%).`
                  : `IRR ${fmtPctFromRatio(irr)} clears the ${FINANCIAL_THRESHOLDS.ic_hurdle_pct}% IC hurdle.`}
              </p>
              {dscrBreach && (
                <p className={styles.overviewReadSub} data-tone="negative">
                  DSCR {Number(dscr).toFixed(2)}× under the {FINANCIAL_THRESHOLDS.dscr_breach_threshold}× covenant floor.
                </p>
              )}
              <Link href="/admin/hearst/financial" className={styles.overviewLink}>Full readout →</Link>
            </section>

            {/* Evidence status */}
            <section className={`${styles.cockpitPanel} ${styles.overviewReadCard}`}>
              <h2 className={styles.cockpitPanelTitle}>Evidence</h2>
              <div className={styles.overviewStat}>
                <span className={styles.overviewStatValue}>{state?.sources.used ?? 0}<span className={styles.overviewStatOf}>/{state?.sources.total ?? 0}</span></span>
                <span className={styles.overviewStatLabel}>sources in model</span>
              </div>
              <p className={styles.overviewReadSub}>
                Avg confidence {state?.sources.confidence != null ? `${state.sources.confidence.toFixed(1)}/5` : MISSING}
              </p>
              <Link href="/admin/hearst/sources" className={styles.overviewLink}>Review sources →</Link>
            </section>

            {/* Dossier / output status */}
            <section className={`${styles.cockpitPanel} ${styles.overviewReadCard}`}>
              <h2 className={styles.cockpitPanelTitle}>Board Pack</h2>
              <div className={styles.overviewStat}>
                <span className={styles.overviewStatValue}>{state?.memos.ready ?? 0}</span>
                <span className={styles.overviewStatLabel}>board-ready memo(s)</span>
              </div>
              <p className={styles.overviewReadSub}>
                {state?.memos.draft ?? 0} in draft · {state?.memos.total ?? 0} total
              </p>
              <Link href="/admin/hearst/dossier" className={styles.overviewLink}>Open dossier →</Link>
            </section>
          </div>

          {/* ── Next action ── */}
          {nextAction && (
            <section className={`${styles.cockpitPanel} ${styles.overviewNextAction}`}>
              <div>
                <div className={styles.cockpitPanelTitle}>Next Action</div>
                <p className={styles.overviewNextLabel}>{nextAction.label}</p>
              </div>
              <Link href={nextAction.href} className={styles.ctaButton}>{nextAction.cta}</Link>
            </section>
          )}
        </div>
      )}
    </HearstPageShell>
  );
}
