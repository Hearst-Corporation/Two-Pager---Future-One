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
        aria-label={isDone ? 'Ouvrir le memo prêt' : 'Voir l\'erreur memo'}
      >
        <span style={S.title}>
          {isDone ? 'Strategic Memo prêt' : 'Strategic Memo · erreur'}
        </span>
        <span style={S.sub}>
          {isDone
            ? `généré en ${formatElapsed(job.elapsed_ms)} · click pour ouvrir`
            : (job.error || 'Erreur inconnue')}
        </span>
      </button>
      <button
        type="button"
        onClick={isErr ? clearMemoJob : markSeenDone}
        style={S.dismiss}
        aria-label="Acquitter la notification"
        title="Acquitter"
      >
        ×
      </button>
    </div>
  );
}

const S = {
  toast: {
    position: 'fixed',
    right: 16,
    bottom: 'calc(var(--cp-bar-bottom, 64px) + 80px)',
    zIndex: 1003,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px 10px 14px',
    border: '1px solid var(--cp-border)',
    borderRadius: 12,
    boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
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
    fontSize: 14,
    fontWeight: 900,
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
    fontSize: 14,
    fontWeight: 900,
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
    gap: 2,
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 11,
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
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },
};
