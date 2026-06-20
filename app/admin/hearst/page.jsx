'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HearstPageShell from './components/HearstPageShell';
import styles from './hearst.module.css';
import { fmtUSD, fmtPctFromRatio, MISSING, parseApiError } from './utils/format';
import { ARCHETYPES, DEFAULT_GEOGRAPHY } from './utils/constants';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';

const PDF_STATUSES = new Set(['reviewed', 'approved', 'archived']);

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

  const irrTone = irr == null ? 'neutral' : irr < 0 ? 'negative' : irr < hurdle ? 'elevated' : 'stable';
  const dscrBreach = dscr != null && dscr < FINANCIAL_THRESHOLDS.dscr_breach_threshold;

  const projectName = state?.project?.name ?? state?.active_scenario?.name ?? 'Base Case';

  const used = state?.sources.used ?? 0;
  const totalSources = state?.sources.total ?? 0;
  const confidence = state?.sources.confidence;
  const readyMemos = state?.memos.ready ?? 0;
  const draftMemos = state?.memos.draft ?? 0;
  const totalMemos = state?.memos.total ?? 0;

  const riskRead =
    irr == null
      ? 'No live projection yet — run the simulator to read the current investment posture.'
      : irrTone === 'negative'
      ? 'Returns are negative under the active thesis. Capital recovery is not achieved.'
      : irrTone === 'elevated'
      ? `IRR sits below the ${fmtPctFromRatio(hurdle)} hurdle. The base case underclears the IC threshold.`
      : dscrBreach
      ? 'Coverage is thin — stabilised DSCR breaches the senior covenant floor.'
      : 'Returns clear the IC hurdle and coverage holds above the covenant floor.';

  let nextAction;
  if (irr == null) {
    nextAction = { text: 'No live projection on record. Open the simulator to compute the base case.', href: '/admin/hearst/simulator', label: 'Open Projection' };
  } else if (used < totalSources || totalSources === 0) {
    nextAction = { text: 'Evidence coverage is incomplete. Promote the missing sources into the model.', href: '/admin/hearst/sources', label: 'Review Sources' };
  } else if (readyMemos === 0) {
    nextAction = { text: 'No board-ready memo on file. Draft and finalise the strategic dossier.', href: '/admin/hearst/dossier', label: 'Open Dossier' };
  } else {
    nextAction = { text: 'Base case is live and evidence is loaded. Stress the thesis in the simulator.', href: '/admin/hearst/simulator', label: 'Open Projection' };
  }

  if (error) {
    return <div className={`${styles.state} ${styles.stateError}`}>{error}</div>;
  }

  if (loading && !state) {
    return <div className={styles.state}>Reading current investment state…</div>;
  }

  return (
    <HearstPageShell eyebrow="Hearst Qatar AI Infrastructure" title="FUTUR ONE" context={projectName}>
      <div className={styles.coreGrid}>
        <div className={`${styles.cell} ${styles.span3}`}>
          <div className={styles.label}>TOTAL CAPEX</div>
          <div className={styles.valueLarge}>{capex == null ? MISSING : fmtUSD(capex)}</div>
        </div>

        <div className={`${styles.cell} ${styles.span3}`}>
          <div className={styles.label}>IRR (POST-TAX)</div>
          <div className={`${styles.valueLarge} ${irr != null && irr < 0 ? styles.negative : ''}`}>
            {irr == null ? MISSING : fmtPctFromRatio(irr)}
          </div>
        </div>

        <div className={`${styles.cell} ${styles.span3}`}>
          <div className={styles.label}>NPV (POST-TAX)</div>
          <div className={`${styles.valueLarge} ${npv != null && npv < 0 ? styles.negative : ''}`}>
            {npv == null ? MISSING : fmtUSD(npv)}
          </div>
        </div>

        <div className={`${styles.cell} ${styles.span3}`}>
          <div className={styles.label}>DSCR</div>
          <div className={`${styles.valueLarge} ${dscrBreach ? styles.negative : ''}`}>
            {dscr == null ? MISSING : `${Number(dscr).toFixed(2)}×`}
          </div>
        </div>

        <div className={`${styles.cell} ${styles.span4}`}>
          <div className={styles.label}>RISK READ</div>
          <p className={styles.muted}>{riskRead}</p>
        </div>

        <div className={`${styles.cell} ${styles.span4}`}>
          <div className={styles.label}>EVIDENCE</div>
          <div className={styles.value}>
            {used}<span className={styles.muted}>/{totalSources}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvKey}>Confidence</span>
            <span className={styles.kvVal}>{confidence == null ? MISSING : `${confidence.toFixed(1)}/5`}</span>
          </div>
          <Link className={styles.link} href="/admin/hearst/sources">Review sources →</Link>
        </div>

        <div className={`${styles.cell} ${styles.span4}`}>
          <div className={styles.label}>BOARD PACK</div>
          <div className={styles.value}>
            {readyMemos}<span className={styles.muted}>/{totalMemos}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.kvKey}>Drafts</span>
            <span className={styles.kvVal}>{draftMemos}/{totalMemos}</span>
          </div>
          <Link className={styles.link} href="/admin/hearst/dossier">Open dossier →</Link>
        </div>

        <div className={`${styles.cell} ${styles.span12}`}>
          <div className={styles.label}>NEXT ACTION</div>
          <p className={styles.muted}>{nextAction.text}</p>
          <Link className={styles.cta} href={nextAction.href}>{nextAction.label}</Link>
        </div>
      </div>
    </HearstPageShell>
  );
}
