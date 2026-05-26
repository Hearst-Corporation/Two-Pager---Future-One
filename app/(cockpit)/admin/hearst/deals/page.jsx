'use client';
import { useState, useEffect, useCallback } from 'react';
import OperatorBadge from '@/components/hearst/OperatorBadge';
import { OPERATORS, OPERATORS_BY_ID } from '@/lib/hearst-constants';

const STAGES = [
  { id: 'prospecting',     label: 'Prospecting',      color: 'var(--cp-text-muted)', bg: 'var(--cp-surface-1)' },
  { id: 'term_sheet_sent', label: 'Term Sheet Sent',   color: 'var(--cp-info)', bg: 'var(--cp-info-bg)' },
  { id: 'due_diligence',   label: 'Due Diligence',     color: 'var(--cp-violet)', bg: 'var(--cp-violet-bg)' },
  { id: 'negotiation',     label: 'Negotiation',       color: 'var(--cp-warning)', bg: 'var(--cp-warning-bg)' },
  { id: 'signed',          label: 'Signed',            color: 'var(--cp-success)', bg: 'var(--cp-success-bg)' },
  { id: 'live',            label: 'Live',              color: 'var(--cp-accent)', bg: 'var(--cp-accent-soft)' },
];

const DEAL_TYPES = [
  { id: 'powered_shell',     label: 'Powered Shell NNN' },
  { id: 'wholesale_lease',   label: 'Wholesale Lease' },
  { id: 'hyperscale_anchor', label: 'Hyperscale Anchor' },
  { id: 'jv',                label: 'JV' },
  { id: 'sale_leaseback',    label: 'Sale-Leaseback' },
  { id: 'manage_only',       label: 'Manage-Only' },
];

