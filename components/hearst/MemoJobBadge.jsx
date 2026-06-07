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
    right: 'var(--cp-space-4)',
    // Au-dessus du chrome bas (nav mobile + FAB) via --cp-toast-bottom
    bottom: 'var(--cp-toast-bottom)',
    zIndex: Z.fabOpen,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-primary)',
    border: '1px solid var(--cp-accent-maroon, var(--cp-accent))',
    borderRadius: 'var(--cp-radius-md)',
    boxShadow: 'var(--cp-shadow-md)',
    cursor: 'pointer',
    fontFamily: 'var(--cp-font-sans, sans-serif)',
    minWidth: 200,
    transition: 'transform var(--cp-dur-base) var(--cp-ease), box-shadow var(--cp-dur-base) var(--cp-ease)',
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
    gap: 'var(--cp-space-1)',
    flex: 1,
    textAlign: 'left',
  },
  title: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wide)',
    color: 'var(--cp-text-strong)',
  },
  sub: {
    fontSize: 'var(--cp-font-micro)',
    fontFamily: 'ui-monospace, monospace',
    color: 'var(--cp-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  chevron: {
    fontSize: 'var(--cp-font-lg)',
    color: 'var(--cp-text-muted)',
    flexShrink: 0,
  },
};
