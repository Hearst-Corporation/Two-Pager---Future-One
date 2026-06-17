'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import { fmtSourceValue, prettyType, parseApiError } from '../utils/format';

function Confidence({ score }) {
  const n = Number(score) || 0;
  if (!n) return <span className={styles.confEmpty}>—</span>;
  return (
    <span className={styles.confDots} aria-label={`Confidence ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} data-on={i <= n}>●</span>
      ))}
    </span>
  );
}

export default function SourcesPage() {
  const [projectName, setProjectName] = useState(null);
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
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

        const res = await fetch(
          `/api/admin/hearst/sources?project_id=${encodeURIComponent(project.id)}`,
        );

        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Could not load the source register.'));
        }

        const data = await res.json();
        if (!active) return;
        setSources(Array.isArray(data.sources) ? data.sources : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  const count = sources?.length ?? 0;

  return (
    <main className={styles.cockpitFrame}>
      <header className={styles.pageHead}>
        <div className={styles.pageEyebrow}>Evidence Library</div>
        <h1 className={styles.pageTitle}>Source Register</h1>
        <p className={styles.pageContext}>
          {loading
            ? 'Loading evidence…'
            : error
              ? 'Unavailable'
              : [
                  projectName,
                  `${count} ${count === 1 ? 'datapoint' : 'datapoints'} on record`,
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
          <div className={styles.loadingState}>Loading evidence…</div>
        ) : count === 0 ? (
          <div className={styles.emptyState}>
            No sources are on record yet. Evidence will appear here once it is
            added through the model.
          </div>
        ) : (
          <section className={styles.cockpitPanel}>
            <div className={styles.cockpitPanelHead}>
              <h2 className={styles.cockpitPanelTitle}>Evidence Register</h2>
              <span className={styles.cockpitPanelContext}>
                {count} {count === 1 ? 'datapoint' : 'datapoints'}
              </span>
            </div>
            <div className={styles.cockpitPanelScrollWrap}>
            <div className={styles.cockpitPanelScroll}>
            <table className={styles.sourcesTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Geography</th>
                  <th>Confidence</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div>{s.metric_name || s.metric_id || '—'}</div>
                      {s.metric_id && s.metric_name && (
                        <div className={styles.metaCell}>{s.metric_id}</div>
                      )}
                    </td>
                    <td className={styles.numCell}>{fmtSourceValue(s)}</td>
                    <td>
                      {s.source_url ? (
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sourceLink}
                        >
                          {s.source_name || '—'}
                        </a>
                      ) : (
                        s.source_name || '—'
                      )}
                    </td>
                    <td>{prettyType(s.source_type)}</td>
                    <td>{s.geography || '—'}</td>
                    <td><Confidence score={s.confidence_score} /></td>
                    <td>
                      {s.used_in_model ? (
                        <span className={styles.tagOn}>In model</span>
                      ) : (
                        <span className={styles.tagOff}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
