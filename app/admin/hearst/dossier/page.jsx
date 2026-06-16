import Link from 'next/link';
import styles from '../hearst.module.css';

export const metadata = {
  title: 'FUTUR ONE | Decision Dossier',
};

export default function DossierStub() {
  return (
    <main className={styles.stub}>
      <div className={styles.stubEyebrow}>Board Pack</div>
      <h1 className={styles.stubTitle}>Decision Dossier</h1>
      <p className={styles.stubText}>
        The board-facing decision dossier — verdict, key risks, and capital
        stack — is being drafted from the underlying model.
      </p>
      <div className={styles.stubStatus}>Module preparing</div>
      <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
        Go to Projection ⟶
      </Link>
    </main>
  );
}
