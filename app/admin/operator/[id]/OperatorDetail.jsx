'use client';
/* eslint-disable no-unused-vars */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PILLAR_ACCENT } from '@/lib/admin-constants';
import AssigneePicker from '@/components/admin/AssigneePicker';
import CommentThread from '@/components/admin/CommentThread';
import { EntityDetailLayout, QuickActionButton, LinkedItemCard } from '@/components/admin/layout/EntityDetail';

/**
 * Operator Detail - Pattern B: Entity Detail Layout
 * Tabs reduits de 7 à 4 pour une UX plus claire:
 * - Overview: Notes, next step, infos principales
 * - Activity: Tasks + Timeline + Comments + Stakeholders (fusionnés)
 * - Tracking: Deck links et analytics
 * - Documents: Fichiers et liens
 */

export default function OperatorDetail({
  me = null,
  operator,
  stakeholders,
  events,
  documents,
  deckLinks,
  tasks,
  initiatives = [],
  statusFlow,
  statusLabel,
  pillarLabel,
  pillarRoute,
  operatorDeckRoute,
  eventLabel,
  initStatusLabel = {},
  initStatusColor = {},
}) {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [sendOpen, setSendOpen] = useState(false);
  const accent = PILLAR_ACCENT[operator.pillar] || 'var(--color-text-primary)';

  const refresh = () => router.refresh();

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewTab operator={operator} accent={accent} onChange={refresh} />,
    },
    {
      id: 'activity',
      label: 'Activity',
      badge: tasks.filter((t) => !t.done).length,
      content: (
        <ActivityTab
          operator={operator}
          tasks={tasks}
          events={events}
          stakeholders={stakeholders}
          me={me}
          accent={accent}
          eventLabel={eventLabel}
          onChange={refresh}
        />
      ),
    },
    {
      id: 'tracking',
      label: 'Tracking',
      content: (
        <TrackingTab
          deckLinks={deckLinks}
          accent={accent}
          operatorDeckRoute={operatorDeckRoute}
          onChange={refresh}
          onOpenSend={() => setSendOpen(true)}
        />
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      content: <DocumentsTab operator={operator} documents={documents} accent={accent} onChange={refresh} />,
    },
  ];

  return (
    <>
      <EntityDetailLayout
        backHref="/admin/pipeline"
        backLabel="← BACK TO PIPELINE"

        // Header
        primaryTag={{ label: (pillarLabel[operator.pillar] || 'Unknown').toUpperCase(), color: accent }}
        secondaryTag={{ label: operator.rank }}
        title={operator.name}
        subtitle={`${operator.country} · ${operator.role}`}
        description={operator.one_liner}
        assignee={
          <AssigneePicker
            valueId={operator.assignee_id}
            size={32}
            onChange={async (newId) => {
              const res = await fetch(`/api/admin/operators/${operator.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignee_id: newId }),
              });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                alert(j.error || 'Failed to update assignee');
                return;
              }
              refresh();
            }}
          />
        }

        // Actions
        primaryAction={
          <QuickActionButton primary accent={accent} onClick={() => setSendOpen(true)} icon="📎">
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>SEND DECK</span>
          </QuickActionButton>
        }
        secondaryActions={[
          <QuickActionButton key="1" onClick={() => setTab('activity')} icon="✓">
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>ADD TASK</span>
          </QuickActionButton>,
          <QuickActionButton key="2" onClick={() => setTab('activity')} icon="📝">
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>LOG EVENT</span>
          </QuickActionButton>,
          <QuickActionButton key="3" href={pillarRoute[operator.pillar]} target="_blank" icon="↗">
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>MISA DECK</span>
          </QuickActionButton>,
          <QuickActionButton key="4" href={operatorDeckRoute[operator.pillar]} target="_blank" icon="👁">
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>OPERATOR DECK</span>
          </QuickActionButton>,
        ]}

        // Status Pipeline
        statusBar={
          <StatusBar
            operator={operator}
            statusFlow={statusFlow}
            statusLabel={statusLabel}
            accent={accent}
            onChange={refresh}
          />
        }

        // Linked Initiatives
        linkedItems={
          initiatives.length > 0 ? (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                LINKED INITIATIVES · {initiatives.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {initiatives.map((i) => (
                  <LinkedItemCard
                    key={i.id}
                    href={`/admin/initiative/${i.id}`}
                    accent={i.workstreams?.accent || 'var(--color-border-medium)'}
                    code={i.code}
                    title={i.title}
                    status={initStatusLabel[i.status]}
                    statusColor={initStatusColor[i.status]}
                  />
                ))}
              </div>
            </div>
          ) : null
        }

        // Tabs
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      {sendOpen && (
        <SendDeckModal
          operator={operator}
          accent={accent}
          operatorDeckRoute={operatorDeckRoute}
          onClose={() => { setSendOpen(false); refresh(); }}
        />
      )}
    </>
  );
}

/* ============================ STATUS BAR ============================ */
function StatusBar({ operator, statusFlow, statusLabel, accent, onChange }) {
  const idx = statusFlow.indexOf(operator.status);
  async function setStatus(s) {
    await fetch(`/api/admin/operators/${operator.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    });
    onChange();
  }
  return (
    <div style={S.statusBar}>
      {statusFlow.map((s, i) => {
        const reached = i <= idx;
        const isLost = s === 'closed_lost';
        return (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              ...S.statusStep,
              background: reached && !isLost ? accent : isLost && operator.status === 'closed_lost' ? 'var(--color-text-secondary)' : 'transparent',
              color: reached && !isLost ? '#fff' : isLost && operator.status === 'closed_lost' ? '#fff' : 'var(--color-text-muted)',
              borderColor: reached || operator.status === 'closed_lost' ? 'transparent' : 'var(--color-border-medium)',
            }}
          >
            {statusLabel[s]}
          </button>
        );
      })}
    </div>
  );
}

