'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PILLAR_ACCENT = {
  datacenter: '#3b82f6',
  mining: '#f59e0b',
  hub: '#10b981',
};

export default function Dashboard({
  operators,
  stats,
  recent,
  pillarLabel,
  pillarRoute,
  statusFlow,
  statusLabel,
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [drag, setDrag] = useState(null);

  const filtered = useMemo(() => {
    return filter === 'all' ? operators : operators.filter((o) => o.pillar === filter);
  }, [operators, filter]);

  const grouped = useMemo(() => {
    const g = {};
    for (const s of statusFlow) g[s] = [];
    for (const op of filtered) g[op.status].push(op);
    return g;
  }, [filtered, statusFlow]);

  async function moveTo(operatorId, newStatus) {
    setDrag(null);
    await fetch(`/api/admin/operators/${operatorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div style={S.wrap}>
      {/* HEADER */}
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>FUTUR ONE × MISA · CONTROL ROOM</div>
          <h1 style={S.title}>Pipeline</h1>
        </div>
        <button onClick={logout} style={S.logout}>LOGOUT ↗</button>
      </header>

      {/* DECK ACCESS HUB */}
      <section style={S.deckHub}>
        <div style={S.eyebrowSec}>PILLAR DECKS · OPEN IN NEW TAB</div>
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
                PILLAR {pid === 'datacenter' ? 'I' : pid === 'mining' ? 'II' : 'III'}
              </div>
              <div style={S.deckTitle}>{pillarLabel[pid]}</div>
              <div style={S.deckMeta}>
                {stats[pid].total} operators ·{' '}
                {stats[pid].byStatus.in_discussion || 0} in discussion ·{' '}
                {(stats[pid].byStatus.loi || 0) + (stats[pid].byStatus.term_sheet || 0)} active LOI/TS
              </div>
              <div style={S.deckArrow}>OPEN DECK ↗</div>
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
        <button onClick={() => router.refresh()} style={S.refresh}>REFRESH ↻</button>
      </section>

      {/* KANBAN */}
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
                />
              ))}
              {grouped[s].length === 0 && (
                <div style={S.colEmpty}>—</div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* RECENT ACTIVITY */}
      <section style={S.recent}>
        <div style={S.eyebrowSec}>RECENT ACTIVITY · LAST 15</div>
        <div style={S.activityList}>
          {recent.length === 0 ? (
            <div style={S.empty}>No activity yet — open an operator and log your first event.</div>
          ) : (
            recent.map((e) => (
              <Link
                key={e.id}
                href={`/admin/operator/${e.operator_id}`}
                style={S.activityRow}
              >
                <div style={S.activityWhen}>
                  {new Date(e.occurred_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
    </div>
  );
}

function OperatorCard({ op, onDragStart, onDragEnd, pillarColor }) {
  const overdue = op.next_step_due && new Date(op.next_step_due) < new Date();
  return (
    <Link
      href={`/admin/operator/${op.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        ...S.card,
        borderLeft: `3px solid ${pillarColor}`,
      }}
    >
      <div style={S.cardRank}>{op.rank}</div>
      <div style={S.cardName}>{op.name}</div>
      <div style={S.cardCountry}>{op.country}</div>
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
  wrap: {
    padding: '32px 40px 80px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'var(--color-text-primary)',
    maxWidth: 1800,
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
  eyebrowSec: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    marginBottom: 14,
  },
  title: { fontSize: 38, fontWeight: 800, letterSpacing: -1.5, margin: 0 },
  logout: {
    background: 'transparent',
    border: '1px solid var(--color-border-medium)',
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    fontFamily: 'inherit',
  },

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
  refresh: {
    background: 'transparent',
    border: '1px solid var(--color-border-medium)',
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    fontFamily: 'inherit',
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

  /* ACTIVITY */
  recent: {},
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
};
