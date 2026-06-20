'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import HearstPageShell from '../components/HearstPageShell';
import { fmtUSD, fmtPctFromRatio, fmtX, parseApiError, MISSING } from '../utils/format';
import {
  ARCHETYPES,
  DEFAULT_GEOGRAPHY,
  DEFAULT_SIM_SCALE_MW,
  DEFAULT_SIM_AI_MIX_PCT,
  DEFAULT_SIM_ARCHETYPE,
  DEFAULT_GPU_SKU,
  DEFAULT_GPU_HOUR_PRICE,
  DEFAULT_GPU_UTIL_PCT,
} from '../utils/constants';

const AI_PCT = DEFAULT_SIM_AI_MIX_PCT;

const BASE_CASE = {
  input_mode: 'mw_first',
  input_value: { total_mw: DEFAULT_SIM_SCALE_MW },
  archetype_id: DEFAULT_SIM_ARCHETYPE ?? ARCHETYPES.compute,
  // Aligned with the Projection page: provide a GPU profile whenever the base
  // case carries an AI mix, otherwise the engine books no AI revenue.
  hardware_mix:
    AI_PCT > 0
      ? {
          ai_pct: AI_PCT,
          gpu_sku_id: DEFAULT_GPU_SKU,
          gpu_hour_price: DEFAULT_GPU_HOUR_PRICE,
          utilization_pct: DEFAULT_GPU_UTIL_PCT,
        }
      : { ai_pct: AI_PCT },
  geography: DEFAULT_GEOGRAPHY,
};

const BASE_CASE_CONTEXT = `Base case · ${DEFAULT_GEOGRAPHY.charAt(0).toUpperCase()}${DEFAULT_GEOGRAPHY.slice(1)}`;

function negClass(n) {
  return typeof n === 'number' && n < 0 ? styles.negative : '';
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
  const dscr = projection?.dscr_stabilized;

  return (
    <HearstPageShell
      eyebrow="Investment Case"
      title="Financial Model"
      context={BASE_CASE_CONTEXT}
    >
      {error ? (
        <div className={styles.state}>
          <div className={styles.stateError}>{error}</div>
          <button type="button" className={styles.cta} onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className={styles.state}>Computing the base case…</div>
      ) : !projection ? (
        <div className={styles.state}>The engine returned no projection for this case.</div>
      ) : (
        <div className={styles.coreGrid}>
          {/* Returns — post-tax */}
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>IRR</div>
            <div className={`${styles.valueLarge} ${negClass(irr)}`}>{fmtPctFromRatio(irr)}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>MOIC</div>
            <div className={styles.valueLarge}>{fmtX(moic)}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>NPV</div>
            <div className={`${styles.valueLarge} ${negClass(npv)}`}>{fmtUSD(npv)}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>DSCR</div>
            <div className={styles.valueLarge}>{fmtX(dscr)}</div>
          </div>

          {/* Capital */}
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Total CAPEX</div>
            <div className={styles.value}>{fmtUSD(projection.total_capex)}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Equity Invested</div>
            <div className={styles.value}>{fmtUSD(projection.equity_invested)}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Terminal Value</div>
            <div className={styles.value}>{fmtUSD(projection.terminal_value)}</div>
          </div>
          <div className={`${styles.cell} ${styles.span3}`}>
            <div className={styles.label}>Payback</div>
            <div className={styles.value}>
              {typeof projection.payback_years === 'number'
                ? `${projection.payback_years.toFixed(1)} yr`
                : MISSING}
            </div>
          </div>

          {/* Projection table */}
          <div className={`${styles.cell} ${styles.span12}`}>
            <div className={styles.label}>Projection</div>
            {years.length > 0 ? (
              <table className={styles.rawTable}>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th className={styles.num}>Revenue</th>
                    <th className={styles.num}>OPEX</th>
                    <th className={styles.num}>EBITDA</th>
                    <th className={styles.num}>FCF</th>
                    <th className={styles.num}>DSCR</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y.year ?? y.calendar_year}>
                      <td className={styles.num}>{y.year ?? y.calendar_year}</td>
                      <td className={`${styles.num} ${negClass(y.revenue)}`}>{fmtUSD(y.revenue)}</td>
                      <td className={`${styles.num} ${negClass(y.opex)}`}>{fmtUSD(y.opex)}</td>
                      <td className={`${styles.num} ${negClass(y.ebitda)}`}>{fmtUSD(y.ebitda)}</td>
                      <td className={`${styles.num} ${negClass(y.free_cash_flow)}`}>{fmtUSD(y.free_cash_flow)}</td>
                      <td className={`${styles.num} ${negClass(y.dscr)}`}>{fmtX(y.dscr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.muted}>No annual projection returned.</div>
            )}
            <Link href="/admin/hearst/simulator" className={styles.link}>
              Open the Projection ⟶
            </Link>
          </div>
        </div>
      )}
    </HearstPageShell>
  );
}
