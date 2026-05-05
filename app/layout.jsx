import './globals.css';

export const metadata = {
  title: 'FUTUR ONE · Sovereign AI Innovation Hub · Qatar',
  description:
    'FUTUR ONE is a sovereign AI innovation hub on the Qatari coast, operated by Hearst Qatar — where compute, architecture and talent operate as one.',
  icons: { icon: '/hearst-h.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
