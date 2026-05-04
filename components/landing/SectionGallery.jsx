'use client';

import { useState } from 'react';
import Reveal from './Reveal';

const ITEMS = [
  {
    src: '/desalination.png',
    label: 'INFRASTRUCTURE',
    title: 'The Plaza',
    span: 'wide',
  },
  {
    src: '/vault.png',
    label: 'INTERIOR',
    title: 'The Atrium',
    span: 'normal',
  },
  {
    src: '/water-compute.png',
    label: 'ENERGY',
    title: 'Water-cooled compute',
    span: 'normal',
  },
  {
    src: '/amphitheater.png',
    label: 'COMMUNITY',
    title: 'The Amphitheater',
    span: 'wide',
  },
];

export default function SectionGallery() {
  return (
    <section style={S.section}>
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <Reveal>
              <div style={S.eyebrow}>
                <span style={S.eyebrowNum}>02</span>
                <span style={S.eyebrowDivider} />
                INSIDE THE HUB
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h2 style={S.title}>
                One campus.
                <br />
                <span style={S.titleAccent}>Built for AI.</span>
              </h2>
            </Reveal>
          </div>
        </div>

        <div style={S.grid}>
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={i * 120} y={28}>
              <Tile item={it} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tile({ item }) {
  const [hover, setHover] = useState(false);
  return (
    <figure
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.tile,
        gridColumn: item.span === 'wide' ? 'span 2' : 'span 1',
      }}
    >
      <img
        src={item.src}
        alt={item.title}
        style={{
          ...S.img,
          transform: hover ? 'scale(1.06)' : 'scale(1)',
        }}
      />
      <div style={S.overlay} />
      <div
        style={{
          ...S.tileAccentBar,
          transform: hover ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
      <figcaption style={S.caption}>
        <span style={S.capLabel}>{item.label}</span>
        <span
          style={{
            ...S.capTitle,
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
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 56,
  },
  eyebrow: {
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
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  tile: {
    position: 'relative',
    margin: 0,
    aspectRatio: '4 / 5',
    overflow: 'hidden',
    background: 'var(--color-gray-850)',
    cursor: 'default',
  },
  tileAccentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1)',
    zIndex: 2,
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.7s cubic-bezier(.22,.61,.36,1)',
    willChange: 'transform',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(14,16,19,.85) 100%)',
    pointerEvents: 'none',
  },
  caption: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
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
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.3,
    transition: 'color 0.3s ease',
  },
};
