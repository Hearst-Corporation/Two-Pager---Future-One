import styles from './hearst.module.css';
import HearstNav from './components/HearstNav';

export default function HearstLayout({ children }) {
  return (
    <div className={styles.wrap}>
      <HearstNav />
      <div className={styles.pageStage}>{children}</div>
    </div>
  );
}
