'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-fetch';
import { PILLAR_ACCENT } from '@/lib/admin-constants';
import { CommandCenterLayout, TaskWidgetItem, QuickStatWidget } from '@/components/admin/layout/CommandCenter';

/**
 * Pipeline Dashboard - Pattern A: Command Center Layout
 * 2 colonnes: Kanban principal + Sidebar avec tâches et liens
 */

export default function Dashboard({
  operators,
  stats,
  recent,
  openTasks = [],
  liveLinks = [],
  wsHealth = [],
  pillarLabel,
  pillarRoute,
  operatorDeckRoute,
  statusFlow,
  statusLabel,
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [drag, setDrag] = useState(null);

  const filtered = useMemo(() => {
    return filter === 'all' ? operators : operators.filter((o) => o.pillar === filter);
  }, [operators, filter]);

  const grouped = useMemo(() => {
    const g = {};
    for (const s of statusFlow) g[s] = [];
    for (const op of filtered) {
      if (g[op.status]) g[op.status].push(op);
    }
    return g;
  }, [filtered, statusFlow]);

  // Tasks bucketed for sidebar
  const taskBuckets = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const in7s = in7.toISOString().slice(0, 10);
    const overdue = [];
    const week = [];
    for (const t of openTasks) {
      if (!t.due_date) continue;
      if (t.due_date < today) overdue.push(t);
      else if (t.due_date <= in7s) week.push(t);
    }
    return { overdue, week, total: overdue.length + week.length };
  }, [openTasks]);

  // Tasks per operator-id (for kanban overdue badge)
  const overdueByOp = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const m = {};
    for (const t of openTasks) {
      if (!t.operator_id) continue;
      if (t.due_date && t.due_date < today) m[t.operator_id] = (m[t.operator_id] || 0) + 1;
    }
    return m;
  }, [openTasks]);

  async function moveTo(operatorId, newStatus) {
    setDrag(null);
    await adminFetch(`/api/admin/operators/${operatorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function toggleTask(id, done) {
    await adminFetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: !done }),
    });
    router.refresh();
  }

  // Build sidebar widgets
  const sidebarWidgets = [
    // MY TASKS
    taskBuckets.total > 0 && {
      title: 'MY TASKS',
      badge: taskBuckets.total,
      cta: { href: '/admin/today', label: 'VIEW ALL →' },
      children: (
        <>
          {taskBuckets.overdue.length > 0 && (
            <div style={{ padding: '8px 14px', background: 'rgba(220,38,38,0.06)', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-accent-strong)', marginBottom: 8 }}>
                OVERDUE ({taskBuckets.overdue.length})
              </div>
              {taskBuckets.overdue.slice(0, 3).map((t) => (
                <TaskWidgetItem key={t.id} task={t} onToggle={toggleTask} accent="var(--color-accent-strong)" />
              ))}
            </div>
          )}
          {taskBuckets.week.slice(0, 5).map((t) => (
            <TaskWidgetItem
              key={t.id}
              task={t}
              onToggle={toggleTask}
              accent={t.operators?.pillar ? PILLAR_ACCENT[t.operators.pillar] : '#94a3b8'}
            />
          ))}
        </>
      ),
    },
    // LIVE LINKS
    liveLinks.length > 0 && {
      title: 'LIVE TRACKED LINKS',
      badge: liveLinks.length,
      cta: null,
      children: (
        <>
          {liveLinks.slice(0, 5).map((l) => (
            <Link
              key={l.id}
              href={`/admin/operator/${l.operator_id}`}
              style={S.linkRow}
            >
              <div style={{ ...S.linkPill, background: PILLAR_ACCENT[l.operators?.pillar] }}>
                {l.audience.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.linkName}>{l.recipient || l.operators?.name || '—'}</div>
                <div style={S.linkMeta}>
                  {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </Link>
          ))}
        </>
      ),
    },
    // QUICK STATS
    {
      title: 'PIPELINE STATS',
      badge: 0,
      cta: null,
      children: (
        <>
          <QuickStatWidget label="Active Operators" value={operators.filter(o => !['closed_won','closed_lost'].includes(o.status)).length} />
          <QuickStatWidget label="Overdue Tasks" value={taskBuckets.overdue.length} alert={taskBuckets.overdue.length > 0} />
          <QuickStatWidget label="Live Deck Links" value={liveLinks.length} />
          <QuickStatWidget label="Workstreams" value={wsHealth.length} />
        </>
      ),
    },
  ].filter(Boolean);

  return (
    <CommandCenterLayout
      eyebrow="FUTUR ONE × MISA · CONTROL ROOM"
      title="Pipeline"
      subtitle={`${operators.filter(o => !['closed_won','closed_lost'].includes(o.status)).length} active accounts across ${wsHealth.length} workstreams`}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/roadmap" style={S.headerCta}>OPEN ROADMAP →</Link>
          <button onClick={() => router.refresh()} style={S.refreshBtn}>REFRESH ↻</button>
        </div>
      }
      sidebarWidgets={sidebarWidgets}
    >
      {/* ROADMAP HEALTH BANNER */}
      {wsHealth.length > 0 && (
        <section style={S.healthSection}>
          <div style={S.healthHead}>
            <div style={S.eyebrowSec}>ROADMAP HEALTH</div>
            <Link href="/admin/roadmap" style={S.healthCta}>VIEW ALL →</Link>
          </div>
          <div style={S.healthGrid}>
            {wsHealth.map((w) => (
              <Link key={w.id} href="/admin/roadmap" style={{ ...S.healthCard, borderTop: `3px solid ${w.accent}` }}>
                <div style={{ ...S.healthCode, color: w.accent }}>{w.code}</div>
                <div style={S.healthLabel}>{w.label}</div>
                <div style={S.healthBar}>
                  <div style={{ ...S.healthBarFill, width: `${w.pct}%`, background: w.accent }} />
                </div>
                <div style={S.healthMeta}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{w.done}/{w.total}</span>
                  {w.live > 0 && <span style={S.healthLive}>● {w.live} live</span>}
                  {w.blocked > 0 && <span style={S.healthBlocked}>● {w.blocked} blocked</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DECK ACCESS HUB — MISA */}
      <section style={S.deckHub}>
        <div style={S.eyebrowSec}>MISA DECKS · COMPLETE PILLAR PROPOSALS</div>
        <div style={S.deckGrid}>
          {['datacenter', 'mining', 'hub'].map((pid) => (
            <a
              key={pid}
              href={pillarRoute[pid]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...S.deckCard, borderLeft: `4px solid ${PILLAR_ACCENT[pid]}` }}
            >
              <div style={{ ...S.deckTag, color: PILLAR_ACCENT[pid] }}>
                PILLAR {pid === 'datacenter' ? 'I' : pid === 'mining' ? 'II' : 'III'} · MISA
              </div>
              <div style={S.deckTitle}>{pillarLabel[pid]}</div>
              <div style={S.deckMeta}>
                {stats[pid].total} operators ·{' '}
                {stats[pid].byStatus.in_discussion || 0} in discussion ·{' '}
                {(stats[pid].byStatus.loi || 0) + (stats[pid].byStatus.term_sheet || 0)} active LOI/TS
              </div>
              <div style={S.deckArrow}>OPEN MISA DECK ↗</div>
            </a>
          ))}
        </div>
      </section>

      {/* DECK ACCESS HUB — OPERATOR-FACING */}
      <section style={S.deckHub}>
        <div style={S.eyebrowSec}>OPERATOR DECKS · ANONYMIZED · ONE EXCLUSIVE SLOT</div>
        <div style={S.deckGrid}>
          {['datacenter', 'mining', 'hub'].map((pid) => (
            <a
              key={pid}
              href={operatorDeckRoute[pid]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...S.deckCard, borderLeft: `4px solid ${PILLAR_ACCENT[pid]}`, background: 'var(--color-bg-main)' }}
            >
              <div style={{ ...S.deckTag, color: PILLAR_ACCENT[pid] }}>
                PILLAR {pid === 'datacenter' ? 'I' : pid === 'mining' ? 'II' : 'III'} · OPERATOR
              </div>
              <div style={S.deckTitle}>{pillarLabel[pid]}</div>
              <div style={S.deckMeta}>Slot is real · We won&apos;t compete · 60-day path</div>
              <div style={S.deckArrow}>OPEN OPERATOR DECK ↗</div>
            </a>
          ))}
        </div>
      </section>

      {/* FILTER */}
      <section style={S.filterRow}>
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>ALL</FilterBtn>
        {['datacenter', 'mining', 'hub'].map((pid) => (
          <FilterBtn
            key={pid}
            active={filter === pid}
            color={PILLAR_ACCENT[pid]}
            onClick={() => setFilter(pid)}
          >
            {pillarLabel[pid].toUpperCase()} · {stats[pid].total}
          </FilterBtn>
        ))}
        <div style={{ flex: 1 }} />
        <FilterBtn active={view === 'list'} onClick={() => setView('list')}>LIST VIEW</FilterBtn>
        <FilterBtn active={view === 'kanban'} onClick={() => setView('kanban')}>KANBAN</FilterBtn>
      </section>

      {/* VIEWS */}
      {view === 'kanban' ? (
        <section style={S.kanban}>
          {statusFlow.map((s) => (
            <div
              key={s}
              style={S.col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drag && moveTo(drag, s)}
            >
              <div style={S.colHeader}>
                <span>{statusLabel[s].toUpperCase()}</span>
                <span style={S.colCount}>{grouped[s].length}</span>
              </div>
              <div style={S.colBody}>
                {grouped[s].map((op) => (
                  <OperatorCard
                    key={op.id}
                    op={op}
                    onDragStart={() => setDrag(op.id)}
                    onDragEnd={() => setDrag(null)}
                    pillarColor={PILLAR_ACCENT[op.pillar]}
                    overdueCount={overdueByOp[op.id] || 0}
                  />
                ))}
                {grouped[s].length === 0 && <div style={S.colEmpty}>—</div>}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section style={S.listView}>
          <div style={S.listHeader}>
            <div style={{ width: 40 }}>RK</div>
            <div style={{ flex: 2 }}>OPERATOR</div>
            <div style={{ flex: 1 }}>PILLAR</div>
            <div style={{ flex: 1 }}>STATUS</div>
            <div style={{ flex: 1.5 }}>NEXT STEP</div>
          </div>
          {filtered.map(op => (
            <Link key={op.id} href={`/admin/operator/${op.id}`} style={{ ...S.listRow, borderLeft: `3px solid ${PILLAR_ACCENT[op.pillar]}` }}>
              <div style={S.listRank}>{op.rank}</div>
              <div style={{ flex: 2, minWidth: 0 }}>
                <div style={S.listName}>{op.name}</div>
                <div style={S.listCountry}>{op.country}</div>
              </div>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: PILLAR_ACCENT[op.pillar] }}>{pillarLabel[op.pillar]?.toUpperCase()}</div>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>{statusLabel[op.status]}</div>
              <div style={{ flex: 1.5, fontSize: 11, lineHeight: 1.4, color: 'var(--color-text-secondary)' }}>
                {op.next_step || '—'}
                {op.next_step_due && <span style={{ marginLeft: 6, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>({new Date(op.next_step_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <div style={S.listEmpty}>No operators found.</div>}
        </section>
      )}

      {/* RECENT ACTIVITY */}
      <section style={S.recent}>
        <div style={S.eyebrowSec}>RECENT ACTIVITY · LAST 15</div>
        <div style={S.activityList}>
          {recent.length === 0 ? (
            <div style={S.empty}>No activity yet — open an operator and log your first event.</div>
          ) : (
            recent.map((e) => (
              <Link key={e.id} href={`/admin/operator/${e.operator_id}`} style={S.activityRow}>
                <div style={S.activityWhen}>
                  {new Date(e.occurred_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ ...S.activityPill, background: PILLAR_ACCENT[e.operators?.pillar] }}>
                  {e.operators?.name}
                </div>
                <div style={S.activityType}>{e.type.replace(/_/g, ' ')}</div>
                <div style={S.activitySubject}>{e.subject || e.body || '—'}</div>
              </Link>
            ))
          )}
        </div>
      </section>
    </CommandCenterLayout>
  );
}

function OperatorCard({ op, onDragStart, onDragEnd, pillarColor, overdueCount = 0 }) {
  const overdue = op.next_step_due && new Date(op.next_step_due) < new Date();
  return (
    <Link
      href={`/admin/operator/${op.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ ...S.card, borderLeft: `3px solid ${pillarColor}`, position: 'relative' }}
    >
      <div style={S.cardRank}>{op.rank}</div>
      <div style={S.cardName}>{op.name}</div>
      <div style={S.cardCountry}>{op.country}</div>
      {overdueCount > 0 && <div style={S.overdueBadge}>{overdueCount} OVERDUE</div>}
      {op.next_step && (
        <div style={{ ...S.cardNext, color: overdue ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
          → {op.next_step}
          {op.next_step_due && (
            <span style={{ fontVariantNumeric: 'tabular-nums', marginLeft: 6 }}>
              ({new Date(op.next_step_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function FilterBtn({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.filter,
        background: active ? (color || 'var(--color-text-primary)') : 'transparent',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        borderColor: color || 'var(--color-border-medium)',
      }}
    >
      {children}
    </button>
  );
}

const S = {
  headerCta: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: '#fff',
    background: 'var(--color-text-primary)',
    padding: '10px 14px',
    textDecoration: 'none',
  },
  refreshBtn: {
    background: 'transparent',
    border: '1px solid var(--color-border-medium)',
    padding: '10px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    fontFamily: 'inherit',
  },

  eyebrowSec: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    marginBottom: 14,
  },

  /* ROADMAP HEALTH */
  healthSection: { marginBottom: 36 },
  healthHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  healthCta: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
  },
  healthCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: 16,
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  healthCode: { fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.5 },
  healthLabel: { fontSize: 14, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 },
  healthBar: {
    width: '100%',
    height: 4,
    background: 'var(--color-border-light)',
    marginTop: 4,
  },
  healthBarFill: { height: 4, transition: 'width .3s ease' },
  healthMeta: {
    display: 'flex',
    gap: 10,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    color: 'var(--color-text-muted)',
    flexWrap: 'wrap',
  },
  healthLive: { color: 'var(--cp-warning)' },
  healthBlocked: { color: 'var(--cp-error)' },

  /* DECK HUB */
  deckHub: { marginBottom: 40 },
  deckGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 },
  deckCard: {
    display: 'block',
    padding: 22,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    transition: 'transform .2s ease, box-shadow .2s ease',
  },
  deckTag: { fontSize: 10, letterSpacing: 2.5, fontWeight: 800, marginBottom: 8 },
  deckTitle: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 10 },
  deckMeta: { fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 },
  deckArrow: {
    marginTop: 14,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-accent-strong)',
  },

  /* FILTER */
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 },
  filter: {
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s ease',
  },

  /* KANBAN */
  kanban: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, minmax(180px, 1fr))',
    gap: 8,
    marginBottom: 40,
    overflowX: 'auto',
    paddingBottom: 6,
  },
  col: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    minHeight: 280,
    display: 'flex',
    flexDirection: 'column',
  },
  colHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid var(--color-border-light)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-text-secondary)',
  },
  colCount: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: 'var(--color-accent-strong)',
  },
  colBody: { padding: 8, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  colEmpty: { padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 11 },

  /* LIST VIEW */
  listView: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    marginBottom: 40,
  },
  listHeader: {
    display: 'flex',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-text-muted)',
    background: 'color-mix(in srgb, var(--color-text-primary) 3%, transparent)',
    gap: 16,
  },
  listRow: {
    display: 'flex',
    padding: '14px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    alignItems: 'center',
    gap: 16,
  },
  listRank: { width: 40, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--color-accent-strong)' },
  listName: { fontSize: 13, fontWeight: 800 },
  listCountry: { fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 },
  listEmpty: { padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' },

  card: {
    display: 'block',
    background: 'var(--color-bg-main)',
    border: '1px solid var(--color-border-light)',
    padding: '12px 12px 12px 14px',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    cursor: 'grab',
  },
  cardRank: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-accent-strong)',
    marginBottom: 4,
  },
  cardName: { fontSize: 13, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 },
  cardCountry: { fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 },
  cardNext: { fontSize: 10, marginTop: 8, lineHeight: 1.4 },
  overdueBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'var(--color-accent-strong)',
    color: '#fff',
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1,
    padding: '2px 5px',
  },

  /* ACTIVITY */
  recent: { marginTop: 20 },
  activityList: {
    border: '1px solid var(--color-border-light)',
    background: 'var(--color-surface)',
  },
  activityRow: {
    display: 'grid',
    gridTemplateColumns: '120px 220px 130px 1fr',
    gap: 16,
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    alignItems: 'center',
    fontSize: 12,
  },
  activityWhen: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: 'var(--color-text-muted)',
  },
  activityPill: {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#fff',
    width: 'fit-content',
  },
  activityType: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
  },
  activitySubject: { fontSize: 12, color: 'var(--color-text-secondary)' },
  empty: { padding: 28, color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center' },

  /* Sidebar link items */
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
  },
  linkPill: {
    padding: '3px 7px',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: '#fff',
    flexShrink: 0,
  },
  linkName: {
    fontSize: 13,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  linkMeta: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    marginTop: 2,
  },
};
