import { Playfair_Display } from 'next/font/google';
import styles from './hearst.module.css';
import HearstNav from './components/HearstNav';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export default function HearstLayout({ children }) {
  return (
    <div className={`${playfair.variable} ${styles.wrap}`}>
      <HearstNav />
      {children}
    </div>
  );
}
