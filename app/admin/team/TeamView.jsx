'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/admin/Avatar';

const ROLE_LABEL = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };
const ROLE_COLOR = { admin: 'var(--cp-accent)', editor: 'var(--cp-info)', viewer: '#64748b' };

export default function TeamView({ members, me }) {
  const router = useRouter();
  const isAdmin = me?.role === 'admin';
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div style={S.wrap}>
      <div style={S.topbar}>
        <Link href="/admin" style={S.back}>← BACK TO ADMIN</Link>
      </div>

      <header style={S.header}>
        <div style={{ flex: 1 }}>
          <div style={S.eyebrow}>FUTUR ONE × MISA · TEAM</div>
          <h1 style={S.title}>Members</h1>
          <p style={S.sub}>{members.length} {members.length === 1 ? 'member' : 'members'} · invite-only</p>
        </div>
        {isAdmin && (
          <button onClick={() => setInviteOpen(true)} style={S.inviteBtn}>+ INVITE</button>
        )}
      </header>

      {!isAdmin && (
        <div style={S.notice}>
          You can see the team here. Only admins can invite new members or change roles.
        </div>
      )}

      <div style={S.list}>
        <div style={{ ...S.row, ...S.head }}>
          <div style={{ width: 40 }} />
          <div>NAME</div>
          <div>EMAIL</div>
          <div>ROLE</div>
          <div>JOINED</div>
          <div>LAST SEEN</div>
          <div />
        </div>
        {members.map((m) => (
          <MemberRow key={m.id} member={m} isAdmin={isAdmin} me={me} onChange={() => router.refresh()} />
        ))}
      </div>

      {inviteOpen && (
        <InviteModal onClose={() => setInviteOpen(false)} onDone={() => { setInviteOpen(false); router.refresh(); }} />
      )}
    </div>
  );
}

