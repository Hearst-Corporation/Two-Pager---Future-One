'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV, findPrimaryByPath, getPrimaryHref } from '@/lib/design-system/navigation';

const ACTIONS = ['Audit', 'Recalculer', 'Exporter'];
const MODES = ['Édition', 'Lecture'];

function IconSlot({ filled = false }) {
  if (filled) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="5" cy="5" r="5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export default function HearstBottomBar() {
  const pathname = usePathname();
  const activePrimary = findPrimaryByPath(pathname);

  const [activeAction, setActiveAction] = useState(ACTIONS[0]);
  const [activeMode, setActiveMode] = useState(MODES[0]);

  return (
    <footer
      aria-label="Sous-navigation"
      className="cockpit-glass"
      style={S.bar}
    >
      <div style={S.barInner}>
        <div style={S.status}>
          <IconSlot />
          <span>Cockpit</span>
        </div>

        <div className="cockpit-seg-track" style={S.seg}>
          {PRIMARY_NAV.map((group) => {
            const active = activePrimary?.id === group.id;
            return (
              <Link
                key={group.id}
                href={getPrimaryHref(group)}
                className={active ? 'cockpit-btn-glass' : undefined}
                style={{ ...S.segBtn, ...(active ? S.segBtnActive : {}) }}
                aria-current={active ? 'page' : undefined}
              >
                {group.label}
              </Link>
            );
          })}
        </div>

        <div className="cockpit-seg-track" style={S.seg}>
          {ACTIONS.map((label) => {
            const active = activeAction === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveAction(label)}
                className={active ? 'cockpit-btn-glass' : undefined}
                style={{ ...S.segBtn, ...(active ? S.segBtnActive : {}) }}
                aria-pressed={active}
              >
                <IconSlot filled={active} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="cockpit-seg-track" style={S.seg}>
          {MODES.map((label) => {
            const active = activeMode === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveMode(label)}
                className={active ? 'cockpit-btn-primary' : undefined}
                style={{ ...S.segBtn, ...(active ? S.segBtnPrimary : {}) }}
                aria-pressed={active}
              >
                <IconSlot filled={active} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
}

const S = {
  bar: {
    position: 'absolute',
    bottom: 'var(--cp-space-6)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 'var(--cp-z-floating)',
    width: 'max-content',
    maxWidth: 'calc(100% - var(--cp-space-9))',
    padding: 'var(--cp-space-3) var(--cp-space-7)',
    borderRadius: 'var(--cp-radius-pill)',
  },
  barInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-5)',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-medium)',
    color: 'var(--cp-text-body)',
  },
  seg: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-0)',
    padding: 'var(--cp-space-1)',
  },
  segBtn: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    padding: 'var(--cp-space-2) var(--cp-space-4)',
    minHeight: 'var(--cp-icon-btn-size)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-regular)',
    borderRadius: 'var(--cp-radius-pill)',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    transition: 'color var(--cp-dur-base) var(--cp-ease), background var(--cp-dur-base) var(--cp-ease)',
  },
  segBtnActive: {
    color: 'var(--cp-text-strong)',
  },
  segBtnPrimary: {
    color: 'var(--cp-text-primary)',
    fontWeight: 'var(--cp-weight-semibold)',
  },
};