function DealCard({ deal, onMove, onDelete }) {
  const [dragging, setDragging] = useState(false);
  const op = OPERATORS_BY_ID[deal.operator_id];

  function handleDragStart(e) {
    setDragging(true);
    e.dataTransfer.setData('deal_id', deal.id);
    e.dataTransfer.setData('current_status', deal.status);
    e.dataTransfer.effectAllowed = 'move';
  }

  const dealTypeLabel = DEAL_TYPES.find(t => t.id === deal.deal_type)?.label || deal.deal_type;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      style={{ ...S.card, opacity: dragging ? 0.5 : 1 }}
    >
      {/* Header */}
      <div style={S.cardHeader}>
        <OperatorBadge operatorId={deal.operator_id} size="sm" showName={true} />
        <button onClick={() => onDelete(deal.id)} style={S.delBtn} title="Delete deal">✕</button>
      </div>

      {/* Deal type */}
      <div style={S.dealType}>{dealTypeLabel}</div>

      {/* Metrics */}
      <div style={S.metricsGrid}>
        <div style={S.metric}>
          <div style={S.metricLabel}>Capacity</div>
          <div style={S.metricValue}>{deal.capacity_mw != null ? deal.capacity_mw + ' MW' : '—'}</div>
        </div>
        <div style={S.metric}>
          <div style={S.metricLabel}>Price</div>
          <div style={S.metricValue}>{deal.price_kw_month != null ? '$' + deal.price_kw_month + '/kW' : '—'}</div>
        </div>
        <div style={S.metric}>
          <div style={S.metricLabel}>Term</div>
          <div style={S.metricValue}>{deal.contract_term_years != null ? deal.contract_term_years + ' yr' : '—'}</div>
        </div>
      </div>

      {/* Close date */}
      {deal.expected_close_date && (
        <div style={S.closeDate}>Close: {deal.expected_close_date}</div>
      )}

      {/* Quick actions */}
      <div style={S.actions}>
        <a href="/admin/hearst/documents" style={S.actionBtn} title="Generate Term Sheet">📋 Term Sheet</a>
        <a href="/admin/hearst/financial" style={S.actionBtn} title="View Financial Model">📊 Model</a>
        <a href="/admin/hearst/data-room" style={S.actionBtn} title="Open Data Room">📁 Data Room</a>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, deals, onMove, onDelete }) {
  const [over, setOver] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOver(true);
  }

  function handleDrop(e) {
    e.preventDefault();
    setOver(false);
    const deal_id = e.dataTransfer.getData('deal_id');
    const current_status = e.dataTransfer.getData('current_status');
    if (deal_id && current_status !== stage.id) {
      onMove(deal_id, stage.id);
    }
  }

  return (
    <div
      style={{ ...S.column, borderColor: over ? stage.color : 'var(--cp-border)', background: over ? stage.bg : 'var(--cp-surface-2)' }}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <div style={{ ...S.columnHeader, color: stage.color }}>
        <span style={S.columnLabel}>{stage.label}</span>
        <span style={{ ...S.columnCount, background: stage.bg, color: stage.color }}>{deals.length}</span>
      </div>
      <div style={S.columnBody}>
        {deals.map(d => (
          <DealCard key={d.id} deal={d} onMove={onMove} onDelete={onDelete} />
        ))}
        {deals.length === 0 && (
          <div style={S.emptyCol}>Drop deals here</div>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ deal_type: 'powered_shell', status: 'prospecting', operator_id: 'equinix', operator_name: 'Equinix' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const [dRes, sRes] = await Promise.all([
          fetch(`/api/admin/hearst/deals?project_id=${proj.id}`),
          fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`),
        ]);
        const { deals: d } = await dRes.json();
        const { scenarios: sc } = await sRes.json();
        setDeals(d || []);
        setScenarios(sc || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function moveDeal(deal_id, new_status) {
    setDeals(prev => prev.map(d => d.id === deal_id ? { ...d, status: new_status } : d));
    try {
      await fetch(`/api/admin/hearst/deals/${deal_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: new_status }),
      });
    } catch (e) {
      setDeals(prev => prev.map(d => d.id === deal_id ? { ...d, status: d.status } : d));
    }
  }

  async function deleteDeal(deal_id) {
    setDeals(prev => prev.filter(d => d.id !== deal_id));
    try {
      await fetch(`/api/admin/hearst/deals/${deal_id}`, { method: 'DELETE' });
    } catch {}
  }

  async function createDeal() {
    if (!project) return;
    setSaving(true);
    try {
      const op = OPERATORS_BY_ID[form.operator_id];
      const res = await fetch('/api/admin/hearst/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          operator_name: op?.name || form.operator_id,
          project_id: project.id,
          capacity_mw: form.capacity_mw ? +form.capacity_mw : null,
          price_kw_month: form.price_kw_month ? +form.price_kw_month : null,
          contract_term_years: form.contract_term_years ? +form.contract_term_years : null,
        }),
      });
      const { deal } = await res.json();
      if (deal) setDeals(prev => [deal, ...prev]);
      setForm({ deal_type: 'powered_shell', status: 'prospecting', operator_id: 'equinix', operator_name: 'Equinix' });
      setShowAdd(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={S.loading}>Loading deals…</div>;

  // Summary stats
  const signed = deals.filter(d => d.status === 'signed' || d.status === 'live');
  const signedMW = signed.reduce((s, d) => s + (d.capacity_mw || 0), 0);
  const pipelineMW = deals.reduce((s, d) => s + (d.capacity_mw || 0), 0);

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.topBar}>
        <div>
          <div style={S.pageTitle}>Deal Flow</div>
          <div style={S.pageSubtitle}>{deals.length} deals · {signedMW.toFixed(0)} MW signed · {pipelineMW.toFixed(0)} MW total pipeline</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={S.addBtn} className="cp-btn-hover">
          {showAdd ? '✕ Cancel' : '+ New Deal'}
        </button>
      </div>

      {error && <div style={S.errBanner}>{error}</div>}

      {/* Add form */}
      {showAdd && (
        <div style={S.addForm}>
          <div style={S.addTitle}>NEW DEAL</div>
          <div style={S.addGrid}>
            <div>
              <label style={S.fieldLabel}>Operator</label>
              <select
                value={form.operator_id}
                onChange={e => setForm(p => ({ ...p, operator_id: e.target.value, operator_name: OPERATORS_BY_ID[e.target.value]?.name || e.target.value }))}
                style={S.input}
              >
                {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.fieldLabel}>Deal Type</label>
              <select value={form.deal_type} onChange={e => setForm(p => ({ ...p, deal_type: e.target.value }))} style={S.input}>
                {DEAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.fieldLabel}>Stage</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={S.input}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.fieldLabel}>Capacity (MW)</label>
              <input type="number" value={form.capacity_mw || ''} onChange={e => setForm(p => ({ ...p, capacity_mw: e.target.value }))} style={S.input} placeholder="e.g. 50" />
            </div>
            <div>
              <label style={S.fieldLabel}>Price ($/kW/mo)</label>
              <input type="number" value={form.price_kw_month || ''} onChange={e => setForm(p => ({ ...p, price_kw_month: e.target.value }))} style={S.input} placeholder="e.g. 110" />
            </div>
            <div>
              <label style={S.fieldLabel}>Term (years)</label>
              <input type="number" value={form.contract_term_years || ''} onChange={e => setForm(p => ({ ...p, contract_term_years: e.target.value }))} style={S.input} placeholder="e.g. 15" />
            </div>
            <div>
              <label style={S.fieldLabel}>Expected Close</label>
              <input type="date" value={form.expected_close_date || ''} onChange={e => setForm(p => ({ ...p, expected_close_date: e.target.value }))} style={S.input} />
            </div>
            <div>
              <label style={S.fieldLabel}>Linked Scenario</label>
              <select value={form.linked_scenario_id || ''} onChange={e => setForm(p => ({ ...p, linked_scenario_id: e.target.value || null }))} style={S.input}>
                <option value="">— None —</option>
                {scenarios.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.fieldLabel}>Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, minHeight: 56 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
            <button onClick={createDeal} disabled={saving} style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create Deal'}
            </button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div style={S.board}>
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter(d => d.status === stage.id)}
            onMove={moveDeal}
            onDelete={deleteDeal}
          />
        ))}
      </div>
    </div>
  );
}

