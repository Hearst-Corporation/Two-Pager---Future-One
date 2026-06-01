'use client';
import { useState, useEffect, useMemo } from 'react';
import SourceBadge, { SOURCE_TYPES_CP } from '@/components/hearst/SourceBadge';
import SectionTabs from '@/components/hearst/SectionTabs';
import OperatorBadge from '@/components/hearst/OperatorBadge';
import {
  SOURCE_TYPES, OPERATORS, OPERATORS_BY_ID,
  PUBLIC_SOURCES_LIBRARY, DOC_TYPES,
} from '@/lib/hearst-constants';

const SOURCE_FIELDS = [
  { key: 'metric_id',    label: 'Metric ID',    required: true },
  { key: 'source_type',  label: 'Source Type',  type: 'select', options: Object.keys(SOURCE_TYPES), required: true },
  { key: 'metric_name',  label: 'Metric Name',  required: true },
  { key: 'source_name',  label: 'Source Name',  required: true },
  { key: 'source_url',   label: 'URL',          type: 'url' },
  { key: 'value',        label: 'Numeric Value', type: 'number' },
  { key: 'value_text',   label: 'Text Value' },
  { key: 'unit',         label: 'Unit' },
  { key: 'currency',     label: 'Currency' },
  { key: 'confidence_score', label: 'Confidence (1–5)', type: 'number' },
  { key: 'geography',    label: 'Geography' },
  { key: 'date_published', label: 'Date Published', type: 'date' },
  { key: 'applicability_to_qatar', label: 'Qatar Applicability', type: 'textarea' },
  { key: 'notes',        label: 'Notes',        type: 'textarea' },
];

const LIB_COUNTS = PUBLIC_SOURCES_LIBRARY.reduce((acc, s) => {
  acc[s.operator_id] = (acc[s.operator_id] || 0) + 1;
  return acc;
}, {});

const ACTIVE_OPERATORS = OPERATORS.filter(o => LIB_COUNTS[o.id] > 0);

function fmtVal(src) {
  if (src.value == null) return src.value_text || '—';
  const v = src.value;
  const u = src.unit || '';
  if (u === 'ratio' || u === 'ratio/year') return (v * 100).toFixed(1) + '%';
  if (u.includes('$/MW') || u.includes('$/kW') || u.includes('$M')) {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M/' + u.split('/').slice(1).join('/');
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(0) + 'k/' + u.split('/').slice(1).join('/');
    return '$' + v + '/' + u.split('/').slice(1).join('/');
  }
  return v.toLocaleString() + (u ? ' ' + u : '');
}

function ConfidenceDots({ score }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i < score ? 'var(--cp-accent)' : 'var(--cp-surface-3)', display: 'inline-block' }} />
      ))}
    </span>
  );
}

