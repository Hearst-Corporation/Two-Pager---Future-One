'use client';

import Link from 'next/link';
import Avatar from '@/components/admin/Avatar';
import { PILLAR_ACCENT, PILLAR_LABEL, PARTNER_KIND_COLOR, EVENT_LABEL, INIT_STATUS_LABEL, INIT_STATUS_COLOR } from '@/lib/admin-constants';

const HOUR = new Date().getHours();
const GREETING = HOUR < 5 ? 'Still up' : HOUR < 12 ? 'Good morning' : HOUR < 18 ? 'Good afternoon' : 'Good evening';

export default function DashboardView({ me, cards }) {
  const firstName = (me.full_name || me.email || '').split(' ')[0];
  const hasAlerts = cards.tasks.overdue > 0 || cards.roadmap.stuck > 0;

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.dateLine}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</div>
          <h1 style={S.greet}>
            {GREETING}, <span style={S.name}>{firstName}</span>.
          </h1>
          <p style={S.summary}>
            Welcome to the command center. {hasAlerts && <span style={{ color: '#dc2626', fontWeight: 700 }}>Attention required on overdue tasks or blocked initiatives.</span>}
          </p>
        </div>
        <div style={S.headerRight}>
          <div style={S.statBox}>
            <div style={S.statLabel}>ACTIVE DEALS</div>
            <div style={S.statVal}>{cards.pipeline.total}</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statLabel}>ROADMAP</div>
            <div style={S.statVal}>{cards.roadmap.total}</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statLabel}>OPEN TASKS</div>
            <div style={S.statVal}>{cards.tasks.total}</div>
          </div>
        </div>
      </header>

      <div style={S.grid}>
        {/* COLUMN 1 : ACTIONABLE */}
        <div style={S.col}>
          <Section title="MY TASKS" count={cards.tasks.total} alert={cards.tasks.overdue > 0} cta="/admin/today">
            {cards.tasks.items.length === 0 && <Empty msg="All caught up." />}
            {cards.tasks.items.map((t) => (
              <TaskRow key={t.id} task={t} overdue={t.due_date && t.due_date < new Date().toISOString().slice(0, 10)} />
            ))}
          </Section>

          <Section title="ROADMAP / BLOCKED & LIVE" count={cards.roadmap.total} alert={cards.roadmap.stuck > 0} cta="/admin/roadmap">
            {cards.roadmap.items.length === 0 && <Empty msg="No blocked or active initiatives." />}
            {cards.roadmap.items.map((i) => (
              <InitRow key={i.id} item={i} />
            ))}
          </Section>
        </div>

        {/* COLUMN 2 : PIPELINE & PARTNERS */}
        <div style={S.col}>
          <Section title="PIPELINE IN MOTION" count={cards.pipeline.total} cta="/admin/pipeline">
             {cards.pipeline.items.length === 0 && <Empty msg="Pipeline empty." />}
             {cards.pipeline.items.map(op => <OpRow key={op.id} op={op} />)}
          </Section>

          <Section title="ACTIVE PARTNERS" count={cards.partners.total} cta="/admin/partners">
             {cards.partners.items.length === 0 && <Empty msg="No active partners." />}
             {cards.partners.items.map(p => <PartnerRow key={p.id} partner={p} />)}
          </Section>
        </div>

        {/* COLUMN 3 : ACTIVITY & NOTIFS */}
        <div style={S.col}>
          <Section title="RECENT ACTIVITY" count={cards.activity.items.length} cta="/admin/pipeline">
            {cards.activity.items.length === 0 && <Empty msg="No recent activity." />}
            {cards.activity.items.map(ev => <ActivityRow key={ev.id} ev={ev} />)}
          </Section>

          <Section title="NOTIFICATIONS" count={cards.notifications.total} alert={cards.notifications.total > 0} cta="/admin/notifications">
            {cards.notifications.items.length === 0 && <Empty msg="Zero unread notifications." />}
            {cards.notifications.items.map(n => <NotifRow key={n.id} notif={n} />)}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, alert, cta, children }) {
  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {alert && <span style={S.alertDot} />}
          <span style={S.sectionTitle}>{title}</span>
          {count > 0 && <span style={S.sectionCount}>{count}</span>}
        </div>
        {cta && <Link href={cta} style={S.sectionCta}>VIEW ALL ↗</Link>}
      </div>
      <div style={S.sectionBody}>{children}</div>
    </section>
  );
}

function Empty({ msg }) {
  return <div style={S.empty}>{msg}</div>;
}

// ---------------- ROWS ----------------

