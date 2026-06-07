'use client';

// MemoToast — notification persistante (pas auto-dismiss) quand le memo est prêt
// et que la modale n'a pas encore été ré-ouverte. Click → ouvre la modale.
//
// Visible quand status === 'done' && !seen_done && !modal_visible.
// Aussi : status === 'error' && !modal_visible → toast erreur (clickable
// pour ré-ouvrir la modale et voir le détail).
//
// Notification persistante par défaut, l'utilisateur doit l'acquitter.

import {
  useMemoJob,
  showMemoModal,
  markSeenDone,
  clearMemoJob,
  formatElapsed,
} from '@/lib/hearst-memo-job-store';
import { Z } from '@/lib/z-index';

export default function MemoToast() {
  const job = useMemoJob();

  if (job.modal_visible) return null;
  if (job.status === 'idle' || job.status === 'loading') return null;
  if (job.status === 'done' && job.seen_done) return null;

  const isDone = job.status === 'done';
  const isErr  = job.status === 'error';

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{ ...S.toast, ...(isErr ? S.toastError : S.toastDone) }}
    >
      <span style={isErr ? S.iconError : S.iconDone}>
        {isErr ? '!' : '✓'}
      </span>
      <button
        type="button"
        onClick={showMemoModal}
        style={S.body}
        aria-label={isDone ? 'Open the ready memo' : 'View memo error'}
      >
        <span style={S.title}>
          {isDone ? 'Strategic Memo ready' : 'Strategic Memo · error'}
        </span>
        <span style={S.sub}>
          {isDone
            ? `generated in ${formatElapsed(job.elapsed_ms)} · click to open`
            : (job.error || 'Unknown error')}
        </span>
      </button>
      <button
        type="button"
        onClick={isErr ? clearMemoJob : markSeenDone}
        style={S.dismiss}
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

const S = {
  toast: {
    position: 'fixed',
    right: 'var(--cp-space-4)',
    bottom: 'var(--cp-toast-bottom)',
    zIndex: Z.toast,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3) var(--cp-space-3) var(--cp-space-3) var(--cp-space-4)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    boxShadow: 'var(--cp-shadow-md)',
    fontFamily: 'var(--cp-font-sans, sans-serif)',
    minWidth: 280,
    maxWidth: 360,
    animation: 'memo-toast-in 240ms cubic-bezier(0.32, 0.72, 0, 1)',
  },
  toastDone: {
    background: 'var(--ct-status-success-soft)',
    borderColor: 'var(--ct-status-success-border)',
    color: 'var(--cp-text-strong)',
  },
  toastError: {
    background: 'var(--ct-status-danger-soft)',
    borderColor: 'var(--ct-status-danger-border)',
    color: 'var(--cp-text-strong)',
  },
  iconDone: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--ct-status-success)',
    color: 'var(--cp-bg-deep, var(--cp-surface-0))',
    fontSize: 'var(--cp-font-md)',
    fontWeight: 'var(--cp-weight-black)',
    flexShrink: 0,
  },
  iconError: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--ct-status-danger)',
    color: 'var(--cp-bg-deep, var(--cp-surface-0))',
    fontSize: 'var(--cp-font-md)',
    fontWeight: 'var(--cp-weight-black)',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-1)',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  sub: {
    fontSize: 'var(--cp-font-xs)',
    opacity: 0.85,
    lineHeight: 1.4,
  },
  dismiss: {
    width: 22,
    height: 22,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    opacity: 0.7,
    cursor: 'pointer',
    fontSize: 'var(--cp-font-lg)',
    lineHeight: 1,
    flexShrink: 0,
  },
};
