'use client';

import { useCallback, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import TextReveal from '../ui/TextReveal';

const MagneticParticles = dynamic(() => import('../ui/MagneticParticles'), {
  ssr: false,
  loading: () => null,
});

const HeroIntroGate = dynamic(() => import('./HeroIntroGate'), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const [introDone, setIntroDone] = useState(false);
  const handleIntroEnter = useCallback(() => setIntroDone(true), []);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section id="top" ref={heroRef} style={S.hero}>
      {/* Particles intro — hidden once entered */}
      {!introDone && (
        <MagneticParticles
          imageUrl="/futur-one-h-accent.svg"
          color={0xbe123c}
          particleCount={45000}
        />
      )}
      {!introDone && <HeroIntroGate onEnter={handleIntroEnter} />}

      {/* Video bg — always mounted, visible once intro done */}
      <motion.video
        style={{ ...S.video, opacity: introDone ? 1 : 0, transition: 'opacity 0.8s ease', y, scale: 1.1 }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        src="/hero-loop.mp4"
      />

      <div style={{ ...S.overlay, opacity: introDone ? 1 : 0, transition: 'opacity 0.8s ease' }} />
      <div style={S.vignette} />

      {/* Editorial content — revealed after intro */}
      <div style={{ ...S.tagRow, opacity: introDone ? 1 : 0, transition: 'opacity 0.6s ease 0.2s' }}>
        <span style={S.tagDot} />
        <span style={S.tag}>FUTUR ONE · QATAR</span>
        <span style={S.tagDivider} />
        <span style={S.tagSub}>SOVEREIGN AI INNOVATION HUB</span>
      </div>

      <div style={{ ...S.content, opacity: introDone ? 1 : 0, transition: 'opacity 0.6s ease 0.1s' }}>
        <h1 style={S.title}>
          <TextReveal delay={400}>FUTUR ONE</TextReveal>
          <br />
          <span style={S.titleAccent}>
            <TextReveal delay={600}>NO LIMITS,</TextReveal>
          </span>{' '}
          <TextReveal delay={800}>BY AI.</TextReveal>
        </h1>

        <p style={S.lede}>
          <TextReveal delay={1000} type="word">
            A sovereign AI innovation hub on the Qatari coast — where compute,
            architecture and talent operate as one.
          </TextReveal>
        </p>
      </div>

      <div style={{ ...S.bottom, opacity: introDone ? 1 : 0, transition: 'opacity 0.6s ease 0.4s' }}>
        <div style={S.signature}>
          <span style={S.sigLabel}>OPERATED BY</span>
          <span style={S.sigName}>HEARST QATAR</span>
        </div>

        <div style={S.scrollHint}>
          <span>SCROLL</span>
          <div style={S.scrollLine} />
        </div>
      </div>
    </section>
  );
}

const S = {
  hero: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    minHeight: 640,
    overflow: 'hidden',
    color: 'var(--color-text-inverse)',
    background: 'var(--color-gray-900)',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(14,16,19,.55) 0%, rgba(14,16,19,.25) 35%, rgba(14,16,19,.85) 100%)',
    zIndex: 1,
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(80% 60% at 50% 100%, rgba(190,18,60,.18) 0%, rgba(0,0,0,0) 60%)',
    pointerEvents: 'none',
    zIndex: 1,
  },

  tagRow: {
    position: 'absolute',
    top: 110,
    left: 48,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--color-accent-strong)',
    boxShadow: '0 0 0 3px rgba(190,18,60,.18)',
  },
  tag: {
    fontSize: 10,
    letterSpacing: 2.2,
    fontWeight: 700,
    color: 'var(--color-text-inverse)',
  },
  tagDivider: {
    width: 24,
    height: 1,
    background: 'var(--color-border-medium)',
    opacity: 0.25,
  },
  tagSub: {
    fontSize: 10,
    letterSpacing: 2.2,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
  },

  content: {
    position: 'absolute',
    left: 48,
    right: 48,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    maxWidth: 880,
  },
  title: {
    fontSize: 'clamp(40px, 6.4vw, 92px)',
    lineHeight: 0.98,
    fontWeight: 800,
    letterSpacing: -2,
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  lede: {
    marginTop: 22,
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--color-text-muted)',
    maxWidth: 480,
    fontWeight: 400,
  },

  bottom: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 36,
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 18,
    borderTop: '1px solid rgba(255,255,255,.1)',
  },
  signature: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sigLabel: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
  },
  sigName: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: 800,
    color: 'var(--color-text-inverse)',
  },

  scrollHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 700,
    color: 'var(--color-text-muted)',
  },
  scrollLine: {
    width: 48,
    height: 1,
    background: 'var(--color-border-medium)',
    opacity: 0.4,
  },
};