function TaskRow({ task, overdue }) {
  const target = task.operator_id ? `/admin/operator/${task.operator_id}`
    : task.partner_id ? `/admin/partner/${task.partner_id}`
    : task.initiative_id ? `/admin/initiative/${task.initiative_id}`
    : null;
  const ref = task.operators?.name || task.partners?.name || (task.initiative_id ? 'Initiative' : '');

  return (
    <div style={S.row}>
      <div style={S.rowIcon}>□</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{task.title}</div>
        <div style={S.rowMeta}>
          {task.due_date && (
            <span style={{ color: overdue ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
              {overdue ? 'OVERDUE · ' : ''}{new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
          {ref && (
            <>
              <span style={{ color: 'var(--color-text-muted)', margin: '0 4px' }}>·</span>
              {target ? <Link href={target} style={S.rowLink}>{ref}</Link> : <span>{ref}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InitRow({ item }) {
  return (
    <Link href={`/admin/initiative/${item.id}`} style={{ ...S.row, textDecoration: 'none' }}>
      <div style={{ ...S.rowIcon, fontSize: 10, color: INIT_STATUS_COLOR[item.status] }}>●</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{item.title}</div>
        <div style={S.rowMeta}>
          <span style={{ fontFamily: 'monospace' }}>{item.code}</span>
          {item.workstreams && <span style={{ color: item.workstreams.accent, fontWeight: 700, margin: '0 4px' }}>· {item.workstreams.code}</span>}
          <span style={{ margin: '0 4px', color: 'var(--color-text-muted)' }}>· {INIT_STATUS_LABEL[item.status]}</span>
        </div>
      </div>
    </Link>
  );
}

function OpRow({ op }) {
  return (
    <Link href={`/admin/operator/${op.id}`} style={{ ...S.row, textDecoration: 'none' }}>
      <div style={{ ...S.rowPill, background: PILLAR_ACCENT[op.pillar] }}>
        {(PILLAR_LABEL[op.pillar] || op.pillar).slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{op.name}</div>
        <div style={S.rowMeta}>
          {op.next_step ? op.next_step : 'No next step defined'}
        </div>
      </div>
    </Link>
  );
}

function PartnerRow({ partner }) {
  return (
    <Link href={`/admin/partner/${partner.id}`} style={{ ...S.row, textDecoration: 'none' }}>
      <div style={{ ...S.rowPill, background: PARTNER_KIND_COLOR[partner.kind] || '#94a3b8' }}>
        P
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{partner.name}</div>
        <div style={S.rowMeta}>
          {partner.kind.toUpperCase()}
        </div>
      </div>
    </Link>
  );
}

function ActivityRow({ ev }) {
  const target = ev.operator_id ? `/admin/operator/${ev.operator_id}`
    : ev.partner_id ? `/admin/partner/${ev.partner_id}`
    : '/admin';
  const tgtName = ev.operators?.name || ev.partners?.name || '—';
  
  return (
    <Link href={target} style={{ ...S.row, textDecoration: 'none' }}>
      <Avatar profile={ev.actor} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowLine}>
          <strong>{ev.actor?.full_name || ev.actor?.email || 'Someone'}</strong>
          <span style={{ color: 'var(--color-text-muted)' }}> · {(EVENT_LABEL[ev.type] || ev.type).toLowerCase()} · </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{tgtName}</span>
        </div>
        {ev.subject && <div style={{ ...S.rowMeta, marginTop: 2 }}>{ev.subject}</div>}
      </div>
    </Link>
  );
}

function NotifRow({ notif }) {
  const target = notif.parent_kind === 'operator' ? `/admin/operator/${notif.parent_id}`
    : notif.parent_kind === 'partner' ? `/admin/partner/${notif.parent_id}`
    : notif.parent_kind === 'initiative' ? `/admin/initiative/${notif.parent_id}`
    : '/admin/notifications';

  return (
    <Link href={target} style={{ ...S.row, textDecoration: 'none', background: 'rgba(59, 130, 246, 0.05)' }}>
      <Avatar profile={notif.actor} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowLine}>
          <strong>{notif.actor?.full_name || notif.actor?.email || 'Someone'}</strong>
          <span style={{ color: 'var(--color-text-muted)' }}> · {notif.type.replace(/_/g, ' ')}</span>
        </div>
        {notif.body && <div style={{ ...S.rowMeta, marginTop: 2 }}>{notif.body}</div>}
      </div>
    </Link>
  );
}

// ---------------- STYLES ----------------

const S = {
  wrap: {
    padding: '32px 40px 80px',
    fontFamily: '"Inter", sans-serif',
    color: 'var(--color-text-primary)',
    maxWidth: 1600,
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 40,
    paddingBottom: 24,
    borderBottom: '1px solid var(--color-border-light)',
  },
  headerLeft: {
    maxWidth: 600,
  },
  headerRight: {
    display: 'flex',
    gap: 16,
  },
  dateLine: { fontSize: 11, fontWeight: 800, letterSpacing: 3, color: 'var(--color-text-muted)', marginBottom: 10 },
  greet: { fontSize: 36, fontWeight: 800, letterSpacing: -1.5, margin: 0, lineHeight: 1.1 },
  name: { color: 'var(--color-accent-strong)' },
  summary: { fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 12, lineHeight: 1.5 },

  statBox: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: '12px 16px',
    minWidth: 120,
  },
  statLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', marginBottom: 4 },
  statVal: { fontSize: 24, fontWeight: 800, letterSpacing: -1, color: 'var(--color-text-primary)' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },

  section: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
  },
  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    background: 'color-mix(in srgb, var(--color-bg-main) 40%, transparent)',
  },
  sectionTitle: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-primary)' },
  sectionCount: { fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' },
  sectionCta: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', textDecoration: 'none' },
  alertDot: { width: 6, height: 6, borderRadius: '50%', background: '#dc2626' },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
  },

  empty: {
    padding: 24,
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: 12,
  },

  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    color: 'var(--color-text-primary)',
  },
  rowIcon: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 1 },
  rowTitle: { fontSize: 13, fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowLink: { color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 },
  rowPill: {
    padding: '3px 6px',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#fff',
    borderRadius: 2,
    marginTop: 1,
  },
  rowLine: {
    fontSize: 12,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
