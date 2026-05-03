'use client';

const COLS = [
  {
    title: 'BUILT BY',
    body: (
      <>
        <strong>Hearst Qatar</strong> · designed by{' '}
        <strong>Foster + Partners</strong>, built by{' '}
        <strong>JB Pastor &amp; Fils</strong>.
      </>
    ),
  },
  {
    title: 'TECHNOLOGY',
    body: <>Tier-1 hyperscalers and silicon partners.</>,
  },
  {
    title: 'LOCATION',
    body: <>Doha, Qatar · Aligned with QNV 2030.</>,
  },
];

export default function Footer() {
  return (
    <footer style={S.footer}>
      <div style={S.container}>
        <div style={S.grid}>
          {COLS.map((c) => (
            <div key={c.title} style={S.col}>
              <div style={S.dot} />
              <div style={S.title}>{c.title}</div>
              <div style={S.body}>{c.body}</div>
            </div>
          ))}
        </div>

        <div style={S.bottom}>
          <div style={S.brand}>
            <div style={S.brandMark}>F1</div>
            <div>
              <div style={S.brandName}>FUTUR ONE · QATAR</div>
              <div style={S.brandSub}>
                A sovereign AI innovation hub · operated by Hearst Qatar
              </div>
            </div>
          </div>
          <div style={S.legal}>
            © {new Date().getFullYear()} Futur One · All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
}

const S = {
  footer: {
    background: 'var(--color-dark-contrast)',
    color: 'var(--color-text-inverse)',
    padding: '64px 48px 32px',
    borderTop: '1px solid rgba(255,255,255,.06)',
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 48,
    paddingBottom: 44,
    borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  col: {
    position: 'relative',
  },
  dot: {
    width: 5,
    height: 5,
    background: 'var(--color-accent-strong)',
    marginBottom: 14,
  },
  title: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: 800,
    color: 'var(--color-accent-soft)',
    marginBottom: 10,
  },
  body: {
    fontSize: 11.5,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,.55)',
    maxWidth: 320,
  },
  bottom: {
    paddingTop: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 26,
    height: 26,
    background: 'var(--color-accent-strong)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: -0.4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.6,
  },
  brandSub: {
    marginTop: 3,
    fontSize: 9.5,
    color: 'rgba(255,255,255,.4)',
    letterSpacing: 0.4,
  },
  legal: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,.35)',
    letterSpacing: 0.5,
  },
};
