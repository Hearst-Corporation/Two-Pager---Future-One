import Link from 'next/link';
import styles from '../hearst.module.css';

export function HearstErrorState({ message, onRetry, backHref = '/admin/hearst', backLabel = '← Back to Overview' }) {
  return (
    <div className={styles.errorState} role="alert">
      <span>{message}</span>
      <div className={styles.errorActions}>
        <button type="button" onClick={onRetry} className={styles.retryButton}>
          Retry
        </button>
        <Link href={backHref} className={styles.errorBack}>{backLabel}</Link>
      </div>
    </div>
  );
}

export function HearstLoadingState({ children }) {
  return <div className={styles.loadingState}>{children}</div>;
}

export function HearstEmptyState({ children }) {
  return <div className={styles.emptyState}>{children}</div>;
}
