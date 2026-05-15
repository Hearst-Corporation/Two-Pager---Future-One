'use client';
/* eslint-disable no-unused-vars */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PARTNER_KIND_COLOR as KIND_COLOR } from '@/lib/admin-constants';
import AssigneePicker from '@/components/admin/AssigneePicker';
import CommentThread from '@/components/admin/CommentThread';
import { EntityDetailLayout, QuickActionButton } from '@/components/admin/layout/EntityDetail';

/**
 * Partner Detail - Pattern B: Entity Detail Layout
 * Tabs reduits de 7 à 4 pour une UX plus claire:
 * - Overview: Notes, next step, infos principales
 * - Activity: Tasks + Timeline + Stakeholders + Comments (fusionnés)
 * - Initiatives: Initiatives liées
 * - Documents: Fichiers et liens
 */

export default function PartnerDetail({
  me = null,
  partner,
  events,
  stakeholders,
  documents,
  tasks,
  initiatives,
  statusFlow,
  statusLabel,
  eventLabel,
  initStatusLabel,
  initStatusColor,
}) {
  const router = useRouter();
  const accent = KIND_COLOR[partner.kind] || '#94a3b8';
  const [tab, setTab] = useState('overview');

  const refresh = () => router.refresh();

  async function setStatus(s) {
    await fetch(`/api/admin/partners/${partner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    });
    refresh();
  }

  async function setAssignee(newId) {
    const res = await fetch(`/api/admin/partners/${partner.id}`, {
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
  }

  const openTasks = tasks.filter((t) => !t.done).length;

  // Tabs configuration - reduit à 4 onglets clairs
  const tabs = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      badge: 0,
      content: <OverviewTab partner={partner} accent={accent} onChange={refresh} />,
    },
    {
      id: 'activity',
      label: 'ACTIVITY',
      badge: openTasks + events.length + stakeholders.length,
      content: (
        <ActivityTab
          partner={partner}
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
      id: 'initiatives',
      label: 'INITIATIVES',
      badge: initiatives.length,
      content: <InitiativesTab initiatives={initiatives} initStatusLabel={initStatusLabel} initStatusColor={initStatusColor} />,
    },
    {
      id: 'documents',
      label: 'DOCUMENTS',
      badge: documents.length,
      content: <DocumentsTab partner={partner} documents={documents} accent={accent} onChange={refresh} />,
    },
  ];

  return (
    <EntityDetailLayout
      backHref="/admin/partners"
      backLabel="← ALL PARTNERS"

      // Header
      primaryTag={{ label: partner.kind.toUpperCase(), color: accent }}
      title={partner.name}
      subtitle={partner.country}
      description={partner.one_liner}
      assignee={
        <AssigneePicker valueId={partner.assignee_id} size={32} onChange={setAssignee} />
      }

      // Actions
      primaryAction={
        <QuickActionButton primary accent={accent} onClick={() => setTab('activity')} icon="✓">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>ADD TASK</span>
        </QuickActionButton>
      }
      secondaryActions={[
        <QuickActionButton key="1" onClick={() => setTab('activity')} icon="📝">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>LOG EVENT</span>
        </QuickActionButton>,
        <QuickActionButton key="2" onClick={() => setTab('activity')} icon="👤">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>ADD CONTACT</span>
        </QuickActionButton>
      ]}

      // Status Bar
      statusBar={
        <div style={S.statusBar}>
          {statusFlow.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                ...S.statusStep,
                background: partner.status === s ? accent : 'transparent',
                color: partner.status === s ? '#fff' : 'var(--color-text-muted)',
                borderColor: partner.status === s ? 'transparent' : 'var(--color-border-medium)',
              }}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      }

      // Tabs
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    />
  );
}

/* ============================ OVERVIEW TAB ============================ */
function OverviewTab({ partner, accent, onChange }) {
  const [owner, setOwner] = useState(partner.owner || '');
  const [next, setNext] = useState(partner.next_step || '');
  const [due, setDue] = useState(partner.next_step_due || '');
  const [notes, setNotes] = useState(partner.notes || '');

  async function save() {
    await fetch(`/api/admin/partners/${partner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: owner || null, next_step: next || null, next_step_due: due || null, notes }),
    });
    onChange();
  }

  return (
    <div style={S.grid2}>
      <Field label="OWNER (INTERNAL)">
        <input style={S.input} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. Adrien" />
      </Field>
      <Field label="NEXT STEP DUE">
        <input type="date" style={S.input} value={due || ''} onChange={(e) => setDue(e.target.value)} />
      </Field>
      <Field label="NEXT STEP" full>
        <input style={S.input} value={next} onChange={(e) => setNext(e.target.value)} placeholder="e.g. Schedule QFZA call" />
      </Field>
      <Field label="NOTES" full>
        <textarea style={{ ...S.input, minHeight: 160, fontFamily: 'inherit', resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Free-form internal notes…" />
      </Field>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={{ ...S.btnPrimary, background: accent }} onClick={save}>SAVE</button>
        <span style={S.muted}>
          Last updated · {new Date(partner.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/* ============================ ACTIVITY TAB (Fusionné) ============================ */
function ActivityTab({ partner, tasks, events, stakeholders, me, accent, eventLabel, onChange }) {
  const [section, setSection] = useState('tasks'); // tasks | timeline | stakeholders | comments
  const openTasks = tasks.filter((t) => !t.done);

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
      {section === 'tasks' && <TasksSection partner={partner} tasks={tasks} accent={accent} onChange={onChange} />}
      {section === 'timeline' && <TimelineSection partner={partner} events={events} eventLabel={eventLabel} accent={accent} onChange={onChange} />}
      {section === 'stakeholders' && <StakeholdersSection partner={partner} stakeholders={stakeholders} accent={accent} onChange={onChange} />}
      {section === 'comments' && <CommentThread parentKind="partner" parentId={partner.id} currentUser={me} />}
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
function TasksSection({ partner, tasks, accent, onChange }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title) return;
    setBusy(true);
    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: partner.id, title, due_date: due || null }),
    });
    setTitle(''); setDue('');
    setBusy(false);
    onChange();
  }

  async function toggle(t) {
    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, done: !t.done }),
    });
    onChange();
  }

  async function remove(id) {
    if (!confirm('Delete this task?')) return;
    await fetch('/api/admin/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    onChange();
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <div style={S.addBlock}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 10, alignItems: 'center' }}>
          <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task — e.g. Schedule QFZA call" />
          <input type="date" style={S.input} value={due} onChange={(e) => setDue(e.target.value)} />
          <button style={{ ...S.btnPrimary, background: accent }} onClick={add} disabled={busy || !title}>+ ADD</button>
        </div>
      </div>

      {open.length === 0 && done.length === 0 ? (
        <div style={S.emptyBlock}>No tasks yet.</div>
      ) : (
        <>
          {open.length > 0 && (
            <div style={{ ...S.table, marginBottom: 24 }}>
              {open.map((t) => (
                <div key={t.id} style={S.row}>
                  <button
                    onClick={() => toggle(t)}
                    style={{ ...S.checkbox, background: t.done ? accent : 'transparent', borderColor: t.done ? accent : 'var(--color-border-medium)', color: '#fff' }}
                  >
                    {t.done ? '✓' : ''}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={S.rowName}>{t.title}</div>
                    {t.due_date && (
                      <div style={{ ...S.rowMeta, color: t.due_date < new Date().toISOString().slice(0, 10) ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
                        {t.due_date < new Date().toISOString().slice(0, 10) ? 'OVERDUE · ' : ''}
                        {new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <button style={S.del} onClick={() => remove(t.id)}>×</button>
                </div>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                DONE · {done.length}
              </div>
              <div style={{ ...S.table, opacity: 0.55 }}>
                {done.map((t) => (
                  <div key={t.id} style={S.row}>
                    <button
                      onClick={() => toggle(t)}
                      style={{ ...S.checkbox, background: accent, borderColor: accent, color: '#fff' }}
                    >
                      ✓
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...S.rowName, textDecoration: 'line-through' }}>{t.title}</div>
                    </div>
                    <button style={S.del} onClick={() => remove(t.id)}>×</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ----- Timeline Section ----- */
function TimelineSection({ partner, events, eventLabel, accent, onChange }) {
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
      body: JSON.stringify({ partner_id: partner.id, type, subject, body }),
    });
    setSubject(''); setBody('');
    setBusy(false);
    onChange();
  }

  async function remove(id) {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/admin/events', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
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
        <textarea style={{ ...S.input, minHeight: 80, fontFamily: 'inherit', resize: 'vertical', marginTop: 10 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details…" />
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
function StakeholdersSection({ partner, stakeholders, accent, onChange }) {
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
      body: JSON.stringify({ partner_id: partner.id, name, title, email, phone }),
    });
    setName(''); setTitle(''); setEmail(''); setPhone('');
    setBusy(false);
    onChange();
  }

  async function remove(id) {
    if (!confirm('Delete this stakeholder?')) return;
    await fetch('/api/admin/stakeholders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
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

/* ============================ INITIATIVES TAB ============================ */
function InitiativesTab({ initiatives, initStatusLabel, initStatusColor }) {
  if (initiatives.length === 0) {
    return (
      <div style={S.emptyBlock}>
        No initiatives linked. Open the roadmap to attach this partner to an initiative.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {initiatives.map((i) => (
        <Link
          key={i.id}
          href={`/admin/initiative/${i.id}`}
          style={{
            ...S.iniCard,
            borderLeft: `4px solid ${i.workstreams?.accent || '#94a3b8'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)' }}>{i.code}</span>
            {i.workstreams && (
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: i.workstreams.accent }}>
                {i.workstreams.code} · {i.workstreams.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{i.title}</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: initStatusColor[i.status] }}>
            {initStatusLabel[i.status]}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ============================ DOCUMENTS TAB ============================ */
function DocumentsTab({ partner, documents, accent, onChange }) {
  const [kind, setKind] = useState('OTHER');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [busy, setBusy] = useState(false);

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('partner_id', partner.id);
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
    fd.append('partner_id', partner.id);
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
    await fetch('/api/admin/documents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    onChange();
  }

  return (
    <div>
      <div style={S.addBlock}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
          <select style={S.input} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="NDA">NDA</option>
            <option value="MOU">MOU</option>
            <option value="DECK">Deck</option>
            <option value="REPORT">Report</option>
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
        <div style={S.emptyBlock}>No documents yet.</div>
      ) : (
        <div style={S.table}>
          {documents.map((d) => (
            <div key={d.id} style={S.row}>
              <div style={{ ...S.docKind, background: accent }}>{d.kind}</div>
              <div style={{ flex: 1 }}>
                <div style={S.rowName}>{d.name}</div>
                <div style={S.rowMeta}>
                  <span>{new Date(d.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },

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
  link: { color: 'var(--color-accent-strong)', textDecoration: 'none', fontWeight: 600 },

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
  docKind: {
    padding: '4px 8px',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: '#fff',
    minWidth: 80,
    textAlign: 'center',
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

  iniCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: 16,
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
  },
};
