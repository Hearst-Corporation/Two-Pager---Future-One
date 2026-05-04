'use client';

import { useState } from 'react';
import Reveal from './Reveal';

const PILLARS = [
  {
    n: '01',
    title: 'LIVE',
    body: 'Premium residential districts. Founders, families and researchers living inside the hub.',
    image: '/hub-residential.png',
  },
  {
    n: '02',
    title: 'LEARN',
    body: 'International school and research campus — from K-12 to advanced AI labs.',
    image: '/hub-school.png',
  },
  {
    n: '03',
    title: 'GATHER',
    body: 'Restaurants, terraces and plazas. The social fabric where ideas turn into companies.',
    image: '/hub-restaurant.png',
  },
];

const SECONDARY = [
  { src: '/hub-terrace.png', label: 'SOCIAL', title: 'Sunset terraces' },
  { src: '/hub-life.png', label: 'CAMPUS LIFE', title: 'Silicon Dunes' },
  { src: '/hub-residential-2.png', label: 'LIVING', title: 'Residential courts' },
  { src: '/hub-bar.png', label: 'NIGHTLIFE', title: 'The Bar' },
];

export default function SectionLife() {
  return (
    <section id="life" style={S.section}>
      <div style={S.container}>
        <div style={S.header}>
          <Reveal>
            <div style={S.eyebrow}>
              <span style={S.eyebrowNum}>03</span>
              <span style={S.eyebrowDivider} />
              MORE THAN A DATA CENTER
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h2 style={S.title}>
              A city for the people
              <br />
              <span style={S.titleAccent}>building the future.</span>
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p style={S.subtitle}>
              FUTUR ONE is not just compute. It's a complete ecosystem —
              where founders, engineers and researchers <em>live</em>,{' '}
              <em>learn</em> and <em>gather</em> inside a single sovereign campus
              designed for the long horizon.
            </p>
          </Reveal>
        </div>

        {/* 3 main lifestyle pillars with image cards */}
        <div style={S.pillarGrid}>
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 140} y={32}>
              <PillarCard pillar={p} />
            </Reveal>
          ))}
        </div>

        {/* Quote band */}
        <Reveal delay={150}>
          <div style={S.quoteBand}>
            <div style={S.quoteMark}>“</div>
            <p style={S.quote}>
              We are not building a server farm. We are building the place where
              the next generation of AI companies will <em>live</em>.
            </p>
            <div style={S.quoteAttr}>FUTUR ONE · OPERATING THESIS</div>
          </div>
        </Reveal>

        {/* Secondary masonry strip */}
        <div style={S.secondaryGrid}>
          {SECONDARY.map((it, i) => (
            <Reveal key={it.title} delay={i * 100} y={20}>
              <Tile item={it} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ pillar }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.pillarCard,
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 24px 48px -16px rgba(190,18,60,.4)'
          : '0 0 0 0 rgba(0,0,0,0)',
      }}
    >
      <div style={S.pillarImgWrap}>
        <img
          src={pillar.image}
          alt={pillar.title}
          style={{
            ...S.pillarImg,
            transform: hover ? 'scale(1.08)' : 'scale(1)',
          }}
        />
        <div style={S.pillarImgOverlay} />
        <div style={S.pillarN}>{pillar.n}</div>
      </div>
      <div style={S.pillarBody}>
        <div
          style={{
            ...S.pillarAccentBar,
            transform: hover ? 'scaleX(1)' : 'scaleX(0.2)',
            opacity: hover ? 1 : 0.5,
          }}
        />
        <div style={S.pillarTitle}>{pillar.title}</div>
        <div style={S.pillarText}>{pillar.body}</div>
      </div>
    </div>
  );
}

function Tile({ item }) {
  const [hover, setHover] = useState(false);
  return (
    <figure
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={S.tile}
    >
      <img
        src={item.src}
        alt={item.title}
        style={{
          ...S.tileImg,
          transform: hover ? 'scale(1.08)' : 'scale(1)',
        }}
      />
      <div style={S.tileOverlay} />
      <figcaption style={S.tileCaption}>
        <span style={S.tileLabel}>{item.label}</span>
        <span
          style={{
            ...S.tileTitle,
            color: hover ? 'var(--color-accent-soft)' : '#fff',
          }}
        >
          {item.title}
        </span>
      </figcaption>
    </figure>
  );
}

const S = {
  section: {
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    padding: '120px 48px',
    borderTop: '1px solid rgba(255,255,255,.05)',
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    maxWidth: 760,
    marginBottom: 64,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 18,
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
    background: 'var(--color-accent-soft)',
    opacity: 0.5,
  },
  title: {
    fontSize: 'clamp(32px, 4.2vw, 60px)',
    fontWeight: 700,
    letterSpacing: -1.2,
    lineHeight: 1.05,
    fontStyle: 'italic',
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  subtitle: {
    marginTop: 22,
    fontSize: 14,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,.65)',
    maxWidth: 620,
  },

  pillarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    marginBottom: 80,
  },
  pillarCard: {
    background: 'var(--color-gray-850)',
    overflow: 'hidden',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1), box-shadow 0.5s ease',
    cursor: 'default',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  pillarImgWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    overflow: 'hidden',
  },
  pillarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.7s cubic-bezier(.22,.61,.36,1)',
    willChange: 'transform',
  },
  pillarImgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(14,16,19,.55) 100%)',
  },
  pillarN: {
    position: 'absolute',
    top: 18,
    left: 20,
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: -1.2,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
    textShadow: '0 2px 16px rgba(0,0,0,.6)',
  },
  pillarBody: {
    position: 'relative',
    padding: '24px 22px 28px',
  },
  pillarAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 2,
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1), opacity 0.3s ease',
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 1.8,
    color: '#fff',
    marginTop: 4,
  },
  pillarText: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,.62)',
  },

  quoteBand: {
    position: 'relative',
    padding: '64px 56px',
    background:
      'linear-gradient(135deg, rgba(190,18,60,.10) 0%, rgba(190,18,60,.02) 100%)',
    border: '1px solid rgba(190,18,60,.18)',
    marginBottom: 80,
    overflow: 'hidden',
  },
  quoteMark: {
    position: 'absolute',
    top: -20,
    left: 28,
    fontSize: 160,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
    fontFamily: 'Georgia, serif',
    opacity: 0.18,
    fontWeight: 700,
  },
  quote: {
    position: 'relative',
    fontSize: 'clamp(20px, 2.4vw, 32px)',
    lineHeight: 1.35,
    fontStyle: 'italic',
    fontWeight: 500,
    color: '#fff',
    margin: 0,
    maxWidth: 920,
  },
  quoteAttr: {
    position: 'relative',
    marginTop: 24,
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
  },

  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  tile: {
    position: 'relative',
    margin: 0,
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    background: 'var(--color-gray-850)',
    cursor: 'default',
  },
  tileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.7s cubic-bezier(.22,.61,.36,1)',
    willChange: 'transform',
  },
  tileOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(14,16,19,.85) 100%)',
    pointerEvents: 'none',
  },
  tileCaption: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  tileLabel: {
    fontSize: 8.5,
    letterSpacing: 1.8,
    fontWeight: 800,
    color: 'var(--color-accent-soft)',
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: -0.2,
    transition: 'color 0.3s ease',
  },
};
