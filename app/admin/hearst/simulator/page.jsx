'use client';

import { useState } from 'react';
import styles from '../hearst.module.css';
import DataCenterProjection from '../components/DataCenterProjection';

export default function SimulatorPage() {
  const [thesis, setThesis] = useState('compute'); // shell | compute | gov
  const [scale, setScale] = useState(150); // MW
  const [aiMix, setAiMix] = useState(50); // %

  // Simulated metrics based on state
  const capEx = (scale * 8.5) * (1 + (aiMix / 100) * 0.2); // $M
  const irr = thesis === 'shell' ? 9.5 : thesis === 'compute' ? 14.2 : 11.8;
  const tcv = capEx * 1.5;

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
            <strong>Shell + Long Lease</strong>
            <div style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.8rem' }}>
              Conservative real-estate play. Hyperscaler takes the fit-out risk.
            </div>
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            data-active={thesis === 'compute'}
            aria-pressed={thesis === 'compute'}
            onClick={() => setThesis('compute')}
          >
            <strong>Compute Cloud</strong>
            <div style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.8rem' }}>
              High-density zones, GPU fabric. Higher risk, superior yields.
            </div>
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            data-active={thesis === 'gov'}
            aria-pressed={thesis === 'gov'}
            onClick={() => setThesis('gov')}
          >
            <strong>Government AI Cluster</strong>
            <div style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.8rem' }}>
              National sovereign cloud. Focus on perimeter security and resilience.
            </div>
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
        <div className={styles.simHeader}>
          <h1 className={styles.simTitle}>Futur One Projection</h1>
          <p className={styles.simSubtitle}>
            Live preview of the asset footprint and financial outcomes.
          </p>
          <p className={styles.illustrativeNote}>
            Illustrative model — local mock formulas, not connected to underwriting API.
          </p>
        </div>

        <DataCenterProjection thesis={thesis} scale={scale} aiMix={aiMix} />

        <div className={styles.simMetrics}>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>Total CAPEX</div>
            <div className={styles.metricValue}>${(capEx / 1000).toFixed(2)}B</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>Target IRR</div>
            <div className={styles.metricValue}>{irr.toFixed(1)}%</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>Total Contract Value</div>
            <div className={styles.metricValue}>${(tcv / 1000).toFixed(2)}B</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>Job Creation</div>
            <div className={styles.metricValue}>{scale * 3} FTE</div>
          </div>
        </div>
      </section>
    </main>
  );
}
