'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { HearstErrorState, HearstLoadingState, HearstEmptyState } from '../components/HearstRegisterStates';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtX,
  fmtYears,
  fmtMW,
  parseApiError,
} from '../utils/format';
import { ARCHETYPES, DEFAULT_GEOGRAPHY, DEFAULT_SIM_SCALE_MW, DEFAULT_SIM_AI_MIX_PCT, DEFAULT_SIM_ARCHETYPE } from '../utils/constants';

const BASE_CASE = {
  input_mode: 'mw_first',
  input_value: { total_mw: DEFAULT_SIM_SCALE_MW },
  archetype_id: DEFAULT_SIM_ARCHETYPE ?? ARCHETYPES.compute,
  hardware_mix: { ai_pct: DEFAULT_SIM_AI_MIX_PCT },
  geography: DEFAULT_GEOGRAPHY,
};
const BASE_CASE_LABEL = `BASE CASE · NEOCLOUD GPU · ${DEFAULT_SIM_SCALE_MW} MW · ${DEFAULT_SIM_AI_MIX_PCT}% AI MIX · ${DEFAULT_GEOGRAPHY.toUpperCase()}`;

function Metric({ label, value }) {
  return (
    <div className={styles.metricItem}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  );
}

export default function FinancialPage() {
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(BASE_CASE),
        });

        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Could not load the financial thesis.', {
            badRequestLabel: 'Invalid base case',
            forbiddenLabel: 'You do not have access to the financial model.',
          }));
        }

        const data = await res.json();
        if (!active) return;
        setProjection(data.projection || null);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  const years = Array.isArray(projection?.years) ? projection.years : [];
  const irr = projection?.irr_post_tax ?? projection?.irr;
  const npv = projection?.npv_post_tax ?? projection?.npv;
  const moic = projection?.moic_post_tax ?? projection?.moic;
  const stressedCase =
    (typeof irr === 'number' && irr < 0) ||
    (typeof npv === 'number' && npv < 0);

  return (
    <HearstPageShell
      variant="editorial"
      eyebrow="Investment Case"
      title="Financial Model"
      context={BASE_CASE_LABEL}
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
        {error ? (
          <HearstErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : loading ? (
          <HearstLoadingState>Computing the base case…</HearstLoadingState>
        ) : !projection ? (
          <HearstEmptyState>
            The engine returned no projection for this case.
          </HearstEmptyState>
        ) : (
          <>
            <section className={styles.modelCallout} data-tone={stressedCase ? 'warning' : 'stable'}>
              <div className={styles.modelCalloutLabel}>Current Read</div>
              <p className={styles.modelCalloutText}>
                {stressedCase
                  ? 'The live base case is screening below target returns under current assumptions. The UI keeps this downside read visible rather than softening it.'
                  : 'The live base case is generating a constructive return profile under the current assumptions.'}
              </p>
            </section>

            <div className={styles.finOverviewGrid}>
              <section className={styles.cockpitPanel}>
                <h2 className={styles.finSectionTitle}>Returns — post-tax</h2>
                <div className={styles.metricsGrid}>
                  <Metric label={<abbr title="Internal Rate of Return">IRR</abbr>} value={fmtPctFromRatio(irr)} />
                  <Metric label={<abbr title="Multiple on Invested Capital">MOIC</abbr>} value={fmtX(moic)} />
                  <Metric label={<abbr title="Net Present Value">NPV</abbr>} value={fmtUSD(npv)} />
                  <Metric label="Payback" value={fmtYears(projection.payback_years)} />
                  <Metric label={<><abbr title="Debt Service Coverage Ratio">DSCR</abbr> (stab.)</>} value={fmtX(projection.dscr_stabilized)} />
                </div>
              </section>

              <section className={styles.cockpitPanel}>
                <h2 className={styles.finSectionTitle}>Capital</h2>
                <div className={styles.metricsGrid}>
                  <Metric label="Total CAPEX" value={fmtUSD(projection.total_capex)} />
                  <Metric label="Equity Invested" value={fmtUSD(projection.equity_invested)} />
                  <Metric label="Terminal Value" value={fmtUSD(projection.terminal_value)} />
                </div>
              </section>
            </div>

            {years.length > 0 && (
              <section className={`${styles.cockpitPanel} ${styles.cockpitPanelFill} ${styles.finProjectionPanel}`}>
                <div className={styles.cockpitPanelHead}>
                  <div>
                    <h2 className={styles.finSectionTitle}>Projection</h2>
                    <p className={`${styles.panelHint} ${styles.desktopOnly}`}>Swipe or scroll horizontally for the full projection.</p>
                  </div>
                </div>
                <div className={`${styles.cockpitPanelScrollWrap} ${styles.desktopTableWrap}`}>
                  <div className={`${styles.cockpitPanelScroll} ${styles.cockpitPanelScrollFill}`}>
                    <table className={styles.sourcesTable}>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>MW Live</th>
                        <th>Revenue</th>
                        <th>EBITDA</th>
                        <th>Margin</th>
                        <th>DSCR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {years.map((y) => (
                        <tr key={y.year ?? y.calendar_year}>
                          <td className={styles.numCell}>{y.calendar_year ?? y.year}</td>
                          <td className={styles.numCell}>{fmtMW(y.mw_live, 1)}</td>
                          <td className={styles.numCell}>{fmtUSD(y.revenue)}</td>
                          <td className={styles.numCell}>{fmtUSD(y.ebitda)}</td>
                          <td className={styles.numCell}>{fmtPctRaw(y.ebitda_margin)}</td>
                          <td className={styles.numCell}>{fmtX(y.dscr)}</td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.mobileCardList}>
                  {years.map((y) => (
                    <article key={y.year ?? y.calendar_year} className={styles.dealCard}>
                      <div className={styles.dealCardHeader}>
                        <div className={styles.dealCardName}>Year {y.calendar_year ?? y.year}</div>
                        <div className={styles.dealCardTags}>
                          <span className={styles.sourceCardTag}>{fmtMW(y.mw_live, 1)}</span>
                        </div>
                      </div>
                      <div className={styles.dealCardBody}>
                        <div className={styles.dealCardRow}>
                          <span className={styles.dealCardRowLabel}>Revenue</span>
                          <span>{fmtUSD(y.revenue)}</span>
                        </div>
                        <div className={styles.dealCardRow}>
                          <span className={styles.dealCardRowLabel}>EBITDA</span>
                          <span>{fmtUSD(y.ebitda)}</span>
                        </div>
                        <div className={styles.dealCardScores}>
                          <div className={styles.dealCardScore}>
                            <span className={styles.dealCardScoreLabel}>Margin</span>
                            <span className={styles.dealCardScoreValue}>{fmtPctRaw(y.ebitda_margin)}</span>
                          </div>
                          <div className={styles.dealCardScore}>
                            <span className={styles.dealCardScoreLabel}>DSCR</span>
                            <span className={styles.dealCardScoreValue}>{fmtX(y.dscr)}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className={styles.cockpitFooterCluster}>
              <p className={styles.cockpitNote}>
                Illustrative model — a single base case computed live by the Oracle
                engine. Explore other theses, scales, and mixes in the Projection.
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
