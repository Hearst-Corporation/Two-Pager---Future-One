'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/admin/Avatar';
import { PILLAR_ACCENT, PILLAR_LABEL, PARTNER_KIND_COLOR, EVENT_LABEL, INIT_STATUS_LABEL, INIT_STATUS_COLOR } from '@/lib/admin-constants';

const TODAY = new Date();
const FORMATTED_DATE = TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const HOUR = TODAY.getHours();
const GREETING = HOUR < 5 ? 'Still up' : HOUR < 12 ? 'Good morning' : HOUR < 18 ? 'Good afternoon' : 'Good evening';

export default function TodayView({ me, buckets, myInitiatives, myOps, myPartners, unreadNotifs, recentActivity }) {
  const router = useRouter();
  const totalOpen = buckets.overdue.length + buckets.dueToday.length + buckets.dueThisWeek.length + buckets.later.length;

  async function toggleTask(id, done) {
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: !done }),
    });
    router.refresh();
  }

  return (
    <div style={S.wrap}>
      <header style={S.hello}>
        <div style={S.dateLine} suppressHydrationWarning>{FORMATTED_DATE.toUpperCase()}</div>
        <h1 style={S.greet} suppressHydrationWarning>
          {GREETING}, <span style={S.greetName}>{(me.full_name || me.email).split(' ')[0]}.</span>
        </h1>
        <p style={S.summary}>
          {totalOpen === 0 ? 'No open tasks. Have a good day.' : (
            <>
              You have <strong>{totalOpen}</strong> open {totalOpen === 1 ? 'task' : 'tasks'}
              {buckets.overdue.length > 0 && <> · <span style={{ color: 'var(--color-accent-strong)', fontWeight: 700 }}>{buckets.overdue.length} overdue</span></>}
              {buckets.dueToday.length > 0 && <> · {buckets.dueToday.length} due today</>}
            </>
          )}
        </p>
      </header>

      <div style={S.grid}>
        <main style={S.main}>
          {buckets.overdue.length > 0 && (
            <Section title="OVERDUE" accent="var(--color-accent-strong)" count={buckets.overdue.length}>
              {buckets.overdue.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} accent="var(--color-accent-strong)" overdue />)}
            </Section>
          )}

          {buckets.dueToday.length > 0 && (
            <Section title="DUE TODAY" accent="#f59e0b" count={buckets.dueToday.length}>
              {buckets.dueToday.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} accent="#f59e0b" />)}
            </Section>
          )}

          {buckets.dueThisWeek.length > 0 && (
            <Section title="THIS WEEK" accent="var(--color-text-secondary)" count={buckets.dueThisWeek.length}>
              {buckets.dueThisWeek.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} accent="var(--color-text-secondary)" />)}
            </Section>
          )}

          {totalOpen === 0 && (
            <div style={S.empty}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>You're all caught up.</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Add tasks from any operator, partner, or initiative — they'll show up here when assigned to you.
              </div>
            </div>
          )}

          {recentActivity.length > 0 && (
            <Section title="TEAM ACTIVITY" accent="var(--color-text-muted)" count={recentActivity.length} cta={{ href: '/admin/activity', label: 'OPEN FEED →' }}>
              {recentActivity.map((e) => <ActivityRow key={e.id} ev={e} />)}
            </Section>
          )}
        </main>

        <aside style={S.aside}>
          {unreadNotifs.length > 0 && (
            <SidePanel title="UNREAD" cta={{ href: '/admin/notifications', label: 'OPEN INBOX →' }}>
              {unreadNotifs.map((n) => (
                <Link
                  key={n.id}
                  href={notifLink(n)}
                  style={S.notifRow}
                >
                  <Avatar profile={n.actor} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.notifLine}>
                      <strong>{n.actor?.full_name || n.actor?.email || 'Someone'}</strong>
                      <span style={{ color: 'var(--color-text-muted)' }}> · {n.type.replace(/_/g, ' ')}</span>
                    </div>
                    {n.body && <div style={S.notifBody}>{n.body}</div>}
                  </div>
                </Link>
              ))}
            </SidePanel>
          )}

          {myInitiatives.length > 0 && (
            <SidePanel title="MY INITIATIVES" cta={{ href: '/admin/roadmap', label: 'ROADMAP →' }}>
              {myInitiatives.slice(0, 6).map((i) => (
                <Link key={i.id} href={`/admin/initiative/${i.id}`} style={S.iniRow}>
                  <span style={{ ...S.iniDot, background: INIT_STATUS_COLOR[i.status] }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.iniTitle}>{i.title}</div>
                    <div style={S.iniMeta}>
                      <span style={{ fontFamily: 'monospace' }}>{i.code}</span>
                      {i.workstreams && <span style={{ color: i.workstreams.accent, fontWeight: 700 }}>· {i.workstreams.code}</span>}
                      <span style={{ color: 'var(--color-text-muted)' }}>· {INIT_STATUS_LABEL[i.status]}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </SidePanel>
          )}

          {(myOps.length > 0 || myPartners.length > 0) && (
            <SidePanel title="OWNED ACCOUNTS">
              {myOps.map((o) => (
                <Link key={o.id} href={`/admin/operator/${o.id}`} style={S.acctRow}>
                  <span style={{ ...S.pillTag, background: PILLAR_ACCENT[o.pillar] }}>{(PILLAR_LABEL[o.pillar] || o.pillar).slice(0, 2).toUpperCase()}</span>
                  <span style={S.acctName}>{o.name}</span>
                </Link>
              ))}
              {myPartners.map((p) => (
                <Link key={p.id} href={`/admin/partner/${p.id}`} style={S.acctRow}>
                  <span style={{ ...S.pillTag, background: PARTNER_KIND_COLOR[p.kind] || '#94a3b8' }}>P</span>
                  <span style={S.acctName}>{p.name}</span>
                </Link>
              ))}
            </SidePanel>
          )}
        </aside>
      </div>
    </div>
  );
}

function notifLink(n) {
  if (!n.parent_kind || !n.parent_id) return '/admin/notifications';
  return ({
    operator: `/admin/operator/${n.parent_id}`,
    partner: `/admin/partner/${n.parent_id}`,
    initiative: `/admin/initiative/${n.parent_id}`,
    task: '/admin/notifications',
  })[n.parent_kind] || '/admin/notifications';
}

function Section({ title, accent, count, cta, children }) {
  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...S.sectionDot, background: accent }} />
          <span style={S.sectionTitle}>{title}</span>
          <span style={S.sectionCount}>{count}</span>
        </div>
        {cta && <Link href={cta.href} style={S.sectionCta}>{cta.label}</Link>}
      </div>
      <div style={S.sectionBody}>{children}</div>
    </section>
  );
}

