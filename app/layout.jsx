import './globals.css';
import './dark-theme.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'FUTUR ONE · Sovereign AI Innovation Hub · Qatar',
  description:
    'FUTUR ONE is a sovereign AI innovation hub on the Qatari coast, operated by Hearst Qatar — where compute, architecture and talent operate as one.',
  icons: { icon: '/hearst-h.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
