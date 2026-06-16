import Link from 'next/link';
import styles from '../hearst.module.css';

export const metadata = {
  title: 'FUTUR ONE | Deal Structures',
};

export default function DealsStub() {
  return (
    <main className={styles.stub}>
      <div className={styles.stubEyebrow}>Structuring</div>
      <h1 className={styles.stubTitle}>Deal Structures</h1>
      <p className={styles.stubText}>
        The catalogue of deal archetypes and their structural terms is being
        prepared for side-by-side comparison.
      </p>
      <div className={styles.stubStatus}>Module preparing</div>
      <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
        Go to Projection ⟶
      </Link>
    </main>
  );
}
