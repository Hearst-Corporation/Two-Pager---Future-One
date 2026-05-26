'use client';

import { useState, useEffect, useRef } from 'react';

const SUCCESS_CLOSE_DELAY_MS = 2000;

export default function ContactModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      setIsOpen(window.location.hash === '#request-briefing');
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  const close = () => {
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    setIsOpen(false);
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = new FormData(e.currentTarget);
    const fullName = String(data.get('fullName') || '').trim();
    const email = String(data.get('email') || '').trim();
    const company = String(data.get('company') || '').trim();

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullName, email, company }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Something went wrong');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => close(), SUCCESS_CLOSE_DELAY_MS);
    } catch {
      setError('Network error — please try again');
      setSubmitting(false);
    }
  };

  function handleTrap(e) {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!isOpen) return null;

  const submitLabel = success ? '✓ Sent' : submitting ? 'Sending...' : 'Send';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'modalFadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(14,16,19,0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={close}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onKeyDown={handleTrap}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: 'var(--color-surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 40,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
          color: 'var(--color-text-inverse)',
          animation: 'modalSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        <h3 id="contact-modal-title" style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: -0.5 }}>Request a Briefing</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 32, lineHeight: 1.5 }}>
          Leave your details below and our team will get back to you with the technical specifications and residency details.
        </p>

        {error && (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: 'rgba(255,80,80,0.08)',
            border: '1px solid rgba(255,80,80,0.25)',
            color: 'rgba(255,120,120,0.9)',
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: 'rgba(80,200,120,0.08)',
            border: '1px solid rgba(80,200,120,0.25)',
            color: 'rgba(100,220,140,0.9)',
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            Thanks — we'll reach out within 24h.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="cf-fullName" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>FULL NAME</label>
            <input
              ref={firstInputRef}
              required
              type="text"
              id="cf-fullName"
              name="fullName"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                color: 'var(--color-text-inverse)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-strong)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="cf-email" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>WORK EMAIL</label>
            <input
              required
              type="email"
              id="cf-email"
              name="email"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                color: 'var(--color-text-inverse)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-strong)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="cf-company" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>COMPANY</label>
            <input
              required
              type="text"
              id="cf-company"
              name="company"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                color: 'var(--color-text-inverse)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-strong)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={close}
              style={{
                flex: '0 0 auto',
                padding: '14px 20px',
                background: 'none',
                color: 'var(--color-text-muted)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                boxSizing: 'border-box',
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: success ? 'rgba(80,200,120,0.3)' : 'var(--color-accent-strong)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: submitting || success ? 'default' : 'pointer',
                transition: 'opacity 0.2s ease',
                opacity: submitting ? 0.7 : 1,
                boxSizing: 'border-box',
              }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
