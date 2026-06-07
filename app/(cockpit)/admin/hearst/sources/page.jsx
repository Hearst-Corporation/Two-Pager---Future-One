'use client';
import { useState, useEffect, useMemo } from 'react';
import SourceBadge from '@/components/hearst/SourceBadge';
import SectionTabs from '@/components/hearst/SectionTabs';
import OperatorBadge from '@/components/hearst/OperatorBadge';
import {
  SOURCE_TYPES, OPERATORS,
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
    <span style={S.confDots}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ ...S.confDot, background: i < score ? 'var(--cp-accent)' : 'var(--cp-surface-3)' }} />
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
          used_in_model: true,
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
    <>
    <style>{`
      @media (max-width: 600px) {
        [data-sources-topbar] { flex-direction: column !important; align-items: stretch !important; }
        [data-sources-filter-row] { flex-wrap: wrap !important; }
        [data-sources-filter-row] select { flex: 1 1 auto; min-width: 0; }
        [data-sources-add-grid] { grid-template-columns: 1fr !important; }
      }
    `}</style>
    <div className="oracle-page">
      <SectionTabs section="library" />
      {/* Header */}
      <div data-sources-topbar style={S.topBar}>
        <div style={S.pageTitle}>Market Intelligence — {PUBLIC_SOURCES_LIBRARY.length} benchmarks</div>
        <div style={S.flexRow}>
          <button onClick={() => setShowMyS(v => !v)} style={S.secBtn}>
            My Sources ({adminSources.length})
          </button>
          <button onClick={() => setShowAdd(v => !v)} style={S.addBtn} className="cp-btn-hover">
            + Add Source
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div data-sources-filter-row style={S.filterRow}>
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
      <div style={S.tableScroll}>
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
            <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 'var(--cp-space-7)' }}>No results matching filters.</td></tr>
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
      </div>

      {/* My Sources (collapsible) */}
      {showMyS && (
        <div style={S.mySourcesWrap}>
          <div style={S.sectionLabel}>MY SOURCES — Admin &amp; Project-specific</div>

          {showAdd && (
            <div style={S.addForm}>
              <div style={S.addFormTitle}>ADD SOURCE</div>
              <div data-sources-add-grid style={S.addGrid}>
                {SOURCE_FIELDS.map(f => (
                  <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
                    <label style={S.fieldLabel}>{f.label}{f.required && ' *'}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={S.input}>
                        {f.options.map(o => <option key={o} value={o}>{SOURCE_TYPES[o]?.label || o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...S.input, minHeight: 'calc(var(--cp-space-12) + var(--cp-space-2))' }} />
                    ) : (
                      <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={S.input} />
                    )}
                  </div>
                ))}
              </div>
              <div style={S.formActions}>
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
                    <td style={S.tdBold}>
                      {s.metric_id}
                      {s.used_in_model && <span style={S.inModelBadge}>● in model</span>}
                    </td>
                    <td style={S.td}><SourceBadge source_type={s.source_type} /></td>
                    <td style={S.td}>{s.source_name || '—'}</td>
                    <td style={{ ...S.td, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value != null ? s.value : (s.value_text || '—')}{s.unit ? ' ' + s.unit : ''}</td>
                    <td style={S.td}>{s.confidence_score != null ? s.confidence_score + '/5' : '—'}</td>
                    <td style={S.td}>{s.date_published || '—'}</td>
                    <td style={S.td}>{s.source_url ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={S.link}>↗</a> : '—'}</td>
                    <td style={S.td}>
                      {confirmDel === s.id ? (
                        <span style={S.delActions}>
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
              <button onClick={() => setUimSrc(null)} style={S.modalClose}>✕</button>
            </div>
            <div style={S.modalBody}>
              <div style={S.modalRow}>
                <OperatorBadge operatorId={uimSrc.operator_id} size="md" />
                <span style={S.modalMetric}>{uimSrc.metric_name}</span>
                <span style={S.modalValue}>{fmtVal(uimSrc)}</span>
              </div>
              <div style={S.modalHint}>
                This flags the source as used in the model — the simulator will use its value for this metric (overriding the benchmark median).
              </div>
              <label style={S.fieldLabel}>Scenario context (for audit)</label>
              <select value={uimScenario} onChange={e => setUimScenario(e.target.value)} style={{ ...S.input, width: '100%', marginBottom: 'var(--cp-space-4)' }}>
                {scenarios.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
              {uimDone ? (
                <div style={S.uimDone}>Source added.</div>
              ) : (
                <div style={S.flexEnd}>
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
    </>
  );
}

const S = {
  loading: { padding: 'var(--cp-space-12)', textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-md)' },
  error: { padding: 'var(--cp-space-5)', color: 'var(--cp-error)', fontSize: 'var(--cp-font-base)', background: 'var(--cp-error-bg)', borderRadius: 'var(--cp-radius-sm)' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 'var(--cp-font-xl)', lineHeight: 'var(--cp-leading-tight)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)' },
  secBtn: { fontSize: 'var(--cp-font-sm)', padding: 'var(--cp-space-2) var(--cp-space-3)', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-sm)', cursor: 'pointer' },
  addBtn: { fontSize: 'var(--cp-font-sm)', fontWeight: 700, padding: 'var(--cp-space-2) var(--cp-space-4)', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 'var(--cp-radius-sm)', cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 'var(--cp-space-2)', alignItems: 'center', marginBottom: 'var(--cp-space-4)' },
  filterSelect: { fontSize: 'var(--cp-font-xs)', padding: 'var(--cp-space-2)', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', color: 'var(--cp-text-primary)', cursor: 'pointer' },
  searchInput: { flex: 1, padding: 'var(--cp-space-2) var(--cp-space-3)', fontSize: 'var(--cp-font-sm)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', outline: 'none' },
  resultCount: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', whiteSpace: 'nowrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)', background: 'var(--cp-surface-2)', borderRadius: 'var(--cp-radius-md)', overflow: 'hidden', marginBottom: 'var(--cp-space-6)' },
  th: { padding: 'var(--cp-space-2) var(--cp-space-3)', textAlign: 'left', fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: 'var(--cp-space-2) var(--cp-space-3)', fontWeight: 700, color: 'var(--cp-text-primary)', verticalAlign: 'middle' },
  link: { color: 'var(--cp-accent)', textDecoration: 'none' },
  useBtn: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, padding: 'var(--cp-space-1) var(--cp-space-3)', background: 'var(--cp-surface-3)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', cursor: 'pointer' },
  sectionLabel: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--cp-space-3)' },
  addForm: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-sm)', padding: 'var(--cp-space-4)', marginBottom: 'var(--cp-space-4)' },
  addFormTitle: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-wider)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-3)' },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--cp-space-3) var(--cp-space-4)' },
  fieldLabel: { display: 'block', fontSize: 'var(--cp-font-xs)', fontWeight: 600, color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-1)' },
  input: { width: '100%', padding: 'var(--cp-space-2) var(--cp-space-3)', fontSize: 'var(--cp-font-sm)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box', fontFamily: 'inherit' },
  cancelBtn: { fontSize: 'var(--cp-font-xs)', padding: 'var(--cp-space-2) var(--cp-space-3)', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', cursor: 'pointer' },
  empty: { padding: 'var(--cp-space-5)', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', background: 'var(--cp-surface-2)', borderRadius: 'var(--cp-radius-sm)', textAlign: 'center' },
  delBtn: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-error)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 'var(--cp-space-1) var(--cp-space-2)' },
  confirmYes: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, color: 'var(--cp-text-strong)', background: 'var(--cp-error)', border: 'none', cursor: 'pointer', padding: 'var(--cp-space-1) var(--cp-space-2)', borderRadius: 'var(--cp-radius-xs)' },
  overlay: { position: 'fixed', inset: 0, background: 'var(--cp-overlay)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border-strong)', borderRadius: 'var(--cp-radius-md)', width: 440, maxWidth: '90vw', boxShadow: 'var(--cp-shadow-lg)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--cp-space-4)', borderBottom: '1px solid var(--cp-border)' },
  modalTitle: { fontSize: 'var(--cp-font-base)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)' },
  modalBody: { padding: 'var(--cp-space-4)' },
  modalRow: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-3)', marginBottom: 'var(--cp-space-3)', background: 'var(--cp-surface-2)', padding: 'var(--cp-space-2) var(--cp-space-3)', borderRadius: 'var(--cp-radius-sm)' },
  confDots: { display: 'inline-flex', gap: 'calc(var(--cp-space-1) / 2)' },
  confDot: { width: 'calc(var(--cp-space-1) + 1px)', height: 'calc(var(--cp-space-1) + 1px)', borderRadius: '50%', display: 'inline-block' },
  flexRow: { display: 'flex', gap: 'var(--cp-space-2)' },
  flexEnd: { display: 'flex', gap: 'var(--cp-space-2)', justifyContent: 'flex-end' },
  formActions: { display: 'flex', gap: 'var(--cp-space-2)', justifyContent: 'flex-end', marginTop: 'var(--cp-space-3)' },
  tableScroll: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  mySourcesWrap: { marginTop: 'var(--cp-space-2)' },
  delActions: { display: 'inline-flex', gap: 'var(--cp-space-1)' },
  modalClose: { background: 'transparent', border: 'none', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-lg)', cursor: 'pointer' },
  modalMetric: { fontWeight: 700, fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-primary)', flex: 1 },
  modalValue: { fontWeight: 800, fontSize: 'var(--cp-font-lg)', fontVariantNumeric: 'tabular-nums' },
  modalHint: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-font-md)' },
  uimDone: { color: 'var(--cp-accent)', fontWeight: 700, textAlign: 'center', padding: 'var(--cp-space-3)' },
  inModelBadge: { display: 'inline-block', marginLeft: 'var(--cp-space-2)', fontSize: 'var(--cp-font-micro)', fontWeight: 700, color: 'var(--cp-accent)', background: 'var(--cp-surface-3)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', padding: '0 var(--cp-space-2)', verticalAlign: 'middle', letterSpacing: 'var(--cp-tracking-eyebrow)' },
};
