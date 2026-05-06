'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Reveal from '../ui/Reveal';

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
  const [offsetY, setOffsetY] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Parallax effect based on section position relative to viewport
      setOffsetY(rect.top * -0.15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="life" ref={sectionRef} style={S.section}>
      {/* Topographic Background */}
      <div style={{ ...S.topoBg, transform: `translateY(${offsetY * 0.5}px)` }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topo" width="400" height="400" patternUnits="userSpaceOnUse">
              <path d="M0 200 Q 100 150 200 200 T 400 200" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              <path d="M0 220 Q 100 170 200 220 T 400 220" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              <path d="M0 240 Q 100 190 200 240 T 400 240" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              <path d="M0 260 Q 100 210 200 260 T 400 260" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              <path d="M0 280 Q 100 230 200 280 T 400 280" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
              
              <path d="M0 100 Q 150 50 250 150 T 400 100" fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
              <path d="M0 120 Q 150 70 250 170 T 400 120" fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
              <path d="M0 140 Q 150 90 250 190 T 400 140" fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>
      </div>

      <div style={S.container}>
        <div style={S.header}>
          <Reveal>
            <div style={S.eyebrow}>
              <span style={S.eyebrowNum}>04</span>
              <span style={S.eyebrowDivider} />
              MORE THAN A DATA CENTER
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h2 style={S.title}>
              A city for the people
              <br />
              <span style={S.titleAccent}>building the future.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p style={S.subtitle}>
              FUTUR ONE is not just compute. It's a complete ecosystem —
              where founders, engineers and researchers <em>live</em>,{' '}
              <em>learn</em> and <em>gather</em> inside a single sovereign campus
              designed for the long horizon.
            </p>
          </Reveal>
        </div>

        {/* Asymmetric Magazine Layout */}
        <div style={S.magazineLayout}>
          {/* Main large feature */}
          <div style={S.magMain}>
            <Reveal delay={50} y={40}>
              <PillarCard pillar={PILLARS[0]} large offsetY={offsetY} />
            </Reveal>
          </div>
          
          {/* Stacked smaller features */}
          <div style={S.magStack}>
            <Reveal delay={100} y={40}>
              <PillarCard pillar={PILLARS[1]} offsetY={offsetY * 1.2} />
            </Reveal>
            <Reveal delay={150} y={40}>
              <PillarCard pillar={PILLARS[2]} offsetY={offsetY * 0.8} />
            </Reveal>
          </div>
        </div>

        {/* Quote band */}
        <Reveal delay={80}>
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
            <Reveal key={it.title} delay={i * 60} y={20}>
              <Tile item={it} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ pillar, large, offsetY }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.pillarCard,
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        aspectRatio: large ? '4 / 5' : '16 / 9',
      }}
      data-magnetic="true"
    >
      <div style={S.pillarImgWrap}>
        <Image
          src={pillar.image}
          alt={pillar.title}
          fill
          style={{
            ...S.pillarImg,
            transform: `scale(${hover ? 1.08 * 1.2 : 1.02 * 1.2}) translateY(${offsetY * 0.1}px)`,
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
        <div style={{ ...S.pillarTitle, fontSize: large ? 18 : 14 }}>{pillar.title}</div>
        <div style={{ ...S.pillarText, fontSize: large ? 14 : 12.5 }}>{pillar.body}</div>
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
      data-magnetic="true"
    >
      <Image
        src={item.src}
        alt={item.title}
        fill
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
            color: hover ? 'var(--color-accent-strong)' : 'var(--color-text-inverse)',
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
    position: 'relative',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    padding: '120px 48px',
    borderTop: '1px solid var(--color-border-light)',
    overflow: 'hidden',
  },
  topoBg: {
    position: 'absolute',
    inset: -200,
    pointerEvents: 'none',
    zIndex: 0,
    opacity: 0.8,
  },
  container: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    maxWidth: 760,
    marginBottom: 80,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
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
    background: 'var(--color-accent-strong)',
    opacity: 0.5,
  },
  title: {
    fontSize: 'clamp(32px, 4vw, 56px)',
    fontWeight: 800,
    letterSpacing: -1.2,
    lineHeight: 1.05,
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  subtitle: {
    marginTop: 22,
    fontSize: 14,
    lineHeight: 1.7,
    color: 'var(--color-text-secondary)',
    maxWidth: 620,
  },

  magazineLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
    gap: 40,
    marginBottom: 100,
  },
  magMain: {
    display: 'flex',
    flexDirection: 'column',
  },
  magStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 40,
    paddingTop: 80, // Offset to create asymmetry
  },

  pillarCard: {
    background: 'var(--color-bg-main)',
    overflow: 'hidden',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--color-border-light)',
  },
  pillarImgWrap: {
    position: 'relative',
    width: '100%',
    flex: 1,
    overflow: 'hidden',
  },
  pillarImg: {
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.7s cubic-bezier(.22,.61,.36,1)',
    willChange: 'transform',
  },
  pillarImgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 50%, var(--color-dark-surface) 100%)',
  },
  pillarN: {
    position: 'absolute',
    top: 24,
    left: 24,
    fontSize: 48,
    fontWeight: 800,
    letterSpacing: -2,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
    textShadow: '0 2px 16px rgba(0,0,0,.2)',
  },
  pillarBody: {
    position: 'relative',
    padding: '32px 28px 36px',
    background: 'var(--color-surface)',
  },
  pillarAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 3,
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1), opacity 0.3s ease',
  },
  pillarTitle: {
    fontWeight: 800,
    letterSpacing: 1.8,
    color: 'var(--color-text-primary)',
    marginTop: 4,
  },
  pillarText: {
    marginTop: 12,
    lineHeight: 1.65,
    color: 'var(--color-text-secondary)',
  },

  quoteBand: {
    position: 'relative',
    padding: '80px 64px',
    background: 'var(--color-bg-main)',
    border: '1px solid var(--color-border-light)',
    borderLeft: '4px solid var(--color-accent-strong)',
    marginBottom: 100,
    overflow: 'hidden',
  },
  quoteMark: {
    position: 'absolute',
    top: -10,
    left: 32,
    fontSize: 180,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
    fontFamily: 'Georgia, serif',
    opacity: 0.05,
    fontWeight: 700,
  },
  quote: {
    position: 'relative',
    fontSize: 'clamp(24px, 2.8vw, 36px)',
    lineHeight: 1.3,
    fontStyle: 'italic',
    fontWeight: 600,
    color: 'var(--color-accent-primary)',
    margin: 0,
    maxWidth: 920,
  },
  quoteAttr: {
    position: 'relative',
    marginTop: 32,
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: 800,
    color: 'var(--color-text-secondary)',
  },

  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  tile: {
    position: 'relative',
    margin: 0,
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    background: 'var(--color-bg-secondary)',
    cursor: 'pointer',
  },
  tileImg: {
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.7s cubic-bezier(.22,.61,.36,1)',
    willChange: 'transform',
  },
  tileOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(14,16,19,.85) 100%)',
  },
  tileCaption: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  tileLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: -0.2,
    transition: 'color 0.3s ease',
  },
};