import Link from 'next/link';
import styles from '../hearst.module.css';

export const metadata = {
  title: 'FUTUR ONE | Scenario Workspace',
};

export default function WorkspaceStub() {
  return (
    <main className={styles.stub}>
      <div className={styles.stubEyebrow}>Working Surface</div>
      <h1 className={styles.stubTitle}>Scenario Workspace</h1>
      <p className={styles.stubText}>
        A space to compose, save, and revisit named scenarios is coming into
        focus. For now, explore assumptions live in the Projection.
      </p>
      <div className={styles.stubStatus}>Coming into focus</div>
      <Link href="/admin/hearst/simulator" className={styles.ctaButton}>
        Go to Projection ⟶
      </Link>
    </main>
  );
}
