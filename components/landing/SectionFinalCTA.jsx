'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

export default function SectionFinalCTA() {
  const sectionRef = useRef(null);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const wh = window.innerHeight;
        const progress = (rect.top + rect.height / 2 - wh / 2) / wh;
        setParallax(progress * 80);
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
    <section id="contact" ref={sectionRef} style={S.section}>
      <img
        src="/aerial-campus-2.png"
        alt=""
        style={{ ...S.bg, transform: `translateY(${parallax}px) scale(1.15)` }}
      />
      <div style={S.overlay} />

      <div style={S.content}>
        <Reveal>
          <div style={S.eyebrow}>FUTUR ONE</div>
        </Reveal>

        <div style={S.headline}>
          <Reveal delay={100} y={32}>
            <span style={S.line}>AI</span>
          </Reveal>
          <Reveal delay={250} y={32}>
            <span style={S.line}>is the</span>
          </Reveal>
          <Reveal delay={400} y={32}>
            <span style={S.lineAccent}>new gas.</span>
          </Reveal>
        </div>

        <Reveal delay={650}>
          <p style={S.sub}>COMPUTE IS THE INFRASTRUCTURE OF NATIONS.</p>
        </Reveal>

        <Reveal delay={800}>
          <div style={S.actions}>
            <CTAButton href="/brochure" primary>
              Read the brochure
            </CTAButton>
            <CTAButton href="mailto:contact@futur.one">
              Request a private briefing
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CTAButton({ href, children, primary = false }) {
  const [hover, setHover] = useState(false);
  const baseStyle = primary
    ? {
        background: hover ? 'var(--color-accent-soft)' : 'var(--color-accent-strong)',
        color: '#fff',
        border: '1px solid var(--color-accent-strong)',
      }
    : {
        background: hover ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
      };
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.cta,
        ...baseStyle,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover && primary
          ? '0 14px 30px -10px rgba(190,18,60,0.5)'
          : '0 0 0 0 rgba(0,0,0,0)',
      }}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        style={{
          marginLeft: 12,
          transition: 'transform 0.3s ease',
          transform: hover ? 'translateX(4px)' : 'translateX(0)',
        }}
      >
        →
      </span>
    </a>
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
    willChange: 'transform',
    transition: 'transform 0.1s linear',
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
  line: {
    color: '#fff',
    display: 'inline-block',
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
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 26px',
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: 700,
    textDecoration: 'none',
    transition:
      'transform 0.3s cubic-bezier(.22,.61,.36,1), background 0.3s ease, box-shadow 0.4s ease',
    cursor: 'pointer',
  },
};
