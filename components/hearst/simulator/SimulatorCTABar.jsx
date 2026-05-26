'use client';

export default function SimulatorCTABar({
  onSave,
  onOpenFinancial,
  onExportMd,
  savingState = 'idle',
  hasProjection = false,
}) {
  const saving = savingState === 'saving';
  const saved = savingState === 'saved';

  return (
    <div style={S.bar}>
      <div style={S.left}>
        {hasProjection
          ? <span style={S.status}>Ready!</span>
          : <span style={S.statusDim}>Need more info</span>}
      </div>
      <div style={S.actions}>
        <button type="button" onClick={onExportMd} disabled={!hasProjection} style={S.btnGhost}>
          Download summary
        </button>
        <button type="button" onClick={onOpenFinancial} disabled={!hasProjection || !saved} style={S.btnGhost}>
          See full financial breakdown
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!hasProjection || saving}
          style={{ ...S.btnPrimary, ...(saving ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}>
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save this plan'}
        </button>
      </div>
    </div>
  );
}

const S = {
  bar: {
    position: 'sticky',
    bottom: 0,
    background: 'var(--cp-surface-2)',
    borderTop: '1px solid var(--cp-border)',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
    zIndex: 10,
  },
  left: { fontSize: 11, color: 'var(--cp-text-muted)' },
  status: { color: 'var(--cp-success)', fontWeight: 700 },
  statusDim: { fontStyle: 'italic' },
  actions: { display: 'flex', gap: 8 },
  btnGhost: {
    fontSize: 12,
    padding: '7px 14px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnPrimary: {
    fontSize: 12,
    padding: '7px 18px',
    background: 'var(--cp-accent-strong)',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 800,
  },
};
