import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase-admin';
import Avatar from '@/components/admin/Avatar';
import { EVENT_LABEL } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const PILLAR_LABEL = { datacenter: 'Data Center', mining: 'Mining', hub: 'Hub' };

function eventTargetHref(e) {
  if (e.operator_id) return `/admin/operator/${e.operator_id}`;
  if (e.partner_id) return `/admin/partner/${e.partner_id}`;
  return '/admin';
}

export default async function ActivityPage() {
  const supa = getAdminClient();
  const { data } = await supa
    .from('events')
    .select('*, actor:profiles!events_actor_id_fkey(id, full_name, email, avatar_url), operators(name, pillar), partners(name)')
    .order('occurred_at', { ascending: false })
    .limit(120);

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div style={S.eyebrow}>ACTIVITY</div>
        <h1 style={S.title}>Team activity feed</h1>
        <p style={S.sub}>The last 120 things that happened across operators and partners.</p>
      </header>

      {(!data || data.length === 0) && (
        <div style={S.empty}>Nothing has happened yet.</div>
      )}

      <div style={S.list}>
        {(data || []).map((e) => {
          const target = e.operators?.name || e.partners?.name || '—';
          const pillar = e.operators?.pillar ? PILLAR_LABEL[e.operators.pillar] : (e.partners ? 'Partner' : null);
          return (
            <Link key={e.id} href={eventTargetHref(e)} style={S.row}>
              <Avatar profile={e.actor} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.line}>
                  <span style={S.actor}>{e.actor?.full_name || e.actor?.email || 'Someone'}</span>
                  <span style={S.verb}> · {(EVENT_LABEL[e.type] || e.type).toLowerCase()} · </span>
                  <span style={S.target}>{target}</span>
                  {pillar && <span style={S.pillar}> · {pillar}</span>}
                </div>
                {e.subject && <div style={S.subject}>{e.subject}</div>}
                {!e.subject && e.body && <div style={S.subject}>{e.body}</div>}
              </div>
              <div style={S.when}>
                {new Date(e.occurred_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  wrap: { padding: '32px 40px 80px', fontFamily: '"Inter", sans-serif', color: 'var(--color-text-primary)', maxWidth: 1100, margin: '0 auto' },
  header: { marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border-light)' },
  eyebrow: { fontSize: 11, letterSpacing: 3, fontWeight: 800, color: 'var(--color-accent-strong)', marginBottom: 6 },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: -1.2, margin: '0 0 4px' },
  sub: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0 },
  empty: { padding: 36, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14, border: '1px dashed var(--color-border-medium)' },
  list: { border: '1px solid var(--color-border-light)' },
  row: { display: 'grid', gridTemplateColumns: '40px 1fr 130px', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none', color: 'var(--color-text-primary)', alignItems: 'center' },
  line: { fontSize: 14, lineHeight: 1.5 },
  actor: { fontWeight: 700 },
  verb: { color: 'var(--color-text-muted)', textTransform: 'lowercase' },
  target: { fontWeight: 700, color: 'var(--color-accent-strong)' },
  pillar: { color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 },
  subject: { marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  when: { fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)', textAlign: 'right' },
};
