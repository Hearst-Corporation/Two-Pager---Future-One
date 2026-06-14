'use client';

import { memo } from 'react';
import { Button } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

function SimulatorCTABar({
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
    <div data-cta-bar style={S.bar}>
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
        <Button variant="link" size="md" disabled={!hasProjection} onClick={onExportMd}>
          {UI.RESULTS_CTA_EXPORT}
        </Button>
        {onSave && (
          <Button variant="secondary" size="md" disabled={!hasProjection || saving} onClick={onSave}>
            {saving ? UI.STATE_SAVING : UI.RESULTS_CTA_SAVE}
          </Button>
        )}
        <Button variant="primary" size="lg" disabled={!hasProjection} onClick={onGenerateMemo} style={{ padding: 'var(--cp-space-3) var(--cp-space-6)', fontSize: 'var(--cp-font-base)' }}>
          {UI.RESULTS_CTA_MEMO}
        </Button>
      </div>
    </div>
  );
}

export default memo(SimulatorCTABar);

const S = {
  bar: {
    padding: 'var(--cp-space-6) 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--cp-space-4)',
    minHeight: 56,
    flexWrap: 'wrap',
    borderTop: '1px solid var(--cp-border-base)',
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
    color: 'var(--cp-status-warning)',
    fontWeight: 'var(--cp-weight-bold)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    background: 'var(--cp-status-warning-soft)',
    border: '1px solid var(--cp-status-warning-border)',
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
    background: 'var(--cp-status-warning)',
  },
  statusDim: { fontStyle: 'italic' },
  actions: { display: 'flex', gap: 'var(--cp-space-4)', alignItems: 'center', flexWrap: 'wrap' },
};
