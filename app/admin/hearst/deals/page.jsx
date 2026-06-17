'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import { fmtScore, prettyType, parseApiError } from '../utils/format';

export default function DealsPage() {
  const [deals, setDeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/hearst/deals');
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Could not load deal structures.'));
        }
        const data = await res.json();
        if (!active) return;
        setDeals(Array.isArray(data.deals) ? data.deals : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  const count = deals?.length ?? 0;

  return (
    <main className={styles.cockpitFrame}>
      <header className={styles.pageHead}>
        <div className={styles.pageEyebrow}>Structuring</div>
        <h1 className={styles.pageTitle}>Deal Structures</h1>
        <p className={styles.pageContext}>
          {loading
            ? 'Loading catalogue…'
            : error
              ? 'Unavailable'
              : `${count} ${count === 1 ? 'archetype' : 'archetypes'} in the engine catalogue`}
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
          <div className={styles.loadingState}>Loading catalogue…</div>
        ) : count === 0 ? (
          <div className={styles.emptyState}>
            No deal archetypes are defined in the engine catalogue.
          </div>
        ) : (
          <>
            <section className={styles.cockpitPanel}>
              <div className={styles.cockpitPanelHead}>
                <h2 className={styles.cockpitPanelTitle}>Deal Archetypes</h2>
                <span className={styles.cockpitPanelContext}>
                  {count} {count === 1 ? 'structure' : 'structures'}
                </span>
              </div>
            <div className={styles.cockpitPanelScrollWrap}>
            <div className={styles.cockpitPanelScroll}>
              <table className={styles.sourcesTable}>
                <thead>
                  <tr>
                    <th>Structure</th>
                    <th>Operator role</th>
                    <th>Revenue model</th>
                    <th>Bankability</th>
                    <th>Control</th>
                    <th>Projection</th>
                    <th>Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div>{d.label || '—'}</div>
                        <div className={styles.metaCell}>
                          {[d.code, d.id].filter(Boolean).join(' · ')}
                        </div>
                        {d.short && (
                          <div className={styles.metaCell}>{d.short}</div>
                        )}
                        {Array.isArray(d.deal_terms) && d.deal_terms.length > 0 && (
                          <div className={styles.metaCell}>{d.deal_terms.join(' · ')}</div>
                        )}
                      </td>
                      <td>{d.operator_role || '—'}</td>
                      <td>{d.compute_as ? prettyType(d.compute_as) : '—'}</td>
                      <td className={styles.numCell}>{fmtScore(d.scores?.bankability)}</td>
                      <td className={styles.numCell}>{fmtScore(d.scores?.control)}</td>
                      <td>
                        {d.in_projection ? (
                          <span className={styles.tagOn}>In Projection</span>
                        ) : (
                          <span className={styles.tagOff}>—</span>
                        )}
                      </td>
                      <td>
                        {d.recommended ? (
                          <span className={styles.tagOn}>Recommended</span>
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
            <p className={styles.cockpitNote}>
              Read-only catalogue — strategic scores (1–5) from the engine archetype
              definitions. Explore live economics for selected structures in the Projection.
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