/* ============================ OVERVIEW TAB ============================ */
function OverviewTab({ operator, accent, onChange }) {
  const [owner, setOwner] = useState(operator.owner || '');
  const [nextStep, setNextStep] = useState(operator.next_step || '');
  const [nextStepDue, setNextStepDue] = useState(operator.next_step_due || '');
  const [notes, setNotes] = useState(operator.notes || '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/admin/operators/${operator.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner: owner || null,
        next_step: nextStep || null,
        next_step_due: nextStepDue || null,
        notes,
      }),
    });
    setBusy(false);
    onChange();
  }

  return (
    <div style={S.grid2}>
      <Field label="OWNER (INTERNAL)">
        <input style={S.input} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. Adrien" />
      </Field>
      <Field label="NEXT STEP DUE">
        <input type="date" style={S.input} value={nextStepDue || ''} onChange={(e) => setNextStepDue(e.target.value)} />
      </Field>
      <Field label="NEXT STEP" full>
        <input style={S.input} value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="e.g. Send NDA" />
      </Field>
      <Field label="NOTES" full>
        <textarea
          style={{ ...S.input, minHeight: 160, fontFamily: 'inherit', resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Free-form internal notes…"
        />
      </Field>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={{ ...S.btnPrimary, background: accent }} onClick={save} disabled={busy}>
          {busy ? 'SAVING…' : 'SAVE'}
        </button>
        <span style={S.muted}>
          Last updated · {new Date(operator.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/* ============================ ACTIVITY TAB (Fusionné) ============================ */
function ActivityTab({ operator, tasks, events, stakeholders, me, accent, eventLabel, onChange }) {
  const [section, setSection] = useState('tasks'); // tasks | timeline | stakeholders | comments
  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <div>
      {/* Sub-navigation pour l'activité */}
      <div style={S.subNav}>
        <SubNavBtn active={section === 'tasks'} onClick={() => setSection('tasks')} count={openTasks.length}>
          TASKS
        </SubNavBtn>
        <SubNavBtn active={section === 'timeline'} onClick={() => setSection('timeline')} count={events.length}>
          TIMELINE
        </SubNavBtn>
        <SubNavBtn active={section === 'stakeholders'} onClick={() => setSection('stakeholders')} count={stakeholders.length}>
          STAKEHOLDERS
        </SubNavBtn>
        <SubNavBtn active={section === 'comments'} onClick={() => setSection('comments')}>
          COMMENTS
        </SubNavBtn>
      </div>

      {/* Content */}
      {section === 'tasks' && (
        <TasksSection operator={operator} tasks={tasks} accent={accent} onChange={onChange} />
      )}
      {section === 'timeline' && (
        <TimelineSection operator={operator} events={events} eventLabel={eventLabel} accent={accent} onChange={onChange} />
      )}
      {section === 'stakeholders' && (
        <StakeholdersSection operator={operator} stakeholders={stakeholders} accent={accent} onChange={onChange} />
      )}
      {section === 'comments' && (
        <CommentThread parentKind="operator" parentId={operator.id} currentUser={me} />
      )}
    </div>
  );
}

function SubNavBtn({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.subNavBtn,
        background: active ? 'var(--color-text-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-secondary)',
      }}
    >
      {children}
      {count > 0 && <span style={{ marginLeft: 6, opacity: 0.7 }}>({count})</span>}
    </button>
  );
}

/* ----- Tasks Section ----- */
function TasksSection({ operator, tasks, accent, onChange }) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(null);
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title) return;
    setBusy(true);
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_id: operator.id, title, due_date: due || null, assigned_to: assignee }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Failed to add task');
      setBusy(false);
      return;
    }
    setTitle(''); setDue(''); setAssignee(null);
    setBusy(false);
    onChange();
  }

  async function toggle(task) {
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, done: !task.done }),
    });
    onChange();
  }

  async function patchTask(id, patch) {
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    onChange();
  }

  async function remove(id) {
    if (!confirm('Delete this task?')) return;
    await fetch('/api/admin/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <div style={S.addBlock}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 200px auto', gap: 10, alignItems: 'center' }}>
          <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task — e.g. Send NDA to Charles" />
          <AssigneePicker valueId={assignee} onChange={setAssignee} size={32} />
          <input type="date" style={S.input} value={due} onChange={(e) => setDue(e.target.value)} />
          <button style={{ ...S.btnPrimary, background: accent }} onClick={add} disabled={busy || !title}>+ ADD</button>
        </div>
      </div>

      {open.length === 0 && done.length === 0 ? (
        <div style={S.emptyBlock}>No tasks yet — add the next thing you need to do.</div>
      ) : (
        <>
          {open.length > 0 && (
            <div style={{ ...S.table, marginBottom: 24 }}>
              {open.map((t) => <TaskRow key={t.id} task={t} accent={accent} onToggle={toggle} onRemove={remove} onPatch={patchTask} />)}
            </div>
          )}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                DONE · {done.length}
              </div>
              <div style={{ ...S.table, opacity: 0.55 }}>
                {done.map((t) => <TaskRow key={t.id} task={t} accent={accent} onToggle={toggle} onRemove={remove} onPatch={patchTask} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, accent, onToggle, onRemove, onPatch }) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !task.done && task.due_date && task.due_date < today;
  return (
    <div style={S.row}>
      <button
        onClick={() => onToggle(task)}
        style={{
          ...S.checkbox,
          background: task.done ? accent : 'transparent',
          borderColor: task.done ? accent : 'var(--color-border-medium)',
          color: '#fff',
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ ...S.rowName, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
        {task.due_date && (
          <div style={{ ...S.rowMeta, color: overdue ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
            {overdue ? 'OVERDUE · ' : ''}{new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
      <AssigneePicker valueId={task.assigned_to} size={22} onChange={(newId) => onPatch && onPatch(task.id, { assigned_to: newId })} />
      <button style={S.del} onClick={() => onRemove(task.id)}>×</button>
    </div>
  );
}

/* ----- Timeline Section ----- */
function TimelineSection({ operator, events, eventLabel, accent, onChange }) {
  const [type, setType] = useState('email_sent');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!subject && !body) return;
    setBusy(true);
    await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_id: operator.id, type, subject, body }),
    });
    setSubject(''); setBody('');
    setBusy(false);
    onChange();
  }

  async function remove(id) {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div>
      <div style={S.addBlock}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10 }}>
          <select style={S.input} value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(eventLabel).filter(([k]) => k !== 'status_change').map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input style={S.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (one-liner)" />
        </div>
        <textarea
          style={{ ...S.input, minHeight: 80, fontFamily: 'inherit', resize: 'vertical', marginTop: 10 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details / body…"
        />
        <button style={{ ...S.btnPrimary, background: accent, marginTop: 10 }} onClick={add} disabled={busy || (!subject && !body)}>
          {busy ? '…' : '+ LOG EVENT'}
        </button>
      </div>

      {events.length === 0 ? (
        <div style={S.emptyBlock}>No events yet — log your first contact.</div>
      ) : (
        <div style={S.timeline}>
          {events.map((e) => (
            <div key={e.id} style={S.evRow}>
              <div style={{ ...S.evDot, background: e.type === 'status_change' ? 'var(--color-text-muted)' : accent }} />
              <div style={S.evWhen}>
                {new Date(e.occurred_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div>
                <div style={{ ...S.evType, color: e.type === 'status_change' ? 'var(--color-text-muted)' : accent }}>
                  {(eventLabel[e.type] || e.type).toUpperCase()}
                </div>
                {e.subject && <div style={S.evSubject}>{e.subject}</div>}
                {e.body && <div style={S.evText}>{e.body}</div>}
              </div>
              {e.type !== 'status_change' && <button style={S.del} onClick={() => remove(e.id)}>×</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----- Stakeholders Section ----- */
function StakeholdersSection({ operator, stakeholders, accent, onChange }) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name) return;
    setBusy(true);
    await fetch('/api/admin/stakeholders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_id: operator.id, name, title, email, phone }),
    });
    setName(''); setTitle(''); setEmail(''); setPhone('');
    setBusy(false);
    onChange();
  }

  async function remove(id) {
    if (!confirm('Delete this stakeholder?')) return;
    await fetch('/api/admin/stakeholders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div>
      <div style={S.addBlock}>
        <div style={S.addGrid4}>
          <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <input style={S.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input style={S.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        </div>
        <button style={{ ...S.btnPrimary, background: accent }} onClick={add} disabled={busy || !name}>
          {busy ? '…' : '+ ADD STAKEHOLDER'}
        </button>
      </div>

      {stakeholders.length === 0 ? (
        <div style={S.emptyBlock}>No stakeholders yet.</div>
      ) : (
        <div style={S.table}>
          {stakeholders.map((s) => (
            <div key={s.id} style={S.row}>
              <div style={{ flex: 1 }}>
                <div style={S.rowName}>{s.name}</div>
                <div style={S.rowMeta}>
                  {s.title && <span>{s.title}</span>}
                  {s.email && <a style={S.link} href={`mailto:${s.email}`}>{s.email}</a>}
                  {s.phone && <a style={S.link} href={`tel:${s.phone}`}>{s.phone}</a>}
                </div>
              </div>
              <button style={S.del} onClick={() => remove(s.id)}>DELETE</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ TRACKING TAB ============================ */
function TrackingTab({ deckLinks, accent, operatorDeckRoute, onChange, onOpenSend }) {
  return (
    <div>
      <div style={{ ...S.addBlock, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: accent, marginBottom: 4 }}>
            DECK INTELLIGENCE
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Each tracked link reports who opens, how long they stay, where they drop off.
          </div>
        </div>
        <button onClick={onOpenSend} style={{ ...S.btnPrimary, background: accent }}>
          + GENERATE TRACKED LINK
        </button>
      </div>

      {deckLinks.length === 0 ? (
        <div style={S.emptyBlock}>No tracked link yet. Generate one to start measuring engagement.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deckLinks.map((l) => (
            <DeckLinkCard key={l.id} link={l} accent={accent} operatorDeckRoute={operatorDeckRoute} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeckLinkCard({ link, accent, operatorDeckRoute, onChange }) {
  const [analytics, setAnalytics] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const url = (typeof window !== 'undefined' ? window.location.origin : '') +
    `${operatorDeckRoute[link.pillar]}?to=${encodeURIComponent(link.recipient || '')}&t=${link.token}`;

  async function load() {
    if (analytics || loading) return;
    setLoading(true);
    const r = await fetch(`/api/admin/deck-links/${link.id}/analytics`);
    const j = await r.json();
    setAnalytics(j);
    setLoading(false);
  }

  async function revoke() {
    if (!confirm('Revoke this link? It will stop logging views.')) return;
    await fetch('/api/admin/deck-links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: link.id }),
    });
    onChange();
  }

  async function copy() {
    try { await navigator.clipboard.writeText(url); } catch {}
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', padding: 0 }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ ...S.docKind, background: link.revoked_at ? 'var(--color-text-muted)' : accent }}>
          {link.audience.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.rowName}>
            {link.recipient || '—'}
            {link.recipient_email && <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: 12, marginLeft: 8 }}>&lt;{link.recipient_email}&gt;</span>}
          </div>
          <div style={S.rowMeta}>
            <span style={{ fontFamily: 'monospace' }}>token: {link.token}</span>
            <span>{new Date(link.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {link.revoked_at && <span style={{ color: 'var(--color-accent-strong)' }}>REVOKED</span>}
          </div>
        </div>
        <button style={S.btnSecondary} onClick={() => { setOpen(!open); if (!open) load(); }}>
          {open ? 'HIDE' : 'ANALYTICS'}
        </button>
        <button style={S.btnSecondary} onClick={copy}>COPY LINK</button>
        {!link.revoked_at && <button style={S.del} onClick={revoke}>REVOKE</button>}
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--color-border-light)', padding: 16 }}>
          {loading && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loading…</div>}
          {analytics && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--color-border-light)', border: '1px solid var(--color-border-light)', marginBottom: 16 }}>
                <AnalyticsStat label="SESSIONS" value={analytics.summary.sessions} accent={accent} />
                <AnalyticsStat label="TOTAL VIEWS" value={analytics.summary.total_views} accent={accent} />
                <AnalyticsStat label="FIRST OPENED" value={analytics.summary.first_seen ? new Date(analytics.summary.first_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} accent={accent} />
                <AnalyticsStat label="LAST SEEN" value={analytics.summary.last_seen ? new Date(analytics.summary.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} accent={accent} />
              </div>
              {analytics.slides.length > 0 ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                    TIME PER SLIDE
                  </div>
                  <SlideBars slides={analytics.slides} accent={accent} />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No views yet.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AnalyticsStat({ label, value, accent }) {
  return (
    <div style={{ background: 'var(--color-bg-main)', padding: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: accent }}>{value}</div>
    </div>
  );
}

function SlideBars({ slides, accent }) {
  const max = Math.max(1, ...slides.map((s) => s.total_ms));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {slides.map((s) => {
        const sec = Math.round(s.total_ms / 1000);
        const pct = (s.total_ms / max) * 100;
        return (
          <div key={s.slide_index} style={{ display: 'grid', gridTemplateColumns: '36px 160px 1fr 70px', gap: 10, alignItems: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {String(s.slide_index).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{s.slide_label || `Slide ${s.slide_index}`}</div>
            <div style={{ height: 8, background: 'var(--color-border-light)', position: 'relative' }}>
              <div style={{ height: 8, background: accent, width: `${pct}%`, transition: 'width .3s ease' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
              {sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================ DOCUMENTS TAB ============================ */
function DocumentsTab({ operator, documents, accent, onChange }) {
  const [kind, setKind] = useState('NDA');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [busy, setBusy] = useState(false);

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('operator_id', operator.id);
    fd.append('kind', kind);
    fd.append('file', file);
    await fetch('/api/admin/documents', { method: 'POST', body: fd });
    setBusy(false);
    e.target.value = '';
    onChange();
  }

  async function addLink() {
    if (!linkUrl) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('operator_id', operator.id);
    fd.append('kind', kind);
    fd.append('external_url', linkUrl);
    fd.append('name', linkName || linkUrl);
    await fetch('/api/admin/documents', { method: 'POST', body: fd });
    setLinkUrl(''); setLinkName('');
    setBusy(false);
    onChange();
  }

  async function open(id) {
    const win = window.open('', '_blank');
    try {
      const r = await fetch(`/api/admin/documents?id=${id}`);
      const j = await r.json();
      if (j.url && win) win.location.href = j.url;
      else if (win) win.close();
    } catch {
      if (win) win.close();
    }
  }

  async function remove(id) {
    if (!confirm('Delete this document?')) return;
    await fetch('/api/admin/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div>
      <div style={S.addBlock}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10, alignItems: 'center' }}>
          <select style={S.input} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="NDA">NDA</option>
            <option value="LOI">LOI</option>
            <option value="TERM_SHEET">Term Sheet</option>
            <option value="DECK">Deck</option>
            <option value="CONTRACT">Contract</option>
            <option value="OTHER">Other</option>
          </select>
          <label style={{ ...S.btnSecondary, cursor: 'pointer', textAlign: 'center' }}>
            {busy ? '…' : '↑ UPLOAD FILE'}
            <input type="file" style={{ display: 'none' }} onChange={uploadFile} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginTop: 10 }}>
          <input style={S.input} value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Display name (optional)" />
          <input style={S.input} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="External URL" />
          <button style={{ ...S.btnPrimary, background: accent }} onClick={addLink} disabled={busy || !linkUrl}>+ ADD LINK</button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div style={S.emptyBlock}>No documents yet — upload an NDA or paste an external link.</div>
      ) : (
        <div style={S.table}>
          {documents.map((d) => (
            <div key={d.id} style={S.row}>
              <div style={{ ...S.docKind, background: accent }}>{d.kind}</div>
              <div style={{ flex: 1 }}>
                <div style={S.rowName}>{d.name}</div>
                <div style={S.rowMeta}>
                  <span>{new Date(d.uploaded_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {d.external_url && <span style={{ color: accent }}>EXTERNAL LINK</span>}
                </div>
              </div>
              <button style={S.btnSecondary} onClick={() => open(d.id)}>OPEN ↗</button>
              <button style={S.del} onClick={() => remove(d.id)}>DELETE</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ SEND DECK MODAL ============================ */
function SendDeckModal({ operator, accent, operatorDeckRoute, onClose }) {
  const [audience, setAudience] = useState('operator');
  const [recipient, setRecipient] = useState(operator.name);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    const res = await fetch('/api/admin/deck-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator_id: operator.id,
        pillar: operator.pillar,
        audience,
        recipient,
        recipient_email: recipientEmail || null,
        notes,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (j.link) setGenerated(j.link);
  }

  const url = generated
    ? (typeof window !== 'undefined' ? window.location.origin : '') +
      `${operatorDeckRoute[operator.pillar]}?to=${encodeURIComponent(generated.recipient || operator.name)}&t=${generated.token}`
    : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function mailto() {
    const subject = encodeURIComponent('Futur One — confidential proposal');
    const body = encodeURIComponent(`Dear ${recipient},\n\nPlease find a confidential proposal regarding Futur One:\n\n${url}\n\nBest regards.`);
    window.open(`mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`);
  }

  return (
    <div style={S.modalBackdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <div style={{ ...S.eyebrowSec, color: accent, fontSize: 10 }}>SEND TRACKED DECK</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>
              {generated ? 'Link generated' : 'Generate a tracked link'}
            </h2>
          </div>
          <button onClick={onClose} style={S.modalClose}>×</button>
        </div>

        {!generated && (
          <div style={S.modalBody}>
            <Field label="AUDIENCE">
              <div style={{ display: 'flex', gap: 8 }}>
                {['operator', 'misa'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    style={{
                      ...S.pillBtn,
                      background: audience === a ? accent : 'transparent',
                      color: audience === a ? '#fff' : 'var(--color-text-secondary)',
                      borderColor: audience === a ? accent : 'var(--color-border-medium)',
                    }}
                  >
                    {a === 'operator' ? 'OPERATOR · anonymized' : 'MISA · names everyone'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="RECIPIENT (display name)">
              <input style={S.input} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </Field>
            <Field label="RECIPIENT EMAIL (optional)">
              <input style={S.input} value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="charles@equinix.com" />
            </Field>
            <Field label="INTERNAL NOTES (optional)">
              <textarea style={{ ...S.input, minHeight: 70, fontFamily: 'inherit', resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why this version, what was discussed…" />
            </Field>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={onClose} style={S.btnSecondary}>CANCEL</button>
              <button onClick={generate} disabled={busy || !recipient} style={{ ...S.btnPrimary, background: accent }}>
                {busy ? '…' : 'GENERATE TRACKED LINK'}
              </button>
            </div>
          </div>
        )}

        {generated && (
          <div style={S.modalBody}>
            <div style={S.linkCard}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: accent, marginBottom: 8 }}>TRACKED URL</div>
              <div style={S.linkUrl}>{url}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <button onClick={copy} style={{ ...S.btnPrimary, background: accent }}>
                {copied ? '✓ COPIED' : 'COPY LINK'}
              </button>
              <button onClick={mailto} style={S.btnSecondary}>OPEN IN MAIL ↗</button>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...S.link, fontWeight: 700, fontSize: 11 }}>PREVIEW THE LINK ↗</a>
              <button onClick={onClose} style={S.btnSecondary}>DONE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ HELPERS ============================ */
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

/* ============================ STYLES ============================ */
const S = {
  statusBar: {
    display: 'flex',
    gap: 4,
    padding: '6px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    overflowX: 'auto',
  },
  statusStep: {
    flex: '1 0 auto',
    padding: '8px 12px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s ease',
    whiteSpace: 'nowrap',
  },

  // Sub-navigation dans Activity
  subNav: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    padding: '8px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
  },
  subNavBtn: {
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    border: '1px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .12s ease',
  },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fieldLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 8 },
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
    background: 'var(--color-text-primary)',
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
  muted: { fontSize: 11, color: 'var(--color-text-muted)' },

  addBlock: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: 16,
    marginBottom: 20,
  },
  addGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 },

  emptyBlock: {
    padding: 32,
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: 13,
    border: '1px dashed var(--color-border-medium)',
  },

  table: {
    border: '1px solid var(--color-border-light)',
    background: 'var(--color-surface)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  rowName: { fontSize: 14, fontWeight: 700 },
  rowMeta: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    display: 'flex',
    gap: 14,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  link: { color: 'var(--color-accent-strong)', textDecoration: 'none', fontWeight: 600 },
  del: {
    background: 'transparent',
    border: '1px solid var(--color-border-medium)',
    padding: '6px 10px',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  docKind: {
    padding: '4px 8px',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: '#fff',
    minWidth: 80,
    textAlign: 'center',
  },

  checkbox: {
    width: 22,
    height: 22,
    border: '1.5px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  timeline: {
    border: '1px solid var(--color-border-light)',
    background: 'var(--color-surface)',
  },
  evRow: {
    display: 'grid',
    gridTemplateColumns: '20px 160px 1fr auto',
    gap: 14,
    padding: '14px 16px',
    borderBottom: '1px solid var(--color-border-light)',
    alignItems: 'flex-start',
  },
  evDot: { width: 10, height: 10, borderRadius: '50%', marginTop: 4 },
  evWhen: { fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-muted)', paddingTop: 2 },
  evType: { fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 4 },
  evSubject: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  evText: { fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' },

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
    width: 560,
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
    padding: 0,
    width: 32,
    height: 32,
  },
  modalBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  pillBtn: {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  linkCard: {
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border-medium)',
    padding: 16,
  },
  linkUrl: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: 'var(--color-text-primary)',
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },

  eyebrowSec: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    marginBottom: 14,
  },
};
