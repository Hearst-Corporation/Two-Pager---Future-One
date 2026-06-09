'use client';

import { useId, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';

/**
 * InfoHint — a subtle "(i)" affordance that explains something in plain English.
 * Education layer only: it adds no data, moves nothing, and never dominates.
 *
 * Two content modes:
 *  - `id`      → keys UI.KPI_EDU[id], renders the 3-line metric explainer
 *                (what it means · how ORACLE computes it · why it matters).
 *  - `content` → { title?, body } renders a free explanation popup (used on the
 *                operating-model / hardware cards, which need a fuller paragraph).
 *
 * Opens on hover (pointer) and on click/focus (keyboard / touch). Closes on blur,
 * Escape, outside click, or pointer-leave. Stops event propagation so it can live
 * inside a clickable card without triggering the card's own onClick.
 *
 * @param {{ id?: string, label?: string, content?: {title?: string, body: string},
 *           align?: 'left'|'right' }} props
 */
export default function InfoHint({ id, label, content, align = 'left' }) {
  const edu = id ? UI.KPI_EDU[id] : null;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { setOpen(false); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }
  }, []);

  // Nothing to show → render nothing (keeps callers simple).
  if (!edu && !content) return null;
  const aria = label ? UI.KPI_EDU_ARIA(label) : UI.KPI_EDU_ARIA_GENERIC;
  const popStyle = align === 'right' ? { ...S.pop, left: 'auto', right: 0 } : S.pop;

  return (
    <span
      ref={wrapRef}
      style={S.wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={aria}
        aria-expanded={open}
        aria-describedby={open ? popId : undefined}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        onPointerDown={(e) => e.stopPropagation()}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        style={S.icon}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16.5" />
          <line x1="12" y1="7.5" x2="12" y2="7.51" />
        </svg>
      </button>

      {open && (
        <span role="tooltip" id={popId} style={popStyle} onPointerDown={(e) => e.stopPropagation()}>
          {edu ? (
            <>
              <span style={S.popLine}>
                <span style={S.popTag}>{UI.KPI_EDU_MEANS}</span>
                <span style={S.popText}>{edu.means}</span>
              </span>
              <span style={S.popLine}>
                <span style={S.popTag}>{UI.KPI_EDU_HOW}</span>
                <span style={S.popText}>{edu.how}</span>
              </span>
              <span style={S.popLine}>
                <span style={S.popTag}>{UI.KPI_EDU_WHY}</span>
                <span style={S.popText}>{edu.why}</span>
              </span>
            </>
          ) : (
            <span style={S.popLine}>
              {content.title && <span style={S.popTitle}>{content.title}</span>}
              <span style={S.popText}>{content.body}</span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}

InfoHint.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  content: PropTypes.shape({ title: PropTypes.string, body: PropTypes.string.isRequired }),
  align: PropTypes.oneOf(['left', 'right']),
};

const S = {
  wrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    width: 'var(--cp-space-4)',
    height: 'var(--cp-space-4)',
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-faint)',
    cursor: 'help',
    borderRadius: 'var(--cp-radius-pill)',
    transition: 'color var(--cp-dur-fast) var(--cp-ease-out)',
  },
  pop: {
    position: 'absolute',
    bottom: 'calc(100% + var(--cp-space-2))',
    left: 0,
    zIndex: 'var(--cp-z-floating)',
    width: 'max-content',
    maxWidth: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-tooltip-bg)',
    border: '1px solid var(--cp-border-strong)',
    borderRadius: 'var(--cp-radius-md)',
    boxShadow: 'var(--cp-shadow-md)',
    textTransform: 'none',
    letterSpacing: 'normal',
    whiteSpace: 'normal',
    cursor: 'default',
  },
  popLine: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(var(--cp-space-1) / 2)',
  },
  popTag: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  popTitle: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    marginBottom: 'calc(var(--cp-space-1) / 2)',
  },
  popText: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-regular)',
    lineHeight: 'var(--cp-leading-normal)',
  },
};
