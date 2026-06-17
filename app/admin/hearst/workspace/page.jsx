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

export default function WorkspacePage() {
  const [projectName, setProjectName] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [scenarioCount, setScenarioCount] = useState(0);
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
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const visibleCount = scenarios?.length ?? 0;
  const count = scenarioCount || visibleCount;
  const isTruncated = visibleCount > 0 && count > visibleCount;

  return (
    <main className={styles.sourcesPage}>
      <header className={styles.sourcesHeader}>
        <div className={styles.stubEyebrow}>Working Surface</div>
        <h1 className={styles.sourcesTitle}>Scenario Workspace</h1>
        <p className={styles.sourcesMeta}>
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
            <Link href="/admin/hearst" className={styles.errorBack}>← Back to Overview</Link>
          </div>
        ) : loading ? (
          <div className={styles.emptyState}>Loading…</div>
        ) : visibleCount === 0 ? (
          <div className={styles.emptyState}>
            No saved scenarios yet. Explore assumptions live in the Projection —
            persistence will appear here once scenarios are saved through the model.
          </div>
        ) : (
          <>
            <div className={styles.sourcesTableWrap}>
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
                  {scenarios.map((s) => {
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
            <p className={styles.illustrativeNote}>
              Read-only register — projections are recalculated from each saved scenario.
              Adjust assumptions interactively in the Projection.
            </p>
            {isTruncated && (
              <p className={styles.illustrativeNote}>
                Showing {visibleCount} of {count} scenarios. Narrow or archive older scenarios
                if you need a smaller working set.
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
