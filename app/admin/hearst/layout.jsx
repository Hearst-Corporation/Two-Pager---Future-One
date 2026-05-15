'use client';
/* ============================================================
   HEARST COCKPIT LAYOUT — pixel-near port
   Left rail (88) | Center (chat + page) | Right rail (320)
   Floating bottom bar (sub-menu) | Maroon glass theme
   ============================================================ */

import './cockpit.css';
import ChatMount from '@/components/hearst/ChatMount';
import HearstIconRail from '@/components/hearst/HearstIconRail';
import HearstRightRail from '@/components/hearst/HearstRightRail';
import HearstBottomBar from '@/components/hearst/HearstBottomBar';

export default function HearstLayout({ children }) {
  return (
    <div className="cockpit-root" style={S.root}>
      <div className="cockpit-ambient-deep" />
      <div className="cockpit-ambient-glow" />

      <div style={S.panelsRow}>
        <HearstIconRail />

        <div style={S.centerPanel}>
          <div style={S.chatArea}>
            <ChatMount />
          </div>
          <div style={S.pageArea}>{children}</div>
          <HearstBottomBar />
        </div>

        <HearstRightRail />
      </div>
    </div>
  );
}

const S = {
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    height: '100%',
    overflow: 'hidden',
    color: '#f5f5f5',
  },
  panelsRow: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  centerPanel: {
    position: 'relative',
    flex: 1,
    minWidth: 520,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  chatArea: {
    flexShrink: 0,
    height: '50%',
    minHeight: 280,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  pageArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '40px 64px 200px',
  },
};
