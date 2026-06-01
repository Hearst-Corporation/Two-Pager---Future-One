'use client';

// MemoJobBadge — badge persistant bottom-right pendant la génération du memo
// quand la modale est fermée. Click → ré-ouvre la modale.
//
// Visible uniquement quand status === 'loading' && modal_visible === false.
// Affiche elapsed time + état de latence. Tokens --cp-* uniquement.

import {
  useMemoJob,
  showMemoModal,
  formatElapsed,
} from '@/lib/hearst-memo-job-store';
import { Z } from '@/lib/z-index';
import { T } from '@/lib/design-system/tokens';

const SLA_WARNING_MS = 120_000;

export default function MemoJobBadge() {
  const job = useMemoJob();

  if (job.status !== 'loading' || job.modal_visible) return null;

  const isSlowish = job.elapsed_ms > SLA_WARNING_MS;

  return (
    <button
      type="button"
      onClick={showMemoModal}
      aria-label="Reopen the memo being generated"
      style={S.badge}
    >
      <span style={S.spinner} />
      <span style={S.body}>
        <span style={S.title}>Memo in progress</span>
        <span style={{ ...S.sub, color: isSlowish ? 'var(--ct-status-warning)' : 'var(--cp-text-muted)' }}>
          {formatElapsed(job.elapsed_ms)}{isSlowish ? ' · still waiting for Kimi' : ''}
        </span>
      </span>
      <span style={S.chevron}>›</span>
    </button>
  );
}

const S = {
  badge: {
    position: 'fixed',
    right: 16,
    // Au-dessus du FAB chat (qui est à bottom: var(--cp-bar-bottom, 64px) + 16px)
    // On le place encore plus haut pour ne pas chevaucher
    bottom: 'calc(var(--cp-bar-bottom, 64px) + 80px)',
    zIndex: Z.fabOpen,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-primary)',
    border: '1px solid var(--cp-accent-maroon, var(--cp-accent))',
    borderRadius: 12,
    boxShadow: 'var(--cp-shadow-md)',
    cursor: 'pointer',
    fontFamily: 'var(--cp-font-sans, sans-serif)',
    minWidth: 200,
    transition: T.transformShadow,
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid var(--cp-border)',
    borderTopColor: 'var(--cp-accent-maroon, var(--cp-accent))',
    animation: 'memo-spin 0.9s linear infinite',
    flexShrink: 0,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
    textAlign: 'left',
  },
  title: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.3,
    color: 'var(--cp-text-strong)',
  },
  sub: {
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    color: 'var(--cp-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  chevron: {
    fontSize: 16,
    color: 'var(--cp-text-muted)',
    flexShrink: 0,
  },
};
