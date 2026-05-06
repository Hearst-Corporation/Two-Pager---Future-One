'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from '../ui/Reveal';

export default function SectionOpportunity() {
  const imgRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: imgRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

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
          <Reveal delay={60}>
            <h2 style={S.headline}>
              A controlled environment
              <br />
              for the frontier of AI.
            </h2>
          </Reveal>
          <Reveal delay={120}>
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
        </div>

        <div style={S.right}>
          <Reveal delay={100} y={32}>
            <div style={S.imgFrame} ref={imgRef}>
              <motion.video
                src="/u2883995211_Futuristic_autonomous_data_center_sleek_white_and_260510d3-d95d-4eba-9737-a28010909814_0.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={{ ...S.img, width: '100%', height: '120%', y }}
              />
              <div style={S.imgOverlay} />
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
    gap: 'clamp(40px, 6vw, 80px)',
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
    fontSize: 14,
    lineHeight: 1.75,
    color: 'var(--color-text-secondary)',
    marginTop: 16,
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
    position: 'absolute',
    objectFit: 'cover',
    display: 'block',
  },
  imgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(14,16,19,.85) 100%)',
  },
  imgCaption: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    color: 'var(--color-text-inverse)',
    background: 'var(--color-dark-surface)',
    opacity: 0.85,
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
