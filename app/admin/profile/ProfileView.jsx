'use client';

import Link from 'next/link';
import Avatar from '@/components/admin/Avatar';
import { getBrowserClient } from '@/lib/supabase-browser';

async function signOut() {
  const supa = getBrowserClient();
  await supa.auth.signOut();
  await fetch('/api/admin/login', { method: 'DELETE' });
  window.location.href = '/admin/login';
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ProfileView({ me }) {
  return (
    <div style={S.wrap}>
      <Link href="/admin" style={S.back}>← Home</Link>

      <div style={S.card}>
        <div style={S.avatarRow}>
          <Avatar profile={me} size={64} />
          <div>
            <div style={S.name}>{me.full_name || '—'}</div>
            <div style={S.email}>{me.email}</div>
            {me.role && <div style={S.roleChip}>{me.role.toUpperCase()}</div>}
          </div>
        </div>

        <div style={S.divider} />

        <div style={S.fieldList}>
          <div style={S.field}>
            <span style={S.label}>MEMBER SINCE</span>
            <span style={S.value} suppressHydrationWarning>{fmt(me.created_at)}</span>
          </div>
          <div style={S.field}>
            <span style={S.label}>LAST SEEN</span>
            <span style={S.value} suppressHydrationWarning>{fmt(me.last_seen_at)}</span>
          </div>
          <div style={S.field}>
            <span style={S.label}>ACCOUNT</span>
            <span style={S.value}>{me.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <div style={S.divider} />

        <button onClick={signOut} style={S.signOutBtn}>
          Sign out
        </button>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    padding: '40px 48px',
    maxWidth: 520,
  },
  back: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    marginBottom: 32,
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 12,
    padding: '32px 28px',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    marginTop: 2,
  },
  roleChip: {
    display: 'inline-block',
    marginTop: 6,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.1em',
    color: 'var(--color-accent-strong)',
    background: 'var(--color-error-bg)',
    borderRadius: 4,
    padding: '2px 7px',
  },
  divider: {
    height: 1,
    background: 'var(--color-border-light)',
    margin: '20px 0',
  },
  fieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.1em',
    color: 'var(--color-text-muted)',
  },
  value: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  signOutBtn: {
    width: '100%',
    padding: '12px 0',
    background: 'transparent',
    border: '1px solid var(--color-border-medium)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.04em',
    transition: 'background 150ms',
  },
};
