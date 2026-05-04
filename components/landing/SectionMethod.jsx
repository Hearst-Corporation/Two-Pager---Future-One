'use client';

const PHASES = [
  {
    n: '01',
    title: 'INCUBATE',
    stage: 'Pre-seed → Seed',
    body:
      'Founder selection. Idea validation. Day-one access to sovereign compute and AI tooling.',
  },
  {
    n: '02',
    title: 'ACCELERATE',
    stage: 'Seed → Series A',
    body:
      'Product-market fit and first commercial wins, supported by the full hub infrastructure.',
  },
  {
    n: '03',
    title: 'SCALE',
    stage: 'Series A → B+',
    body:
      'Geographic expansion, talent influx and continued infrastructure alignment.',
  },
  {
    n: '04',
    title: 'ANCHOR',
    stage: 'Big Tech bridge',
    body:
      'POCs and integrations with hyperscalers and silicon partners. Strategic anchoring.',
  },
];

export default function SectionMethod() {
  return (
    <section id="method" style={S.section}>
      <div style={S.bg} />
      <div style={S.bgOverlay} />

      <div style={S.container}>
        <div style={S.header}>
          <div style={S.eyebrow}>THE PROGRAM</div>
          <h2 style={S.title}>
            THE <span style={S.titleAccent}>METHOD.</span>
          </h2>
          <p style={S.subtitle}>
            A four-phase residency program — from first line of code to global
            anchor.
          </p>
        </div>

        <div style={S.grid}>
          {PHASES.map((p, i) => (
            <div key={p.n} style={S.card}>
              <div style={S.cardN}>{p.n}</div>
              <div style={S.cardTitle}>{p.title}</div>
              <div style={S.cardStage}>{p.stage}</div>
              <div style={S.cardDivider} />
              <p style={S.cardBody}>{p.body}</p>
              {i < PHASES.length - 1 && <div style={S.cardArrow}>›</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const S = {
  section: {
    position: 'relative',
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    padding: '120px 48px',
    overflow: 'hidden',
    borderTop: '1px solid rgba(255,255,255,.05)',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/aerial-white.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(14,16,19,.85) 0%, rgba(14,16,19,.35) 50%, rgba(14,16,19,.85) 100%)',
  },
  container: {
    position: 'relative',
    maxWidth: 1400,
    margin: '0 auto',
    zIndex: 1,
  },
  header: {
    maxWidth: 640,
    marginBottom: 56,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 18,
  },
  title: {
    fontSize: 'clamp(36px, 4.6vw, 64px)',
    fontWeight: 800,
    letterSpacing: -1.2,
    lineHeight: 1,
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  subtitle: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,.6)',
    maxWidth: 480,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 1,
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.06)',
  },
  card: {
    position: 'relative',
    background: 'var(--color-gray-850)',
    padding: '28px 24px 32px',
    minHeight: 240,
    display: 'flex',
    flexDirection: 'column',
  },
  cardN: {
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: -1.4,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
  },
  cardTitle: {
    marginTop: 18,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: '#fff',
  },
  cardStage: {
    marginTop: 6,
    fontSize: 10.5,
    color: 'rgba(255,255,255,.65)',
    fontWeight: 500,
    letterSpacing: 0.3,
  },
  cardDivider: {
    marginTop: 18,
    height: 1,
    background: 'rgba(255,255,255,.1)',
  },
  cardBody: {
    marginTop: 14,
    fontSize: 11.5,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,.6)',
  },
  cardArrow: {
    position: 'absolute',
    right: -10,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
    color: 'var(--color-accent-strong)',
    fontWeight: 300,
    zIndex: 2,
    background: 'var(--color-gray-900)',
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