function MemberRow({ member, isAdmin, me, onChange }) {
  const isMe = member.id === me?.id;
  const [busy, setBusy] = useState(false);

  async function setRole(role) {
    if (role === member.role) return;
    setBusy(true);
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Could not update role');
      return;
    }
    onChange();
  }

  async function toggleActive() {
    if (isMe) { alert("You can't deactivate yourself."); return; }
    setBusy(true);
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !member.is_active }),
    });
    setBusy(false);
    if (res.ok) onChange();
  }

  return (
    <div style={{ ...S.row, opacity: member.is_active ? 1 : 0.45 }}>
      <Avatar profile={member} size={36} />
      <div>
        <div style={S.memberName}>
          {member.full_name || '—'}
          {isMe && <span style={S.youTag}>YOU</span>}
        </div>
        {!member.is_active && <div style={S.deactivated}>Deactivated</div>}
      </div>
      <div style={S.muted}>{member.email}</div>
      <div>
        {isAdmin ? (
          <select
            value={member.role}
            disabled={busy}
            onChange={(e) => setRole(e.target.value)}
            style={{ ...S.rolePill, color: ROLE_COLOR[member.role], borderColor: ROLE_COLOR[member.role] }}
          >
            {['admin', 'editor', 'viewer'].map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        ) : (
          <span style={{ ...S.rolePill, color: ROLE_COLOR[member.role], borderColor: ROLE_COLOR[member.role], pointerEvents: 'none' }}>
            {ROLE_LABEL[member.role]}
          </span>
        )}
      </div>
      <div style={S.muted}>
        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div style={S.muted}>
        {member.last_seen_at
          ? new Date(member.last_seen_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—'}
      </div>
      <div style={{ textAlign: 'right' }}>
        {isAdmin && !isMe && (
          <button onClick={toggleActive} style={S.smallBtn}>
            {member.is_active ? 'DEACTIVATE' : 'REACTIVATE'}
          </button>
        )}
      </div>
    </div>
  );
}

function InviteModal({ onClose, onDone }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('editor');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, full_name: fullName || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Invite failed');
      return;
    }
    onDone();
  }

  return (
    <div style={S.modalBackdrop} onClick={onClose}>
      <form onSubmit={submit} style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <div style={S.eyebrowSm}>INVITE A NEW MEMBER</div>
            <h2 style={S.modalTitle}>Send a magic-link invite</h2>
          </div>
          <button type="button" onClick={onClose} style={S.modalClose}>×</button>
        </div>
        <div style={S.modalBody}>
          <Field label="EMAIL">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="charles@equinix.com"
              style={S.input}
            />
          </Field>
          <Field label="FULL NAME (OPTIONAL)">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Charles Meyers"
              style={S.input}
            />
          </Field>
          <Field label="ROLE">
            <div style={{ display: 'flex', gap: 8 }}>
              {['admin', 'editor', 'viewer'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    ...S.roleChoice,
                    background: role === r ? ROLE_COLOR[r] : 'transparent',
                    color: role === r ? '#fff' : ROLE_COLOR[r],
                    borderColor: ROLE_COLOR[r],
                  }}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </Field>
          {err && <div style={S.err}>{err}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={S.btnSecondary}>CANCEL</button>
            <button type="submit" disabled={busy || !email} style={S.btnPrimary}>
              {busy ? '…' : 'SEND INVITE'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={S.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

const S = {
  wrap: { padding: '24px 40px 80px', fontFamily: '"Inter", sans-serif', color: 'var(--color-text-primary)', maxWidth: 1200, margin: '0 auto' },
  topbar: { marginBottom: 16 },
  back: { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', textDecoration: 'none' },
  header: { display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 28, paddingBottom: 18, borderBottom: '1px solid var(--color-border-light)' },
  eyebrow: { fontSize: 11, letterSpacing: 3, fontWeight: 800, color: 'var(--color-accent-strong)', marginBottom: 6 },
  title: { fontSize: 38, fontWeight: 800, letterSpacing: -1.5, margin: '0 0 4px' },
  sub: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0 },
  inviteBtn: { padding: '10px 16px', fontSize: 11, fontWeight: 800, letterSpacing: 2, border: 0, background: 'var(--color-accent-strong)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' },
  notice: { background: 'var(--color-surface)', border: '1px dashed var(--color-border-medium)', padding: 16, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 18 },
  list: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' },
  row: {
    display: 'grid',
    gridTemplateColumns: '52px 1.4fr 1.6fr 130px 130px 160px 130px',
    gap: 14,
    padding: '14px 18px',
    borderBottom: '1px solid var(--color-border-light)',
    alignItems: 'center',
    fontSize: 14,
  },
  head: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', background: 'color-mix(in srgb, var(--color-text-primary) 3%, transparent)', alignItems: 'center' },
  memberName: { fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
  youTag: { fontSize: 9, fontWeight: 800, letterSpacing: 1.5, padding: '2px 6px', background: 'var(--color-accent-strong)', color: '#fff' },
  deactivated: { fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 },
  muted: { fontSize: 13, color: 'var(--color-text-muted)' },
  rolePill: {
    display: 'inline-block',
    padding: '5px 10px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  smallBtn: { padding: '6px 10px', fontSize: 9, fontWeight: 800, letterSpacing: 1.5, border: '1px solid var(--color-border-medium)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'inherit' },

  /* Modal */
  modalBackdrop: { position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--color-gray-900) 60%, transparent)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 24 },
  modal: { width: 480, maxWidth: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border-light)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)' },
  modalTitle: { margin: '4px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: -0.8 },
  modalClose: { background: 'transparent', border: 0, fontSize: 28, cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, width: 32, height: 32, fontFamily: 'inherit' },
  modalBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  fieldLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', marginBottom: 6 },
  eyebrowSm: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-accent-strong)' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid var(--color-border-medium)', background: 'var(--color-bg-main)', fontSize: 14, fontFamily: 'inherit', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' },
  roleChoice: { padding: '10px 14px', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', flex: 1 },
  err: { fontSize: 12, color: 'var(--color-accent-strong)', fontWeight: 600 },
  btnPrimary: { padding: '10px 16px', border: 0, color: '#fff', background: 'var(--color-accent-strong)', fontSize: 11, fontWeight: 800, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '10px 14px', border: '1px solid var(--color-border-medium)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 10, fontWeight: 800, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit' },
};
