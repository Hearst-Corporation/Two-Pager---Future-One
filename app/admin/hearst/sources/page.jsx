'use client';

import { useState, useEffect } from 'react';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { fmtSourceValue, parseApiError, MISSING } from '../utils/format';

export default function SourcesPage() {
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

  const list = sources ?? [];
  const count = list.length;
  const inModelCount = list.filter((source) => source?.used_in_model).length;
  const geographies = new Set(list.map((source) => source?.geography).filter(Boolean));
  const confScores = list
    .map((source) => Number(source?.confidence_score))
    .filter((n) => Number.isFinite(n) && n > 0);
  const avgConfidence = confScores.length
    ? (confScores.reduce((a, b) => a + b, 0) / confScores.length).toFixed(1)
    : MISSING;

  const context = `${count} ${count === 1 ? 'datapoint' : 'datapoints'} on record`;

  return (
    <HearstPageShell
      variant="data"
      eyebrow="Evidence Library"
      title="Source Register"
      context={context}
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
      {error ? (
        <div className={`${styles.state} ${styles.stateError}`}>
          {error}{' '}
          <button type="button" className={styles.link} onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className={styles.state}>Loading evidence…</div>
      ) : count === 0 ? (
        <div className={styles.state}>
          No sources are on record yet. Evidence will appear here once it is added through the model.
        </div>
      ) : (
        <div className={styles.coreGrid}>
          <div className={styles.cell + ' ' + styles.span3}>
            <div className={styles.label}>Total Datapoints</div>
            <div className={styles.valueLarge}>{count}</div>
          </div>
          <div className={styles.cell + ' ' + styles.span3}>
            <div className={styles.label}>In Model</div>
            <div className={styles.valueLarge}>{inModelCount}</div>
          </div>
          <div className={styles.cell + ' ' + styles.span3}>
            <div className={styles.label}>Avg Confidence</div>
            <div className={styles.valueLarge}>{avgConfidence}</div>
          </div>
          <div className={styles.cell + ' ' + styles.span3}>
            <div className={styles.label}>Geographies</div>
            <div className={styles.valueLarge}>{geographies.size}</div>
          </div>

          <div className={styles.cell + ' ' + styles.span12}>
            <table className={styles.rawTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className={styles.num}>Value</th>
                  <th>Source</th>
                  <th className={styles.num}>Confidence</th>
                  <th className={styles.num}>In Model</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>{s.metric_name || s.metric_id || MISSING}</td>
                    <td className={styles.num}>{fmtSourceValue(s)}</td>
                    <td>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {s.source_name || MISSING}
                        </a>
                      ) : (
                        s.source_name || MISSING
                      )}
                    </td>
                    <td className={styles.num}>
                      {Number(s.confidence_score) > 0 ? `${Number(s.confidence_score)}/5` : MISSING}
                    </td>
                    <td className={styles.num}>
                      {s.used_in_model ? (
                        <span className={styles.accent}>✓</span>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </HearstPageShell>
  );
}
