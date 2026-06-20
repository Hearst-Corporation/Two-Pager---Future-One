import './hearst-tokens.css';
import styles from './hearst.module.css';
import HearstNav from './components/HearstNav';

export default function HearstLayout({ children }) {
  return (
    <div className={styles.wrap}>
      <HearstNav />
      {children}
    </div>
  );
}
