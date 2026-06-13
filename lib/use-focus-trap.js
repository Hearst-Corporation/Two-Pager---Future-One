// lib/use-focus-trap.js — focus initial, Tab cycle, Escape, restore on unmount.

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * @param {boolean} active
 * @param {{ onEscape?: () => void }} [opts]
 */
export function useFocusTrap(active, { onEscape } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const prevFocus = document.activeElement;
    node?.focus();

    function onKey(e) {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const focusables = node.querySelectorAll(FOCUSABLE);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (prevFocus instanceof HTMLElement) prevFocus.focus();
    };
  }, [active, onEscape]);

  return ref;
}
