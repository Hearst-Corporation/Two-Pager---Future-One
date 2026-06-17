'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';

function prettyType(t) {
  if (!t) return '—';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const fmtMoney = (v) => {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtPctRatio = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);
const fmtMW = (v) => (v == null ? '—' : `${v} MW`);
const fmtPctRaw = (v) => (v == null ? '—' : `${v}%`);

async function parseApiError(res, fallback) {
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  const apiError = body?.error || body?.message;
  switch (res.status) {
    case 400: return apiError ? `Invalid request: ${apiError}` : fallback;
    case 401: return 'Session expired. Please sign in again.';
    case 403: return 'You do not have access to the scenario workspace.';
    case 429: return 'Too many requests. Please wait a moment and retry.';
    default:  return apiError || fallback;
  }
}

export default function WorkspacePage() {
  const [projectName, setProjectName] = useState(null);
  const [scenarios, setScenarios] = useState(null);
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
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const count = scenarios?.length ?? 0;

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
        ) : count === 0 ? (
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
                    <th>IRR</th>
                    <th>NPV</th>
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
                        <td className={styles.numCell}>{fmtMW(s.total_mw)}</td>
                        <td className={styles.numCell}>{fmtMoney(proj.total_capex)}</td>
                        <td className={styles.numCell}>{fmtPctRatio(irr)}</td>
                        <td className={styles.numCell}>{fmtMoney(npv)}</td>
                        <td className={styles.numCell}>{fmtPctRaw(s.source_score)}</td>
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
            <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
              Open the Projection ⟶
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
