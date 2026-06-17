'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtX,
  fmtYears,
  fmtMW,
} from '../utils/format';

const BASE_CASE = {
  input_mode: 'mw_first',
  input_value: { total_mw: 150 },
  archetype_id: 'neocloud_gpu',
  hardware_mix: { ai_pct: 50 },
  geography: 'qatar',
};
const BASE_CASE_LABEL = 'Base case · Neocloud GPU · 150 MW · 50% AI mix · Qatar';

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
          let body = null;
          try { body = await res.json(); } catch { /* non-JSON error body */ }
          const apiError = body?.error || body?.message;
          let message;
          switch (res.status) {
            case 400: message = apiError ? `Invalid base case: ${apiError}` : 'Could not compute the base case.'; break;
            case 401: message = 'Session expired. Please sign in again.'; break;
            case 403: message = 'You do not have access to the financial model.'; break;
            case 429: message = 'Too many requests. Please wait a moment and retry.'; break;
            default:  message = apiError || 'Could not load the financial thesis.';
          }
          throw new Error(message);
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
          <div className={styles.loadingState}>Computing the base case…</div>
        ) : !projection ? (
          <div className={styles.emptyState}>
            The engine returned no projection for this case.
          </div>
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
                <h2 className={styles.finSectionTitle}>Projection</h2>
                <div className={styles.cockpitPanelScrollWrap}>
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
