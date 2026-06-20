'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { HearstErrorState, HearstLoadingState, HearstEmptyState } from '../components/HearstRegisterStates';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtMW,
  prettyType,
  parseApiError,
  MISSING,
} from '../utils/format';
import { WORKSPACE_PAGE_SIZE } from '../utils/constants';

export default function WorkspacePage() {
  const [projectName, setProjectName] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Local pagination over the scenarios already held client-side. No extra
  // fetch — reveals more of the array the API returned, WORKSPACE_PAGE_SIZE at a time.
  const [shown, setShown] = useState(WORKSPACE_PAGE_SIZE);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // The project must resolve first: the scenarios endpoint requires its id
        // (400 without project_id), so the two requests have a hard data
        // dependency and cannot be fired concurrently.
        const projectRes = await fetch('/api/admin/hearst/project');
        if (!projectRes.ok) {
          throw new Error(await parseApiError(projectRes, 'Could not load the Hearst project.'));
        }
        const projectData = await projectRes.json();
        const project = projectData.project;
        if (!project?.id) {
          throw new Error('No Hearst project is configured yet.');
        }
        if (!active) return;
        setProjectName(project.name || null);

        const scenariosRes = await fetch(
          `/api/admin/hearst/scenarios?project_id=${encodeURIComponent(project.id)}`,
        );
        if (!scenariosRes.ok) {
          throw new Error(await parseApiError(scenariosRes, 'Could not load saved scenarios.'));
        }
        const scenariosData = await scenariosRes.json();
        if (!active) return;
        setScenarios(Array.isArray(scenariosData.scenarios) ? scenariosData.scenarios : []);
        setScenarioCount(Number.isFinite(scenariosData.count) ? scenariosData.count : 0);
        setShown(WORKSPACE_PAGE_SIZE);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  // What the client actually holds vs. the true total on record server-side.
  const loadedCount = scenarios?.length ?? 0;
  const count = scenarioCount || loadedCount;
  // The API may cap the array below the real total — surfaced honestly below.
  const serverCapped = loadedCount > 0 && count > loadedCount;
  const visible = scenarios ? scenarios.slice(0, shown) : [];
  const hasMoreLocal = loadedCount > shown;
  const activeCount = scenarios?.filter((scenario) => scenario?.is_active).length ?? 0;
  const lockedCount = scenarios?.filter((scenario) => scenario?.is_locked).length ?? 0;
  const avgIrrValues = (scenarios ?? [])
    .map((scenario) => scenario?.projection?.irr_post_tax ?? scenario?.projection?.irr)
    .filter((value) => typeof value === 'number');
  const avgIrr = avgIrrValues.length
    ? fmtPctFromRatio(avgIrrValues.reduce((sum, value) => sum + value, 0) / avgIrrValues.length)
    : MISSING;
  const context = loading
    ? 'Loading scenarios…'
    : error
      ? 'Unavailable'
      : [
          projectName,
          `${count} ${count === 1 ? 'scenario' : 'scenarios'} on record`,
        ].filter(Boolean).join(' · ');

  return (
    <HearstPageShell
      variant="data"
      eyebrow="Working Surface"
      title="Scenario Workspace"
      context={context}
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
        {error ? (
          <HearstErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : loading ? (
          <HearstLoadingState>Loading scenarios…</HearstLoadingState>
        ) : loadedCount === 0 ? (
          <HearstEmptyState>
            No saved scenarios yet. Explore assumptions live in the Projection —
            persistence will appear here once scenarios are saved through the model.
          </HearstEmptyState>
        ) : (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Scenarios on record</div>
                <div className={styles.summaryValue}>{count}</div>
                <p className={styles.summaryText}>Saved scenario count reported by the live workspace endpoints.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Active scenarios</div>
                <div className={styles.summaryValue}>{activeCount}</div>
                <p className={styles.summaryText}>Entries still marked live inside the current scenario catalogue.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Locked scenarios</div>
                <div className={styles.summaryValue}>{lockedCount}</div>
                <p className={styles.summaryText}>Saved views currently preserved from direct editing.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Average IRR</div>
                <div className={styles.summaryValue}>{avgIrr}</div>
                <p className={styles.summaryText}>Average post-tax return across the scenarios loaded into this session.</p>
              </article>
            </div>

            <section className={`${styles.cockpitPanel} ${styles.cockpitPanelFill}`}>
              <div className={styles.cockpitPanelHead}>
                <div>
                  <h2 className={styles.cockpitPanelTitle}>Saved Scenarios</h2>
                  <p className={`${styles.panelHint} ${styles.desktopOnly}`}>Swipe or scroll horizontally for the full register.</p>
                </div>
                <span className={styles.cockpitPanelContext}>
                  Showing {visible.length} of {count}
                </span>
              </div>
              <div className={`${styles.cockpitPanelScrollWrap} ${styles.desktopTableWrap}`}>
                <div className={`${styles.cockpitPanelScroll} ${styles.cockpitPanelScrollFill}`}>
                  <table className={styles.sourcesTable}>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Type</th>
                    <th>Scale</th>
                    <th>CAPEX</th>
                    <th>IRR (post-tax)</th>
                    <th>NPV (post-tax)</th>
                    <th>Evidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => {
                    const proj = s.projection || {};
                    const irr = proj.irr_post_tax ?? proj.irr;
                    const npv = proj.npv_post_tax ?? proj.npv;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div>{s.name || MISSING}</div>
                          {s.description && (
                            <div className={styles.metaCell}>{s.description}</div>
                          )}
                        </td>
                        <td>{prettyType(s.scenario_type)}</td>
                        <td className={styles.numCell}>{fmtMW(s.total_mw, 0)}</td>
                        <td className={styles.numCell}>{fmtUSD(proj.total_capex)}</td>
                        <td className={styles.numCell}>{fmtPctFromRatio(irr)}</td>
                        <td className={styles.numCell}>{fmtUSD(npv)}</td>
                        <td className={styles.numCell}>{fmtPctRaw(s.source_score, 0)}</td>
                        <td>
                          {s.is_active ? (
                            <span className={styles.tagOn}>Active</span>
                          ) : s.is_locked ? (
                            <span className={styles.tagOff}>Locked</span>
                          ) : (
                            <span className={styles.tagOff}>{MISSING}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.mobileCardList}>
                {visible.map((s) => {
                  const proj = s.projection || {};
                  const irr = proj.irr_post_tax ?? proj.irr;
                  const npv = proj.npv_post_tax ?? proj.npv;
                  return (
                    <article key={s.id} className={styles.dealCard}>
                      <div className={styles.dealCardHeader}>
                        <div className={styles.dealCardName}>{s.name || MISSING}</div>
                        <div className={styles.dealCardTags}>
                          {s.is_active && <span className={styles.tagOn}>Active</span>}
                          {s.is_locked && <span className={styles.tagOff}>Locked</span>}
                        </div>
                      </div>
                      {s.description && <p className={styles.dealCardShort}>{s.description}</p>}
                      <div className={styles.dealCardBody}>
                        <div className={styles.dealCardRow}>
                          <span className={styles.dealCardRowLabel}>Type</span>
                          <span>{prettyType(s.scenario_type)}</span>
                        </div>
                        <div className={styles.dealCardRow}>
                          <span className={styles.dealCardRowLabel}>Scale</span>
                          <span>{fmtMW(s.total_mw, 0)}</span>
                        </div>
                        <div className={styles.dealCardScores}>
                          <div className={styles.dealCardScore}>
                            <span className={styles.dealCardScoreLabel}>IRR</span>
                            <span className={styles.dealCardScoreValue}>{fmtPctFromRatio(irr)}</span>
                          </div>
                          <div className={styles.dealCardScore}>
                            <span className={styles.dealCardScoreLabel}>NPV</span>
                            <span className={styles.dealCardScoreValue}>{fmtUSD(npv)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.dealCardTerms}>
                        <span className={styles.sourceCardTag}>CAPEX {fmtUSD(proj.total_capex)}</span>
                        <span className={styles.sourceCardTag}>Evidence {fmtPctRaw(s.source_score, 0)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
              {hasMoreLocal && (
                <div className={styles.loadMoreRow}>
                  <button
                    type="button"
                    className={styles.loadMoreButton}
                    onClick={() => setShown((n) => Math.min(n + WORKSPACE_PAGE_SIZE, loadedCount))}
                  >
                    Load {Math.min(WORKSPACE_PAGE_SIZE, loadedCount - shown)} more
                  </button>
                </div>
              )}
            </section>
            <div className={styles.cockpitFooterCluster}>
              <p className={styles.cockpitNote}>
                Read-only register — projections are recalculated from each saved scenario.
                Adjust assumptions interactively in the Projection.
              </p>
              {serverCapped && !hasMoreLocal && (
                <p className={styles.cockpitNote}>
                  Showing the {loadedCount} most recent of {count} scenarios on record. Older
                  scenarios remain in the model; archive or narrow the set to bring them into view.
                </p>
              )}
              <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
                Open the Projection ⟶
              </Link>
            </div>
          </>
        )}
    </HearstPageShell>
  );
}
