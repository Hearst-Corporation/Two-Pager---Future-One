'use client';

import { useState, useEffect } from 'react';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { fmtDate, prettyType, parseApiError, MISSING } from '../utils/format';

const PDF_STATUSES = new Set(['reviewed', 'approved', 'archived']);

export default function DossierPage() {
  const [memos, setMemos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // The project must resolve first: the strategic-memos call is filtered by
        // its id, so the two requests have a hard data dependency and cannot be
        // fired concurrently.
        const projectRes = await fetch('/api/admin/hearst/project');
        if (!projectRes.ok) {
          throw new Error(await parseApiError(projectRes, 'Could not load the Hearst project.'));
        }
        const projectData = await projectRes.json();
        const projectId = projectData.project?.id;
        if (!projectId) {
          throw new Error('No Hearst project is configured yet.');
        }

        const memosRes = await fetch(
          `/api/admin/hearst/strategic-memos?project_id=${encodeURIComponent(projectId)}`,
        );
        if (!memosRes.ok) {
          throw new Error(await parseApiError(memosRes, 'Could not load strategic memos.'));
        }
        const memosData = await memosRes.json();
        if (!active) return;
        setMemos(Array.isArray(memosData.memos) ? memosData.memos : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  const count = memos?.length ?? 0;
  const pdfReadyCount = memos?.filter((memo) => PDF_STATUSES.has(memo?.status)).length ?? 0;
  const draftCount = memos?.filter((memo) => memo?.status === 'draft').length ?? 0;
  const context = loading
    ? 'Loading memos…'
    : error
      ? 'Unavailable'
      : `${count} ${count === 1 ? 'memo' : 'memos'}`;

  return (
    <HearstPageShell
      eyebrow="Board Pack"
      title="Decision Dossier"
      context={context}
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
      {error ? (
        <div className={styles.state}>
          <span className={styles.stateError}>{error}</span>{' '}
          <button type="button" className={styles.link} onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className={styles.state}>Loading memos…</div>
      ) : count === 0 ? (
        <div className={styles.state}>
          No board memos are on record yet. Strategic deliverables will appear here
          once generated through the model.
        </div>
      ) : (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span4}`}>
            <div className={styles.label}>Total Memos</div>
            <div className={styles.valueLarge}>{count}</div>
          </div>
          <div className={`${styles.cell} ${styles.span4}`}>
            <div className={styles.label}>Board-Ready</div>
            <div className={styles.valueLarge}>{pdfReadyCount}</div>
          </div>
          <div className={`${styles.cell} ${styles.span4}`}>
            <div className={styles.label}>Drafts</div>
            <div className={styles.valueLarge}>{draftCount}</div>
          </div>

          <div className={`${styles.cell} ${styles.span12}`}>
            <table className={styles.rawTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th className={styles.num}>Date</th>
                  <th>Export</th>
                </tr>
              </thead>
              <tbody>
                {memos.map((m) => {
                  const boardReady = PDF_STATUSES.has(m.status);
                  return (
                    <tr key={m.id}>
                      <td>{m.title || MISSING}</td>
                      <td>{m.audience ? prettyType(m.audience) : MISSING}</td>
                      <td>
                        <span className={boardReady ? styles.tagOn : styles.tag}>
                          {prettyType(m.status)}
                        </span>
                      </td>
                      <td className={styles.num}>{fmtDate(m.created_at)}</td>
                      <td>
                        {boardReady ? (
                          <a
                            href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                          >
                            PDF
                          </a>
                        ) : (
                          <span className={styles.muted}>{MISSING}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </HearstPageShell>
  );
}
