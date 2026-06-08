'use client';

import { Button } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

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

  const reasonSnippet = cautionReason
    ? (cautionReason.length > 52 ? cautionReason.slice(0, 49) + '…' : cautionReason)
    : null;

  return (
    <div style={S.bar}>
      <div style={S.left}>
        {hasProjection && planCaution ? (
          <span style={S.statusCaution}>
            <span style={S.dotCaution} />
            {UI.RESULTS_CTA_PLAN_REVIEW}{reasonSnippet ? ` · ${reasonSnippet}` : ''}
          </span>
        ) : hasProjection ? (
          <span style={S.statusReady}>
            <span style={S.dot} /> {UI.RESULTS_CTA_PLAN_READY}
          </span>
        ) : (
          <span style={S.statusDim}>{UI.RESULTS_CTA_FILL}</span>
        )}
      </div>
      <div style={S.actions}>
        <Button variant="link" size="sm" disabled={!hasProjection} onClick={onExportMd}>
          {UI.RESULTS_CTA_EXPORT}
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasProjection || saving} onClick={onSave}>
          {saving ? UI.STATE_SAVING : UI.RESULTS_CTA_SAVE}
        </Button>
        <Button variant="primary" size="sm" disabled={!hasProjection} onClick={onGenerateMemo}>
          {UI.RESULTS_CTA_MEMO}
        </Button>
      </div>
    </div>
  );
}

const S = {
  bar: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
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
    fontWeight: 'var(--cp-weight-bold)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
  },
  statusCaution: {
    color: 'var(--cp-text-strong)',
    fontWeight: 'var(--cp-weight-bold)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-accent)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-1) var(--cp-space-3)',
    fontSize: 'var(--cp-font-sm)',
  },
  dot: {
    display: 'inline-block',
    width: 'var(--cp-space-2)',
    height: 'var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-accent-maroon)',
    boxShadow: '0 0 0 3px var(--cp-accent-soft)',
  },
  dotCaution: {
    display: 'inline-block',
    width: 'var(--cp-space-2)',
    height: 'var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-accent)',
    boxShadow: '0 0 0 3px var(--cp-accent-soft)',
  },
  statusDim: { fontStyle: 'italic' },
  actions: { display: 'flex', gap: 'var(--cp-space-2)', alignItems: 'center', flexWrap: 'wrap' },
};
