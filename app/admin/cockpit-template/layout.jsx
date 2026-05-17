'use client';
import './cockpit-template.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/admin/cockpit-template' },
  { id: 'section-a', label: 'Section A', href: '/admin/cockpit-template/section-a' },
  { id: 'section-b', label: 'Section B', href: '/admin/cockpit-template/section-b' },
];

const ACTION_ITEMS = ['Action 1', 'Action 2', 'Action 3'];
const MODE_ITEMS = ['Edit', 'View'];

export default function CockpitTemplateLayout({ children }) {
  return (
    <div className="ct-root" style={S.root}>
      {/* Fond bordeaux + halo */}
      <div className="ct-ambient-deep" />
      <div className="ct-ambient-glow" />

      <div style={S.panelsRow}>

        {/* Rail gauche */}
        <aside className="ct-glass ct-rail-left" style={S.leftRail}>
          <div style={S.leftRailInner}>
            {/* Logo slot */}
            <div style={S.logoSlot}>
              <div style={S.logoDot} />
            </div>
            <div style={S.spacer} />
            {/* Avatar slot */}
            <div style={S.avatar}>AB</div>
          </div>
        </aside>

        {/* Centre */}
        <div style={S.centerPanel}>
          <div style={S.pageArea}>{children}</div>

          {/* Bottom bar flottante */}
          <footer className="ct-glass" style={S.bottomBar}>
            <div style={S.bottomBarInner}>
              <span style={S.bottomLabel}>● Cockpit</span>

              {/* Nav principale */}
              <div className="ct-seg-track" style={S.seg}>
                {NAV_ITEMS.map(item => (
                  <a key={item.id} href={item.href} style={S.segBtn}>
                    {item.label}
                  </a>
                ))}
              </div>

              {/* Actions */}
              <div className="ct-seg-track" style={S.seg}>
                {ACTION_ITEMS.map(label => (
                  <button key={label} type="button" style={S.segBtn}>{label}</button>
                ))}
              </div>

              {/* Modes */}
              <div className="ct-seg-track" style={S.seg}>
                {MODE_ITEMS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className={i === 0 ? 'ct-btn-primary' : undefined}
                    style={{ ...S.segBtn, ...(i === 0 ? S.segBtnActive : {}) }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </footer>
        </div>

        {/* Rail droit (chat / infos) */}
        <aside className="ct-rail-right" style={S.rightRail}>
          <div style={S.rightRailHeader}>
            <span style={S.rightRailTitle}>Assistant</span>
            <button type="button" style={S.rightRailBtn}>+</button>
          </div>
          <div style={S.rightRailBody}>
            {/* Slot pour chat ou panneau contextuel */}
            <p style={S.rightRailPlaceholder}>Panneau contextuel — remplacez ce contenu.</p>
          </div>
        </aside>

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
    color: 'var(--ct-text-primary)',
  },
  panelsRow: {
    position: 'relative',
    zIndex: 'var(--ct-z-content)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  /* Rail gauche */
  leftRail: {
    position: 'relative',
    zIndex: 'var(--ct-z-rails)',
    flexShrink: 0,
    width: 'var(--ct-rail-left)',
    height: '100%',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
  },
  leftRailInner: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--ct-space-7) 0',
  },
  logoSlot: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'var(--ct-surface-3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--ct-space-6)',
  },
  logoDot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'var(--ct-text-strong)',
  },
  spacer: { flex: 1 },
  avatar: {
    width: 'var(--ct-avatar-size)',
    height: 'var(--ct-avatar-size)',
    borderRadius: '50%',
    background: 'var(--ct-surface-3)',
    color: 'var(--ct-text-strong)',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  },

  /* Centre */
  centerPanel: {
    position: 'relative',
    flex: 1,
    minWidth: 'var(--ct-min-center)',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  pageArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: 'var(--ct-space-7) var(--ct-space-8) var(--ct-space-12)',
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 'var(--ct-space-6)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 'var(--ct-z-floating)',
    width: 'max-content',
    maxWidth: 'calc(100% - 48px)',
    padding: 'var(--ct-space-3) var(--ct-space-7)',
    borderRadius: 'var(--ct-radius-pill)',
  },
  bottomBarInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--ct-space-5)',
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--ct-text-body)',
    whiteSpace: 'nowrap',
  },
  seg: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--ct-space-1)',
  },
  segBtn: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'var(--ct-text-primary)',
    padding: 'var(--ct-space-2) var(--ct-space-4)',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 'var(--ct-radius-pill)',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--ct-space-2)',
  },
  segBtnActive: {
    borderRadius: 'var(--ct-radius-pill)',
    padding: 'var(--ct-space-2) var(--ct-space-4)',
    fontWeight: 700,
  },

  /* Rail droit */
  rightRail: {
    position: 'relative',
    zIndex: 'var(--ct-z-rails)',
    flexShrink: 0,
    width: 'var(--ct-rail-right)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  rightRailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--ct-space-5) var(--ct-space-5) var(--ct-space-3)',
    borderBottom: '1px solid var(--ct-border)',
  },
  rightRailTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ct-text-muted)',
  },
  rightRailBtn: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--ct-surface-2)',
    border: '1px solid var(--ct-border)',
    color: 'var(--ct-text-body)',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  rightRailBody: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--ct-space-5)',
  },
  rightRailPlaceholder: {
    fontSize: 12,
    color: 'var(--ct-text-muted)',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
};
