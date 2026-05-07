'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/admin';
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setErr('Wrong password');
    }
  }

  return (
    <div style={S.wrap}>
      <form onSubmit={submit} style={S.card}>
        <div style={S.eyebrow}>FUTUR ONE × MISA</div>
        <h1 style={S.title}>Admin access</h1>
        <p style={S.sub}>Restricted area — internal pipeline.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          style={S.input}
        />
        {err && <div style={S.err}>{err}</div>}
        <button type="submit" disabled={busy} style={S.btn}>
          {busy ? '…' : 'Enter'}
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
  },
  card: {
    width: 360,
    padding: 40,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
  },
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
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
  },
  err: { fontSize: 12, color: 'var(--color-accent-strong)', fontWeight: 600 },
};
