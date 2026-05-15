'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV, findPrimaryByPath, getPrimaryHref } from '@/lib/design-system/navigation';

const ACTIONS = ['Audit', 'Recalculer', 'Exporter'];
const MODES = ['Édition', 'Lecture'];

function IconSlot({ filled = false }) {
  return (
    <span
      style={{
        display: 'block',
        width: 16,
        height: 16,
        borderRadius: 3,
        ...(filled
          ? { background: 'currentColor', opacity: 0.8 }
          : { border: '1px solid currentColor', opacity: 0.4 }),
      }}
    />
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
                aria-pressed={active}
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
                <IconSlot />
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
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    width: 'max-content',
    padding: '20px 32px',
    borderRadius: 9999,
  },
  barInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 15,
    fontWeight: 500,
    color: 'rgba(245, 245, 245, 0.65)',
  },
  seg: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  segBtn: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'rgba(245, 245, 245, 0.40)',
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 400,
    borderRadius: 9999,
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'color 0.15s ease, background 0.15s ease',
  },
  segBtnActive: {
    color: '#ffffff',
  },
  segBtnPrimary: {
    fontWeight: 500,
  },
};
