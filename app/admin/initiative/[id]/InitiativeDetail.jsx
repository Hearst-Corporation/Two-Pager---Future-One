'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AssigneePicker from '@/components/admin/AssigneePicker';
import CommentThread from '@/components/admin/CommentThread';
import { EntityDetailLayout, QuickActionButton } from '@/components/admin/layout/EntityDetail';

/**
 * Initiative Detail - Pattern B: Entity Detail Layout
 * Structure simplifiée avec Quick Actions
 */

export default function InitiativeDetail({
  me = null,
  initiative,
  workstream,
  tasks,
  operators,
  partners,
  allOperators,
  allPartners,
  dependsOn = [],
  blocks = [],
  allInitiatives = [],
  ownerLabel,
  ownerColor,
  statusFlow,
  statusLabel,
  statusColor,
  priorityLabel,
}) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({
    title: initiative.title,
    body: initiative.body || '',
    owner_entity: initiative.owner_entity,
    owner_person: initiative.owner_person || '',
    priority: initiative.priority,
    start_date: initiative.start_date || '',
    due_date: initiative.due_date || '',
    notes: initiative.notes || '',
  });

  async function setStatus(s) {
    await fetch(`/api/admin/initiatives/${initiative.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    });
    router.refresh();
  }

  async function setAssignee(newId) {
    const res = await fetch(`/api/admin/initiatives/${initiative.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: newId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Failed to update assignee');
      return;
    }
    router.refresh();
  }

  async function save() {
    await fetch(`/api/admin/initiatives/${initiative.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      }),
    });
    setEdit(false);
    router.refresh();
  }

  async function link(kind, target_id) {
    await fetch(`/api/admin/initiatives/${initiative.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, target_id }),
    });
    router.refresh();
  }

  async function unlink(kind, target_id) {
    await fetch(`/api/admin/initiatives/${initiative.id}/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, target_id }),
    });
    router.refresh();
  }

  const accent = workstream?.accent || 'var(--color-accent-strong)';
  const openTasks = tasks.filter((t) => !t.done).length;

  // Header subtitle avec meta info
  const subtitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ ...S.ownerPill, color: ownerColor[initiative.owner_entity], borderColor: ownerColor[initiative.owner_entity] }}>
        {ownerLabel[initiative.owner_entity]}
      </span>
      <span style={{ ...S.statusPill, color: statusColor[initiative.status] }}>
        {statusLabel[initiative.status]}
      </span>
      <span style={{ ...S.priorityPill, color: initiative.priority === 'critical' ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
        {priorityLabel[initiative.priority]} priority
      </span>
      {initiative.due_date && (
        <span style={S.dateChip}>
          Due {new Date(initiative.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );

  return (
    <EntityDetailLayout
      backHref="/admin/roadmap"
      backLabel="← BACK TO ROADMAP"
      topRightActions={
        !edit ? (
          <button style={S.btnSecondary} onClick={() => setEdit(true)}>EDIT</button>
        ) : (
          <>
            <button style={{ ...S.btnPrimary, background: accent }} onClick={save}>SAVE</button>
            <button style={S.btnSecondary} onClick={() => setEdit(false)}>CANCEL</button>
          </>
        )
      }

      // Header
      primaryTag={workstream ? { label: `${workstream.code} · ${workstream.label}`, color: accent } : null}
      secondaryTag={{ label: initiative.code }}
      title={!edit ? initiative.title : null}
      subtitle={!edit ? subtitle : null}
      assignee={
        <AssigneePicker valueId={initiative.assigned_to} size={32} onChange={setAssignee} />
      }

      // Actions
      primaryAction={
        <QuickActionButton primary accent={accent} onClick={() => setTab('details')} icon="✓">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>ADD TASK</span>
        </QuickActionButton>
      }
      secondaryActions={[
        <QuickActionButton key="1" onClick={() => setTab('details')} icon="🔗">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>LINK PARTNER</span>
        </QuickActionButton>,
        <QuickActionButton key="2" onClick={() => setTab('details')} icon="🔗">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>LINK OPERATOR</span>
        </QuickActionButton>,
        <QuickActionButton key="3" href="/admin/roadmap" icon="🗺">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>VIEW ROADMAP</span>
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
                background: initiative.status === s ? statusColor[s] : 'transparent',
                color: initiative.status === s ? '#fff' : 'var(--color-text-muted)',
                borderColor: initiative.status === s ? 'transparent' : 'var(--color-border-medium)',
              }}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      }

      // Tabs
      tabs={[
        {
          id: 'details',
          label: 'DETAILS',
          content: (
            <DetailsTab
              initiative={initiative}
              workstream={workstream}
              tasks={tasks}
              operators={operators}
              partners={partners}
              allOperators={allOperators}
              allPartners={allPartners}
              dependsOn={dependsOn}
              blocks={blocks}
              allInitiatives={allInitiatives}
              edit={edit}
              form={form}
              setForm={setForm}
              accent={accent}
              ownerLabel={ownerLabel}
              ownerColor={ownerColor}
              statusColor={statusColor}
              statusLabel={statusLabel}
              priorityLabel={priorityLabel}
              link={link}
              unlink={unlink}
              onChange={() => router.refresh()}
            />
          ),
        },
        {
          id: 'comments',
          label: 'COMMENTS',
          content: <CommentThread parentKind="initiative" parentId={initiative.id} currentUser={me} />,
        },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    />
  );
}

/* ============================ DETAILS TAB ============================ */
function DetailsTab({
  initiative,
  workstream,
  tasks,
  operators,
  partners,
  allOperators,
  allPartners,
  dependsOn,
  blocks,
  allInitiatives,
  edit,
  form,
  setForm,
  accent,
  ownerLabel,
  ownerColor,
  statusColor,
  statusLabel,
  priorityLabel,
  link,
  unlink,
  onChange,
}) {
  return (
    <div style={S.grid}>
      <div>
        {/* DESCRIPTION */}
        <Section title="DESCRIPTION">
          {!edit ? (
            <p style={S.body}>{initiative.body || 'No description.'}</p>
          ) : (
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              style={{ ...S.input, minHeight: 140, fontFamily: 'inherit', resize: 'vertical' }}
            />
          )}
        </Section>

        {/* TASKS */}
        <Section title="TASKS">
          <TasksBlock initiative={initiative} tasks={tasks} accent={accent} onChange={onChange} />
        </Section>

        {/* NOTES */}
        <Section title="NOTES">
          {!edit ? (
            <p style={{ ...S.body, color: 'var(--color-text-muted)' }}>
              {initiative.notes || 'No notes.'}
            </p>
          ) : (
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ ...S.input, minHeight: 100, fontFamily: 'inherit', resize: 'vertical' }}
            />
          )}
        </Section>
      </div>

      <div>
        {/* META PANEL */}
        <Section title="DETAILS">
          <Field label="OWNER ENTITY">
            {!edit ? (
              <div style={{ ...S.ownerPill, color: ownerColor[initiative.owner_entity], borderColor: ownerColor[initiative.owner_entity], display: 'inline-block' }}>
                {ownerLabel[initiative.owner_entity]}
              </div>
            ) : (
              <select value={form.owner_entity} onChange={(e) => setForm({ ...form, owner_entity: e.target.value })} style={S.input}>
                {Object.entries(ownerLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
          </Field>
          <Field label="OWNER (PERSON)">
            {!edit ? (
              <div style={S.metaValue}>{initiative.owner_person || '—'}</div>
            ) : (
              <input value={form.owner_person} onChange={(e) => setForm({ ...form, owner_person: e.target.value })} style={S.input} placeholder="e.g. Adrien" />
            )}
          </Field>
          <Field label="PRIORITY">
            {!edit ? (
              <div style={S.metaValue}>{priorityLabel[initiative.priority]}</div>
            ) : (
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={S.input}>
                {Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
          </Field>
          <Field label="START DATE">
            {!edit ? (
              <div style={S.metaValue}>{initiative.start_date || '—'}</div>
            ) : (
              <input type="date" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} style={S.input} />
            )}
          </Field>
          <Field label="DUE DATE">
            {!edit ? (
              <div style={S.metaValue}>{initiative.due_date || '—'}</div>
            ) : (
              <input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={S.input} />
            )}
          </Field>
        </Section>

        {/* LINKED PARTNERS */}
        <Section title="LINKED PARTNERS">
          <LinkBlock
            kind="partner"
            items={partners}
            all={allPartners}
            accent={accent}
            link={link}
            unlink={unlink}
            hrefBase="/admin/partner"
            renderItem={(p) => (
              <div>
                <div style={S.linkName}>{p.name}</div>
                <div style={S.linkMeta}>{p.kind}</div>
              </div>
            )}
          />
        </Section>

        {/* LINKED OPERATORS */}
        <Section title="LINKED OPERATORS">
          <LinkBlock
            kind="operator"
            items={operators}
            all={allOperators}
            accent={accent}
            link={link}
            unlink={unlink}
            hrefBase="/admin/operator"
            renderItem={(o) => (
              <div>
                <div style={S.linkName}>{o.name}</div>
                <div style={S.linkMeta}>{o.pillar}</div>
              </div>
            )}
          />
        </Section>

        {/* DEPENDS ON */}
        <Section title="DEPENDS ON">
          <DependencyBlock
            items={dependsOn}
            candidates={allInitiatives}
            initiativeId={initiative.id}
            accent={accent}
            statusColor={statusColor}
            statusLabel={statusLabel}
            onChange={onChange}
          />
        </Section>

        {/* BLOCKS */}
        <Section title="BLOCKS">
          <DependencyBlock
            items={blocks}
            candidates={allInitiatives}
            initiativeId={initiative.id}
            accent={accent}
            statusColor={statusColor}
            statusLabel={statusLabel}
            readOnly
            onChange={onChange}
          />
        </Section>
      </div>
    </div>
  );
}

/* ============================ SUB-COMPONENTS ============================ */
function Section({ title, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <div style={S.fieldLabel}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function TasksBlock({ initiative, tasks, accent, onChange }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');

  async function add() {
    if (!title) return;
    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiative_id: initiative.id, title, due_date: due || null }),
    });
    setTitle(''); setDue('');
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
    if (!confirm('Delete task?')) return;
    await fetch('/api/admin/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    onChange();
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 8, marginBottom: 12 }}>
        <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        <input type="date" style={S.input} value={due} onChange={(e) => setDue(e.target.value)} />
        <button style={{ ...S.btnPrimary, background: accent }} onClick={add} disabled={!title}>+ ADD</button>
      </div>
      {tasks.length === 0 ? (
        <div style={S.emptyMini}>No tasks yet.</div>
      ) : (
        <div>
          {tasks.map((t) => {
            const today = new Date().toISOString().slice(0, 10);
            const overdue = !t.done && t.due_date && t.due_date < today;
            return (
              <div key={t.id} style={S.taskRow}>
                <button
                  onClick={() => toggle(t)}
                  style={{
                    ...S.checkbox,
                    background: t.done ? accent : 'transparent',
                    borderColor: t.done ? accent : 'var(--color-border-medium)',
                    color: '#fff',
                  }}
                >
                  {t.done ? '✓' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                  {t.due_date && (
                    <div style={{ fontSize: 11, color: overdue ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}>
                      {overdue ? 'OVERDUE · ' : ''}{new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <button style={S.del} onClick={() => remove(t.id)}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LinkBlock({ kind, items, all, accent, link, unlink, hrefBase, renderItem }) {
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState('');
  const linkedIds = new Set(items.map((i) => i.id));
  const candidates = all.filter((a) => !linkedIds.has(a.id));

  async function attach() {
    if (!pick) return;
    await link(kind, pick);
    setPick('');
    setPicking(false);
  }

  return (
    <div>
      {items.length === 0 && !picking && <div style={S.emptyMini}>No {kind}s linked.</div>}
      {items.map((it) => (
        <div key={it.id} style={S.linkRow}>
          <Link href={`${hrefBase}/${it.id}`} style={{ textDecoration: 'none', color: 'var(--color-text-primary)', flex: 1 }}>
            {renderItem(it)}
          </Link>
          <button style={S.del} onClick={() => unlink(kind, it.id)}>UNLINK</button>
        </div>
      ))}
      {!picking ? (
        <button style={{ ...S.btnSecondary, marginTop: 10, width: '100%' }} onClick={() => setPicking(true)}>
          + LINK A {kind.toUpperCase()}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...S.input, flex: 1 }}>
            <option value="">Choose…</option>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button style={{ ...S.btnPrimary, background: accent }} onClick={attach} disabled={!pick}>LINK</button>
          <button style={S.btnSecondary} onClick={() => { setPicking(false); setPick(''); }}>×</button>
        </div>
      )}
    </div>
  );
}

function DependencyBlock({ items, candidates, initiativeId, accent, statusColor, statusLabel, readOnly, onChange }) {
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState('');
  const linkedIds = new Set(items.map((i) => i.id));
  const filtered = candidates.filter((c) => !linkedIds.has(c.id));

  async function attach() {
    if (!pick) return;
    const res = await fetch(`/api/admin/initiatives/${initiativeId}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depends_on_id: pick }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Could not link — possibly a cycle.');
    }
    setPick('');
    setPicking(false);
    onChange();
  }

  async function detach(id) {
    await fetch(`/api/admin/initiatives/${initiativeId}/dependencies`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depends_on_id: id }),
    });
    onChange();
  }

  return (
    <div>
      {items.length === 0 && !picking && <div style={S.emptyMini}>{readOnly ? 'Nothing depends on this initiative.' : 'No upstream dependency.'}</div>}
      {items.map((it) => (
        <div key={it.id} style={S.linkRow}>
          <Link href={`/admin/initiative/${it.id}`} style={{ flex: 1, textDecoration: 'none', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[it.status], flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)' }}>{it.code}</span>
                <span style={S.linkName}>{it.title}</span>
              </div>
              {it.workstream && <div style={S.linkMeta}><span style={{ color: it.workstream.accent, fontWeight: 800 }}>{it.workstream.code}</span> · {statusLabel[it.status]}</div>}
            </div>
          </Link>
          {!readOnly && <button style={S.del} onClick={() => detach(it.id)}>UNLINK</button>}
        </div>
      ))}
      {!readOnly && !picking && <button style={{ ...S.btnSecondary, marginTop: 10, width: '100%' }} onClick={() => setPicking(true)}>+ ADD DEPENDENCY</button>}
      {!readOnly && picking && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...S.input, flex: 1 }}>
            <option value="">Choose initiative…</option>
            {filtered.map((c) => <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ''}{c.title}</option>)}
          </select>
          <button style={{ ...S.btnPrimary, background: accent }} onClick={attach} disabled={!pick}>LINK</button>
          <button style={S.btnSecondary} onClick={() => { setPicking(false); setPick(''); }}>×</button>
        </div>
      )}
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
    whiteSpace: 'nowrap',
  },

  ownerPill: { fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '4px 10px', border: '1px solid' },
  statusPill: { fontSize: 10, fontWeight: 800, letterSpacing: 1.2 },
  priorityPill: { fontSize: 10, fontWeight: 800, letterSpacing: 1.2 },
  dateChip: { fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)', fontWeight: 700 },

  grid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 },

  section: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: 'var(--color-text-muted)', marginBottom: 14 },
  body: { fontSize: 14, lineHeight: 1.65, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'pre-wrap' },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-text-muted)', marginBottom: 6 },
  metaValue: { fontSize: 13, fontWeight: 600 },

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
    padding: '10px 14px',
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
  emptyMini: { fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 0' },

  taskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border-light)',
  },
  checkbox: {
    width: 20,
    height: 20,
    border: '1.5px solid',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border-light)',
  },
  linkName: { fontSize: 13, fontWeight: 700 },
  linkMeta: { fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
};
