'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import CountUp from './CountUp';

const FACTS = [
  {
    label: 'SQM',
    sub: 'TOTAL CAMPUS',
    render: () => (
      <>
        <CountUp to={100} duration={1800} /> K
      </>
    ),
  },
  {
    label: 'STARTUPS',
    sub: 'MAX CAPACITY',
    render: () => <CountUp to={150} duration={1800} />,
  },
  {
    label: 'RESIDENTS',
    sub: 'FOUNDERS & TEAMS',
    render: () => (
      <>
        <CountUp to={4} duration={1800} /> K
      </>
    ),
  },
  {
    label: 'OPERATIONS',
    sub: 'AI-MANAGED',
    render: () => '24/7',
  },
];

export default function SectionCampus() {
  const imgRef = useRef(null);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = imgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const wh = window.innerHeight;
        // -1 when section bottom hits top, +1 when section top hits bottom
        const progress = (rect.top + rect.height / 2 - wh / 2) / wh;
        setParallax(progress * 60);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="campus" style={S.section}>
      <div style={S.imgWrap} ref={imgRef}>
        <img
          src="/aerial-campus-red.png"
          alt="FUTUR ONE campus aerial view"
          style={{ ...S.img, transform: `translateY(${parallax}px) scale(1.1)` }}
        />
        <div style={S.imgOverlay} />
        <Reveal>
          <div style={S.imgCaption}>
            <div style={S.capEyebrow}>
              <span style={S.eyebrowNum}>06</span>
              <span style={S.eyebrowDivider} />
              THE CAMPUS · DOHA
            </div>
            <div style={S.capTitle}>
              Designed by <em>Foster + Partners</em>.
              <br />
              Built by <em>JB Pastor &amp; Fils</em>.
            </div>
          </div>
        </Reveal>
      </div>

      <div style={S.bottom}>
        <div style={S.bottomLeft}>
          <Reveal>
            <div style={S.eyebrow}>BY THE NUMBERS</div>
          </Reveal>
          <Reveal delay={120}>
            <h2 style={S.title}>
              A controlled environment,
              <br />
              <span style={S.titleAccent}>at sovereign scale.</span>
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p style={S.body}>
              One hundred thousand square meters of integrated infrastructure —
              residency, compute and operations under a single sovereign roof.
            </p>
          </Reveal>
        </div>

        <div style={S.factGrid}>
          {FACTS.map((f, i) => (
            <Reveal key={f.label} delay={i * 100} y={16}>
              <FactCard fact={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FactCard({ fact }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.fact,
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        background: hover ? 'rgba(190,18,60,0.06)' : 'transparent',
      }}
    >
      <div
        style={{
          ...S.factAccentBar,
          transform: hover ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
      <div style={S.factVal}>{fact.render()}</div>
      <div style={S.factLabel}>{fact.label}</div>
      <div style={S.factSub}>{fact.sub}</div>
    </div>
  );
}

const S = {
  section: {
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    paddingBottom: 0,
  },
  imgWrap: {
    position: 'relative',
    width: '100%',
    height: '78vh',
    minHeight: 480,
    overflow: 'hidden',
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    willChange: 'transform',
    transition: 'transform 0.1s linear',
  },
  imgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(14,16,19,.4) 0%, rgba(14,16,19,.05) 35%, rgba(14,16,19,.85) 100%)',
  },
  imgCaption: {
    position: 'absolute',
    bottom: 48,
    left: 48,
    right: 48,
    color: '#fff',
  },
  capEyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 14,
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
  capTitle: {
    fontSize: 'clamp(22px, 2.6vw, 36px)',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
    maxWidth: 720,
  },

  bottom: {
    background: 'var(--color-gray-900)',
    padding: '90px 48px 110px',
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: 64,
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,.05)',
    maxWidth: 1400,
    margin: '0 auto',
  },
  bottomLeft: {
    maxWidth: 460,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 18,
  },
  title: {
    fontSize: 'clamp(28px, 3.2vw, 44px)',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: -0.8,
    fontStyle: 'italic',
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  body: {
    marginTop: 22,
    fontSize: 13,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,.6)',
  },

  factGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    border: '1px solid rgba(255,255,255,.08)',
  },
  fact: {
    position: 'relative',
    padding: '28px 24px',
    borderRight: '1px solid rgba(255,255,255,.08)',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 140,
    justifyContent: 'space-between',
    transition: 'transform 0.4s cubic-bezier(.22,.61,.36,1), background 0.3s ease',
    cursor: 'default',
    overflow: 'hidden',
  },
  factAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1)',
  },
  factVal: {
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: -1.4,
    lineHeight: 1,
    color: '#fff',
  },
  factLabel: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: 'var(--color-accent-strong)',
  },
  factSub: {
    marginTop: 3,
    fontSize: 9.5,
    letterSpacing: 1.2,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
  },
};
