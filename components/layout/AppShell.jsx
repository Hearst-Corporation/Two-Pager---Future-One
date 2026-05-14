'use client';
/* ============================================================
   OPENCLAW · APP SHELL
   ------------------------------------------------------------
   Root shell for the HEARST module. Provides the 3-zone layout:
   Sidebar (fixed) | MainWorkspace (flex) with Left/Chat/Right.
   Height: 100dvh, no external scroll. Internal scroll per panel.
   ============================================================ */

import { BG, LAYOUT, SP } from '@/lib/design-system/tokens';

export default function AppShell({ sidebar, children }) {
  return (
    <div style={S.shell}>
      {/* Sidebar — fixed width, full height */}
      <div style={S.sidebarWrap}>{sidebar}</div>

      {/* Main workspace — fills remaining space */}
      <div style={S.workspace}>{children}</div>
    </div>
  );
}

const S = {
  shell: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    height: '100dvh',
    background: BG.base,
    overflow: 'hidden',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  sidebarWrap: {
    flexShrink: 0,
    width: LAYOUT.sidebarWidth,
    height: '100%',
    zIndex: 100,
  },
  workspace: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};
