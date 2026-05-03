'use client';

const ITEMS = [
  {
    src: '/desalination.png',
    label: 'INFRASTRUCTURE',
    title: 'The Plaza',
    span: 'wide',
  },
  {
    src: '/vault.png',
    label: 'INTERIOR',
    title: 'The Atrium',
    span: 'normal',
  },
  {
    src: '/water-compute.png',
    label: 'ENERGY',
    title: 'Water-cooled compute',
    span: 'normal',
  },
  {
    src: '/amphitheater.png',
    label: 'COMMUNITY',
    title: 'The Amphitheater',
    span: 'wide',
  },
];

export default function SectionGallery() {
  return (
    <section style={S.section}>
      <div style={S.container}>
        <div style={S.header}>
          <div style={S.eyebrow}>INSIDE THE HUB</div>
          <h2 style={S.title}>
            One campus.
            <br />
            <span style={S.titleAccent}>Built for AI.</span>
          </h2>
        </div>

        <div style={S.grid}>
          {ITEMS.map((it) => (
            <figure
              key={it.title}
              style={{
                ...S.tile,
                gridColumn: it.span === 'wide' ? 'span 2' : 'span 1',
              }}
            >
              <img src={it.src} alt={it.title} style={S.img} />
              <div style={S.overlay} />
              <figcaption style={S.caption}>
                <span style={S.capLabel}>{it.label}</span>
                <span style={S.capTitle}>{it.title}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const S = {
  section: {
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    padding: '120px 48px',
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 56,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 14,
  },
  title: {
    fontSize: 'clamp(28px, 3.6vw, 52px)',
    fontWeight: 700,
    letterSpacing: -1,
    lineHeight: 1.05,
    fontStyle: 'italic',
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  tile: {
    position: 'relative',
    margin: 0,
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    background: 'var(--color-gray-850)',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform .6s ease',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(14,16,19,.85) 100%)',
    pointerEvents: 'none',
  },
  caption: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  capLabel: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 800,
    color: 'var(--color-accent-soft)',
  },
  capTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.3,
    color: '#fff',
  },
};
