'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPartnerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    kind: 'institution',
    country: 'Qatar',
    one_liner: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.name) { setErr('Name required'); return; }
    setBusy(true);
    setErr('');
    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Failed');
      return;
    }
    setOpen(false);
    setForm({ name: '', kind: 'institution', country: 'Qatar', one_liner: '' });
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={S.btn}>+ NEW PARTNER</button>
      {open && (
        <div style={S.backdrop} onClick={() => setOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.head}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-accent-strong)' }}>NEW PARTNER</div>
                <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: -0.8 }}>Add an institution</h2>
              </div>
              <button onClick={() => setOpen(false)} style={S.close}>×</button>
            </div>
            <div style={S.body}>
              <Field label="NAME">
                <input style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Qatar Investment Authority" autoFocus />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="KIND">
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} style={S.input}>
                    <option value="institution">Institution</option>
                    <option value="authority">Authority</option>
                    <option value="foundation">Foundation</option>
                    <option value="sponsor">Sponsor</option>
                  </select>
                </Field>
                <Field label="COUNTRY">
                  <input style={S.input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Qatar" />
                </Field>
              </div>
              <Field label="ONE-LINER">
                <textarea
                  style={{ ...S.input, minHeight: 90, fontFamily: 'inherit', resize: 'vertical' }}
                  value={form.one_liner}
                  onChange={(e) => setForm({ ...form, one_liner: e.target.value })}
                  placeholder="What this partner does and why it matters."
                />
              </Field>
              {err && <div style={{ color: 'var(--color-accent-strong)', fontSize: 12, fontWeight: 600 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setOpen(false)} style={S.btnSecondary}>CANCEL</button>
                <button onClick={submit} disabled={busy || !form.name} style={S.btnPrimary}>
                  {busy ? '…' : 'CREATE PARTNER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const S = {
  btn: {
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    border: 0,
    background: 'var(--color-accent-strong)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'color-mix(in srgb, var(--color-gray-900) 60%, transparent)',
    backdropFilter: 'blur(6px)',
    zIndex: 200,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },
  modal: {
    width: 540,
    maxWidth: '100%',
    background: 'var(--color-bg-main)',
    border: '1px solid var(--color-border-light)',
    boxShadow: '0 30px 80px color-mix(in srgb, var(--color-gray-900) 40%, transparent)',
  },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  close: {
    background: 'transparent',
    border: 0,
    fontSize: 28,
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    lineHeight: 1,
    width: 32,
    height: 32,
  },
  body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border-medium)',
    background: 'var(--color-bg-main)',
    fontSize: 13,
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    padding: '10px 18px',
    border: 0,
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: 'var(--color-accent-strong)',
  },
  btnSecondary: {
    padding: '10px 14px',
    border: '1px solid var(--color-border-medium)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
