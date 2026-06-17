'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';

function prettyType(t) {
  if (!t) return '—';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

async function parseApiError(res, fallback) {
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  const apiError = body?.error || body?.message;
  switch (res.status) {
    case 400: return apiError ? `Invalid request: ${apiError}` : fallback;
    case 401: return 'Session expired. Please sign in again.';
    case 403: return 'You do not have access to the decision dossier.';
    case 429: return 'Too many requests. Please wait a moment and retry.';
    default:  return apiError || fallback;
  }
}

export default function DossierPage() {
  const [memos, setMemos] = useState(null);
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

    load();
    return () => { active = false; };
  }, []);

  const count = memos?.length ?? 0;

  return (
    <main className={styles.sourcesPage}>
      <header className={styles.sourcesHeader}>
        <div className={styles.stubEyebrow}>Board Pack</div>
        <h1 className={styles.sourcesTitle}>Decision Dossier</h1>
        <p className={styles.sourcesMeta}>
          {loading
            ? 'Loading memos…'
            : error
              ? 'Unavailable'
              : `${count} ${count === 1 ? 'memo' : 'memos'} on record`}
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
            No board memos are on record yet. Strategic deliverables will appear
            here once generated through the model.
          </div>
        ) : (
          <>
            <div className={styles.sourcesTableWrap}>
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
                        {m.status && m.status !== 'draft' ? (
                          <a
                            href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            PDF
                          </a>
                        ) : (
                          <span className={styles.tagOff}>Draft</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.illustrativeNote}>
              Read-only library — summary rows only. Full memo content and generation
              remain on the backend deliverables pipeline.
            </p>
            <Link href="/admin/hearst/financial" className={styles.ctaButton}>
              View Financial Thesis ⟶
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
