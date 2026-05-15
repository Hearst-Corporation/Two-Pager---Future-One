'use client';

import { useEffect, useRef, useState } from 'react';
import { PARTICLES_EXPLODE_EVENT } from '../ui/MagneticParticles';

const REVEAL_DELAY_MS = 1100;
const HINT_REVEAL_MS = 800;

export default function HeroIntroGate({ onEnter }) {
  const [phase, setPhase] = useState('idle');
  const [hintVisible, setHintVisible] = useState(false);
  const enteredRef = useRef(false);
  const enterRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      enteredRef.current = true;
      setPhase('hidden');
      onEnter();
      return;
    }

    const enter = () => {
      if (enteredRef.current) return;
      enteredRef.current = true;
      window.dispatchEvent(new Event(PARTICLES_EXPLODE_EVENT));
      setPhase('hidden');
      window.setTimeout(onEnter, REVEAL_DELAY_MS);
    };

    enterRef.current = enter;

    // Trigger enter on first scroll or touch
    const onScrollOrTouch = () => {
      enter();
    };
    
    window.addEventListener('wheel', onScrollOrTouch, { passive: true, once: true });
    window.addEventListener('touchmove', onScrollOrTouch, { passive: true, once: true });

    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener('keydown', onKey);
    
    const hintTimer = window.setTimeout(() => setHintVisible(true), HINT_REVEAL_MS);

    return () => {
      enterRef.current = null;
      window.removeEventListener('wheel', onScrollOrTouch);
      window.removeEventListener('touchmove', onScrollOrTouch);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(hintTimer);
    };
  }, [onEnter]);

  if (phase === 'hidden') return null;

  return (
    <button
      type="button"
      aria-label="Enter the site"
      onClick={() => enterRef.current?.()}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      {hintVisible && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-accent-strong)',
            boxShadow: '0 0 0 0 rgba(190,18,60,0.6)',
            animation: 'futurPulse 1.8s ease-out infinite',
          }}
        />
      )}
      <style>{`
        @keyframes futurPulse {
          0%   { box-shadow: 0 0 0 0 rgba(190,18,60,0.6); }
          70%  { box-shadow: 0 0 0 14px rgba(190,18,60,0); }
          100% { box-shadow: 0 0 0 0 rgba(190,18,60,0); }
        }
      `}</style>
    </button>
  );
}
