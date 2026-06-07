'use client';


const MODES = [
  { id: 'capital_first',     label: 'Budget',        sub: '$',       hint: 'How much money do you have?' },
  { id: 'mw_first',          label: 'Size',          sub: 'MW',      hint: 'How big do you want it?' },
  { id: 'target_irr_first',  label: 'Target return', sub: '%',       hint: 'What yearly return do you want?' },
];

export default function InputModeSwitcher({ mode, onChange, onBootstrap }) {
  return (
    <div style={S.wrap}>
      <div data-input-mode-grid style={S.modes} role="radiogroup" aria-label="Input mode">
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange?.(m.id)}
              style={{ ...S.modeBtn, ...(active ? S.modeBtnActive : {}) }}>
              <div style={S.modeRow}>
                <span style={S.modeLabel}>{m.label}</span>
                <span style={{ ...S.modeSub, ...(active ? S.modeSubActive : {}) }}>{m.sub}</span>
              </div>
              <div style={S.modeHint}>{m.hint}</div>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={onBootstrap} style={S.bootstrap}>
        Auto-fill with Qatar market data →
      </button>
    </div>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  modes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--cp-space-3)',
  },
  modeBtn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-surface-0)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--cp-text-primary)',
    transition: 'all var(--cp-dur-base) var(--cp-ease)',
    minHeight: 72,
  },
  modeBtnActive: {
    background: 'linear-gradient(180deg, var(--cp-accent-maroon), color-mix(in srgb, var(--cp-accent-maroon) 70%, var(--cp-surface-0)))',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-maroon)',
    boxShadow: '0 14px 36px -24px var(--cp-accent-maroon)',
  },
  modeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--cp-space-1)' },
  modeLabel: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  modeSub: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  modeSubActive: { color: 'var(--cp-text-strong)', opacity: 0.85 },
  modeHint: {
    fontSize: 'var(--cp-font-micro)',
    opacity: 0.8,
    lineHeight: '14px',
  },

  bootstrap: {
    alignSelf: 'flex-start',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    padding: 'var(--cp-space-0)',
    background: 'transparent',
    color: 'var(--cp-accent-maroon)',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
};
