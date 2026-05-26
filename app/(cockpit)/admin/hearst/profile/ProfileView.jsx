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
      <div style={S.header}>
        <div style={S.eyebrow}>ACCOUNT</div>
        <h1 style={S.title}>Profile</h1>
      </div>

      <div style={S.card}>
        <div style={S.avatarRow}>
          <Avatar profile={me} size={64} />
          <div style={S.identity}>
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
            <span style={S.label}>STATUS</span>
            <span style={S.value}>{me.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      <button onClick={signOut} style={S.signOutBtn}>
        Sign out
      </button>
    </div>
  );
}

const S = {
  wrap: {
    maxWidth: 520,
    width: '100%',
    margin: '0 auto',
    padding: '32px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.14em',
    color: 'var(--cp-text-muted)',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    letterSpacing: -0.6,
    margin: 0,
  },
  card: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 14,
    padding: '28px 24px',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  identity: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    color: 'var(--cp-text-muted)',
  },
  roleChip: {
    display: 'inline-block',
    marginTop: 6,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: 'var(--cp-accent)',
    background: 'var(--cp-accent-soft)',
    borderRadius: 4,
    padding: '3px 8px',
    width: 'fit-content',
  },
  divider: {
    height: 1,
    background: 'var(--cp-border)',
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
    letterSpacing: '0.12em',
    color: 'var(--cp-text-muted)',
  },
  value: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--cp-text-primary)',
  },
  signOutBtn: {
    width: '100%',
    padding: '14px 0',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    color: '#ef4444',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.08em',
    transition: 'background 150ms, border-color 150ms',
  },
};
