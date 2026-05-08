'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/admin/Avatar';

const TYPE_LABEL = {
  mention: 'mentioned you',
  assignment: 'assigned you',
  comment_reply: 'replied to your comment',
  status_change: 'changed status',
  invite: 'invited you',
};

const TYPE_HUE = {
  mention: '#be123c',
  assignment: '#3b82f6',
  comment_reply: '#8b5cf6',
  status_change: '#10b981',
  invite: '#f59e0b',
};

export default function NotificationsView({ notifications }) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function markAllRead() {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  async function markRead(id) {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    router.refresh();
  }

  function targetLink(n) {
    if (!n.parent_kind || !n.parent_id) return '/admin';
    const map = {
      operator: `/admin/operator/${n.parent_id}`,
      partner: `/admin/partner/${n.parent_id}`,
      initiative: `/admin/initiative/${n.parent_id}`,
      task: '/admin', // tasks live inside parent fiches; the dashboard has the overview
    };
    return map[n.parent_kind] || '/admin';
  }

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>NOTIFICATIONS</div>
          <h1 style={S.title}>Inbox</h1>
          <p style={S.sub}>
            {notifications.length === 0
              ? 'No activity yet.'
              : `${notifications.length} total · ${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={S.markAll}>MARK ALL AS READ</button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div style={S.empty}>You're all caught up.</div>
      ) : (
        <div style={S.list}>
          {notifications.map((n) => {
            const verb = TYPE_LABEL[n.type] || n.type;
            const hue = TYPE_HUE[n.type] || 'var(--color-text-muted)';
            const unread = !n.read_at;
            return (
              <Link
                key={n.id}
                href={targetLink(n)}
                onClick={() => unread && markRead(n.id)}
                style={{ ...S.row, background: unread ? 'color-mix(in srgb, var(--color-accent-strong) 4%, transparent)' : 'transparent' }}
              >
                <div style={{ ...S.dot, background: unread ? hue : 'transparent', borderColor: hue }} />
                <Avatar profile={n.actor} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.title2}>
                    <span style={{ fontWeight: 700 }}>{n.actor?.full_name || n.actor?.email || 'Someone'}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>{verb}</span>
                    {n.parent_kind && <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>on a {n.parent_kind}</span>}
                  </div>
                  {n.body && <div style={S.body}>{n.body}</div>}
                </div>
                <div style={S.when}>
                  {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { padding: '32px 40px 80px', fontFamily: '"Inter", sans-serif', color: 'var(--color-text-primary)', maxWidth: 880, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border-light)' },
  eyebrow: { fontSize: 11, letterSpacing: 3, fontWeight: 800, color: 'var(--color-accent-strong)', marginBottom: 6 },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: -1.2, margin: '0 0 4px' },
  sub: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0 },
  markAll: { padding: '10px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, border: '1px solid var(--color-border-medium)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'inherit' },
  empty: { padding: 36, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14, border: '1px dashed var(--color-border-medium)' },
  list: { display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border-light)' },
  row: {
    display: 'grid',
    gridTemplateColumns: '20px 44px 1fr 130px',
    gap: 14,
    padding: '16px 18px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    alignItems: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: '50%', border: '1.5px solid' },
  title2: { fontSize: 14, lineHeight: 1.5 },
  body: { marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  when: { fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)', textAlign: 'right' },
};
