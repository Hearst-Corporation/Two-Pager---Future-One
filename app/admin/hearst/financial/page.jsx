'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';

// /financial computes a single, clearly-labelled BASE CASE through the live
// Oracle engine (same endpoint as the simulator) and surfaces the deeper
// financial breakdown — post-tax returns, capital, and the year-by-year
// projection — that the interactive Projection page does not show.
// It invents nothing: every figure is the engine's response for this case.
const BASE_CASE = {
  input_mode: 'mw_first',
  input_value: { total_mw: 150 },
  archetype_id: 'neocloud_gpu',
  hardware_mix: { ai_pct: 50 },
  geography: 'qatar',
};
const BASE_CASE_LABEL = 'Base case · Neocloud GPU · 150 MW · 50% AI mix · Qatar';

const fmtMoney = (v) => {
  if (v == null) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};
const fmtPctRatio = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);
const fmtPctRaw = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);
const fmtX = (v) => (v == null ? '—' : `${v.toFixed(2)}×`);
const fmtYears = (v) => (v == null ? '—' : `${v.toFixed(1)} yrs`);
const fmtMW = (v) => (v == null ? '—' : `${v} MW`);

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

  useEffect(() => {
    let active = true;

    async function load() {
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

    load();
    return () => { active = false; };
  }, []);

  const years = Array.isArray(projection?.years) ? projection.years : [];

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
            <section className={styles.finSection}>
              <h2 className={styles.finSectionTitle}>Returns — post-tax</h2>
              <div className={styles.metricsGrid}>
                <Metric label="IRR" value={fmtPctRatio(projection.irr_post_tax)} />
                <Metric label="MOIC" value={fmtX(projection.moic_post_tax)} />
                <Metric label="NPV" value={fmtMoney(projection.npv_post_tax)} />
                <Metric label="Payback" value={fmtYears(projection.payback_years)} />
                <Metric label="DSCR (stab.)" value={fmtX(projection.dscr_stabilized)} />
              </div>
            </section>

            <section className={styles.finSection}>
              <h2 className={styles.finSectionTitle}>Capital</h2>
              <div className={styles.metricsGrid}>
                <Metric label="Total CAPEX" value={fmtMoney(projection.total_capex)} />
                <Metric label="Equity Invested" value={fmtMoney(projection.equity_invested)} />
                <Metric label="Terminal Value" value={fmtMoney(projection.terminal_value)} />
              </div>
            </section>

            {years.length > 0 && (
              <section className={styles.finSection}>
                <h2 className={styles.finSectionTitle}>Projection</h2>
                <div className={styles.sourcesTableWrap}>
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
                          <td className={styles.numCell}>{fmtMW(y.mw_live)}</td>
                          <td className={styles.numCell}>{fmtMoney(y.revenue)}</td>
                          <td className={styles.numCell}>{fmtMoney(y.ebitda)}</td>
                          <td className={styles.numCell}>{fmtPctRaw(y.ebitda_margin)}</td>
                          <td className={styles.numCell}>{y.dscr == null ? '—' : fmtX(y.dscr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <p className={styles.illustrativeNote}>
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
