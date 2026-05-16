'use client';
/* ============================================================
   HEARST COCKPIT LAYOUT — pixel-near port
   Left rail (88) | Center (page) | Right rail (420: chat + alerts)
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
          <div style={S.pageArea}>{children}</div>
          <HearstBottomBar />
        </div>

        <HearstRightRail>
          <ChatMount />
        </HearstRightRail>
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
    color: 'var(--cp-text-primary)',
  },
  panelsRow: {
    position: 'relative',
    zIndex: 'var(--cp-z-content)',
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
    minWidth: 'var(--cp-min-center)',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  pageArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: 'var(--cp-space-7) var(--cp-space-8) var(--cp-space-12)',
  },
};
