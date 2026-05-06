'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from '../ui/Reveal';
import TextReveal from '../ui/TextReveal';
import MagneticButton from '../ui/MagneticButton';

export default function SectionFinalCTA() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section id="contact" ref={sectionRef} style={S.section}>
      <motion.video
        src="/test-cover-facade.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ ...S.bg, y, scale: 1.2 }}
      />
      <div style={S.overlay} />

      <div style={S.content}>
        <Reveal>
          <div style={S.eyebrow}>FUTUR ONE</div>
        </Reveal>

        <div style={S.headline}>
          <TextReveal delay={50}>AI</TextReveal>
          <TextReveal delay={200}>is the</TextReveal>
          <div style={S.lineAccent}>
            <TextReveal delay={350}>new gas.</TextReveal>
          </div>
        </div>

        <Reveal delay={600}>
          <p style={S.sub}>COMPUTE IS THE INFRASTRUCTURE OF NATIONS.</p>
        </Reveal>

        <Reveal delay={700}>
          <div style={S.actions}>
            <MagneticButton href="/brochure" style={S.ctaPrimary}>
              Read the brochure
              <span aria-hidden="true" style={{ marginLeft: 12 }}>→</span>
            </MagneticButton>
            <MagneticButton href="#request-briefing" style={S.ctaSecondary}>
              Request a private briefing
              <span aria-hidden="true" style={{ marginLeft: 12 }}>→</span>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const S = {
  section: {
    position: 'relative',
    color: 'var(--color-text-inverse)',
    padding: '140px 48px 120px',
    overflow: 'hidden',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
  },
  bg: {
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
      'linear-gradient(120deg, rgba(14,16,19,.55) 0%, rgba(14,16,19,.2) 60%, rgba(14,16,19,.05) 100%)',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 1100,
    margin: '0 auto',
    width: '100%',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 24,
  },
  headline: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 'clamp(56px, 9vw, 132px)',
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 0.95,
    letterSpacing: -2.4,
  },
  lineAccent: {
    color: 'var(--color-accent-strong)',
    display: 'inline-block',
  },
  sub: {
    marginTop: 28,
    fontSize: 11,
    letterSpacing: 2.6,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
  },
  actions: {
    marginTop: 44,
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 26px',
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: 700,
    textDecoration: 'none',
    background: 'var(--color-accent-strong)',
    color: 'var(--color-text-inverse)',
    border: '1px solid var(--color-accent-strong)',
    cursor: 'pointer',
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 26px',
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: 700,
    textDecoration: 'none',
    background: 'transparent',
    color: 'var(--color-text-inverse)',
    border: '1px solid var(--color-border-medium)',
    cursor: 'pointer',
  },
};
