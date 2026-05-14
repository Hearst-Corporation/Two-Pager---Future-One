'use client';
/* ============================================================
   OPENCLAW · HEARST LAYOUT
   ------------------------------------------------------------
   Stable shell for the HEARST module. Three-zone layout:
   LeftContextPanel | ChatPanel (stable core) | RightContextPanel

   The chat NEVER unmounts when navigating between HEARST pages.
   Only the left/right panel content and the page content change.

   Key design decisions:
   - AdminSidebar is rendered by AdminLayout (parent). We receive it as children
     alongside our content, so we DON'T render a second sidebar.
   - The workspace fills the remaining width after AdminSidebar.
   - Page content renders in the center panel, below the chat header area.
   ============================================================ */

import HearstNavHeader from '@/components/layout/HearstNavHeader';
import ChatMount from '@/components/hearst/ChatMount';
import LeftPanelContent from '@/components/hearst/LeftPanelContent';
import RightPanelContent from '@/components/hearst/RightPanelContent';
import { BG, LAYOUT, SP, BORDER } from '@/lib/design-system/tokens';

export default function HearstLayout({ children }) {
  return (
    <div className="openclaw-dark" style={S.darkWrap}>
      {/* Top navigation header */}
      <HearstNavHeader />

      {/* Three-panel workspace */}
      <div style={S.panelsRow}>
        {/* Left context panel */}
        <div style={S.leftPanel}>
          <LeftPanelContent />
        </div>

        {/* Center: Chat (stable core) + Page content */}
        <div style={S.centerPanel}>
          {/* Chat is always mounted, always visible */}
          <div style={S.chatArea}>
            <ChatMount />
          </div>

          {/* Page content scrolls independently below chat */}
          <div style={S.pageArea}>
            {children}
          </div>
        </div>

        {/* Right context panel */}
        <div style={S.rightPanel}>
          <RightPanelContent />
        </div>
      </div>
    </div>
  );
}

const S = {
  darkWrap: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
    background: BG.base,
    color: '#f8fafc',
  },
  panelsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  leftPanel: {
    flexShrink: 0,
    width: LAYOUT.leftPanelWidth,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${BORDER.color}`,
    background: BG.elevated,
  },
  centerPanel: {
    flex: 1,
    minWidth: LAYOUT.chatMinWidth,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: BG.base,
  },
  chatArea: {
    flexShrink: 0,
    height: '55%',
    minHeight: 320,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: `1px solid ${BORDER.color}`,
  },
  pageArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: `${SP[5]}px`,
    background: BG.base,
  },
  rightPanel: {
    flexShrink: 0,
    width: LAYOUT.rightPanelWidth,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `1px solid ${BORDER.color}`,
    background: BG.elevated,
  },
};
