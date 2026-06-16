import Link from 'next/link';
import styles from '../hearst.module.css';

export const metadata = {
  title: 'FUTUR ONE | Source Register',
};

export default function SourcesStub() {
  return (
    <main className={styles.stub}>
      <div className={styles.stubEyebrow}>Evidence Library</div>
      <h1 className={styles.stubTitle}>Source Register</h1>
      <p className={styles.stubText}>
        The register of public and private evidence behind every assumption —
        filings, market comparables, and sourced datapoints — is being assembled.
      </p>
      <div className={styles.stubStatus}>Module preparing</div>
      <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
        Go to Projection ⟶
      </Link>
    </main>
  );
}
