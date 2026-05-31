'use client';
/* ============================================================
   OPENCLAW · CHAT PANEL
   ------------------------------------------------------------
   Central chat panel — THE STABLE CORE of the interface.
   This panel NEVER unmounts when navigation changes.
   ============================================================ */

import { BG, TEXT, SP, FONT_SIZES as T, W, LS, BORDER, ACCENT } from '@/lib/design-system/tokens';

export default function ChatPanel({ header, children }) {
  return (
    <div style={S.panel}>
      {header && (
        <div style={S.header}>
          {header}
        </div>
      )}
      {children}
    </div>
  );
}

/** Header component for the chat panel */
export function ChatHeader({ title, subtitle, badge, actions }) {
  return (
    <div style={S.chatHeader}>
      <div style={S.chatHeaderMain}>
        <div style={S.chatTitleRow}>
          <span style={S.chatTitle}>{title}</span>
          {badge && <span style={S.chatBadge}>{badge}</span>}
        </div>
        {subtitle && <span style={S.chatSubtitle}>{subtitle}</span>}
      </div>
      {actions && <div style={S.chatActions}>{actions}</div>}
    </div>
  );
}

/** Composer area at bottom of chat */
export function ChatComposer({ children }) {
  return (
    <div style={S.composer}>
      {children}
    </div>
  );
}

const S = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    background: BG.base,
  },
  header: {
    flexShrink: 0,
    borderBottom: `1px solid ${BORDER.color}`,
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${SP[3]}px ${SP[5]}px`,
    gap: `${SP[4]}px`,
  },
  chatHeaderMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  chatTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
  },
  chatTitle: {
    fontSize: T.base,
    fontWeight: W.bold,
    color: TEXT.primary,
    letterSpacing: LS.normal,
  },
  chatBadge: {
    fontSize: T.micro,
    fontWeight: W.black,
    letterSpacing: LS.caps,
    color: TEXT.inverse,
    background: ACCENT.main,
    padding: `1px ${SP[2]}px`,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  chatSubtitle: {
    fontSize: T.caption,
    fontWeight: W.medium,
    color: TEXT.muted,
  },
  chatActions: {
    display: 'flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
    flexShrink: 0,
  },
  composer: {
    flexShrink: 0,
    padding: `${SP[3]}px ${SP[4]}px`,
    borderTop: `1px solid ${BORDER.color}`,
    background: BG.elevated,
  },
};
