'use client';
import { useState, useEffect } from 'react';
import SourceBadge from '@/components/hearst/SourceBadge';
import { SOURCE_TYPES } from '@/lib/hearst-constants';

const SOURCE_FIELDS = [
  { key: 'metric_id', label: 'Metric / Field', required: true },
  { key: 'source_type', label: 'Source Type', type: 'select', options: Object.keys(SOURCE_TYPES), required: true },
  { key: 'metric_name', label: 'Metric Name (human-readable)', required: true },
  { key: 'source_name', label: 'Source Name / Author', required: true },
  { key: 'source_url', label: 'URL (if applicable)', type: 'url' },
  { key: 'value', label: 'Numeric Value', type: 'number' },
  { key: 'value_text', label: 'Text Value (if not numeric)' },
  { key: 'unit', label: 'Unit' },
  { key: 'currency', label: 'Currency', type: 'text' },
  { key: 'confidence_score', label: 'Confidence Score (1–5)', type: 'number' },
  { key: 'geography', label: 'Geography' },
  { key: 'page_number', label: 'Page / Section' },
  { key: 'date_published', label: 'Date Published', type: 'date' },
  { key: 'applicability_to_qatar', label: 'Applicability to Qatar', type: 'textarea' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function SourcesPage() {
  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ source_type: 'admin_input', currency: 'USD' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const sRes = await fetch(`/api/admin/hearst/sources?project_id=${proj.id}`);
        const { sources: s } = await sRes.json();
        setSources(s || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addSource() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hearst/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id }),
      });
      const { source } = await res.json();
      setSources(prev => [source, ...prev]);
      setForm({ source_type: 'admin_input', currency: 'USD' });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  const [confirmingDelete, setConfirmingDelete] = useState(null);

  async function deleteSource(id) {
    const previous = sources;
    setSources(prev => prev.filter(s => s.id !== id)); // optimistic
    setConfirmingDelete(null);
    try {
      const res = await fetch(`/api/admin/hearst/sources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    } catch (e) {
      setSources(previous); // revert
      setError(`Delete failed: ${e.message}`);
      setTimeout(() => setError(null), 4000);
    }
  }

  if (loading) return <div style={S.loading}>Loading source ledger…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const filtered = sources.filter(s => {
    const matchText = !filter || JSON.stringify(s).toLowerCase().includes(filter.toLowerCase());
    const matchType = !typeFilter || s.source_type === typeFilter;
    return matchText && matchType;
  });

  const counts = Object.keys(SOURCE_TYPES).reduce((acc, t) => {
    acc[t] = sources.filter(s => s.source_type === t).length;
    return acc;
  }, {});

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.topBar}>
        <div style={S.pageTitle}>Source Ledger</div>
        <button onClick={() => setShowAdd(v => !v)} style={S.addBtn}>
          {showAdd ? '✕ Cancel' : '+ Add Source'}
        </button>
      </div>

      {/* Type summary chips */}
      <div style={S.chipRow}>
        <button onClick={() => setTypeFilter('')} style={{ ...S.chip, ...(typeFilter === '' ? S.chipActive : {}) }}>
          All ({sources.length})
        </button>
        {Object.entries(SOURCE_TYPES).map(([t, meta]) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
            style={{ ...S.chip, background: typeFilter === t ? meta.bg : 'transparent', color: typeFilter === t ? meta.color : 'var(--color-text-muted)', borderColor: meta.color }}
          >
            {meta.label} ({counts[t] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        placeholder="Search sources…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={S.search}
      />

      {/* Add form */}
      {showAdd && (
        <div style={S.addForm}>
          <div style={S.addFormTitle}>ADD NEW SOURCE</div>
          <div style={S.addGrid}>
            {SOURCE_FIELDS.map(f => (
              <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
                <label style={S.fieldLabel}>{f.label}{f.required && ' *'}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={S.input}>
                    {f.options.map(o => <option key={o} value={o}>{SOURCE_TYPES[o]?.label || o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...S.input, minHeight: 60 }} />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={S.input}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
            <button onClick={addSource} disabled={saving || !form.metric_id || !form.metric_name || !form.source_name} style={S.saveBtn}>
              {saving ? 'Saving…' : 'Add Source'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={S.empty}>No sources found. Add your first source above.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Metric</th>
              <th style={S.th}>Type</th>
              <th style={S.th}>Source Name</th>
              <th style={S.th}>Value</th>
              <th style={S.th}>Confidence</th>
              <th style={S.th}>Date Published</th>
              <th style={S.th}>URL</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={S.tr}>
                <td style={S.tdBold}>{s.metric_id}</td>
                <td style={S.td}><SourceBadge type={s.source_type} /></td>
                <td style={S.td}>{s.source_name || '—'}</td>
                <td style={S.tdNum}>{s.value != null ? s.value : (s.value_text || '—')}{s.unit ? ' ' + s.unit : ''}</td>
                <td style={S.td}>{s.confidence_score != null ? s.confidence_score + '/5' : '—'}</td>
                <td style={S.td}>{s.date_published || '—'}</td>
                <td style={S.td}>
                  {s.source_url ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={S.link}>↗</a> : '—'}
                </td>
                <td style={S.td}>
                  {confirmingDelete === s.id ? (
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <button onClick={() => deleteSource(s.id)} style={S.confirmYes} title="Confirm delete">✓ Delete</button>
                      <button onClick={() => setConfirmingDelete(null)} style={S.confirmNo} title="Cancel">✕</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmingDelete(s.id)} style={S.deleteBtn} title="Delete source">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
  error: { padding: 24, color: '#DC2626', fontSize: 13, background: '#FEF2F2', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '7px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  chipRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  chip: { fontSize: 11, fontWeight: 600, padding: '4px 10px', border: '1px solid', borderRadius: 20, cursor: 'pointer', transition: 'all .15s' },
  chipActive: { background: 'var(--color-text-primary)', color: 'var(--color-bg-main)', borderColor: 'var(--color-text-primary)' },
  search: { width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid var(--color-border-light)', borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-primary)', marginBottom: 16, boxSizing: 'border-box' },
  addForm: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: '18px 20px', marginBottom: 20 },
  addFormTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 14 },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 16px' },
  fieldLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 3 },
  input: { width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--color-border-light)', borderRadius: 4, background: 'var(--color-bg-main)', color: 'var(--color-text-primary)', boxSizing: 'border-box' },
  saveBtn: { fontSize: 12, fontWeight: 700, padding: '7px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  cancelBtn: { fontSize: 12, padding: '7px 14px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-light)', borderRadius: 6, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', fontSize: 13, background: 'var(--color-surface)', borderRadius: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--color-surface)', borderRadius: 8, overflow: 'hidden' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--color-text-muted)', background: 'var(--color-bg-main)', borderBottom: '1px solid var(--color-border-light)' },
  tr: { borderBottom: '1px solid var(--color-border-light)' },
  td: { padding: '8px 12px', color: 'var(--color-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-primary)', verticalAlign: 'middle', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' },
  tdNum: { padding: '8px 12px', fontFamily: 'monospace', color: 'var(--color-text-primary)', fontWeight: 700, verticalAlign: 'middle' },
  link: { color: '#2563EB', fontSize: 14, textDecoration: 'none' },
  deleteBtn: { fontSize: 12, color: '#DC2626', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 },
  confirmYes: { fontSize: 10, fontWeight: 700, color: '#fff', background: '#DC2626', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 4 },
  confirmNo: { fontSize: 10, color: 'var(--color-text-muted)', background: 'transparent', border: '1px solid var(--color-border-light)', cursor: 'pointer', padding: '3px 6px', borderRadius: 4 },
};
