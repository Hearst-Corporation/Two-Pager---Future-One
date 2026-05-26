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
        {hasProjection ? (
          <span style={S.statusReady}>
            <span style={S.dot} /> Plan ready
          </span>
        ) : (
          <span style={S.statusDim}>Fill in your numbers to generate a plan</span>
        )}
      </div>
      <div style={S.actions}>
        <button type="button" onClick={onExportMd} disabled={!hasProjection} style={S.btnLink}>
          ↓ Summary (.md)
        </button>
        <button type="button" onClick={onOpenFinancial} disabled={!hasProjection || !saved} style={S.btnSecondary}>
          Open financial model →
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!hasProjection || saving}
          style={{
            ...S.btnPrimary,
            ...(saving || !hasProjection ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
            ...(saved ? { background: 'var(--cp-accent-maroon)' } : {}),
          }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save this plan'}
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
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    boxShadow: 'var(--cp-shadow-md)',
    backdropFilter: 'blur(12px)',
    zIndex: 10,
    minHeight: 56,
  },
  left: { fontSize: 12, color: 'var(--cp-text-muted)', display: 'flex', alignItems: 'center', gap: 8 },
  statusReady: {
    color: 'var(--cp-accent-maroon)',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: 999,
    background: 'var(--cp-accent-maroon)',
    boxShadow: '0 0 0 3px var(--cp-accent-soft)',
  },
  statusDim: { fontStyle: 'italic' },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },

  btnLink: {
    fontSize: 12,
    height: 36,
    padding: '0 12px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  btnSecondary: {
    fontSize: 12,
    height: 36,
    padding: '0 16px',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
  },
  btnPrimary: {
    fontSize: 13,
    height: 36,
    padding: '0 20px',
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 800,
    letterSpacing: 0.2,
  },
};
