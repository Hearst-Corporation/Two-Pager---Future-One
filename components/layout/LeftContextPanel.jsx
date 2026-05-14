'use client';
/* ============================================================
   OPENCLAW · LEFT CONTEXT PANEL
   ------------------------------------------------------------
   Fixed-width left panel for contextual navigation, filters,
   lists, and section-specific tools. Scrolls internally.
   ============================================================ */

import { BG, CARD, TEXT, SP, T, W, LS, BORDER, NAV, ACCENT } from '@/lib/design-system/tokens';

export default function LeftContextPanel({ header, children }) {
  return (
    <div style={S.panel}>
      {header && (
        <div style={S.header}>
          {header}
        </div>
      )}
      <div style={S.scroll}>
        {children}
      </div>
    </div>
  );
}

/** Section title within the left panel */
export function PanelSection({ title, children }) {
  return (
    <div style={S.section}>
      {title && <div style={S.sectionTitle}>{title}</div>}
      {children}
    </div>
  );
}

/** Navigation item for the left panel */
export function PanelNavItem({ label, icon, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.navItem,
        ...(active ? S.navItemActive : {}),
      }}
    >
      {icon && <span style={S.navIcon}>{icon}</span>}
      <span style={S.navLabel}>{label}</span>
      {badge != null && <span style={S.navBadge}>{badge}</span>}
    </button>
  );
}

const S = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    flexShrink: 0,
    padding: `${SP[4]}px ${SP[5]}px`,
    borderBottom: `1px solid ${BORDER.color}`,
    background: `linear-gradient(180deg, ${BG.elevated} 0%, transparent 100%)`,
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: `${SP[3]}px ${SP[4]}px`,
  },
  section: {
    marginBottom: `${SP[5]}px`,
  },
  sectionTitle: {
    fontSize: T.mini,
    fontWeight: W.black,
    letterSpacing: LS.caps,
    color: TEXT.muted,
    textTransform: 'uppercase',
    marginBottom: `${SP[3]}px`,
    paddingLeft: `${SP[3]}px`,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: `${SP[3]}px`,
    width: '100%',
    padding: `${SP[2]}px ${SP[3]}px`,
    minHeight: NAV.itemHeight,
    borderRadius: CARD.radiusSm,
    background: 'transparent',
    border: 'none',
    color: TEXT.secondary,
    fontSize: T.body,
    fontWeight: W.semibold,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.12s ease, color 0.12s ease',
  },
  navItemActive: {
    background: NAV.activeBg,
    color: TEXT.primary,
    boxShadow: `inset 2px 0 0 ${ACCENT.main}, ${NAV.activeGlow}`,
  },
  navIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: NAV.iconSize,
    height: NAV.iconSize,
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  navBadge: {
    fontSize: T.micro,
    fontWeight: W.black,
    color: TEXT.inverse,
    background: ACCENT.main,
    padding: `1px ${SP[2]}px`,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
