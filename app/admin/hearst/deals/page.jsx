'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { fmtScore, prettyType, parseApiError, MISSING } from '../utils/format';

const SCORE_ROWS = [
  ['brand', 'Brand'],
  ['bankability', 'Bankability'],
  ['speed', 'Speed'],
  ['control', 'Control'],
  ['margin', 'Margin'],
  ['exit', 'Exit'],
];

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
  const context = loading
    ? 'Loading…'
    : error
      ? 'Unavailable'
      : `${count} ${count === 1 ? 'archetype' : 'archetypes'}`;

  return (
    <HearstPageShell
      variant="data"
      eyebrow="Structuring"
      title="Deal Structures"
      context={context}
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
      {error ? (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={`${styles.state} ${styles.stateError}`}>{error}</div>
            <button type="button" className={styles.link} onClick={() => setReloadKey((k) => k + 1)}>
              Retry
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={styles.state}>Loading catalogue…</div>
          </div>
        </div>
      ) : count === 0 ? (
        <div className={styles.coreGrid}>
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={styles.state}>No deal archetypes are defined in the engine catalogue.</div>
          </div>
        </div>
      ) : (
        <div className={styles.coreGrid}>
          {deals.map((d) => (
            <div key={d.id} className={`${styles.cell} ${styles.span6}`}>
              <div className={styles.label}>
                {[d.code, d.label].filter(Boolean).join(' · ') || MISSING}
              </div>

              {d.short && <div className={styles.valueSmall}>{d.short}</div>}

              {(d.recommended || d.in_projection) && (
                <p>
                  {d.recommended && (
                    <span className={`${styles.tag} ${styles.tagOn}`}>Recommended</span>
                  )}
                  {' '}
                  {d.in_projection && (
                    <span className={`${styles.tag} ${styles.tagOn}`}>In Projection</span>
                  )}
                </p>
              )}

              {(d.operator_role || d.compute_as) && (
                <div className={styles.kv}>
                  {d.operator_role && (
                    <>
                      <span className={styles.kvKey}>Operator</span>
                      <span className={styles.kvVal}>{d.operator_role}</span>
                    </>
                  )}
                  {d.compute_as && (
                    <>
                      <span className={styles.kvKey}>Revenue model</span>
                      <span className={styles.kvVal}>{prettyType(d.compute_as)}</span>
                    </>
                  )}
                  {d.real_comp && (
                    <>
                      <span className={styles.kvKey}>Comparable</span>
                      <span className={styles.kvVal}>{d.real_comp}</span>
                    </>
                  )}
                </div>
              )}

              <table className={styles.rawTable}>
                <tbody>
                  {SCORE_ROWS.map(([key, name]) => (
                    <tr key={key}>
                      <td>{name}</td>
                      <td className={styles.num}>{fmtScore(d.scores?.[key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {Array.isArray(d.deal_terms) && d.deal_terms.length > 0 && (
                <p>
                  {d.deal_terms.map((term) => (
                    <span key={term} className={styles.tag}>{term}</span>
                  ))}
                </p>
              )}
            </div>
          ))}

          <div className={`${styles.cell} ${styles.span12}`}>
            <p className={styles.muted}>
              Read-only catalogue — strategic scores (1–5) from the engine archetype
              definitions. Explore live economics for selected structures in the Projection.
            </p>
            <Link href="/admin/hearst/simulator" className={styles.cta}>
              Open Projection →
            </Link>
          </div>
        </div>
      )}
    </HearstPageShell>
  );
}
