'use client';

import { useState } from 'react';
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

          <div style={S.pillars}>
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={360 + i * 100} y={16}>
                <Pillar pillar={p} />
              </Reveal>
            ))}
          </div>
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

function Pillar({ pillar }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.pillar,
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        borderTop: hover
          ? '2px solid var(--color-accent-strong)'
          : '2px solid transparent',
        marginTop: hover ? -1 : 0,
      }}
    >
      <div style={{ ...S.pillarN, color: hover ? 'var(--color-accent-soft)' : 'var(--color-accent-strong)' }}>
        {pillar.n}
      </div>
      <div style={S.pillarTitle}>{pillar.title}</div>
      <div style={S.pillarBody}>{pillar.body}</div>
    </div>
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
    padding: '20px 18px 20px 18px',
    borderRight: '1px solid var(--color-border-light)',
    transition: 'transform 0.4s cubic-bezier(.22,.61,.36,1), border-color 0.3s ease',
    cursor: 'default',
    willChange: 'transform',
  },
  pillarN: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    transition: 'color 0.3s ease',
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
