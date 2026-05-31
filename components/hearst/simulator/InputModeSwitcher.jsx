'use client';

const MODES = [
  { id: 'capital_first',     label: 'Budget',        sub: '$',       hint: 'How much money do you have?' },
  { id: 'mw_first',          label: 'Size',          sub: 'MW',      hint: 'How big do you want it?' },
  { id: 'target_irr_first',  label: 'Target return', sub: '%',       hint: 'What yearly return do you want?' },
];

export default function InputModeSwitcher({ mode, onChange, onBootstrap, onPreset, presets = [] }) {
  return (
    <div style={S.wrap}>
      <div style={S.label}>Starting point</div>

      <div style={S.modes} role="radiogroup" aria-label="Input mode">
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

      <div style={S.presetsRow}>
        <div style={S.presetsLabel}>Presets</div>
        <div style={S.presets}>
          {presets.map(p => (
            <button key={p.id} type="button" onClick={() => onPreset?.(p)} style={S.chip}>
              {p.label}
            </button>
          ))}
        </div>
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
    gap: 12,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modeBtn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '10px 14px',
    background: 'var(--cp-surface-0)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--cp-text-primary)',
    transition: 'all 0.15s ease',
    minHeight: 52,
  },
  modeBtnActive: {
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-maroon)',
  },
  modeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  modeLabel: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  modeSub: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  modeSubActive: { color: 'var(--cp-text-strong)', opacity: 0.85 },
  modeHint: {
    fontSize: 11,
    opacity: 0.8,
    lineHeight: '16px',
  },

  presetsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 4,
    borderTop: '1px dashed var(--cp-border)',
    marginTop: 4,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  presets: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 12px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  },
  bootstrap: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: 700,
    padding: '0',
    background: 'transparent',
    color: 'var(--cp-accent-maroon)',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
};