const S = {
  wrap: {},
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  topBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)', marginBottom: 2 },
  pageSubtitle: { fontSize: 11, color: 'var(--cp-text-muted)' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '7px 14px', background: 'var(--cp-info-strong-cta)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  errBanner: { background: 'var(--cp-error-bg)', border: '1px solid var(--cp-error)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: 'var(--cp-error)', marginBottom: 16 },

  addForm: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 },
  addTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 14 },
  addGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 16px' },
  fieldLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--cp-text-muted)', marginBottom: 3 },
  input: { width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box', fontFamily: 'inherit' },
  saveBtn: { fontSize: 12, fontWeight: 700, padding: '7px 18px', background: 'var(--cp-info-strong-cta)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  cancelBtn: { fontSize: 12, padding: '7px 14px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer' },

  board: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' },
  column: { flex: '0 0 240px', border: '1px solid', borderRadius: 8, transition: 'background .15s, border-color .15s', minHeight: 400 },
  columnHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--cp-border)' },
  columnLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
  columnCount: { fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10 },
  columnBody: { padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 340 },
  emptyCol: { textAlign: 'center', padding: '24px 12px', color: 'var(--cp-text-muted)', fontSize: 11, borderRadius: 5, border: '1px dashed var(--cp-border)' },

  card: {
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)', borderRadius: 7,
    padding: '12px 12px', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 8,
  },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  delBtn: { background: 'transparent', border: 'none', color: 'var(--cp-text-muted)', fontSize: 11, cursor: 'pointer', padding: '2px 4px', borderRadius: 3 },
  dealType: { fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 },
  metric: { background: 'var(--cp-surface-2)', borderRadius: 4, padding: '5px 7px' },
  metricLabel: { fontSize: 8, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metricValue: { fontSize: 11, fontWeight: 800, color: 'var(--cp-text-primary)' },
  closeDate: { fontSize: 10, color: 'var(--cp-text-muted)' },
  actions: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  actionBtn: { fontSize: 9, fontWeight: 600, padding: '3px 7px', background: 'var(--cp-surface-3)', color: 'var(--cp-text-muted)', borderRadius: 3, textDecoration: 'none', border: '1px solid var(--cp-border)' },
};
