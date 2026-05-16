'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from '../ui/Reveal';

const SATELLITES = [
  { angle: -90, key: 'COMPUTE & HPC', sub: 'Tier IV · NVIDIA H100 / H200', details: '100MW+ CAPACITY\nLIQUID COOLED' },
  { angle: -30, key: 'ENERGY', sub: 'Reliable · Sustainable · Optimized', details: 'SOLAR DESALINATION\nPUE < 1.15' },
  { angle: 30, key: 'INFRASTRUCTURE', sub: 'Campus · Connectivity · Security', details: 'FIBER BACKBONE\nZERO TRUST SEC' },
  { angle: 90, key: 'TALENT', sub: 'Engineers · Researchers · Operators', details: 'GLOBAL EXPERTS\nON-SITE LABS' },
  { angle: 150, key: 'AI SERVICES', sub: 'Models · Data · Tools · Platforms', details: 'SOVEREIGN LLMS\nDATA PRIVACY' },
  { angle: 210, key: 'COMMUNITY', sub: 'Founders · Residents · Partners', details: 'VC NETWORK\nLIVING CAMPUS' },
];

const RADIUS = 160;
const CENTER_R = 55;

export default function SectionHub() {
  const hubRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [glitchText, setGlitchText] = useState('');

  useEffect(() => {
    const el = hubRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setAnimated(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setAnimated(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Glitch effect logic
  useEffect(() => {
    if (!hoveredKey) {
      setGlitchText('');
      return;
    }
    const targetText = SATELLITES.find(s => s.key === hoveredKey)?.details || '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    let iterations = 0;
    
    const interval = setInterval(() => {
      setGlitchText(targetText.split('').map((char, index) => {
        if (char === '\n' || char === ' ') return char;
        if (index < iterations) return targetText[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      
      if (iterations >= targetText.length) {
        clearInterval(interval);
      }
      iterations += 1/3;
    }, 30);

    return () => clearInterval(interval);
  }, [hoveredKey]);

  const { scrollYProgress } = useScroll({
    target: hubRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section id="hub" style={S.section}>
      <div style={S.container}>
        <div style={S.header}>
          <Reveal>
            <div style={S.eyebrow}>
              <span style={S.eyebrowNum}>02</span>
              <span style={S.eyebrowDivider} />
              THE SOVEREIGN AI INFRASTRUCTURE HUB
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h2 style={S.title}>
              One integrated ecosystem.
              <br />
              <span style={S.titleAccent}>Six sovereign layers.</span>
            </h2>
          </Reveal>
        </div>

        <div style={S.grid}>
          <div style={S.hubWrap} ref={hubRef}>
            <div style={S.hub}>
              {/* SVG Network Lines */}
              <svg style={S.svgNetwork} viewBox="-200 -200 400 400">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-accent-strong)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--color-accent-strong)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                {SATELLITES.map((s, i) => {
                  const rad = (s.angle * Math.PI) / 180;
                  const x2 = Math.cos(rad) * RADIUS;
                  const y2 = Math.sin(rad) * RADIUS;
                  const isHovered = hoveredKey === s.key;
                  const isAnyHovered = hoveredKey !== null;
                  
                  return (
                    <g key={`connection-${s.key}`}>
                      <line
                        x1="0" y1="0" x2={x2} y2={y2}
                        stroke={isHovered ? 'var(--color-accent-soft)' : 'url(#lineGrad)'}
                        strokeWidth={isHovered ? 2 : 1}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.2}
                        style={{
                          strokeDasharray: RADIUS,
                          strokeDashoffset: animated ? 0 : RADIUS,
                          transition: `stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1) ${i * 100}ms, opacity 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease`
                        }}
                      />
                      {/* Data particles traveling along line */}
                      {isHovered && (
                        <circle r="3" fill="#fff">
                          <animateMotion
                            dur="1.5s"
                            repeatCount="indefinite"
                            path={`M 0 0 L ${x2} ${y2}`}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Center Node */}
              <div
                style={{
                  ...S.hubCenter,
                  opacity: animated ? 1 : 0,
                  transform: animated
                    ? 'translate(-50%, -50%) scale(1)'
                    : 'translate(-50%, -50%) scale(0.6)',
                }}
              >
                {hoveredKey ? (
                  <div style={S.glitchTextWrap}>
                    {glitchText.split('\n').map((line, i) => (
                      <div key={i} style={S.glitchLine}>{line}</div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={S.hubCenterTitle}>FUTUR ONE</div>
                    <div style={S.hubCenterSub}>QATAR</div>
                  </>
                )}
              </div>

              {/* Satellites */}
              {SATELLITES.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                const x = Math.cos(rad) * RADIUS;
                const y = Math.sin(rad) * RADIUS;
                const isRight = Math.cos(rad) > 0.1;
                const isLeft = Math.cos(rad) < -0.1;
                const align = isRight ? 'left' : isLeft ? 'right' : 'center';
                const offsetX = isRight ? 24 : isLeft ? -24 : 0;
                const offsetY = align === 'center' ? (s.angle === -90 ? -24 : 24) : 0;
                const isHovered = hoveredKey === s.key;
                const isAnyHovered = hoveredKey !== null;

                return (
                  <div
                    key={s.key}
                    onMouseEnter={() => setHoveredKey(s.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                      opacity: animated ? (!isAnyHovered || isHovered ? 1 : 0.3) : 0,
                      transition: `opacity 0.5s ease ${animated ? 0 : i * 120 + 600}ms`,
                      cursor: 'pointer',
                      zIndex: isHovered ? 10 : 1,
                    }}
                    data-magnetic="true"
                  >
                    <div
                      style={{
                        ...S.satDot,
                        transform: isHovered ? 'scale(1.5)' : 'scale(1)',
                        background: isHovered
                          ? 'var(--color-accent-strong)'
                          : 'var(--color-gray-850)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(${offsetX}px, ${offsetY}px) translateY(-50%) ${
                          isRight ? '' : isLeft ? 'translateX(-100%)' : 'translateX(-50%)'
                        }`,
                        width: 160,
                        textAlign: align,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          ...S.satTitle,
                          color: isHovered ? 'var(--color-accent-soft)' : '#fff',
                          transform: isHovered ? (isRight ? 'translateX(4px)' : isLeft ? 'translateX(-4px)' : 'translateY(-4px)') : 'translate(0)',
                        }}
                      >
                        {s.key}
                      </div>
                      <div style={{
                        ...S.satSub,
                        opacity: isHovered ? 1 : 0.6,
                        transform: isHovered ? (isRight ? 'translateX(4px)' : isLeft ? 'translateX(-4px)' : 'translateY(-4px)') : 'translate(0)',
                      }}>{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Reveal delay={150} y={28}>
            <div style={S.imgWrap}>
              <motion.video
                src="https://zrvlmhuymhyrzonnihce.supabase.co/storage/v1/object/public/landing-assets/FUTUR-ONE-FINAL.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={{ ...S.img, width: '100%', height: '120%', y }}
              />
              <div style={S.imgOverlay} />
              <div style={S.imgCaption}>
                <span style={S.capLabel}>SOVEREIGN COMPUTE</span>
                <span style={S.capTitle}>The compute floor — Phase 1</span>
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
    background: 'var(--color-gray-850)',
    color: 'var(--color-text-inverse)',
    padding: '120px 48px',
    borderTop: '1px solid rgba(255,255,255,.05)',
    overflow: 'hidden',
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    maxWidth: 720,
    marginBottom: 72,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 18,
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
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
    fontSize: 'clamp(28px, 3.6vw, 52px)',
    fontWeight: 700,
    letterSpacing: -1,
    lineHeight: 1.05,
    fontStyle: 'italic',
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
    gap: 48,
    alignItems: 'center',
  },

  hubWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 480,
    position: 'relative',
  },
  hub: {
    position: 'relative',
    width: 0,
    height: 0,
  },
  svgNetwork: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    height: 400,
    overflow: 'visible',
    pointerEvents: 'none',
  },
  hubCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: CENTER_R * 2,
    height: CENTER_R * 2,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 35% 30%, var(--color-accent-soft) 0%, var(--color-accent-strong) 60%, var(--color-accent-primary) 100%)',
    color: 'var(--color-text-inverse)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 2,
    transition: 'opacity 0.6s ease, transform 0.7s cubic-bezier(.34,1.56,.64,1)',
  },
  hubCenterTitle: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    lineHeight: 1,
  },
  hubCenterSub: {
    fontSize: 8,
    opacity: 0.85,
    marginTop: 3,
    letterSpacing: 1.6,
    fontWeight: 600,
  },
  glitchTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  glitchLine: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    color: 'var(--color-text-inverse)',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
  },
  satDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--color-gray-850)',
    border: '2px solid var(--color-accent-strong)',
    transition: 'transform 0.4s cubic-bezier(.34,1.56,.64,1), background 0.3s ease',
  },
  satTitle: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: 'var(--color-text-inverse)',
    transition: 'color 0.3s ease, transform 0.3s ease',
  },
  satSub: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    marginTop: 4,
    lineHeight: 1.4,
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },

  imgWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    background: 'var(--color-gray-900)',
  },
  img: {
    position: 'absolute',
    objectFit: 'cover',
    display: 'block',
  },
  imgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(14,16,19,.85) 100%)',
  },
  imgCaption: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  capLabel: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 800,
    color: 'var(--color-accent-soft)',
  },
  capTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: -0.2,
    color: 'var(--color-text-inverse)',
  },
};