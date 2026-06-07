'use client';
import { useState, useEffect, useMemo } from 'react';
import SourceBadge from '@/components/hearst/SourceBadge';
import SectionTabs from '@/components/hearst/SectionTabs';
import OperatorBadge from '@/components/hearst/OperatorBadge';
import { Table, Row, Cell, Field, Button, Badge } from '@/components/hearst/ui';
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
          <Button variant="ghost" size="sm" onClick={() => setShowMyS(v => !v)}>
            My Sources ({adminSources.length})
          </Button>
          <Button variant="primary" size="sm" className="cp-btn-hover" onClick={() => setShowAdd(v => !v)}>
            + Add Source
          </Button>
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
      <div style={S.tableSpacer}>
      <Table scroll head={['Operator', 'Metric', 'Value', 'Source', 'Geography', 'Confidence', 'Date', '']}>
        {libFiltered.length === 0 ? (
          <Row><Cell style={{ textAlign: 'center', padding: 'var(--cp-space-7)' }} colSpan={8}>No results matching filters.</Cell></Row>
        ) : libFiltered.map(src => (
          <Row key={src.id}>
            <Cell><OperatorBadge operatorId={src.operator_id} size="sm" /></Cell>
            <Cell label>{src.metric_name}</Cell>
            <Cell style={{ fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtVal(src)}</Cell>
            <Cell>
              {src.url
                ? <a href={src.url} target="_blank" rel="noopener noreferrer" style={S.link}>{src.source_name}</a>
                : src.source_name}
            </Cell>
            <Cell>{src.geography || '—'}</Cell>
            <Cell><ConfidenceDots score={src.confidence_score || 0} /></Cell>
            <Cell>{src.date_published?.slice(0, 7) || '—'}</Cell>
            <Cell style={{ textAlign: 'right' }}>
              <Button variant="muted" size="sm" onClick={() => { setUimSrc(src); setUimDone(false); }}>Use in Model</Button>
            </Cell>
          </Row>
        ))}
      </Table>
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
                  <Field
                    key={f.key}
                    label={f.label}
                    type={f.type || 'text'}
                    required={f.required}
                    options={(f.options || []).map(o => ({ value: o, label: SOURCE_TYPES[o]?.label || o }))}
                    value={form[f.key] || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={f.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}
                  />
                ))}
              </div>
              <div style={S.formActions}>
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={addSource} disabled={saving || !form.metric_id || !form.metric_name || !form.source_name}>
                  {saving ? 'Saving…' : 'Add Source'}
                </Button>
              </div>
            </div>
          )}

          {adminSources.length === 0 ? (
            <div style={S.empty}>No admin sources yet.</div>
          ) : (
            <Table head={['Metric ID', 'Type', 'Source', 'Value', 'Confidence', 'Date', 'URL', '']}>
              {adminSources.map(s => (
                <Row key={s.id}>
                  <Cell label>
                    {s.metric_id}
                    {s.used_in_model && <Badge tone="accent" pill={false} style={{ marginLeft: 'var(--cp-space-2)' }}>● in model</Badge>}
                  </Cell>
                  <Cell><SourceBadge source_type={s.source_type} /></Cell>
                  <Cell>{s.source_name || '—'}</Cell>
                  <Cell style={{ fontWeight: 'var(--cp-weight-bold)', fontVariantNumeric: 'tabular-nums' }}>{s.value != null ? s.value : (s.value_text || '—')}{s.unit ? ' ' + s.unit : ''}</Cell>
                  <Cell>{s.confidence_score != null ? s.confidence_score + '/5' : '—'}</Cell>
                  <Cell>{s.date_published || '—'}</Cell>
                  <Cell>{s.source_url ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={S.link}>↗</a> : '—'}</Cell>
                  <Cell>
                    {confirmDel === s.id ? (
                      <span style={S.delActions}>
                        <Button variant="dangerSolid" size="sm" onClick={() => deleteSource(s.id)}>Delete</Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDel(null)}>Cancel</Button>
                      </span>
                    ) : (
                      <Button variant="danger" size="sm" style={{ border: 'none' }} onClick={() => setConfirmDel(s.id)}>✕</Button>
                    )}
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </div>
      )}

      {/* Use in Model modal */}
      {uimSrc && (
        <div style={S.overlay} onClick={() => setUimSrc(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>Add to Source Ledger</span>
              <Button variant="ghost" size="sm" style={{ border: 'none' }} onClick={() => setUimSrc(null)}>✕</Button>
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
              <Field
                label="Scenario context (for audit)"
                type="select"
                value={uimScenario}
                onChange={e => setUimScenario(e.target.value)}
                options={scenarios.map(sc => ({ value: sc.id, label: sc.name }))}
                style={{ marginBottom: 'var(--cp-space-4)' }}
              />
              {uimDone ? (
                <div style={S.uimDone}>Source added.</div>
              ) : (
                <div style={S.flexEnd}>
                  <Button variant="ghost" size="sm" onClick={() => setUimSrc(null)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={useInModel} disabled={uimSaving}>
                    {uimSaving ? 'Adding…' : 'Add to Ledger'}
                  </Button>
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
  filterRow: { display: 'flex', gap: 'var(--cp-space-2)', alignItems: 'center', marginBottom: 'var(--cp-space-4)' },
  filterSelect: { fontSize: 'var(--cp-font-xs)', padding: 'var(--cp-space-2)', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', color: 'var(--cp-text-primary)', cursor: 'pointer' },
  searchInput: { flex: 1, padding: 'var(--cp-space-2) var(--cp-space-3)', fontSize: 'var(--cp-font-sm)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', outline: 'none' },
  resultCount: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', whiteSpace: 'nowrap' },
  tableSpacer: { marginBottom: 'var(--cp-space-6)' },
  link: { color: 'var(--cp-accent)', textDecoration: 'none' },
  sectionLabel: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--cp-space-3)' },
  addForm: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-sm)', padding: 'var(--cp-space-4)', marginBottom: 'var(--cp-space-4)' },
  addFormTitle: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-wider)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-3)' },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--cp-space-3) var(--cp-space-4)' },
  empty: { padding: 'var(--cp-space-5)', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', background: 'var(--cp-surface-2)', borderRadius: 'var(--cp-radius-sm)', textAlign: 'center' },
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
  mySourcesWrap: { marginTop: 'var(--cp-space-2)' },
  delActions: { display: 'inline-flex', gap: 'var(--cp-space-1)' },
  modalMetric: { fontWeight: 'var(--cp-weight-bold)', fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-primary)', flex: 1 },
  modalValue: { fontWeight: 'var(--cp-weight-black)', fontSize: 'var(--cp-font-lg)', fontVariantNumeric: 'tabular-nums' },
  modalHint: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-font-md)' },
  uimDone: { color: 'var(--cp-accent)', fontWeight: 'var(--cp-weight-bold)', textAlign: 'center', padding: 'var(--cp-space-3)' },
};
