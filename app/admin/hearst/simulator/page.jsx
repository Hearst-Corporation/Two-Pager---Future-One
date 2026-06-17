'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../hearst.module.css';
import DataCenterProjection from '../components/DataCenterProjection';
import { fmtUSD, fmtPctFromRatio, MISSING } from '../utils/format';

export default function SimulatorPage() {
  const [thesis, setThesis] = useState('compute'); // shell | compute | gov
  const [scale, setScale] = useState(150); // MW
  const [aiMix, setAiMix] = useState(50); // %

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    capEx: null,
    irr: null,
    npv: null,
    risk: 'Moderate',
  });
  // Bumped by the Retry button to re-run the current simulation.
  const [attempt, setAttempt] = useState(0);

  // Tracks the in-flight request so a new run can abort the previous one.
  const abortRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function fetchMetrics() {
      setLoading(true);
      setError(null);

      // Abort any still-pending request before firing a new one.
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const archetypeId = thesis === 'shell'
        ? 'powered_shell'
        : thesis === 'compute'
          ? 'neocloud_gpu'
          : 'sovereign_ai';

      try {
        const res = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            input_mode: 'mw_first',
            input_value: { total_mw: scale },
            archetype_id: archetypeId,
            hardware_mix: { ai_pct: aiMix },
            geography: 'qatar',
          }),
        });

        if (!res.ok) {
          let body = null;
          try { body = await res.json(); } catch { /* non-JSON error body */ }
          const apiError = body?.error || body?.message;
          let message;
          switch (res.status) {
            case 400: message = apiError ? `Invalid input: ${apiError}` : 'Invalid simulation parameters.'; break;
            case 401: message = 'Session expired. Please sign in again.'; break;
            case 403: message = 'You do not have access to run simulations.'; break;
            case 429: message = 'Too many requests. Please wait a moment and retry.'; break;
            default:  message = apiError || 'Simulation failed. Please try again.';
          }
          throw new Error(message);
        }

        const data = await res.json();
        if (!active) return;

        const proj = data.projection || {};

        let riskLabel = 'Moderate';
        if (thesis === 'shell') riskLabel = 'Low (secured yield)';
        if (thesis === 'compute') riskLabel = 'High (merchant compute)';
        if (thesis === 'gov') riskLabel = 'Low (sovereign backed)';

        setMetrics({
          capEx: proj.total_capex ?? null,
          irr: proj.irr_post_tax ?? proj.irr ?? null,
          npv: proj.npv_post_tax ?? proj.npv ?? null,
          risk: riskLabel,
        });
      } catch (err) {
        // A superseded/cancelled request is not a user-facing error.
        if (err.name === 'AbortError') return;
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    const t = setTimeout(fetchMetrics, 600);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [thesis, scale, aiMix, attempt]);

  return (
    <main className={styles.simLayout}>
      <aside className={styles.simControls}>
        <div className={styles.controlGroup} role="group" aria-labelledby="thesis-label">
          <h2 id="thesis-label" className={styles.simSectionTitle}>Investment Thesis</h2>
          <button
            type="button"
            className={styles.controlBtn}
            data-active={thesis === 'shell'}
            aria-pressed={thesis === 'shell'}
            onClick={() => setThesis('shell')}
          >
            <span>Shell + Long Lease</span>
            {thesis === 'shell' && <span style={{ opacity: 0.5 }}>✓</span>}
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            data-active={thesis === 'compute'}
            aria-pressed={thesis === 'compute'}
            onClick={() => setThesis('compute')}
          >
            <span>Compute Cloud</span>
            {thesis === 'compute' && <span style={{ opacity: 0.5 }}>✓</span>}
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            data-active={thesis === 'gov'}
            aria-pressed={thesis === 'gov'}
            onClick={() => setThesis('gov')}
          >
            <span>Sovereign AI Cluster</span>
            {thesis === 'gov' && <span style={{ opacity: 0.5 }}>✓</span>}
          </button>
        </div>

        <div className={styles.controlGroup} role="group" aria-labelledby="scale-label">
          <h2 id="scale-label" className={styles.simSectionTitle}>Scale (MW)</h2>
          <div className={styles.controlRow}>
            {[50, 150, 300, 500].map((val) => (
              <button
                key={val}
                type="button"
                className={styles.controlBtn}
                data-active={scale === val}
                aria-pressed={scale === val}
                aria-label={`${val} megawatts`}
                onClick={() => setScale(val)}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup} role="group" aria-labelledby="aimix-label">
          <h2 id="aimix-label" className={styles.simSectionTitle}>AI Infrastructure Mix</h2>
          <div className={styles.controlRow}>
            {[0, 25, 50, 75, 100].map((val) => (
              <button
                key={val}
                type="button"
                className={styles.controlBtn}
                data-active={aiMix === val}
                aria-pressed={aiMix === val}
                aria-label={`${val} percent AI infrastructure mix`}
                onClick={() => setAiMix(val)}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className={styles.simMain}>
        <header className={styles.simHeader}>
          <h1 className={styles.simTitle}>Futur One Projection</h1>
          <p className={styles.simSubtitle}>
            Live preview of the asset footprint and financial outcomes. Connected to Oracle engine.
          </p>
        </header>

        <DataCenterProjection thesis={thesis} scale={scale} aiMix={aiMix} />

        <div
          className={styles.simMetrics}
          data-loading={loading}
          aria-live="polite"
          aria-busy={loading}
        >
          {error ? (
            <div className={styles.simError} role="alert">
              <span>{error}</span>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={() => setAttempt((n) => n + 1)}
                disabled={loading}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Total CAPEX</div>
                <div className={styles.metricValue}>
                  {loading && metrics.capEx == null ? MISSING : fmtUSD(metrics.capEx)}
                </div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>IRR (post-tax)</div>
                <div className={styles.metricValue}>
                  {loading && metrics.irr == null ? MISSING : fmtPctFromRatio(metrics.irr)}
                </div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>NPV (post-tax)</div>
                <div className={styles.metricValue}>
                  {loading && metrics.npv == null ? MISSING : fmtUSD(metrics.npv)}
                </div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Thesis risk (indicative)</div>
                <div className={`${styles.metricValue} ${styles.metricValueRisk}`}>{metrics.risk}</div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
