'use client';

import Reveal from './Reveal';

export default function SectionOpportunity() {
  return (
    <section id="vision" style={S.section}>
      <div style={S.inner}>
        <div style={S.left}>
          <Reveal>
            <div style={S.eyebrow}>
              <span style={S.eyebrowNum}>01</span>
              <span style={S.eyebrowDivider} />
              WHAT IS FUTUR ONE
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h2 style={S.headline}>
              A controlled environment
              <br />
              for the frontier of AI.
            </h2>
          </Reveal>
          <Reveal delay={240}>
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
          </Reveal>
        </div>

        <div style={S.right}>
          <Reveal delay={200} y={32}>
            <div style={S.imgFrame}>
              <img src="/supercomputer.png" alt="FUTUR ONE supercomputer hall" style={S.img} />
              <div style={S.imgCaption}>
                <span style={S.capLabel}>01</span>
                <span style={S.capText}>The compute floor</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const S = {
  section: {
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    padding: '110px 48px',
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
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  eyebrowNum: {
    fontFamily: 'monospace',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: 1,
  },
  eyebrowDivider: {
    width: 28,
    height: 1,
    background: 'var(--color-accent-strong)',
    opacity: 0.5,
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
    fontSize: 14,
    lineHeight: 1.75,
    color: 'var(--color-text-secondary)',
    marginTop: 16,
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
