'use client';

/* ============================================================
   FUTUR ONE — OPERATOR DECK ENGINE
   ------------------------------------------------------------
   Same UX family as MISA decks (keyboard, wheel, dots, fullscreen).
   Reads ?to=<name> from URL to watermark each slide footer.
   ============================================================ */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  S00Cover,
  S01Vision,
  S02Project,
  S03Site,
  S04SlotIsReal,
  S05YourRole,
  S06WontDo,
  S07Capital,
  S08Risk,
  S09Path,
} from './Slides';
import { FONT_STACK } from '../../pitch/tokens';

const SLIDES = [
  { id: 0, Component: S00Cover, label: 'Cover' },
  { id: 1, Component: S01Vision, label: 'Vision' },
  { id: 2, Component: S02Project, label: 'Project' },
  { id: 3, Component: S03Site, label: 'Site' },
  { id: 4, Component: S04SlotIsReal, label: 'Slot is Real' },
  { id: 5, Component: S05YourRole, label: 'Your Role' },
  { id: 6, Component: S06WontDo, label: "What we won't do" },
  { id: 7, Component: S07Capital, label: 'Capital' },
  { id: 8, Component: S08Risk, label: 'Risk' },
  { id: 9, Component: S09Path, label: '60-Day Path' },
];

export default function OperatorDeck({ pillar }) {
  const sp = useSearchParams();
  const recipient = sp.get('to') || '';
  const token = sp.get('t') || '';
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const wheelLockRef = useRef(null);
  const sessionRef = useRef(null);
  const slideEnterRef = useRef(0);
  const currentRef = useRef(0);

  // Send a tracking ping. `slide_index` is the slide that was just *active*,
  // and `duration_ms` is how long it was visible. Called either when leaving
  // a slide (with its full visible duration) or on initial entry (duration 0).
  const sendPing = useCallback((slideIdx, label, duration) => {
    if (!token || !sessionRef.current) return;
    fetch('/api/track/deck-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        session_id: sessionRef.current,
        slide_index: slideIdx,
        slide_label: label,
        duration_ms: duration,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [token]);

  // Boot session id and log initial slide on mount (client only).
  useEffect(() => {
    if (!token) return;
    const KEY = `fto_session_${token}`;
    let s = window.sessionStorage.getItem(KEY);
    if (!s) {
      s = (crypto.randomUUID && crypto.randomUUID()) || `${Math.random().toString(36).slice(2)}${Date.now()}`;
      window.sessionStorage.setItem(KEY, s);
    }
    sessionRef.current = s;
    slideEnterRef.current = Date.now();
    sendPing(0, SLIDES[0].label, 0);
  }, [token, sendPing]);

  // Final ping when the deck unmounts: capture time spent on the last slide.
  useEffect(() => {
    return () => {
      if (!token || !sessionRef.current) return;
      const elapsed = Date.now() - slideEnterRef.current;
      sendPing(currentRef.current, SLIDES[currentRef.current].label, elapsed);
    };
  }, [token, sendPing]);

  // When the user navigates away from a slide, log the time they spent on it.
  const logLeave = useCallback((leavingIdx) => {
    if (!token) return;
    const now = Date.now();
    const elapsed = now - slideEnterRef.current;
    slideEnterRef.current = now;
    sendPing(leavingIdx, SLIDES[leavingIdx].label, elapsed);
  }, [token, sendPing]);

  const go = useCallback((delta) => {
    setIndex((i) => {
      const next = Math.max(0, Math.min(SLIDES.length - 1, i + delta));
      if (next !== i) {
        logLeave(i);
        currentRef.current = next;
      }
      return next;
    });
    setShowHint(false);
  }, [logLeave]);

  const goTo = useCallback((target) => {
    setIndex((cur) => {
      const next = Math.max(0, Math.min(SLIDES.length - 1, target));
      if (next !== cur) {
        logLeave(cur);
        currentRef.current = next;
      }
      return next;
    });
    setShowHint(false);
  }, [logLeave]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Home') goTo(0);
      else if (e.key === 'End') goTo(SLIDES.length - 1);
      else if (/^[0-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        if (n >= 0 && n < SLIDES.length) goTo(n);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
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
      e.preventDefault();
      if (wheelLockRef.current) return;
      if (e.deltaY > 20) {
        go(1);
        wheelLockRef.current = setTimeout(() => { wheelLockRef.current = null; }, 600);
      } else if (e.deltaY < -20) {
        go(-1);
        wheelLockRef.current = setTimeout(() => { wheelLockRef.current = null; }, 600);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      if (wheelLockRef.current) {
        clearTimeout(wheelLockRef.current);
        wheelLockRef.current = null;
      }
    };
  }, [go]);

  const Current = SLIDES[index].Component;

  return (
    <div style={S.deck}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        >
          <Current pillar={pillar} recipient={recipient} />
        </motion.div>
      </AnimatePresence>

      <div style={{ ...S.clickZone, ...S.clickLeft }} onClick={() => go(-1)} aria-label="Previous slide" />
      <div style={{ ...S.clickZone, ...S.clickRight }} onClick={() => go(1)} aria-label="Next slide" />

      <div style={S.footer}>
        <div style={S.brand}>
          <span style={S.brandAccent}>FUTUR</span>
          <span style={{ marginLeft: 6 }}>ONE</span>
          <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{pillar.label}</span>
          {recipient && (
            <>
              <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>FOR {recipient.toUpperCase()}</span>
            </>
          )}
        </div>
        <div style={S.dots}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.label}`}
              style={{ ...S.dot, ...(i === index ? S.dotActive : null) }}
            />
          ))}
        </div>
        <div style={S.counter}>
          {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </div>

      {showHint && (
        <div style={S.hint}>
          ← → to navigate · F fullscreen · 0–9 jump · Home / End
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
    fontFamily: FONT_STACK,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  clickZone: { position: 'absolute', top: 0, bottom: 80, width: '20%', cursor: 'pointer', zIndex: 50 },
  clickLeft: { left: 0 },
  clickRight: { right: 0 },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    padding: '0 8vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'none',
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
  dots: { display: 'flex', gap: 8, pointerEvents: 'auto' },
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
  dotActive: { background: 'var(--color-accent-strong)', width: 32 },
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
    background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
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
