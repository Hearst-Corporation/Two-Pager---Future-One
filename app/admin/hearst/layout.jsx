'use client';
/* ============================================================
   HEARST COCKPIT LAYOUT — pixel-near port
   Left rail (88) | Center (page) | Right rail (420: chat + alerts)
   Floating bottom bar (sub-menu) | Maroon glass theme
   ============================================================ */

import './cockpit.css';
import { useHubMode } from '@hearst/hub-sdk';
import ChatMount from '@/components/hearst/ChatMount';
import HearstIconRail from '@/components/hearst/HearstIconRail';
import HearstRightRail from '@/components/hearst/HearstRightRail';
import HearstBottomBar from '@/components/hearst/HearstBottomBar';
import { SimulationProvider } from '@/lib/hearst-simulation-context';

// ---------------------------------------------------------------------------
// Contrat hub-mode Phase A — embarqué dans le hub Hearst (?hub=1 / window.hearstHub)
// Oracle masque son propre chrome (rail gauche, rail droit, bottom bar, ambients)
// pour ne pas doubler le chrome du hub. Standalone (isHub===false) : no-op strict.
//
// WHY backdrop-filter → none :
// Dans un guest <webview> Electron, Chromium ne peut pas résoudre
// backdrop-filter:blur, -webkit-backdrop-filter, ni mask-image correctement →
// zones noires/vides. On neutralise .cockpit-glass, .cockpit-btn-glass,
// .cockpit-rail-right qui portent ces propriétés.
// ---------------------------------------------------------------------------
function HubModeStyles() {
  const { isHub } = useHubMode();
  if (!isHub) return null;
  return (
    <style>{`
      /* ── Chrome Oracle : rails + bottom bar masqués ────────────── */
      .cockpit-rail-left  { display: none !important; }
      .cockpit-rail-right { display: none !important; }
      .cockpit-ambient-deep { display: none !important; }
      .cockpit-ambient-glow { display: none !important; }

      /* ── Center panel full-width sans les rails ─────────────────── */
      .cockpit-root > [style] > div:first-child ~ div {
        /* fallback si les rails sont simplement cachés plutôt que absents */
        flex: 1 !important;
      }

      /* ── backdrop-filter → none (webview compositing) ───────────── */
      .cockpit-glass,
      .cockpit-glass::before {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: var(--cp-surface-2) !important;
      }
      .cockpit-btn-glass {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: rgba(255,255,255,0.08) !important;
      }
      .cockpit-rail-right {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `}</style>
  );
}

export default function HearstLayout({ children }) {
  return (
    <SimulationProvider>
    <div className="cockpit-root" style={S.root}>
      <div className="cockpit-ambient-deep" />
      <div className="cockpit-ambient-glow" />

      <HubModeStyles />

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
    </SimulationProvider>
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
