'use client';

export default function SectionOpportunity() {
  return (
    <section id="vision" style={S.section}>
      <div style={S.inner}>
        <div style={S.left}>
          <div style={S.eyebrow}>WHAT IS FUTUR ONE</div>
          <h2 style={S.headline}>
            A controlled environment
            <br />
            for the frontier of AI.
          </h2>
          <div style={S.lead}>
            <p style={S.paragraph}>
              FUTUR ONE is a <strong>sovereign AI innovation hub</strong>{' '}
              operated by Hearst Qatar — a single integrated environment where
              compute, architecture, residency and operations are designed to
              work as one.
            </p>
            <p style={S.paragraph}>
              From the desert coast of Qatar, FUTUR ONE concentrates the
              infrastructure required to build the next generation of
              artificial intelligence companies — at sovereign scale.
            </p>
          </div>

          <div style={S.pillars}>
            {PILLARS.map((p) => (
              <div key={p.title} style={S.pillar}>
                <div style={S.pillarN}>{p.n}</div>
                <div style={S.pillarTitle}>{p.title}</div>
                <div style={S.pillarBody}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.right}>
          <div style={S.imgFrame}>
            <img src="/supercomputer.png" alt="FUTUR ONE supercomputer hall" style={S.img} />
            <div style={S.imgCaption}>
              <span style={S.capLabel}>01</span>
              <span style={S.capText}>The compute floor</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    n: '01',
    title: 'COMPUTE',
    body: 'Tier IV data centers. High-density NVIDIA H100 / H200 racks at frontier scale.',
  },
  {
    n: '02',
    title: 'ARCHITECTURE',
    body: 'A 100,000 sqm campus designed by Foster + Partners on the Qatari coast.',
  },
  {
    n: '03',
    title: 'RESIDENCY',
    body: 'Founders, engineers and researchers living and building inside the hub.',
  },
];

const S = {
  section: {
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    padding: '120px 48px',
  },
  inner: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: 80,
    alignItems: 'center',
  },
  left: {
    maxWidth: 620,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
    marginBottom: 22,
  },
  headline: {
    fontSize: 'clamp(28px, 3.2vw, 44px)',
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: -0.8,
    fontStyle: 'italic',
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  lead: {
    marginTop: 28,
    maxWidth: 540,
  },
  paragraph: {
    fontSize: 13.5,
    lineHeight: 1.7,
    color: 'var(--color-text-secondary)',
    marginTop: 14,
  },

  pillars: {
    marginTop: 44,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 0,
    borderTop: '1px solid var(--color-border-light)',
  },
  pillar: {
    padding: '20px 18px 0 0',
    borderRight: '1px solid var(--color-border-light)',
    paddingLeft: 18,
  },
  pillarN: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    color: 'var(--color-accent-strong)',
  },
  pillarTitle: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: 'var(--color-text-primary)',
    marginTop: 8,
  },
  pillarBody: {
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--color-text-secondary)',
    marginTop: 8,
  },

  right: {
    position: 'relative',
  },
  imgFrame: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    background: 'var(--color-gray-900)',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  imgCaption: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    color: '#fff',
    background: 'rgba(14,16,19,.55)',
    backdropFilter: 'blur(6px)',
    padding: '10px 16px',
  },
  capLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: 800,
    color: 'var(--color-accent-soft)',
  },
  capText: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: 600,
  },
};
