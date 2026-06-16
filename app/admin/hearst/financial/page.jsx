import Link from 'next/link';
import styles from '../hearst.module.css';

export const metadata = {
  title: 'FUTUR ONE | Financial Thesis',
};

export default function FinancialStub() {
  return (
    <main className={styles.stub}>
      <div className={styles.stubEyebrow}>Investment Case</div>
      <h1 className={styles.stubTitle}>Financial Thesis</h1>
      <p className={styles.stubText}>
        The full financial thesis — capital structure, returns bridge, and
        sensitivity — is taking shape alongside the live Projection.
      </p>
      <div className={styles.stubStatus}>Coming into focus</div>
      <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
        Go to Projection ⟶
      </Link>
    </main>
  );
}
