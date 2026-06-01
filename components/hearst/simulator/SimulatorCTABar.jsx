'use client';

export default function SimulatorCTABar({
  onSave,
  onExportMd,
  onGenerateMemo,
  savingState = 'idle',
  hasProjection = false,
  planCaution = false,
  cautionReason = null,
}) {
  const saving = savingState === 'saving';

  // Truncate reason to 52 chars so the badge stays on one line
  const reasonSnippet = cautionReason
    ? (cautionReason.length > 52 ? cautionReason.slice(0, 49) + '…' : cautionReason)
    : null;

  return (
    <div className="simulator-cta-bar" style={S.bar}>
      <div style={S.left}>
        {hasProjection && planCaution ? (
          <span style={S.statusCaution}>
            <span style={S.dotCaution} /> Plan needs review{reasonSnippet ? ` · ${reasonSnippet}` : ''}
          </span>
        ) : hasProjection ? (
          <span style={S.statusReady}>
            <span style={S.dot} /> Plan ready
          </span>
        ) : (
          <span style={S.statusDim}>Fill in your numbers to generate a plan</span>
        )}
      </div>
      <div style={S.actions}>
        <button type="button" onClick={onExportMd} disabled={!hasProjection} style={S.btnLink}>
          Export Summary
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!hasProjection || saving}
          style={{
            ...S.btnSecondary,
            ...(saving || !hasProjection ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
          }}>
          {saving ? 'Saving…' : 'Save Scenario'}
        </button>
        <button
          type="button"
          onClick={onGenerateMemo}
          disabled={!hasProjection}
          style={{
            ...S.btnPrimary,
            ...(!hasProjection ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
          }}>
          Generate Strategic Memo
        </button>
      </div>
    </div>
  );
}

const S = {
  bar: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 10px)',
    padding: 'var(--cp-space-4) var(--cp-space-5)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--cp-space-4)',
    marginTop: 'var(--cp-space-4)',
    minHeight: 56,
    flexWrap: 'wrap',
  },
  left: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)' },
  statusReady: {
    color: 'var(--cp-accent-maroon)',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  statusCaution: {
    color: 'var(--cp-text-strong)',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-accent)',
    borderRadius: 'var(--cp-radius-md)',
    padding: '3px 10px',
    fontSize: 'var(--cp-font-sm)',
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-accent-maroon)',
    boxShadow: '0 0 0 3px var(--cp-accent-soft)',
  },
  dotCaution: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-accent)',
    boxShadow: '0 0 0 3px var(--cp-accent-soft)',
  },
  statusDim: { fontStyle: 'italic' },
  actions: { display: 'flex', gap: 'var(--cp-space-2)', alignItems: 'center' },

  btnLink: {
    fontSize: 'var(--cp-font-sm)',
    height: 36,
    padding: '0 var(--cp-space-3)',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  btnSecondary: {
    fontSize: 'var(--cp-font-sm)',
    height: 36,
    padding: '0 var(--cp-space-4)',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    cursor: 'pointer',
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  btnPrimary: {
    fontSize: 'var(--cp-font-sm)',
    height: 36,
    padding: '0 var(--cp-space-5)',
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 'var(--cp-radius-sm)',
    cursor: 'pointer',
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
};
