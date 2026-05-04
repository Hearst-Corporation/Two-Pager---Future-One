'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

const SATELLITES = [
  { angle: -90, key: 'COMPUTE & HPC', sub: 'Tier IV · NVIDIA H100 / H200' },
  { angle: -30, key: 'ENERGY', sub: 'Reliable · Sustainable · Optimized' },
  { angle: 30, key: 'INFRASTRUCTURE', sub: 'Campus · Connectivity · Security' },
  { angle: 90, key: 'TALENT', sub: 'Engineers · Researchers · Operators' },
  { angle: 150, key: 'AI SERVICES', sub: 'Models · Data · Tools · Platforms' },
  { angle: 210, key: 'COMMUNITY', sub: 'Founders · Residents · Partners' },
];

const RADIUS = 140;
const CENTER_R = 50;
const SAT_R = 11;

export default function SectionHub() {
  const hubRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

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

  return (
    <section id="hub" style={S.section}>
      <div style={S.container}>
        <div style={S.header}>
          <Reveal>
            <div style={S.eyebrow}>
              <span style={S.eyebrowNum}>04</span>
              <span style={S.eyebrowDivider} />
              THE SOVEREIGN AI INFRASTRUCTURE HUB
            </div>
          </Reveal>
          <Reveal delay={120}>
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
              {SATELLITES.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                const startX = CENTER_R * Math.cos(rad);
                const startY = CENTER_R * Math.sin(rad);
                const lineLen = RADIUS - CENTER_R - SAT_R;
                const isHovered = hoveredKey === s.key;
                return (
                  <div
                    key={`line-${s.key}`}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: lineLen,
                      height: 1,
                      background: isHovered
                        ? 'linear-gradient(90deg, var(--color-accent-soft) 0%, var(--color-accent-strong) 100%)'
                        : 'linear-gradient(90deg, var(--color-accent-strong) 0%, rgba(190,18,60,.15) 100%)',
                      transform: `translate(${startX}px, ${startY}px) rotate(${s.angle}deg) scaleX(${animated ? 1 : 0})`,
                      transformOrigin: '0 50%',
                      transition: `transform 0.7s cubic-bezier(.22,.61,.36,1) ${i * 120 + 200}ms, background 0.3s ease`,
                      opacity: isHovered ? 1 : 0.85,
                    }}
                  />
                );
              })}

              <div
                style={{
                  ...S.hubCenter,
                  opacity: animated ? 1 : 0,
                  transform: animated
                    ? 'translate(-50%, -50%) scale(1)'
                    : 'translate(-50%, -50%) scale(0.6)',
                }}
              >
                <div style={S.hubCenterTitle}>FUTUR ONE</div>
                <div style={S.hubCenterSub}>QATAR</div>
              </div>

              {SATELLITES.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                const x = Math.cos(rad) * RADIUS;
                const y = Math.sin(rad) * RADIUS;
                const isRight = Math.cos(rad) > 0.1;
                const isLeft = Math.cos(rad) < -0.1;
                const align = isRight ? 'left' : isLeft ? 'right' : 'center';
                const offsetX = isRight ? 18 : isLeft ? -18 : 0;
                const offsetY = align === 'center' ? (s.angle === -90 ? -18 : 18) : 0;
                const isHovered = hoveredKey === s.key;

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
                      opacity: animated ? 1 : 0,
                      transition: `opacity 0.5s ease ${i * 120 + 600}ms`,
                      cursor: 'default',
                    }}
                  >
                    <div
                      style={{
                        ...S.satDot,
                        transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                        background: isHovered
                          ? 'var(--color-accent-strong)'
                          : 'var(--color-gray-850)',
                        boxShadow: isHovered
                          ? '0 0 0 6px rgba(190,18,60,.25), 0 0 14px rgba(190,18,60,.5)'
                          : '0 0 0 3px rgba(190,18,60,.15)',
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
                        width: 140,
                        textAlign: align,
                        transition: 'color 0.3s ease',
                      }}
                    >
                      <div
                        style={{
                          ...S.satTitle,
                          color: isHovered ? 'var(--color-accent-soft)' : '#fff',
                        }}
                      >
                        {s.key}
                      </div>
                      <div style={S.satSub}>{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Reveal delay={300} y={28}>
            <div style={S.imgWrap}>
              <img src="/supercomputer-wide.png" alt="FUTUR ONE compute hall" style={S.img} />
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
    gridTemplateColumns: '1fr 1fr',
    gap: 48,
    alignItems: 'center',
  },

  hubWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 420,
  },
  hub: {
    position: 'relative',
    width: RADIUS * 2,
    height: RADIUS * 2,
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
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow:
      '0 0 0 6px rgba(190,18,60,.08), 0 8px 28px -6px rgba(190,18,60,.5)',
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
  satDot: {
    width: SAT_R * 2,
    height: SAT_R * 2,
    borderRadius: '50%',
    background: 'var(--color-gray-850)',
    border: '2px solid var(--color-accent-strong)',
    boxShadow: '0 0 0 3px rgba(190,18,60,.15)',
    transition: 'transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
  },
  satTitle: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: '#fff',
    transition: 'color 0.3s ease',
  },
  satSub: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,.5)',
    marginTop: 3,
    lineHeight: 1.4,
  },

  imgWrap: {
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
    color: '#fff',
  },
};
