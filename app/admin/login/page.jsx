'use client';

// Auth legacy layer — hors cockpit (.ct-* / --cp-*).
// Tokens volontairement = globals.css --color-* (light surface), pas le DS Oracle.
// Ne pas migrer vers cp-tokens sans refonte UX login dédiée.

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase-browser';
import { safeNextPath } from '@/lib/url-helpers';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

const AUTH_ERROR_MESSAGES = {
  otp_expired: 'This link has expired. Please request a new one.',
  access_denied: 'Access denied. Please request a new magic link.',
};

function LoginForm() {
  const sp = useSearchParams();
  // Sanitize `next` at the source: safeNextPath rejects absolute URLs,
  // protocol-relative (//evil.com) and javascript: schemes, falling back to
  // ORACLE_HOME. Covers both the password redirect and the magic-link emailRedirectTo.
  const next = safeNextPath(sp.get('next'));
  const authError = sp.get('auth_error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('magic');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(AUTH_ERROR_MESSAGES[authError] || '');

  async function sendMagicLink(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    const supa = getBrowserClient();
    const { error } = await supa.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setMsg('Magic link sent. Check your inbox.');
  }

  async function signInWithPassword(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    const supa = getBrowserClient();
    const { error } = await supa.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    window.location.href = next;
  }

  return (
    <div style={S.wrap}>
      <form onSubmit={mode === 'magic' ? sendMagicLink : signInWithPassword} style={S.card}>
        <div style={S.eyebrow}>FUTUR ONE × MISA</div>
        <h1 style={S.title}>Sign in</h1>
        <p style={S.sub}>Restricted area — invite only.</p>

        <input
          type="email"
          autoFocus
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          style={S.input}
        />

        {mode === 'password' && (
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={S.input}
          />
        )}

        {err && <div style={S.err}>{err}</div>}
        {msg && <div style={S.msg}>{msg}</div>}

        <button type="submit" disabled={busy} style={S.btn}>
          {busy ? '…' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'magic' ? 'password' : 'magic'); setErr(''); setMsg(''); }}
          style={S.switch}
        >
          {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
        </button>
      </form>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: '100vh',
    background: 'var(--color-bg-main)',
    display: 'grid',
    placeItems: 'center',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: 24,
  },
  card: {
    width: 380,
    maxWidth: '100%',
    padding: 40,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  eyebrow: { fontSize: 11, letterSpacing: 3, fontWeight: 800, color: 'var(--color-accent-strong)' },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: -1, margin: 0, color: 'var(--color-text-primary)' },
  sub: { fontSize: 13, margin: 0, color: 'var(--color-text-muted)' },
  input: {
    padding: '12px 14px',
    border: '1px solid var(--color-border-medium)',
    background: 'var(--color-bg-main)',
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  btn: {
    padding: '12px 14px',
    border: 0,
    background: 'var(--color-accent-strong)',
    color: 'var(--color-text-inverse)',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  switch: {
    background: 'transparent',
    border: 0,
    color: 'var(--color-text-muted)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 4,
  },
  err: { fontSize: 12, color: 'var(--color-accent-strong)', fontWeight: 600 },
  msg: { fontSize: 12, color: 'var(--color-success)', fontWeight: 600 },
};
