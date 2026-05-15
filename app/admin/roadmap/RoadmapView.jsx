'use client';
/* eslint-disable no-unused-vars */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RoadmapView({
  workstreams,
  initiatives,
  linksByInit,
  ownerLabel,
  ownerColor,
  statusLabel,
  statusColor,
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [drag, setDrag] = useState(null);

  async function moveTo(initiativeId, newStatus) {
    setDrag(null);
    await fetch(`/api/admin/initiatives/${initiativeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  function exportPdf() {
    if (typeof window !== 'undefined') window.print();
  }

  // Health metrics
  const stats = useMemo(() => {
    const byStream = {};
    for (const w of workstreams) byStream[w.id] = { total: 0, done: 0, in_progress: 0, blocked: 0, planned: 0 };
    for (const i of initiatives) {
      const s = byStream[i.workstream_id];
      if (!s) continue;
      s.total += 1;
      if (i.status === 'done') s.done += 1;
      if (i.status === 'in_progress') s.in_progress += 1;
      if (i.status === 'blocked') s.blocked += 1;
      if (i.status === 'planned' || i.status === 'not_started') s.planned += 1;
    }
    return byStream;
  }, [workstreams, initiatives]);

  return (
    <div style={S.wrap} className="roadmap-print-root">
      <header style={S.header} className="no-print">
        <div>
          <Link href="/admin" style={S.back}>← BACK TO PIPELINE</Link>
          <div style={S.eyebrow}>FUTUR ONE × MISA · STRATEGIC ROADMAP</div>
          <h1 style={S.title}>Roadmap</h1>
          <p style={S.sub}>
            {initiatives.length} initiatives · {workstreams.length} workstreams · live execution view
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setNewOpen(true)} style={S.newBtn}>+ NEW INITIATIVE</button>
          <button onClick={exportPdf} style={S.pdfBtn}>EXPORT PDF ↗</button>
        </div>
      </header>

      {/* Print-only header — only visible on PDF export */}
      <div className="print-only" style={S.printHeader}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#666' }}>FUTUR ONE × MISA · STRATEGIC ROADMAP</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, marginTop: 4 }}>Roadmap</div>
        </div>
        <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>
          {initiatives.length} initiatives · {workstreams.length} workstreams<br />
          Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {newOpen && (
        <NewInitiativeModal
          workstreams={workstreams}
          ownerLabel={ownerLabel}
          onClose={() => setNewOpen(false)}
          onCreated={() => { setNewOpen(false); router.refresh(); }}
        />
      )}

      <StreamsView
        workstreams={workstreams}
        initiatives={initiatives}
        stats={stats}
        linksByInit={linksByInit}
        ownerLabel={ownerLabel}
        ownerColor={ownerColor}
        statusLabel={statusLabel}
        statusColor={statusColor}
        drag={drag}
        setDrag={setDrag}
        moveTo={moveTo}
      />
    </div>
  );
}

/* ============================ STREAMS VIEW ============================ */
function StreamsView({ workstreams, initiatives, stats, linksByInit, ownerLabel, ownerColor, statusLabel, statusColor, drag, setDrag, moveTo }) {
  // Display only 4 actionable buckets in the per-stream sub-kanban (hide archived)
  const buckets = ['planned', 'in_progress', 'blocked', 'done'];
  return (
    <div style={S.streamsGrid}>
      {workstreams.map((w) => {
        const items = initiatives.filter((i) => i.workstream_id === w.id);
        const grouped = {};
        for (const b of buckets) grouped[b] = [];
        for (const it of items) {
          if (it.status === 'not_started') grouped.planned.push(it);
          else if (grouped[it.status]) grouped[it.status].push(it);
        }
        const s = stats[w.id] || { total: 0, done: 0, in_progress: 0, blocked: 0, planned: 0 };
        const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
        return (
          <div key={w.id} style={{ ...S.streamCard, borderTop: `4px solid ${w.accent}` }} className="ws-card">
            <div style={S.streamHeader}>
              <div>
                <div style={{ ...S.streamCode, color: w.accent }}>{w.code}</div>
                <div style={S.streamLabel}>{w.label}</div>
                <div style={S.streamTagline}>{w.tagline}</div>
              </div>
              <div>
                <div style={S.progressRing}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-border-light)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke={w.accent} strokeWidth="4"
                      strokeDasharray={150.8} strokeDashoffset={150.8 * (1 - pct / 100)}
                      strokeLinecap="round" transform="rotate(-90 28 28)" />
                  </svg>
                  <div style={S.progressText}>{pct}%</div>
                </div>
              </div>
            </div>

            <div style={S.streamStats}>
              <Stat n={s.in_progress} l="LIVE" color={statusColor.in_progress} />
              <Stat n={s.blocked} l="BLOCKED" color={statusColor.blocked} />
              <Stat n={s.planned} l="PLANNED" color={statusColor.planned} />
              <Stat n={s.done} l="DONE" color={statusColor.done} />
            </div>

            {/* Sub-kanban inside each workstream */}
            <div style={S.subKanban} className="no-print">
              {buckets.map((b) => (
                <div
                  key={b}
                  style={{
                    ...S.subCol,
                    borderTop: `2px solid ${statusColor[b]}`,
                    background: drag && drag.bucket !== b ? 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)' : 'transparent',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => drag && moveTo(drag.id, b)}
                >
                  <div style={S.subColHead}>
                    <span style={{ color: statusColor[b], fontWeight: 800, letterSpacing: 1.5, fontSize: 9 }}>
                      {statusLabel[b].toUpperCase()}
                    </span>
                    <span style={S.subColCount}>{grouped[b].length}</span>
                  </div>
                  <div style={S.subColBody}>
                    {grouped[b].map((i) => (
                      <DraggableInitChip
                        key={i.id}
                        i={i}
                        statusColor={statusColor}
                        ownerColor={ownerColor}
                        ownerLabel={ownerLabel}
                        linksByInit={linksByInit}
                        onDragStart={() => setDrag({ id: i.id, bucket: b })}
                        onDragEnd={() => setDrag(null)}
                      />
                    ))}
                    {grouped[b].length === 0 && <div style={S.subColEmpty}>—</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Print-friendly flat list (only visible in PDF export) */}
            <div className="print-only" style={S.streamItems}>
              {items.map((i) => (
                <div key={i.id} style={S.initRow}>
                  <div style={{ ...S.initStatusDot, background: statusColor[i.status] }} />
                  <div style={S.initContent}>
                    <div style={S.initHead}>
                      <span style={S.initCode}>{i.code}</span>
                      <span style={S.initTitle}>{i.title}</span>
                    </div>
                    <div style={S.initMeta}>
                      <span style={{ ...S.ownerPill, color: ownerColor[i.owner_entity], borderColor: ownerColor[i.owner_entity] }}>{ownerLabel[i.owner_entity]}</span>
                      <span style={{ ...S.statusPill, color: statusColor[i.status] }}>{statusLabel[i.status]}</span>
                      {i.priority === 'critical' && <span style={S.critTag}>CRITICAL</span>}
                      {i.due_date && <span style={S.dueChip}>{new Date(i.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div style={S.streamEmpty}>No initiatives yet.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DraggableInitChip({ i, statusColor, ownerColor, ownerLabel, linksByInit, onDragStart, onDragEnd }) {
  const links = linksByInit[i.id] || { partners: [], operators: [] };
  return (
    <Link
      href={`/admin/initiative/${i.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        ...S.subCard,
        borderLeft: `3px solid ${ownerColor[i.owner_entity]}`,
      }}
    >
      <div style={S.subCardHead}>
        <span style={S.subCardCode}>{i.code}</span>
        {i.priority === 'critical' && <span style={S.subCardCrit}>!</span>}
      </div>
      <div style={S.subCardTitle}>{i.title}</div>
      <div style={S.subCardMeta}>
        <span style={{ ...S.subCardOwner, color: ownerColor[i.owner_entity] }}>{ownerLabel[i.owner_entity]}</span>
        {i.due_date && (
          <span style={S.subCardDue}>
            {new Date(i.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {(links.partners.length + links.operators.length) > 0 && (
          <span style={S.subCardLinks}>🔗 {links.partners.length + links.operators.length}</span>
        )}
      </div>
    </Link>
  );
}

/* ============================ NEW INITIATIVE MODAL ============================ */
function NewInitiativeModal({ workstreams, ownerLabel, onClose, onCreated }) {
  const [form, setForm] = useState({
    workstream_id: workstreams[0]?.id || '',
    code: '',
    title: '',
    body: '',
    owner_entity: 'hearst',
    priority: 'medium',
    due_date: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.title || !form.workstream_id) {
      setErr('Workstream and title are required');
      return;
    }
    setBusy(true);
    setErr('');
    const res = await fetch('/api/admin/initiatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        code: form.code || null,
        due_date: form.due_date || null,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(j.error || 'Failed'); return; }
    onCreated();
  }

  const ws = workstreams.find((w) => w.id === form.workstream_id);
  const accent = ws?.accent || 'var(--color-accent-strong)';

  return (
    <div style={S.modalBackdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: accent }}>NEW INITIATIVE</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: -0.8 }}>Add to roadmap</h2>
          </div>
          <button onClick={onClose} style={S.modalClose}>×</button>
        </div>
        <div style={S.modalBody}>
          <Field label="WORKSTREAM">
            <select
              value={form.workstream_id}
              onChange={(e) => setForm({ ...form, workstream_id: e.target.value })}
              style={S.input}
            >
              {workstreams.map((w) => (
                <option key={w.id} value={w.id}>{w.code} — {w.label}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <Field label="CODE (opt)">
              <input
                style={S.input}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="LP-5"
              />
            </Field>
            <Field label="TITLE">
              <input
                style={S.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short imperative — e.g. Engage Meeza on hub expansion"
              />
            </Field>
          </div>
          <Field label="DESCRIPTION">
            <textarea
              style={{ ...S.input, minHeight: 90, fontFamily: 'inherit', resize: 'vertical' }}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="What this initiative is and why."
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="OWNER">
              <select value={form.owner_entity} onChange={(e) => setForm({ ...form, owner_entity: e.target.value })} style={S.input}>
                {Object.entries(ownerLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="PRIORITY">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={S.input}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
            <Field label="DUE DATE">
              <input type="date" style={S.input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
          </div>
          {err && <div style={{ color: 'var(--color-accent-strong)', fontSize: 12, fontWeight: 600 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={S.btnSecondary}>CANCEL</button>
            <button
              onClick={submit}
              disabled={busy || !form.title}
              style={{ ...S.btnPrimary, background: accent }}
            >
              {busy ? '…' : 'CREATE INITIATIVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Stat({ n, l, color }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statN, color }}>{n}</div>
      <div style={S.statL}>{l}</div>
    </div>
  );
}

/* ============================ TIMELINE VIEW ============================ */
function TimelineView({ initiatives, workstreams, statusColor, ownerColor, ownerLabel }) {
  // Build a 9-month visible window starting from earliest start or today
  const today = new Date();
  const months = [];
  for (let i = -1; i < 8; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push(d);
  }
  const firstMs = months[0].getTime();
  const lastMs = new Date(months.at(-1).getFullYear(), months.at(-1).getMonth() + 1, 1).getTime();
  const range = lastMs - firstMs;

  // Group by workstream
  const grouped = workstreams
    .map((w) => ({ w, items: initiatives.filter((i) => i.workstream_id === w.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div style={S.timelineWrap}>
      {/* Month header */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', borderBottom: '1px solid var(--color-border-light)' }}>
        <div style={{ padding: '10px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)' }}>WORKSTREAM / INITIATIVE</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, borderLeft: '1px solid var(--color-border-light)' }}>
          {months.map((m, i) => (
            <div key={i} style={{ padding: '10px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border-light)', textAlign: 'left' }}>
              {m.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} {String(m.getFullYear()).slice(2)}
            </div>
          ))}
        </div>
      </div>

      {grouped.map(({ w, items }) => (
        <div key={w.id}>
          <div style={{ ...S.tlGroupHead, borderLeft: `4px solid ${w.accent}` }}>
            <span style={{ color: w.accent, fontWeight: 800, fontSize: 11, letterSpacing: 2 }}>{w.code}</span>
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: 13 }}>{w.label}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 11 }}>{items.length} initiatives</span>
          </div>
          {items.map((i) => {
            const s = i.start_date ? new Date(i.start_date).getTime() : Date.now();
            const e = i.due_date ? new Date(i.due_date).getTime() : (s + 1000 * 60 * 60 * 24 * 21);
            const left = Math.max(0, ((s - firstMs) / range) * 100);
            const width = Math.max(2, ((e - s) / range) * 100);
            const isPoint = !i.start_date || !i.due_date;
            return (
              <Link
                key={i.id}
                href={`/admin/initiative/${i.id}`}
                style={{ display: 'grid', gridTemplateColumns: '220px 1fr', borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none', color: 'var(--color-text-primary)', transition: 'background .15s' }}
              >
                <div style={{ padding: '10px 14px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-text-muted)' }}>{i.code}</div>
                  <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{i.title}</div>
                </div>
                <div style={{ position: 'relative', height: 42, borderLeft: '1px solid var(--color-border-light)', background: 'repeating-linear-gradient(to right, transparent 0, transparent calc(100%/9 - 1px), var(--color-border-light) calc(100%/9 - 1px), var(--color-border-light) calc(100%/9))' }}>
                  <div
                    title={`${i.code} · ${i.title} · ${ownerLabel[i.owner_entity]}`}
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: `${left}%`,
                      width: isPoint ? 10 : `${width}%`,
                      height: 18,
                      background: statusColor[i.status],
                      borderLeft: `3px solid ${ownerColor[i.owner_entity]}`,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#fff',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      borderRadius: isPoint ? '50%' : 0,
                    }}
                  >
                    {!isPoint && width > 6 ? i.code : ''}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
      {grouped.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
          No initiatives match the current filter.
        </div>
      )}
    </div>
  );
}

/* ============================ LIST VIEW ============================ */
function ListView({ initiatives, wsById, linksByInit, ownerLabel, ownerColor, statusLabel, statusColor, priorityLabel }) {
  return (
    <div style={S.listWrap}>
      <div style={{ ...S.listRow, ...S.listHead }}>
        <div>CODE</div>
        <div>TITLE</div>
        <div>WORKSTREAM</div>
        <div>OWNER</div>
        <div>STATUS</div>
        <div>PRIORITY</div>
        <div>DUE</div>
        <div>LINKS</div>
      </div>
      {initiatives.map((i) => {
        const w = wsById[i.workstream_id];
        const links = linksByInit[i.id] || { partners: [], operators: [] };
        return (
          <Link key={i.id} href={`/admin/initiative/${i.id}`} style={S.listRow}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>{i.code}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{i.title}</div>
            <div>
              {w && <span style={{ fontSize: 11, fontWeight: 700, color: w.accent }}>{w.code}</span>}
              {w && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>{w.label}</span>}
            </div>
            <div>
              <span style={{ ...S.ownerPill, color: ownerColor[i.owner_entity], borderColor: ownerColor[i.owner_entity] }}>
                {ownerLabel[i.owner_entity]}
              </span>
            </div>
            <div>
              <span style={{ ...S.statusPill, color: statusColor[i.status] }}>{statusLabel[i.status]}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: i.priority === 'critical' ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
              {priorityLabel[i.priority]}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              {i.due_date ? new Date(i.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {(links.partners.length + links.operators.length) || '—'}
            </div>
          </Link>
        );
      })}
      {initiatives.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
          No initiatives match the current filter.
        </div>
      )}
    </div>
  );
}

function SelectFilter({ value, onChange, label, options }) {
  return (
    <label style={S.filterLabel}>
      <span style={S.filterLabelText}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={S.select}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

const S = {
  wrap: {
    padding: '24px 40px 80px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'var(--color-text-primary)',
    maxWidth: 1800,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 28,
    paddingBottom: 18,
    borderBottom: '1px solid var(--color-border-light)',
  },
  back: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    display: 'block',
    marginBottom: 12,
  },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: 800, color: 'var(--color-accent-strong)', marginBottom: 6 },
  title: { fontSize: 38, fontWeight: 800, letterSpacing: -1.5, margin: '0 0 4px' },
  sub: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0 },

  viewSwitch: { display: 'flex', gap: 4, padding: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' },
  viewBtn: {
    padding: '8px 16px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    border: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  filterBar: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    padding: '12px 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    marginBottom: 18,
  },
  filterLabel: { display: 'flex', alignItems: 'center', gap: 8 },
  filterLabelText: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)' },
  select: {
    padding: '6px 10px',
    fontSize: 12,
    border: '1px solid var(--color-border-medium)',
    background: 'var(--color-bg-main)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  counter: { fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' },

  /* STREAMS */
  streamsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 },
  streamCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' },
  streamHeader: { padding: '20px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  streamCode: { fontSize: 11, fontWeight: 800, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 6 },
  streamLabel: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 },
  streamTagline: { fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.4 },
  progressRing: { position: 'relative', width: 56, height: 56 },
  progressText: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: 12,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },

  streamStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 1,
    background: 'var(--color-border-light)',
    borderTop: '1px solid var(--color-border-light)',
    borderBottom: '1px solid var(--color-border-light)',
  },
  stat: { background: 'var(--color-surface)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  statN: { fontSize: 18, fontWeight: 800, letterSpacing: -0.5 },
  statL: { fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)' },

  streamItems: { padding: 8, display: 'flex', flexDirection: 'column' },
  streamEmpty: { padding: 16, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' },

  initRow: {
    display: 'flex',
    gap: 12,
    padding: '10px 12px',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    borderBottom: '1px solid var(--color-border-light)',
  },
  initStatusDot: { width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0 },
  initContent: { flex: 1, minWidth: 0 },
  initHead: { display: 'flex', alignItems: 'baseline', gap: 8 },
  initCode: { fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)' },
  initTitle: { fontSize: 13, fontWeight: 600, lineHeight: 1.35 },
  initMeta: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },

  ownerPill: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.2,
    border: '1px solid',
    padding: '2px 6px',
    borderRadius: 1,
  },
  statusPill: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.2,
    padding: '2px 0',
  },
  critTag: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.2,
    background: 'var(--color-accent-strong)',
    color: '#fff',
    padding: '2px 6px',
  },
  dueChip: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'var(--color-text-muted)',
    fontWeight: 700,
  },
  linksChip: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    fontWeight: 600,
  },

  /* TIMELINE */
  timelineWrap: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    overflow: 'auto',
  },
  tlGroupHead: {
    padding: '10px 14px',
    background: 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)',
    borderBottom: '1px solid var(--color-border-light)',
    display: 'flex',
    alignItems: 'center',
  },

  /* LIST */
  listWrap: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' },
  listRow: {
    display: 'grid',
    gridTemplateColumns: '70px 2fr 1.5fr 100px 130px 90px 80px 60px',
    gap: 14,
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    alignItems: 'center',
  },
  listHead: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    background: 'color-mix(in srgb, var(--color-text-primary) 3%, transparent)',
  },

  /* New / PDF buttons in header */
  newBtn: {
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    border: 0,
    background: 'var(--color-accent-strong)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  pdfBtn: {
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    border: '1px solid var(--color-border-medium)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  /* Sub-kanban inside each workstream card */
  subKanban: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    padding: 8,
    background: 'color-mix(in srgb, var(--color-text-primary) 2%, transparent)',
  },
  subCol: {
    background: 'var(--color-bg-main)',
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    transition: 'background .12s ease',
  },
  subColHead: {
    padding: '8px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border-light)',
  },
  subColCount: { fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-muted)' },
  subColBody: { padding: 6, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  subColEmpty: { fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' },

  subCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: 8,
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    cursor: 'grab',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  subCardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCardCode: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1,
    color: 'var(--color-text-muted)',
  },
  subCardCrit: {
    background: 'var(--color-accent-strong)',
    color: '#fff',
    padding: '0 5px',
    fontSize: 9,
    fontWeight: 800,
    borderRadius: 1,
  },
  subCardTitle: { fontSize: 11, fontWeight: 600, lineHeight: 1.35 },
  subCardMeta: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  subCardOwner: { fontSize: 9, fontWeight: 800, letterSpacing: 1 },
  subCardDue: { fontSize: 9, fontFamily: 'monospace', color: 'var(--color-text-muted)', fontWeight: 700 },
  subCardLinks: { fontSize: 9, color: 'var(--color-text-muted)' },

  /* Modal */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'color-mix(in srgb, var(--color-gray-900) 60%, transparent)',
    backdropFilter: 'blur(6px)',
    zIndex: 200,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },
  modal: {
    width: 600,
    maxWidth: '100%',
    background: 'var(--color-bg-main)',
    border: '1px solid var(--color-border-light)',
    boxShadow: '0 30px 80px color-mix(in srgb, var(--color-gray-900) 40%, transparent)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  modalClose: {
    background: 'transparent',
    border: 0,
    fontSize: 28,
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    lineHeight: 1,
    width: 32,
    height: 32,
  },
  modalBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border-medium)',
    background: 'var(--color-bg-main)',
    fontSize: 13,
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    padding: '10px 18px',
    border: 0,
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '10px 14px',
    border: '1px solid var(--color-border-medium)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  /* Print-only header */
  printHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottom: '2px solid #000',
  },
};
