'use client';

import { useState, useEffect } from 'react';

export default function ContactModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setIsOpen(window.location.hash === '#request-briefing');
    };
    
    // Check initial hash
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

  const close = () => {
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    setIsOpen(false);
  };

  if (!isOpen) return null;

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

        <h3 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: -0.5 }}>Request a Briefing</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 32, lineHeight: 1.5 }}>
          Leave your details below and our team will get back to you with the technical specifications and residency details.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); close(); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>FULL NAME</label>
            <input 
              required
              type="text" 
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                color: 'var(--color-text-inverse)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-strong)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>WORK EMAIL</label>
            <input 
              required
              type="text" 
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
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-strong)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: 'var(--color-text-secondary)' }}>COMPANY</label>
            <input 
              required
              type="text" 
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                color: 'var(--color-text-inverse)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-strong)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          
          <button 
            type="submit"
            style={{
              marginTop: 12,
              width: '100%',
              padding: '14px 24px',
              background: 'var(--color-accent-strong)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => e.target.style.opacity = 0.9}
            onMouseOut={(e) => e.target.style.opacity = 1}
          >
            SUBMIT REQUEST
          </button>
        </form>
      </div>
    </div>
  );
}