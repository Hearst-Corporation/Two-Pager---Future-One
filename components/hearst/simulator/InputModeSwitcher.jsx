'use client';

const MODES = [
  { id: 'capital_first',     label: 'BUDGET $',     hint: 'How much money do you have to invest?' },
  { id: 'mw_first',          label: 'SIZE (MW)',    hint: 'How big do you want it? (in MW of power)' },
  { id: 'target_irr_first',  label: 'TARGET RETURN', hint: 'What yearly return do you want?' },
];

export default function InputModeSwitcher({ mode, onChange, onBootstrap, onPreset, presets = [] }) {
  return (
    <div style={S.wrap}>
      <div style={S.modes}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange?.(m.id)}
              aria-pressed={active}
              style={{ ...S.modeBtn, ...(active ? S.modeBtnActive : {}) }}>
              <div style={S.modeLabel}>{m.label}</div>
              <div style={S.modeHint}>{m.hint}</div>
            </button>
          );
        })}
      </div>
      <div style={S.actions}>
        {presets.map(p => (
          <button key={p.id} type="button" onClick={() => onPreset?.(p)} style={S.chip}>
            {p.label}
          </button>
        ))}
        <button type="button" onClick={onBootstrap} style={S.bootstrap}>
          Auto-fill with market data
        </button>
      </div>
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
    borderRadius: 8,
    padding: '14px 16px',
  },
  modes: {
    display: 'flex',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    padding: '12px 16px',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center',
    color: 'var(--cp-text-muted)',
    transition: 'all 0.15s ease',
  },
  modeBtnActive: {
    background: 'var(--cp-accent-strong)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-strong)',
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 1,
  },
  modeHint: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 12px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 20,
    cursor: 'pointer',
  },
  bootstrap: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: 700,
    padding: '6px 14px',
    background: 'var(--cp-info-strong-cta, var(--cp-info))',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
