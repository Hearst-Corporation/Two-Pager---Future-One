'use client';

import Link from 'next/link';
import Avatar from '@/components/admin/Avatar';

/**
 * CommandCenter Layout - Pattern A
 * Layout 2 colonnes pour les pages de travail (Pipeline, Roadmap, Today)
 *
 * Structure:
 * - Header: Titre, contexte, stats
 * - ContentGrid: 2 cols (main + sidebar)
 * - MainZone: Contenu principal (kanban, timeline, etc.)
 * - Sidebar: Widgets contextuels (tasks, notifications, quick stats)
 */

export function CommandCenterLayout({
  children,

  // Header
  eyebrow = null,
  title,
  subtitle = null,
  actions = null, // ReactNode for top-right actions

  // Sidebar content
  sidebarWidgets = [], // Array of { title, badge?, cta?, children }
}) {
  return (
    <div style={S.wrap}>
      {/* HEADER */}
      <header style={S.header}>
        <div>
          {eyebrow && <div style={S.eyebrow}>{eyebrow}</div>}
          <h1 style={S.title}>{title}</h1>
          {subtitle && <p style={S.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div style={S.headerActions}>{actions}</div>}
      </header>

      {/* CONTENT GRID */}
      <div style={S.grid}>
        <main style={S.main}>
          {children}
        </main>

        {/* SIDEBAR */}
        {sidebarWidgets.length > 0 && (
          <aside style={S.aside}>
            {sidebarWidgets.map((widget, i) => (
              <SidePanel
                key={i}
                title={widget.title}
                badge={widget.badge}
                cta={widget.cta}
              >
                {widget.children}
              </SidePanel>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}

/* ============================ SIDEBAR WIDGETS ============================ */

export function SidePanel({ title, badge, cta, children }) {
  return (
    <section style={S.sidePanel}>
      <div style={S.sideHead}>
        <div style={S.sideTitleRow}>
          <span style={S.sideTitle}>{title}</span>
          {badge > 0 && <span style={S.sideBadge}>{badge}</span>}
        </div>
        {cta && <Link href={cta.href} style={S.sideCta}>{cta.label}</Link>}
      </div>
      <div style={S.sideBody}>{children}</div>
    </section>
  );
}

export function TaskWidgetItem({ task, onToggle, accent }) {
  const target = task.operator_id
    ? `/admin/operator/${task.operator_id}`
    : task.partner_id
    ? `/admin/partner/${task.partner_id}`
    : task.initiative_id
    ? `/admin/initiative/${task.initiative_id}`
    : null;
  const parent = task.operators?.name || task.partners?.name || (task.initiative_id ? 'Initiative' : '');
  const overdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10);

  return (
    <div style={S.taskRow}>
      <button
        onClick={() => onToggle?.(task.id, task.done)}
        style={{ ...S.taskCheck, borderColor: accent || 'var(--color-border-medium)' }}
        aria-label="Mark done"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.taskTitle}>{task.title}</div>
        <div style={S.taskMeta}>
          {task.due_date && (
            <span style={{ color: overdue ? 'var(--color-accent-strong)' : 'var(--color-text-muted)', fontWeight: overdue ? 700 : 400 }}>
              {overdue ? 'OVERDUE · ' : ''}
              {new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
          {parent && target && (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}> · </span>
              <Link href={target} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                {parent}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationWidgetItem({ notification }) {
  const target = notification.parent_kind === 'operator'
    ? `/admin/operator/${notification.parent_id}`
    : notification.parent_kind === 'partner'
    ? `/admin/partner/${notification.parent_id}`
    : notification.parent_kind === 'initiative'
    ? `/admin/initiative/${notification.parent_id}`
    : '/admin/notifications';

  return (
    <Link href={target} style={S.notifRow}>
      <Avatar profile={notification.actor} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.notifLine}>
          <strong>{notification.actor?.full_name || notification.actor?.email || 'Someone'}</strong>
          <span style={{ color: 'var(--color-text-muted)' }}> · {notification.type.replace(/_/g, ' ')}</span>
        </div>
        {notification.body && <div style={S.notifBody}>{notification.body}</div>}
      </div>
    </Link>
  );
}

export function QuickStatWidget({ label, value, alert = false }) {
  return (
    <div style={S.statRow}>
      <span style={S.statLabel}>{label}</span>
      <span style={{ ...S.statValue, color: alert ? 'var(--color-accent-strong)' : 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

/* ============================ STYLES ============================ */
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
    marginBottom: 32,
    paddingBottom: 18,
    borderBottom: '1px solid var(--color-border-light)',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: -1.5,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    marginTop: 10,
  },
  headerActions: {
    display: 'flex',
    gap: 12,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    gap: 32,
  },
  main: {
    minWidth: 0,
  },
  aside: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  // Sidebar panels
  sidePanel: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
  },
  sideHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  sideTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sideTitle: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-primary)',
  },
  sideBadge: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
  },
  sideCta: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
  },
  sideBody: {
    display: 'flex',
    flexDirection: 'column',
  },

  // Task widget item
  taskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  taskCheck: {
    width: 20,
    height: 20,
    border: '1.5px solid',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 1,
    padding: 0,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  taskMeta: {
    marginTop: 4,
    fontSize: 11,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },

  // Notification widget item
  notifRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
  },
  notifLine: {
    fontSize: 12,
    lineHeight: 1.45,
  },
  notifBody: {
    marginTop: 3,
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },

  // Quick stats
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'monospace',
  },
};
