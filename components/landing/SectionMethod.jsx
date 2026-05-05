'use client';

import { useState, useEffect, useRef } from 'react';
import Reveal from './Reveal';

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
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [maxTranslate, setMaxTranslate] = useState(0);

  // Mesurer la largeur du track via ResizeObserver — robuste au layout async (fonts, images).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const trackWidth = el.scrollWidth;
      const viewport = window.innerWidth;
      setMaxTranslate(Math.max(0, trackWidth - viewport));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalScroll = rect.height - windowHeight;
      if (totalScroll <= 0 || maxTranslate <= 0) {
        setScrollProgress(0);
        return;
      }

      let progress = -rect.top / totalScroll;
      progress = Math.max(0, Math.min(1, progress));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [maxTranslate]);

  // Hauteur dynamique : 100vh (pin) + autant de pixels qu'il faut pour scroller le track horizontalement.
  // Si rien à scroller (track ≤ viewport), la section fait juste 100vh, pas de zone vide.
  const sectionHeight =
    maxTranslate > 0 ? `calc(100vh + ${maxTranslate}px)` : '100vh';

  return (
    <section id="method" ref={sectionRef} style={{ ...S.section, height: sectionHeight }}>
      <div style={S.stickyContainer}>
        <div style={S.bg} />
        <div style={S.bgOverlay} />

        <div style={S.contentWrapper}>
          <div style={S.header}>
            <Reveal>
              <div style={S.eyebrow}>
                <span style={S.eyebrowNum}>06</span>
                <span style={S.eyebrowDivider} />
                THE PROGRAM
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h2 style={S.title}>
                THE <span style={S.titleAccent}>METHOD.</span>
              </h2>
            </Reveal>
            <Reveal delay={240}>
              <p style={S.subtitle}>
                A four-phase residency program — from first line of code to global
                anchor.
              </p>
            </Reveal>
          </div>

          {/* Horizontal Track */}
          <div style={S.trackContainer}>
            <div 
              ref={trackRef}
              style={{
                ...S.track,
                transform: `translate3d(-${scrollProgress * maxTranslate}px, 0, 0)`,
              }}
            >
              {/* Timeline Line */}
              <div style={S.timelineLine}>
                <div style={{
                  ...S.timelineProgress,
                  transform: `scaleX(${Math.min(1, scrollProgress * 1.1)})`,
                }} />
              </div>

              {PHASES.map((p, i) => {
                const nodeProgress = Math.min(1, scrollProgress * 1.1);
                const reached = nodeProgress >= (i / (PHASES.length - 1));
                return (
                <div key={p.n} style={S.phaseWrapper}>
                  {/* Timeline Node */}
                  <div style={{
                    ...S.timelineNode,
                    borderColor: reached
                      ? 'var(--color-accent-strong)'
                      : 'rgba(255,255,255,0.2)',
                    background: reached
                      ? 'var(--color-accent-strong)'
                      : 'transparent',
                  }} />
                  
                  <PhaseCard phase={p} isLast={i === PHASES.length - 1} />
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({ phase, isLast }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.card,
        transform: hover ? 'translateY(-8px)' : 'translateY(0)',
      }}
      data-magnetic="true"
    >
      <div
        style={{
          ...S.cardAccentBar,
          transform: hover ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={S.cardN}>{phase.n}</div>
        <div style={S.cardTitle}>{phase.title}</div>
        <div style={S.cardStage}>{phase.stage}</div>
        <div style={S.cardDivider} />
        <p style={S.cardBody}>{phase.body}</p>
      </div>
      {!isLast && <div style={S.cardArrow}>›</div>}
    </div>
  );
}

const S = {
  section: {
    position: 'relative',
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
  },
  stickyContainer: {
    position: 'sticky',
    top: 0,
    height: '100vh',
    width: '100%',
    overflow: 'clip',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: '12vh',
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
      'linear-gradient(180deg, rgba(14,16,19,.95) 0%, rgba(14,16,19,.65) 50%, rgba(14,16,19,.95) 100%)',
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
  header: {
    maxWidth: 640,
    marginBottom: 40,
    marginLeft: 'max(48px, calc((100vw - 1400px) / 2))',
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

  trackContainer: {
    width: '100%',
    overflow: 'visible',
  },
  track: {
    display: 'flex',
    gap: 80,
    paddingLeft: 'max(48px, calc((100vw - 1400px) / 2))',
    paddingRight: '48px', // Extra space at the end
    position: 'relative',
    willChange: 'transform',
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    left: 'max(48px, calc((100vw - 1400px) / 2))',
    right: 0,
    height: 2,
    background: 'rgba(255,255,255,0.1)',
    zIndex: 0,
  },
  timelineProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.1s linear',
  },
  phaseWrapper: {
    position: 'relative',
    paddingTop: 40, // Space for timeline
    width: 380,
    flexShrink: 0,
  },
  timelineNode: {
    position: 'absolute',
    top: 14,
    left: 32,
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    backgroundColor: 'var(--color-gray-900)',
    zIndex: 1,
    transition: 'all 0.4s ease',
  },
  card: {
    position: 'relative',
    background: 'var(--color-gray-850)',
    padding: '32px 28px 36px',
    minHeight: 280,
    display: 'flex',
    flexDirection: 'column',
    transition:
      'transform 0.4s cubic-bezier(.22,.61,.36,1), background 0.3s ease, box-shadow 0.4s ease',
    cursor: 'default',
    willChange: 'transform',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1)',
  },
  cardN: {
    fontSize: 48,
    fontWeight: 800,
    letterSpacing: -2,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
  },
  cardTitle: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: '#fff',
  },
  cardStage: {
    marginTop: 8,
    fontSize: 11,
    color: 'rgba(255,255,255,.65)',
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  cardDivider: {
    marginTop: 24,
    height: 1,
    background: 'rgba(255,255,255,.1)',
  },
  cardBody: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,.6)',
  },
  cardArrow: {
    position: 'absolute',
    right: -12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 24,
    color: 'var(--color-accent-strong)',
    fontWeight: 300,
    zIndex: 2,
    background: 'var(--color-gray-900)',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};