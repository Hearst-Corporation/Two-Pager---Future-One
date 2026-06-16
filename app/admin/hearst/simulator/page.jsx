'use client';

import { useState, useEffect } from 'react';
import styles from '../hearst.module.css';
import DataCenterProjection from '../components/DataCenterProjection';

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
    risk: 'Moderate'
  });

  useEffect(() => {
    let active = true;

    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      
      const archetypeId = thesis === 'shell' 
        ? 'powered_shell' 
        : thesis === 'compute' 
          ? 'neocloud_gpu' 
          : 'sovereign_ai';
      
      try {
        const res = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input_mode: 'mw_first',
            input_value: { total_mw: scale },
            archetype_id: archetypeId,
            hardware_mix: { ai_pct: aiMix },
            geography: 'qatar'
          })
        });

        if (!res.ok) {
          // Parse the structured JSON error body (api-errors.js) when present,
          // then map known statuses to actionable messages.
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
        
        // Derive risk placeholder based on thesis if not explicitly defined
        let riskLabel = 'Moderate';
        if (thesis === 'shell') riskLabel = 'Low (Secured Yield)';
        if (thesis === 'compute') riskLabel = 'High (Merchant GPU)';
        if (thesis === 'gov') riskLabel = 'Low (Sovereign Backed)';

        setMetrics({
          capEx: proj.total_capex ?? null,
          irr: proj.irr_post_tax ?? proj.irr ?? null,
          npv: proj.npv_post_tax ?? proj.npv ?? null,
          risk: riskLabel
        });
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    const t = setTimeout(fetchMetrics, 300); // 300ms debounce
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [thesis, scale, aiMix]);

  // Formatters
  const formatMoney = (val) => {
    if (val == null) return '--';
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
    return `$${val.toFixed(0)}`;
  };

  const formatPct = (val) => {
    if (val == null) return '--';
    return `${(val * 100).toFixed(1)}%`;
  };

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
            {[50, 150, 300, 500].map(val => (
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
            {[0, 25, 50, 75, 100].map(val => (
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
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--ct-font-serif)', fontSize: '2.5rem', margin: 0 }}>
            Futur One Projection
          </h1>
          <p style={{ color: 'var(--ct-text-muted)', marginTop: '0.5rem' }}>
            Live preview of the asset footprint and financial outcomes. Connected to Oracle engine.
          </p>
        </div>

        <DataCenterProjection thesis={thesis} scale={scale} aiMix={aiMix} />

        <div
          className={styles.simMetrics}
          style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}
          aria-live="polite"
          aria-busy={loading}
        >
          {error ? (
            <div className={styles.simError} role="alert">
              {error}
            </div>
          ) : (
            <>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Total CAPEX</div>
                <div className={styles.metricValue}>{formatMoney(metrics.capEx)}</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Target IRR</div>
                <div className={styles.metricValue}>{formatPct(metrics.irr)}</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>NPV</div>
                <div className={styles.metricValue}>{formatMoney(metrics.npv)}</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>Risk Profile</div>
                <div className={styles.metricValue} style={{ fontSize: '1.25rem', paddingTop: '0.5rem' }}>{metrics.risk}</div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
