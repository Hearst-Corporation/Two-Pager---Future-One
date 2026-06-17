'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { fmtDate, prettyType, parseApiError } from '../utils/format';

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
  const regionCount = new Set((memos ?? []).map((memo) => memo?.region).filter(Boolean)).size;
  const context = loading
    ? 'Loading memos…'
    : error
      ? 'Unavailable'
      : `${count} ${count === 1 ? 'memo' : 'memos'} on record`;

  return (
    <HearstPageShell
      variant="data"
      eyebrow="Board Pack"
      title="Decision Dossier"
      context={context}
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
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
          <div className={styles.loadingState}>Loading memos…</div>
        ) : count === 0 ? (
          <div className={styles.emptyState}>
            No board memos are on record yet. Strategic deliverables will appear
            here once generated through the model.
          </div>
        ) : (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Memos on record</div>
                <div className={styles.summaryValue}>{count}</div>
                <p className={styles.summaryText}>Board-facing deliverables currently available in the dossier pipeline.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>PDF-ready</div>
                <div className={styles.summaryValue}>{pdfReadyCount}</div>
                <p className={styles.summaryText}>Entries already eligible for direct export from the current route.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Drafts</div>
                <div className={styles.summaryValue}>{draftCount}</div>
                <p className={styles.summaryText}>Items still waiting for review or downstream approval before export.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Regional coverage</div>
                <div className={styles.summaryValue}>{regionCount}</div>
                <p className={styles.summaryText}>Distinct regional framings currently represented in the memo library.</p>
              </article>
            </div>

            <section className={`${styles.cockpitPanel} ${styles.cockpitPanelFill}`}>
              <div className={styles.cockpitPanelHead}>
                <h2 className={styles.cockpitPanelTitle}>Strategic Memos</h2>
                <span className={styles.cockpitPanelContext}>
                  {count} {count === 1 ? 'deliverable' : 'deliverables'}
                </span>
              </div>
              <div className={styles.cockpitPanelScrollWrap}>
                <div className={`${styles.cockpitPanelScroll} ${styles.cockpitPanelScrollFill}`}>
                  <table className={styles.sourcesTable}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Stakeholder</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Data as of</th>
                    <th>Created</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {memos.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div>{m.title || '—'}</div>
                        {m.audience && (
                          <div className={styles.metaCell}>{prettyType(m.audience)}</div>
                        )}
                      </td>
                      <td>{prettyType(m.stakeholder)}</td>
                      <td>{m.region ? prettyType(m.region) : '—'}</td>
                      <td>{prettyType(m.status)}</td>
                      <td>{m.confidence_level ? prettyType(m.confidence_level) : '—'}</td>
                      <td className={styles.numCell}>{fmtDate(m.data_as_of)}</td>
                      <td className={styles.numCell}>{fmtDate(m.created_at)}</td>
                      <td>
                        {PDF_STATUSES.has(m.status) ? (
                          <a
                            href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            PDF
                          </a>
                        ) : (
                          <span className={styles.tagOff}>
                            {m.status === 'draft' ? 'Draft' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>
            </section>
            <div className={styles.cockpitFooterCluster}>
              <p className={styles.cockpitNote}>
                Read-only library — summary rows only. Full memo content and generation
                remain on the backend deliverables pipeline.
              </p>
              <Link href="/admin/hearst/financial" className={styles.ctaButton}>
                View Financial Thesis ⟶
              </Link>
            </div>
          </>
        )}
    </HearstPageShell>
  );
}
