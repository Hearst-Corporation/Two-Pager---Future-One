import { X } from 'lucide-react';
import Button from './Button';
import { useFocusTrap } from '@/lib/use-focus-trap';

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 'var(--cp-z-modal, 1000)',
    background: 'var(--cp-overlay)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--cp-space-4)',
  },
  modal: {
    background: 'var(--cp-surface-0)',
    borderRadius: 'var(--cp-radius-lg)',
    boxShadow: 'var(--cp-shadow-xl)',
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--cp-border-strong)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--cp-space-4)',
    borderBottom: '1px solid var(--cp-border)',
  },
  title: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-strong)',
    margin: 0,
  },
  body: {
    padding: 'var(--cp-space-4)',
    overflowY: 'auto',
    flex: '1 1 auto',
  },
  footer: {
    padding: 'var(--cp-space-4)',
    borderTop: '1px solid var(--cp-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--cp-space-3)',
  },
};

export function Modal({ isOpen, onClose, title, children, footer }) {
  const modalRef = useFocusTrap(isOpen, { onEscape: onClose });

  if (!isOpen) return null;

  return (
    <div style={S.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={onClose}>
      <div ref={modalRef} tabIndex={-1} style={S.modal} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={S.header}>
            <h2 id="modal-title" style={S.title}>{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X size={16} aria-hidden="true" />
            </Button>
          </div>
        )}
        <div style={S.body}>
          {children}
        </div>
        {footer && (
          <div style={S.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
