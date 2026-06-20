'use client';

import { useState, useEffect } from 'react';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtX,
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
  const archetypeCount = (scenarios ?? []).filter((scenario) =>
    ['base', 'downside', 'upside'].includes(scenario?.scenario_type),
  ).length;

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
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={`${styles.state} ${styles.stateError}`}>
              <span className={styles.value}>{error}</span>
              <button
                type="button"
                className={styles.cta}
                onClick={() => setReloadKey((k) => k + 1)}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={styles.state}>Loading scenarios…</div>
          </div>
        </div>
      ) : loadedCount === 0 ? (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={styles.state}>
              No saved scenarios yet. Explore assumptions live in the Projection —
              persistence will appear here once scenarios are saved through the model.
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Total Scenarios</div>
            <div className={styles.valueLarge}>{count}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Active</div>
            <div className={styles.valueLarge}>{activeCount}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Locked</div>
            <div className={styles.valueLarge}>{lockedCount}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Base · Down · Up</div>
            <div className={styles.valueLarge}>{archetypeCount}</div>
          </div>

          <div className={`${styles.cell} ${styles.span12}`}>
            <table className={styles.rawTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th className={styles.num}>MW</th>
                  <th className={styles.num}>CAPEX</th>
                  <th className={styles.num}>IRR</th>
                  <th className={styles.num}>NPV</th>
                  <th className={styles.num}>MOIC</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const proj = s.projection;
                  const capex = proj?.total_capex;
                  const irr = proj?.irr_post_tax;
                  const npv = proj?.npv_post_tax;
                  const moic = proj?.moic_post_tax;
                  const irrNegative = typeof irr === 'number' && irr < 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        {s.name || MISSING}
                        {s.is_active && <span className={styles.tagOn}>Active</span>}
                        {s.is_locked && <span className={styles.tag}>Locked</span>}
                      </td>
                      <td>
                        <span className={styles.tag}>{prettyType(s.scenario_type)}</span>
                      </td>
                      <td className={`${styles.num} ${styles.valueMono}`}>
                        {s.total_mw != null ? fmtMW(s.total_mw, 0) : MISSING}
                      </td>
                      <td className={`${styles.num} ${styles.valueMono}`}>
                        {proj ? fmtUSD(capex) : MISSING}
                      </td>
                      <td
                        className={`${styles.num} ${styles.valueMono} ${
                          irrNegative ? styles.negative : ''
                        }`}
                      >
                        {proj ? fmtPctFromRatio(irr) : MISSING}
                      </td>
                      <td className={`${styles.num} ${styles.valueMono}`}>
                        {proj ? fmtUSD(npv) : MISSING}
                      </td>
                      <td className={`${styles.num} ${styles.valueMono}`}>
                        {proj ? fmtX(moic) : MISSING}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {hasMoreLocal && (
              <div className={styles.controlRow}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() =>
                    setShown((n) => Math.min(n + WORKSPACE_PAGE_SIZE, loadedCount))
                  }
                >
                  Load {Math.min(WORKSPACE_PAGE_SIZE, loadedCount - shown)} more
                </button>
              </div>
            )}

            {serverCapped && !hasMoreLocal && (
              <div className={styles.muted}>
                Showing the {loadedCount} most recent of {count} scenarios on record.
                Older scenarios remain in the model.
              </div>
            )}
          </div>
        </div>
      )}
    </HearstPageShell>
  );
}
