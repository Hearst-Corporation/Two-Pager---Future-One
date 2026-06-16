import Link from 'next/link';
import styles from './hearst.module.css';

export const metadata = {
  title: 'FUTUR ONE | Investment Memo',
};

export default function HearstLanding() {
  return (
    <main className={styles.hero}>
      <div className={styles.eyebrow}>Hearst Qatar AI Infrastructure</div>
      <h1 className={styles.title}>FUTUR ONE</h1>
      
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Target CAPEX</div>
          <div className={styles.metricValue}>$4.2B</div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Total Scale</div>
          <div className={styles.metricValue}>500MW</div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Projected IRR</div>
          <div className={styles.metricValue}>12.5%</div>
        </div>
      </div>

      <p className={styles.illustrativeNote}>
        Illustrative model — headline figures for narrative preview only.
      </p>

      <p className={styles.subtitle}>
        A cinematic projection of the sovereign AI infrastructure investment.<br/>
        Where state-of-the-art compute meets strategic long-term yields.
      </p>

      <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
        Enter the Projection ⟶
      </Link>
    </main>
  );
}
