'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  S00Cover,
  S01Vision2030,
  S02WhoWeAre,
  S03Capabilities,
  S04Champion,
  S05Architecture,
  S06Stack,
  S07Method,
  S08Numbers,
  S09Alignment,
  S10Closing,
} from './slides';

const SLIDES = [
  { id: 0, Component: S00Cover, label: 'Cover' },
  { id: 1, Component: S01Vision2030, label: 'Vision' },
  { id: 2, Component: S02WhoWeAre, label: 'Hearst Qatar' },
  { id: 3, Component: S03Capabilities, label: 'Capabilities' },
  { id: 4, Component: S04Champion, label: 'The Campus' },
  { id: 5, Component: S05Architecture, label: 'Masterplan' },
  { id: 6, Component: S06Stack, label: 'The Stack' },
  { id: 7, Component: S07Method, label: 'Method' },
  { id: 8, Component: S08Numbers, label: 'Numbers' },
  { id: 9, Component: S09Alignment, label: 'Vision 2030' },
  { id: 10, Component: S10Closing, label: 'Closing' },
];

export default function Deck() {
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const go = useCallback(
    (delta) => {
      setIndex((i) => Math.max(0, Math.min(SLIDES.length - 1, i + delta)));
      setShowHint(false);
    },
    [],
  );

  const goTo = useCallback((i) => {
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
    setShowHint(false);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Home') {
        goTo(0);
      } else if (e.key === 'End') {
        goTo(SLIDES.length - 1);
      } else if (/^[0-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        if (n >= 0 && n < SLIDES.length) goTo(n);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, goTo]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onWheel = (e) => {
      // Empêche le scroll natif de la page entière (le rebond sur Mac)
      e.preventDefault();
      
      if (window.wheelTimeout) return;
      
      if (e.deltaY > 20) {
        go(1);
        window.wheelTimeout = setTimeout(() => { window.wheelTimeout = null; }, 600);
      } else if (e.deltaY < -20) {
        go(-1);
        window.wheelTimeout = setTimeout(() => { window.wheelTimeout = null; }, 600);
      }
    };

    // On attache l'événement en non-passif pour pouvoir faire e.preventDefault()
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [go]);

  const Current = SLIDES[index].Component;

  return (
    <div style={S.deck}>
      <Current />

      {/* Navigation invisible — clics zones gauche/droite */}
      <div
        style={{ ...S.clickZone, ...S.clickLeft }}
        onClick={() => go(-1)}
        aria-label="Slide précédente"
      />
      <div
        style={{ ...S.clickZone, ...S.clickRight }}
        onClick={() => go(1)}
        aria-label="Slide suivante"
      />

      {/* Footer minimal — pagination + hint */}
      <div style={S.footer}>
        <div style={S.brand}>
          <span style={S.brandAccent}>FUTUR</span>
          <span style={{ marginLeft: 6 }}>ONE</span>
        </div>
        <div style={S.dots}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Aller à ${s.label}`}
              style={{
                ...S.dot,
                ...(i === index ? S.dotActive : null),
              }}
            />
          ))}
        </div>
        <div style={S.counter}>
          {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </div>

      {showHint && (
        <div style={S.hint}>
          ← → pour naviguer · F pour plein écran · 0–9 accès direct
        </div>
      )}
    </div>
  );
}

const S = {
  deck: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--color-bg-main)',
    color: 'var(--color-text-primary)',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  clickZone: {
    position: 'absolute',
    top: 0,
    bottom: 80,
    width: '20%',
    cursor: 'pointer',
    zIndex: 50,
  },
  clickLeft: { left: 0 },
  clickRight: { right: 0 },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    padding: '0 100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background:
      'linear-gradient(180deg, rgba(245,245,246,0) 0%, rgba(245,245,246,0.9) 50%, rgba(245,245,246,1) 100%)',
    zIndex: 100,
    pointerEvents: 'none',
  },
  brand: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 3,
    color: 'var(--color-text-secondary)',
    pointerEvents: 'auto',
  },
  brandAccent: { color: 'var(--color-accent-strong)' },
  dots: {
    display: 'flex',
    gap: 8,
    pointerEvents: 'auto',
  },
  dot: {
    width: 22,
    height: 3,
    border: 0,
    padding: 0,
    background: 'var(--color-gray-300)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: 0,
  },
  dotActive: {
    background: 'var(--color-accent-strong)',
    width: 32,
  },
  counter: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    fontVariantNumeric: 'tabular-nums',
    pointerEvents: 'auto',
  },
  hint: {
    position: 'fixed',
    top: 32,
    right: 32,
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 4,
    fontSize: 11,
    letterSpacing: 1,
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    zIndex: 200,
    backdropFilter: 'blur(8px)',
  },
};
