import './globals.css';
import localFont from 'next/font/local';

// Satoshi Variable — primary UI typeface (local, variable weight 300–900).
const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Variable.woff2', weight: '300 900', style: 'normal' },
    { path: '../public/fonts/Satoshi-VariableItalic.woff2', weight: '300 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-satoshi',
});

export const metadata = {
  title: 'FUTUR ONE · National AI Innovation Hub · Qatar',
  description:
    'FUTUR ONE is a national AI innovation hub on the Qatari coast, operated by Hearst Qatar — where compute, architecture and talent operate as one.',
  icons: { icon: '/hearst-h.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={satoshi.variable}>
      <body>{children}</body>
    </html>
  );
}
