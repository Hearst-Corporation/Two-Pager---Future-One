'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { HearstErrorState, HearstLoadingState, HearstEmptyState } from '../components/HearstRegisterStates';
import { fmtScore, prettyType, parseApiError, MISSING } from '../utils/format';

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
  const recommendedCount = deals?.filter((deal) => deal?.recommended).length ?? 0;
  const inProjectionCount = deals?.filter((deal) => deal?.in_projection).length ?? 0;
  const avgScore = (key) => {
    const values = (deals ?? [])
      .map((deal) => Number(deal?.scores?.[key]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) return MISSING;
    return `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)}/5`;
  };
  const context = loading
    ? 'Loading catalogue…'
    : error
      ? 'Unavailable'
      : `${count} ${count === 1 ? 'archetype' : 'archetypes'} in the engine catalogue`;

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
          <HearstErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : loading ? (
          <HearstLoadingState>Loading catalogue…</HearstLoadingState>
        ) : count === 0 ? (
          <HearstEmptyState>
            No deal archetypes are defined in the engine catalogue.
          </HearstEmptyState>
        ) : (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Archetypes</div>
                <div className={styles.summaryValue}>{count}</div>
                <p className={styles.summaryText}>Live structures currently available in the engine catalogue.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Recommended</div>
                <div className={styles.summaryValue}>{recommendedCount}</div>
                <p className={styles.summaryText}>Structures flagged as most actionable in the current catalogue.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>In projection</div>
                <div className={styles.summaryValue}>{inProjectionCount}</div>
                <p className={styles.summaryText}>Archetypes already wired into the live projection experience.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Average bankability</div>
                <div className={styles.summaryValue}>{avgScore('bankability')}</div>
                <p className={styles.summaryText}>Read from the engine’s own structure scoring, without editorial override.</p>
              </article>
            </div>

            <section className={`${styles.cockpitPanel} ${styles.cockpitPanelFill}`}>
              <div className={styles.cockpitPanelHead}>
                <h2 className={styles.cockpitPanelTitle}>Deal Archetypes</h2>
                <span className={styles.cockpitPanelContext}>
                  {count} {count === 1 ? 'structure' : 'structures'}
                </span>
              </div>

              {/* Desktop table — hidden on mobile */}
              <div className={`${styles.cockpitPanelScrollWrap} ${styles.desktopTableWrap}`}>
                <div className={`${styles.cockpitPanelScroll} ${styles.cockpitPanelScrollFill}`}>
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
                        <div>{d.label || MISSING}</div>
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
                      <td>{d.operator_role || MISSING}</td>
                      <td>{d.compute_as ? prettyType(d.compute_as) : MISSING}</td>
                      <td className={styles.numCell}>{fmtScore(d.scores?.bankability)}</td>
                      <td className={styles.numCell}>{fmtScore(d.scores?.control)}</td>
                      <td>
                        {d.in_projection ? (
                          <span className={styles.tagOn}>In Projection</span>
                        ) : (
                          <span className={styles.tagOff}>{MISSING}</span>
                        )}
                      </td>
                      <td>
                        {d.recommended ? (
                          <span className={styles.tagOn}>Recommended</span>
                        ) : (
                          <span className={styles.tagOff}>{MISSING}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile card list — shown only on mobile */}
              <div className={styles.mobileCardList}>
                {deals.map((d) => (
                  <article key={d.id} className={styles.dealCard}>
                    <div className={styles.dealCardHeader}>
                      <div className={styles.dealCardName}>{d.label || MISSING}</div>
                      <div className={styles.dealCardTags}>
                        {d.recommended && <span className={styles.tagOn}>Recommended</span>}
                        {d.in_projection && <span className={styles.tagOn}>In Projection</span>}
                      </div>
                    </div>
                    {d.short && <p className={styles.dealCardShort}>{d.short}</p>}
                    <div className={styles.dealCardBody}>
                      {d.operator_role && (
                        <div className={styles.dealCardRow}>
                          <span className={styles.dealCardRowLabel}>Operator</span>
                          <span>{d.operator_role}</span>
                        </div>
                      )}
                      {d.compute_as && (
                        <div className={styles.dealCardRow}>
                          <span className={styles.dealCardRowLabel}>Revenue model</span>
                          <span>{prettyType(d.compute_as)}</span>
                        </div>
                      )}
                      <div className={styles.dealCardScores}>
                        <div className={styles.dealCardScore}>
                          <span className={styles.dealCardScoreLabel}>Bankability</span>
                          <span className={styles.dealCardScoreValue}>{fmtScore(d.scores?.bankability)}</span>
                        </div>
                        <div className={styles.dealCardScore}>
                          <span className={styles.dealCardScoreLabel}>Control</span>
                          <span className={styles.dealCardScoreValue}>{fmtScore(d.scores?.control)}</span>
                        </div>
                      </div>
                    </div>
                    {Array.isArray(d.deal_terms) && d.deal_terms.length > 0 && (
                      <div className={styles.dealCardTerms}>
                        {d.deal_terms.map((term) => (
                          <span key={term} className={styles.sourceCardTag}>{term}</span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <div className={styles.cockpitFooterCluster}>
              <p className={styles.cockpitNote}>
                Read-only catalogue — strategic scores (1–5) from the engine archetype
                definitions. Explore live economics for selected structures in the Projection.
              </p>
              <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
                Open the Projection ⟶
              </Link>
            </div>
          </>
        )}
    </HearstPageShell>
  );
}
