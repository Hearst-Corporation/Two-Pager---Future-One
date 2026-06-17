'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
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

  return (
    <main className={styles.finPage}>
      <header className={styles.sourcesHeader}>
        <div className={styles.stubEyebrow}>Investment Case</div>
        <h1 className={styles.sourcesTitle}>Financial Thesis</h1>
        <p className={styles.sourcesMeta}>{BASE_CASE_LABEL}</p>
      </header>

      <div aria-live="polite" aria-busy={loading}>
        {error ? (
          <div className={styles.errorState} role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className={styles.errorBack}
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
            >
              Retry
            </button>
            <Link href="/admin/hearst" className={styles.errorBack}>← Back to Overview</Link>
          </div>
        ) : loading ? (
          <div className={styles.emptyState}>Computing the base case…</div>
        ) : !projection ? (
          <div className={styles.emptyState}>
            The engine returned no projection for this case.
          </div>
        ) : (
          <>
            <section className={styles.cockpitPanel}>
              <h2 className={styles.finSectionTitle}>Returns — post-tax</h2>
              <div className={styles.metricsGrid}>
                <Metric label="IRR" value={fmtPctFromRatio(irr)} />
                <Metric label="MOIC" value={fmtX(moic)} />
                <Metric label="NPV" value={fmtUSD(npv)} />
                <Metric label="Payback" value={fmtYears(projection.payback_years)} />
                <Metric label="DSCR (stab.)" value={fmtX(projection.dscr_stabilized)} />
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

            {years.length > 0 && (
              <section className={styles.cockpitPanel}>
                <h2 className={styles.finSectionTitle}>Projection</h2>
                <div className={styles.cockpitPanelScroll}>
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
              </section>
            )}

            <p className={styles.cockpitNote}>
              Illustrative model — a single base case computed live by the Oracle
              engine. Explore other theses, scales, and mixes in the Projection.
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
