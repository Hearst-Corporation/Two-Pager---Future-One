'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PILLAR_ACCENT = {
  datacenter: '#3b82f6',
  mining: '#f59e0b',
  hub: '#10b981',
};

export default function OperatorDetail({
  operator,
  stakeholders,
  events,
  documents,
  statusFlow,
  statusLabel,
  pillarLabel,
  eventLabel,
}) {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [, startTransition] = useTransition();
  const accent = PILLAR_ACCENT[operator.pillar];

  const refresh = () => startTransition(() => router.refresh());

  return (
    <div style={S.wrap}>
      {/* TOP BAR */}
      <div style={S.topbar}>
        <Link href="/admin" style={S.back}>← BACK TO PIPELINE</Link>
        <div style={S.topbarRight}>
          <Link href="/admin" style={S.back}>HOME</Link>
        </div>
      </div>

      {/* HEADER */}
      <header style={S.header}>
        <div style={{ ...S.pillarTag, background: accent }}>{pillarLabel[operator.pillar].toUpperCase()}</div>
        <div style={S.rank}>{operator.rank}</div>
        <h1 style={S.name}>{operator.name}</h1>
        <div style={S.country}>
          {operator.country} · <span style={{ color: accent, fontWeight: 800 }}>{operator.role}</span>
        </div>
        {operator.one_liner && <p style={S.lead}>{operator.one_liner}</p>}
      </header>

      {/* QUICK STATUS BAR */}
      <StatusBar
        operator={operator}
        statusFlow={statusFlow}
        statusLabel={statusLabel}
        accent={accent}
        onChange={refresh}
      />

      {/* TABS */}
      <div style={S.tabs}>
        {['overview', 'stakeholders', 'timeline', 'documents'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...S.tab,
              borderBottomColor: tab === t ? accent : 'transparent',
              color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            {t.toUpperCase()}
            {t === 'stakeholders' && stakeholders.length > 0 && <span style={S.tabBadge}>{stakeholders.length}</span>}
            {t === 'timeline' && events.length > 0 && <span style={S.tabBadge}>{events.length}</span>}
            {t === 'documents' && documents.length > 0 && <span style={S.tabBadge}>{documents.length}</span>}
          </button>
        ))}
      </div>

      <div style={S.tabBody}>
        {tab === 'overview' && (
          <OverviewTab operator={operator} accent={accent} onChange={refresh} />
        )}
        {tab === 'stakeholders' && (
          <StakeholdersTab
            operator={operator}
            stakeholders={stakeholders}
            accent={accent}
            onChange={refresh}
          />
        )}
        {tab === 'timeline' && (
          <TimelineTab
            operator={operator}
            events={events}
            eventLabel={eventLabel}
            accent={accent}
            onChange={refresh}
          />
        )}
        {tab === 'documents' && (
          <DocumentsTab
            operator={operator}
            documents={documents}
            accent={accent}
            onChange={refresh}
          />
        )}
      </div>
    </div>
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

/* ============================ OVERVIEW ============================ */
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
          Last updated · {new Date(operator.updated_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={S.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

/* ============================ STAKEHOLDERS ============================ */
function StakeholdersTab({ operator, stakeholders, accent, onChange }) {
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

/* ============================ TIMELINE ============================ */
function TimelineTab({ operator, events, eventLabel, accent, onChange }) {
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
          <input
            style={S.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (one-liner)"
          />
        </div>
        <textarea
          style={{ ...S.input, minHeight: 80, fontFamily: 'inherit', resize: 'vertical', marginTop: 10 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details / body…"
        />
        <button
          style={{ ...S.btnPrimary, background: accent, marginTop: 10 }}
          onClick={add}
          disabled={busy || (!subject && !body)}
        >
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
                {new Date(e.occurred_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div style={S.evBody}>
                <div style={{ ...S.evType, color: e.type === 'status_change' ? 'var(--color-text-muted)' : accent }}>
                  {(eventLabel[e.type] || e.type).toUpperCase()}
                </div>
                {e.subject && <div style={S.evSubject}>{e.subject}</div>}
                {e.body && <div style={S.evText}>{e.body}</div>}
              </div>
              {e.type !== 'status_change' && (
                <button style={S.del} onClick={() => remove(e.id)}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ DOCUMENTS ============================ */
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
    const r = await fetch(`/api/admin/documents?id=${id}`);
    const j = await r.json();
    if (j.url) window.open(j.url, '_blank');
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
          <input
            style={S.input}
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Or — display name (optional)"
          />
          <input
            style={S.input}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="External URL (Notion, Drive, etc.)"
          />
          <button
            style={{ ...S.btnPrimary, background: accent }}
            onClick={addLink}
            disabled={busy || !linkUrl}
          >
            + ADD LINK
          </button>
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
                  {d.storage_path && <span>UPLOADED FILE</span>}
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

/* ============================ STYLES ============================ */
const S = {
  wrap: {
    padding: '20px 40px 80px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'var(--color-text-primary)',
    maxWidth: 1200,
    margin: '0 auto',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
  },
  topbarRight: { display: 'flex', gap: 16 },
  back: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
  },

  header: { marginBottom: 24 },
  pillarTag: {
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: '#fff',
    marginBottom: 12,
  },
  rank: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-accent-strong)',
    marginBottom: 6,
  },
  name: { fontSize: 44, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, margin: 0 },
  country: { fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8, fontWeight: 600 },
  lead: {
    fontSize: 15,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.55,
    marginTop: 16,
    maxWidth: 720,
  },

  statusBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
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

  tabs: {
    display: 'flex',
    gap: 24,
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: 24,
  },
  tab: {
    padding: '12px 0',
    background: 'none',
    border: 0,
    borderBottom: '2px solid transparent',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tabBadge: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
  },
  tabBody: {},

  /* Overview */
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

  /* Add block (stakeholders / timeline / docs) */
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

  /* Generic row table */
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

  /* Timeline */
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
  evDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginTop: 4,
  },
  evWhen: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: 'var(--color-text-muted)',
    paddingTop: 2,
  },
  evBody: {},
  evType: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    marginBottom: 4,
  },
  evSubject: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  evText: { fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' },
};
