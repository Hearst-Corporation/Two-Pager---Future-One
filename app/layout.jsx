import './globals.css';

export const metadata = {
  title: 'Prese Hub — A3 plié',
  description: 'Visualiseur de document A3 plié 4 pages',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
