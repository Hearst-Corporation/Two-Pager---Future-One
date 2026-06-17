'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtMW,
  prettyType,
  parseApiError,
} from '../utils/format';

const PAGE_SIZE = 20;

export default function WorkspacePage() {
  const [projectName, setProjectName] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Local pagination over the scenarios already held client-side. No extra
  // fetch — reveals more of the array the API returned, PAGE_SIZE at a time.
  const [shown, setShown] = useState(PAGE_SIZE);

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
        setShown(PAGE_SIZE);
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

  return (
    <main className={styles.cockpitFrame}>
      <header className={styles.pageHead}>
        <div className={styles.pageEyebrow}>Working Surface</div>
        <h1 className={styles.pageTitle}>Scenario Workspace</h1>
        <p className={styles.pageContext}>
          {loading
            ? 'Loading scenarios…'
            : error
              ? 'Unavailable'
              : [
                  projectName,
                  `${count} ${count === 1 ? 'scenario' : 'scenarios'} on record`,
                ].filter(Boolean).join(' · ')}
        </p>
      </header>

      <div aria-live="polite" aria-busy={loading}>
        {error ? (
          <div className={styles.errorState} role="alert">
            <span>{error}</span>
            <div className={styles.errorActions}>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className={styles.retryButton}
              >
                Retry
              </button>
              <Link href="/admin/hearst" className={styles.errorBack}>← Back to Overview</Link>
            </div>
          </div>
        ) : loading ? (
          <div className={styles.loadingState}>Loading scenarios…</div>
        ) : loadedCount === 0 ? (
          <div className={styles.emptyState}>
            No saved scenarios yet. Explore assumptions live in the Projection —
            persistence will appear here once scenarios are saved through the model.
          </div>
        ) : (
          <>
            <section className={styles.cockpitPanel}>
              <div className={styles.cockpitPanelHead}>
                <h2 className={styles.cockpitPanelTitle}>Saved Scenarios</h2>
                <span className={styles.cockpitPanelContext}>
                  Showing {visible.length} of {count}
                </span>
              </div>
            <div className={styles.cockpitPanelScrollWrap}>
            <div className={styles.cockpitPanelScroll}>
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
                          <div>{s.name || '—'}</div>
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
                            <span className={styles.tagOff}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
            {hasMoreLocal && (
              <div className={styles.loadMoreRow}>
                <button
                  type="button"
                  className={styles.loadMoreButton}
                  onClick={() => setShown((n) => Math.min(n + PAGE_SIZE, loadedCount))}
                >
                  Load {Math.min(PAGE_SIZE, loadedCount - shown)} more
                </button>
              </div>
            )}
            </section>
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
          </>
        )}
      </div>
    </main>
  );
}
