'use client';
import { useState, useEffect } from 'react';

const STATUS_META = {
  missing:     { label: 'Missing',     color: 'var(--cp-error)', bg: 'var(--cp-error-bg)' },
  in_progress: { label: 'In Progress', color: 'var(--cp-warning)', bg: 'var(--cp-warning-bg)' },
  uploaded:    { label: 'Uploaded',    color: 'var(--cp-info)', bg: 'var(--cp-info-bg)' },
  reviewed:    { label: 'Reviewed',    color: 'var(--cp-violet)', bg: 'var(--cp-violet-bg)' },
  approved:    { label: 'Approved',    color: 'var(--cp-success)', bg: 'var(--cp-success-bg)' },
};

const STATUS_ORDER = ['missing', 'in_progress', 'uploaded', 'reviewed', 'approved'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.missing;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: m.bg, color: m.color }}>{m.label}</span>;
}

export default function DataRoomPage() {
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', notes: '' });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({ title: '', category: '', notes: '' });
    setShowAdd(false);
  }

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const drRes = await fetch(`/api/admin/hearst/data-room?project_id=${proj.id}`);
        const { items: it } = await drRes.json();
        setItems(it || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/hearst/data-room/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const { item } = await res.json();
      setItems(prev => prev.map(i => i.id === id ? item : i));
    } finally {
      setUpdating(null);
    }
  }

  async function addItem() {
    if (!form.title || !form.category || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hearst/data-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id, status: 'missing', required_for_base_case: true }),
      });
      if (!res.ok) throw new Error('Failed to add document');
      const { item } = await res.json();
      setItems(prev => [...prev, item]);
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={S.loading}>Loading data room…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))].sort();

  const filtered = items.filter(i => {
    const matchCat = !catFilter || i.category === catFilter;
    const matchSt = !statusFilter || i.status === statusFilter;
    return matchCat && matchSt;
  });

  const total = items.length;
  const approved = items.filter(i => i.status === 'approved' || i.status === 'reviewed').length;
  const missing = items.filter(i => i.status === 'missing').length;
  const pct = total ? Math.round((approved / total) * 100) : 0;

  // Group by category
  const byCategory = {};
  for (const item of filtered) {
    const cat = item.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  return (
    <div style={S.wrap}>
      {/* Progress header */}
      <div style={S.progressCard}>
        <div style={S.progressInfo}>
          <div style={S.progressTitle}>Data Room Completeness</div>
          <div style={S.progressSub}>{approved} of {total} documents approved or reviewed</div>
        </div>
        <div style={S.progressBarWrap}>
          <div style={{ ...S.progressBar, width: pct + '%' }} />
        </div>
        <div style={{ ...S.pct, color: pct >= 70 ? 'var(--cp-success)' : pct >= 40 ? 'var(--cp-warning)' : 'var(--cp-error)' }}>{pct}%</div>
        {missing > 0 && <div style={S.missingAlert}>{missing} missing</div>}
      </div>

      {/* Filters + add */}
      <div style={S.filterRow}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={S.select}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={S.select}>
          <option value="">All statuses</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <button onClick={() => showAdd ? resetForm() : setShowAdd(true)} style={S.addBtn}>{showAdd ? '✕' : '+ Add Document'}</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={S.addForm}>
          <input placeholder="Document title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={S.input} />
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={S.input}>
            <option value="">Category *</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Other">Other</option>
          </select>
          <input placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={S.input} />
          <button onClick={addItem} disabled={saving || !form.title || !form.category} style={{ ...S.saveBtn, opacity: saving || !form.title || !form.category ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Adding…' : 'Add'}
          </button>
          <button onClick={resetForm} style={S.cancelBtn}>Cancel</button>
        </div>
      )}

      {/* Document groups */}
      {Object.entries(byCategory).map(([cat, catItems]) => {
        const catApproved = catItems.filter(i => i.status === 'approved' || i.status === 'reviewed').length;
        return (
          <div key={cat} style={S.catGroup}>
            <div style={S.catHeader}>
              <span style={S.catName}>{cat}</span>
              <span style={S.catCount}>{catApproved}/{catItems.length}</span>
            </div>
            {catItems.map(item => {
              const next = STATUS_ORDER[STATUS_ORDER.indexOf(item.status) + 1];
              const prev = STATUS_ORDER[STATUS_ORDER.indexOf(item.status) - 1];
              return (
                <div key={item.id} style={{ ...S.docRow, opacity: updating === item.id ? 0.6 : 1 }}>
                  <div style={S.docLeft}>
                    <StatusBadge status={item.status} />
                    <div style={S.docTitle}>{item.title}</div>
                    {item.required_for_base_case && <span style={S.reqTag}>REQUIRED</span>}
                  </div>
                  <div style={S.docRight}>
                    {item.notes && <span style={S.docNote}>{item.notes}</span>}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {prev && (
                        <button onClick={() => updateStatus(item.id, prev)} style={S.statusBtn} disabled={updating === item.id}>
                          ← {STATUS_META[prev]?.label}
                        </button>
                      )}
                      {next && (
                        <button
                          onClick={() => updateStatus(item.id, next)}
                          style={{ ...S.statusBtn, background: STATUS_META[next]?.bg, color: STATUS_META[next]?.color, borderColor: STATUS_META[next]?.color }}
                          disabled={updating === item.id}
                        >
                          Mark {STATUS_META[next]?.label} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  progressCard: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)',
    borderRadius: 8, padding: '14px 20px', marginBottom: 20,
  },
  progressInfo: { minWidth: 200 },
  progressTitle: { fontSize: 13, fontWeight: 700, color: 'var(--cp-text-primary)' },
  progressSub: { fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2 },
  progressBarWrap: { flex: 1, height: 8, background: 'var(--cp-border)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', background: 'var(--cp-info)', borderRadius: 4, transition: 'width .3s' },
  pct: { fontSize: 18, fontWeight: 900, minWidth: 50 },
  missingAlert: { fontSize: 11, fontWeight: 700, color: 'var(--cp-error)', background: 'var(--cp-error-bg)', padding: '3px 10px', borderRadius: 20 },
  filterRow: { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' },
  select: { fontSize: 12, padding: '7px 10px', border: '1px solid var(--cp-border)', borderRadius: 6, background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', cursor: 'pointer' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '7px 14px', background: 'var(--cp-info)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto' },
  addForm: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 160, padding: '7px 10px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 6, background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)' },
  saveBtn: { fontSize: 12, fontWeight: 700, padding: '7px 14px', background: 'var(--cp-success)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  cancelBtn: { fontSize: 12, padding: '7px 12px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer' },
  catGroup: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  catHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: 'var(--cp-bg-deep)', borderBottom: '1px solid var(--cp-border)' },
  catName: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--cp-text-muted)', textTransform: 'uppercase' },
  catCount: { fontSize: 11, fontWeight: 700, color: 'var(--cp-success)' },
  docRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--cp-border)', transition: 'opacity .15s' },
  docLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  docTitle: { fontSize: 13, color: 'var(--cp-text-primary)', fontWeight: 500 },
  reqTag: { fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--cp-violet)', background: 'var(--cp-violet-bg)', padding: '1px 6px', borderRadius: 10 },
  docRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  docNote: { fontSize: 11, color: 'var(--cp-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusBtn: { fontSize: 10, fontWeight: 600, padding: '4px 10px', border: '1px solid var(--cp-border)', background: 'transparent', color: 'var(--cp-text-muted)', borderRadius: 4, cursor: 'pointer' },
};
