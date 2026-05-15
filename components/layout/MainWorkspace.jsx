'use client';
/* ============================================================
   OPENCLAW · MAIN WORKSPACE
   ------------------------------------------------------------
   Three-panel layout: LeftContextPanel | ChatPanel | RightContextPanel
   Left and Right have fixed widths. Chat is flexible but stable.
   Each panel scrolls independently.
   ============================================================ */

import { BG, LAYOUT, BORDER } from '@/lib/design-system/tokens';

export default function MainWorkspace({ leftPanel, chatPanel, rightPanel }) {
  return (
    <div style={S.workspace}>
      {/* Top nav area — reserved for HearstNavHeader */}
      <div style={S.navArea} />

      {/* Three panels */}
      <div style={S.panelsRow}>
        {/* Left context panel */}
        <div style={S.leftPanel}>{leftPanel}</div>

        {/* Center chat panel — the stable core */}
        <div style={S.chatPanel}>{chatPanel}</div>

        {/* Right context panel */}
        <div style={S.rightPanel}>{rightPanel}</div>
      </div>
    </div>
  );
}

const S = {
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    height: '100%',
    background: BG.base,
    overflow: 'hidden',
  },
  navArea: {
    flexShrink: 0,
    height: 0, /* Nav is rendered inside the layout, this reserves space if needed */
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
  chatPanel: {
    flex: 1,
    minWidth: LAYOUT.chatMinWidth,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