export default function SourcesPage() {
  const [project, setProject]       = useState(null);
  const [scenarios, setScenarios]   = useState([]);
  const [adminSources, setAdminSources] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [selectedOp, setSelectedOp]   = useState('all');
  const [docType, setDocType]         = useState('all');
  const [search, setSearch]           = useState('');
  const [showMyS, setShowMyS]         = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [form, setForm]               = useState({ source_type: 'admin_input', currency: 'USD' });
  const [saving, setSaving]           = useState(false);
  const [confirmDel, setConfirmDel]   = useState(null);

  // Use in Model modal
  const [uimSrc, setUimSrc]           = useState(null);
  const [uimScenario, setUimScenario] = useState('');
  const [uimSaving, setUimSaving]     = useState(false);
  const [uimDone, setUimDone]         = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const [sRes, scRes] = await Promise.all([
          fetch(`/api/admin/hearst/sources?project_id=${proj.id}`),
          fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`),
        ]);
        const { sources: s } = await sRes.json();
        const { scenarios: sc } = await scRes.json();
        setAdminSources(s || []);
        setScenarios(sc || []);
        setUimScenario(sc?.[0]?.id || '');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const libFiltered = useMemo(() => PUBLIC_SOURCES_LIBRARY.filter(src => {
    if (selectedOp !== 'all' && src.operator_id !== selectedOp) return false;
    if (docType !== 'all' && src.doc_type !== docType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(src.metric_name + src.source_name + (src.geography || '')).toLowerCase().includes(q)) return false;
    }
    return true;
  }), [selectedOp, docType, search]);

  async function addSource() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hearst/sources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id }),
      });
      const { source } = await res.json();
      setAdminSources(prev => [source, ...prev]);
      setForm({ source_type: 'admin_input', currency: 'USD' });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSource(id) {
    const prev = adminSources;
    setAdminSources(p => p.filter(s => s.id !== id));
    setConfirmDel(null);
    try {
      const res = await fetch(`/api/admin/hearst/sources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (e) {
      setAdminSources(prev);
      setError(e.message);
      setTimeout(() => setError(null), 4000);
    }
  }

  async function useInModel() {
    if (!project || !uimSrc) return;
    setUimSaving(true);
    try {
      await fetch('/api/admin/hearst/sources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          metric_id: uimSrc.metric_id, metric_name: uimSrc.metric_name,
          source_type: uimSrc.source_type, source_name: uimSrc.source_name,
          source_url: uimSrc.url, value: uimSrc.value, value_text: uimSrc.value_text,
          unit: uimSrc.unit, currency: uimSrc.currency, geography: uimSrc.geography,
          confidence_score: uimSrc.confidence_score, date_published: uimSrc.date_published,
          applicability_to_qatar: uimSrc.applicability_to_qatar, notes: uimSrc.caveat,
        }),
      });
      setUimDone(true);
      setTimeout(() => { setUimSrc(null); setUimDone(false); fetch(`/api/admin/hearst/sources?project_id=${project.id}`).then(r => r.json()).then(({ sources: s }) => setAdminSources(s || [])); }, 1000);
    } finally {
      setUimSaving(false);
    }
  }

  if (loading) return <div style={S.loading}>Loading market intelligence…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  return (
    <div style={S.wrap}>
      <SectionTabs section="library" />
      {/* Header */}
      <div style={S.topBar}>
        <div style={S.pageTitle}>Market Intelligence — {PUBLIC_SOURCES_LIBRARY.length} benchmarks</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowMyS(v => !v)} style={S.secBtn}>
            My Sources ({adminSources.length})
          </button>
          <button onClick={() => setShowAdd(v => !v)} style={S.addBtn} className="cp-btn-hover">
            + Add Source
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div style={S.filterRow}>
        {/* Operator select */}
        <select value={selectedOp} onChange={e => setSelectedOp(e.target.value)} style={S.filterSelect}>
          <option value="all">All Operators ({PUBLIC_SOURCES_LIBRARY.length})</option>
          {ACTIVE_OPERATORS.map(op => (
            <option key={op.id} value={op.id}>{op.name} ({LIB_COUNTS[op.id]})</option>
          ))}
        </select>
        {/* Doc type select */}
        <select value={docType} onChange={e => setDocType(e.target.value)} style={S.filterSelect}>
          {DOC_TYPES.map(dt => <option key={dt.id} value={dt.id}>{dt.label}</option>)}
        </select>
        {/* Search */}
        <input
          placeholder="Search metric, source…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={S.searchInput}
        />
        <span style={S.resultCount}>{libFiltered.length} results</span>
      </div>

      {/* Library table */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Operator</th>
            <th style={S.th}>Metric</th>
            <th style={S.th}>Value</th>
            <th style={S.th}>Source</th>
            <th style={S.th}>Geography</th>
            <th style={S.th}>Confidence</th>
            <th style={S.th}>Date</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {libFiltered.length === 0 ? (
            <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 28 }}>No results matching filters.</td></tr>
          ) : libFiltered.map(src => (
            <tr key={src.id} style={S.tr}>
              <td style={S.td}><OperatorBadge operatorId={src.operator_id} size="sm" /></td>
              <td style={S.tdBold}>{src.metric_name}</td>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--cp-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtVal(src)}</td>
              <td style={S.td}>
                {src.url
                  ? <a href={src.url} target="_blank" rel="noopener noreferrer" style={S.link}>{src.source_name}</a>
                  : src.source_name}
              </td>
              <td style={S.td}>{src.geography || '—'}</td>
              <td style={S.td}><ConfidenceDots score={src.confidence_score || 0} /></td>
              <td style={S.td}>{src.date_published?.slice(0, 7) || '—'}</td>
              <td style={{ ...S.td, textAlign: 'right' }}>
                <button onClick={() => { setUimSrc(src); setUimDone(false); }} style={S.useBtn}>
                  Use in Model
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* My Sources (collapsible) */}
      {showMyS && (
        <div style={{ marginTop: 8 }}>
          <div style={S.sectionLabel}>MY SOURCES — Admin &amp; Project-specific</div>

          {showAdd && (
            <div style={S.addForm}>
              <div style={S.addFormTitle}>ADD SOURCE</div>
              <div style={S.addGrid}>
                {SOURCE_FIELDS.map(f => (
                  <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
                    <label style={S.fieldLabel}>{f.label}{f.required && ' *'}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={S.input}>
                        {f.options.map(o => <option key={o} value={o}>{SOURCE_TYPES[o]?.label || o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...S.input, minHeight: 56 }} />
                    ) : (
                      <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={S.input} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={() => setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
                <button onClick={addSource} disabled={saving || !form.metric_id || !form.metric_name || !form.source_name}
                  style={{ ...S.addBtn, opacity: (saving || !form.metric_id) ? 0.5 : 1 }}>
                  {saving ? 'Saving…' : 'Add Source'}
                </button>
              </div>
            </div>
          )}

          {adminSources.length === 0 ? (
            <div style={S.empty}>No admin sources yet.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  {['Metric ID', 'Type', 'Source', 'Value', 'Confidence', 'Date', 'URL', ''].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminSources.map(s => (
                  <tr key={s.id} style={S.tr}>
                    <td style={S.tdBold}>{s.metric_id}</td>
                    <td style={S.td}><SourceBadge source_type={s.source_type} /></td>
                    <td style={S.td}>{s.source_name || '—'}</td>
                    <td style={{ ...S.td, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value != null ? s.value : (s.value_text || '—')}{s.unit ? ' ' + s.unit : ''}</td>
                    <td style={S.td}>{s.confidence_score != null ? s.confidence_score + '/5' : '—'}</td>
                    <td style={S.td}>{s.date_published || '—'}</td>
                    <td style={S.td}>{s.source_url ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={S.link}>↗</a> : '—'}</td>
                    <td style={S.td}>
                      {confirmDel === s.id ? (
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <button onClick={() => deleteSource(s.id)} style={S.confirmYes}>Delete</button>
                          <button onClick={() => setConfirmDel(null)} style={S.cancelBtn}>Cancel</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDel(s.id)} style={S.delBtn}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Use in Model modal */}
      {uimSrc && (
        <div style={S.overlay} onClick={() => setUimSrc(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>Add to Source Ledger</span>
              <button onClick={() => setUimSrc(null)} style={{ background: 'transparent', border: 'none', color: 'var(--cp-text-muted)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={S.modalBody}>
              <div style={S.modalRow}>
                <OperatorBadge operatorId={uimSrc.operator_id} size="md" />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cp-text-primary)', flex: 1 }}>{uimSrc.metric_name}</span>
                <span style={{ fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtVal(uimSrc)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 14 }}>
                This adds the source to your source ledger. It does not automatically update scenario assumptions.
              </div>
              <label style={S.fieldLabel}>Scenario context (for audit)</label>
              <select value={uimScenario} onChange={e => setUimScenario(e.target.value)} style={{ ...S.input, width: '100%', marginBottom: 16 }}>
                {scenarios.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
              {uimDone ? (
                <div style={{ color: 'var(--cp-accent)', fontWeight: 700, textAlign: 'center', padding: 12 }}>Source added.</div>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setUimSrc(null)} style={S.cancelBtn}>Cancel</button>
                  <button onClick={useInModel} disabled={uimSaving} style={{ ...S.addBtn, opacity: uimSaving ? 0.6 : 1 }}>
                    {uimSaving ? 'Adding…' : 'Add to Ledger'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 20, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 20, lineHeight: '28px', fontWeight: 800, color: 'var(--cp-text-primary)' },
  secBtn: { fontSize: 12, padding: '6px 12px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '6px 16px', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 },
  filterSelect: { fontSize: 11, padding: '5px 8px', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 4, color: 'var(--cp-text-primary)', cursor: 'pointer' },
  searchInput: { flex: 1, padding: '5px 10px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', outline: 'none' },
  resultCount: { fontSize: 10, color: 'var(--cp-text-muted)', whiteSpace: 'nowrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: '8px 12px', color: 'var(--cp-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: '8px 12px', fontWeight: 700, color: 'var(--cp-text-primary)', verticalAlign: 'middle' },
  link: { color: 'var(--cp-accent)', textDecoration: 'none' },
  useBtn: { fontSize: 10, fontWeight: 700, padding: '4px 10px', background: 'var(--cp-surface-3)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 12 },
  addForm: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 6, padding: '16px 16px', marginBottom: 16 },
  addFormTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 12 },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 16px' },
  fieldLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cp-text-muted)', marginBottom: 3 },
  input: { width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box', fontFamily: 'inherit' },
  cancelBtn: { fontSize: 11, padding: '5px 12px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  empty: { padding: '20px', color: 'var(--cp-text-muted)', fontSize: 12, background: 'var(--cp-surface-2)', borderRadius: 6, textAlign: 'center' },
  delBtn: { fontSize: 12, color: 'var(--cp-error)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' },
  confirmYes: { fontSize: 10, fontWeight: 700, color: 'var(--cp-text-strong)', background: 'var(--cp-error)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border-strong)', borderRadius: 10, width: 440, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px', borderBottom: '1px solid var(--cp-border)' },
  modalTitle: { fontSize: 13, fontWeight: 800, color: 'var(--cp-text-primary)' },
  modalBody: { padding: '16px 16px' },
  modalRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: 'var(--cp-surface-2)', padding: '8px 12px', borderRadius: 6 },
};