function SidePanel({ title, cta, children }) {
  return (
    <section style={S.side}>
      <div style={S.sideHead}>
        <span style={S.sideTitle}>{title}</span>
        {cta && <Link href={cta.href} style={S.sectionCta}>{cta.label}</Link>}
      </div>
      <div style={S.sideBody}>{children}</div>
    </section>
  );
}

function TaskRow({ task, onToggle, accent, overdue }) {
  const target = task.operator_id ? `/admin/operator/${task.operator_id}`
    : task.partner_id ? `/admin/partner/${task.partner_id}`
    : task.initiative_id ? `/admin/initiative/${task.initiative_id}`
    : null;
  const ref = task.operators?.name || task.partners?.name || (task.initiative_id ? 'Initiative' : '');

  return (
    <div style={S.taskRow}>
      <button
        onClick={() => onToggle(task.id, task.done)}
        style={{ ...S.taskCheck, borderColor: accent }}
        aria-label="Mark done"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.taskTitle}>{task.title}</div>
        <div style={S.taskMeta}>
          {task.due_date && (
            <span style={{ color: overdue ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
              {overdue ? 'OVERDUE · ' : ''}{new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
          {ref && (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>·</span>
              {target ? <Link href={target} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>{ref}</Link> : <span>{ref}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ ev }) {
  const target = ev.operator_id ? `/admin/operator/${ev.operator_id}`
    : ev.partner_id ? `/admin/partner/${ev.partner_id}`
    : '/admin';
  const tgtName = ev.operators?.name || ev.partners?.name || '—';
  return (
    <Link href={target} style={S.actRow}>
      <Avatar profile={ev.actor} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.actLine}>
          <strong>{ev.actor?.full_name || ev.actor?.email || 'Someone'}</strong>
          <span style={{ color: 'var(--color-text-muted)' }}> · {(EVENT_LABEL[ev.type] || ev.type).toLowerCase()} · </span>
          <span style={{ fontWeight: 700, color: 'var(--color-accent-strong)' }}>{tgtName}</span>
        </div>
        {ev.subject && <div style={S.actSubject}>{ev.subject}</div>}
      </div>
      <div style={S.actWhen}>
        {new Date(ev.occurred_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </Link>
  );
}

const S = {
  wrap: { padding: '32px 40px 80px', fontFamily: '"Inter", sans-serif', color: 'var(--color-text-primary)', maxWidth: 1300, margin: '0 auto' },
  hello: { marginBottom: 36 },
  dateLine: { fontSize: 11, fontWeight: 800, letterSpacing: 3, color: 'var(--color-text-muted)', marginBottom: 8 },
  greet: { fontSize: 44, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, margin: 0 },
  greetName: { color: 'var(--color-accent-strong)' },
  summary: { fontSize: 16, color: 'var(--color-text-secondary)', marginTop: 14, lineHeight: 1.55 },

  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 32 },
  main: { display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 },
  aside: { display: 'flex', flexDirection: 'column', gap: 20 },

  section: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--color-border-light)' },
  sectionDot: { width: 10, height: 10, borderRadius: '50%' },
  sectionTitle: { fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: 'var(--color-text-primary)' },
  sectionCount: { fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' },
  sectionCta: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', textDecoration: 'none' },
  sectionBody: { display: 'flex', flexDirection: 'column' },

  taskRow: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--color-border-light)' },
  taskCheck: { width: 22, height: 22, border: '1.5px solid', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, padding: 0 },
  taskTitle: { fontSize: 15, fontWeight: 600, lineHeight: 1.45 },
  taskMeta: { marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: 8 },

  empty: { background: 'var(--color-surface)', border: '1px dashed var(--color-border-medium)', padding: 48, textAlign: 'center' },

  actRow: { display: 'grid', gridTemplateColumns: '36px 1fr 110px', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none', color: 'var(--color-text-primary)', alignItems: 'center' },
  actLine: { fontSize: 13, lineHeight: 1.5 },
  actSubject: { marginTop: 3, fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  actWhen: { fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)', textAlign: 'right' },

  side: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' },
  sideHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--color-border-light)' },
  sideTitle: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-primary)' },
  sideBody: { display: 'flex', flexDirection: 'column' },

  notifRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none', color: 'var(--color-text-primary)' },
  notifLine: { fontSize: 12, lineHeight: 1.45 },
  notifBody: { marginTop: 3, fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },

  iniRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none', color: 'var(--color-text-primary)' },
  iniDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  iniTitle: { fontSize: 13, fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  iniMeta: { marginTop: 2, fontSize: 10, display: 'flex', gap: 6, alignItems: 'center' },

  acctRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none', color: 'var(--color-text-primary)' },
  pillTag: { padding: '3px 7px', fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#fff' },
  acctName: { fontSize: 13, fontWeight: 600 },
};
