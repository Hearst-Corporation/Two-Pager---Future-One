'use client';

// ChatToggleFAB — ouvre le rail droit (IC + Kimi) en drawer overlay.
// Le centre reste full-width ; --ct-rail-right = 0 (cp-tokens.css).
//
// Mécanique : toggle la classe `cp-chat-drawer-open` sur <body>. cockpit.css
// applique alors `transform: translateX(0)` au .ct-rail-right du shell + révèle
// le backdrop. Le shell garde son ChatKimi monté en permanence (aucune perte
// de conversation au open/close).

import { useEffect, useState, useCallback } from 'react';
import './chat-fab.css';

const BODY_CLASS = 'cp-chat-drawer-open';

export default function ChatToggleFAB() {
  const [open, setOpen] = useState(false);

  const sync = useCallback((next) => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle(BODY_CLASS, next);
    setOpen(next);
  }, []);

  const close = useCallback(() => sync(false), [sync]);
  const toggle = useCallback(() => sync(!open), [open, sync]);

  // ESC ferme le drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Cleanup : ne jamais laisser la classe trainer si le composant unmount
  useEffect(() => () => {
    if (typeof document !== 'undefined') document.body.classList.remove(BODY_CLASS);
  }, []);

  return (
    <>
      {/* Backdrop : derrière le drawer, devant le reste */}
      <div
        className="cp-chat-drawer-backdrop"
        aria-hidden="true"
        onClick={close}
        data-open={open ? 'true' : 'false'}
      />

      {/* FAB : bouton flottant */}
      <button
        type="button"
        className="cp-chat-drawer-fab"
        aria-label={open ? 'Fermer le chat Kimi' : 'Ouvrir le chat Kimi'}
        aria-expanded={open}
        onClick={toggle}
        data-open={open ? 'true' : 'false'}
      >
        {open ? (
          // X close icon
          <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          // Chat bubble icon
          <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M3 5.5A2.5 2.5 0 015.5 3h11A2.5 2.5 0 0119 5.5v8A2.5 2.5 0 0116.5 16H9l-4.5 3.5V16H5.5A2.5 2.5 0 013 13.5v-8z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}
