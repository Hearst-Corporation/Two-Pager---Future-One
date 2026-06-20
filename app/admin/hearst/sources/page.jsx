'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { HearstErrorState, HearstLoadingState, HearstEmptyState } from '../components/HearstRegisterStates';
import { fmtSourceValue, prettyType, parseApiError, MISSING } from '../utils/format';
import { FEATURED_DOCS_LIMIT } from '../utils/constants';

function Confidence({ score }) {
  const n = Number(score) || 0;
  if (!n) return <span className={styles.confEmpty}>{MISSING}</span>;
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
  const linkedDocs = sources?.filter((source) => source?.source_url) ?? [];
  const inModelCount = sources?.filter((source) => source?.used_in_model).length ?? 0;
  const geographies = new Set((sources ?? []).map((source) => source?.geography).filter(Boolean));
  const documents = [];
  const seenDocuments = new Set();
  for (const source of sources ?? []) {
    const key = source.source_url || source.source_name || source.id;
    if (seenDocuments.has(key)) continue;
    seenDocuments.add(key);
    documents.push({
      id: key,
      name: source.source_name || source.metric_name || 'Reference document',
      url: source.source_url || null,
      type: prettyType(source.source_type),
      geography: source.geography || MISSING,
      inModel: Boolean(source.used_in_model),
    });
  }
  const featuredDocuments = documents.slice(0, FEATURED_DOCS_LIMIT);
  const context = loading
    ? 'Loading evidence…'
    : error
      ? 'Unavailable'
      : [
          projectName,
          `${count} ${count === 1 ? 'datapoint' : 'datapoints'} on record`,
        ].filter(Boolean).join(' - ');

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
          <HearstErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : loading ? (
          <HearstLoadingState>Loading evidence…</HearstLoadingState>
        ) : count === 0 ? (
          <HearstEmptyState>
            No sources are on record yet. Evidence will appear here once it is
            added through the model.
          </HearstEmptyState>
        ) : (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Datapoints</div>
                <div className={styles.summaryValue}>{count}</div>
                <p className={styles.summaryText}>Live evidence entries currently indexed for the Hearst case.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Reference documents</div>
                <div className={styles.summaryValue}>{documents.length}</div>
                <p className={styles.summaryText}>Distinct linked materials surfaced directly from the register.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Used in model</div>
                <div className={styles.summaryValue}>{inModelCount}</div>
                <p className={styles.summaryText}>Evidence rows explicitly flowing into the current modelling layer.</p>
              </article>
              <article className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Geographic scope</div>
                <div className={styles.summaryValue}>{geographies.size}</div>
                <p className={styles.summaryText}>Distinct regions represented in the active evidence library.</p>
              </article>
            </div>

            <div className={styles.registerLayout}>
              <section className={styles.cockpitPanel}>
                <div className={styles.cockpitPanelHead}>
                  <h2 className={styles.cockpitPanelTitle}>Reference Documents</h2>
                  <span className={styles.cockpitPanelContext}>
                    {linkedDocs.length} linked
                  </span>
                </div>
                <div className={styles.sourceDocList}>
                  {featuredDocuments.length > 0 ? (
                    featuredDocuments.map((document) => (
                      <article key={document.id} className={styles.sourceDocItem}>
                        <div>
                          {document.url ? (
                            <a
                              href={document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.sourceLink}
                            >
                              {document.name}
                            </a>
                          ) : (
                            <span>{document.name}</span>
                          )}
                          <div className={styles.metaCell}>
                            {[document.type, document.geography].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        {document.inModel ? <span className={styles.tagOn}>In model</span> : null}
                      </article>
                    ))
                  ) : (
                    <p className={styles.summaryText}>
                      No linked documents are currently exposed by the register.
                    </p>
                  )}
                </div>
              </section>

              <section className={`${styles.cockpitPanel} ${styles.cockpitPanelFill}`}>
                <div className={styles.cockpitPanelHead}>
                  <div>
                    <h2 className={styles.cockpitPanelTitle}>Evidence Register</h2>
                    <p className={`${styles.panelHint} ${styles.desktopOnly}`}>Swipe or scroll horizontally for the full register.</p>
                  </div>
                  <span className={styles.cockpitPanelContext}>
                    {count} {count === 1 ? 'datapoint' : 'datapoints'}
                  </span>
                </div>

                {/* Desktop table — hidden on mobile */}
                <div className={`${styles.cockpitPanelScrollWrap} ${styles.desktopTableWrap}`}>
                  <div className={`${styles.cockpitPanelScroll} ${styles.cockpitPanelScrollFill}`}>
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
                          <div>{s.metric_name || s.metric_id || MISSING}</div>
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
                              {s.source_name || MISSING}
                            </a>
                          ) : (
                            s.source_name || MISSING
                          )}
                        </td>
                        <td>{prettyType(s.source_type)}</td>
                        <td>{s.geography || MISSING}</td>
                        <td><Confidence score={s.confidence_score} /></td>
                        <td>
                          {s.used_in_model ? (
                            <span className={styles.tagOn}>In model</span>
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
                  {sources.map((s) => (
                    <article key={s.id} className={styles.sourceCard}>
                      <div className={styles.sourceCardHeader}>
                        <div className={styles.sourceCardMetric}>
                          {s.metric_name || s.metric_id || MISSING}
                        </div>
                        <div className={styles.sourceCardValue}>{fmtSourceValue(s)}</div>
                      </div>
                      <div className={styles.sourceCardMeta}>
                        {s.source_url ? (
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.sourceLink} ${styles.sourceCardLink}`}
                          >
                            {s.source_name || MISSING}
                          </a>
                        ) : (
                          <span className={styles.sourceCardSource}>{s.source_name || MISSING}</span>
                        )}
                      </div>
                      <div className={styles.sourceCardFooter}>
                        <span className={styles.sourceCardTag}>{prettyType(s.source_type)}</span>
                        {s.geography && <span className={styles.sourceCardTag}>{s.geography}</span>}
                        <Confidence score={s.confidence_score} />
                        {s.used_in_model && <span className={styles.tagOn}>In model</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className={styles.cockpitFooterCluster}>
              <p className={styles.cockpitNote}>
                Read-only register — every datapoint traces to a live source record.
                Explore assumptions interactively in the Projection.
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
