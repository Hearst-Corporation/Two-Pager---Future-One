'use client';
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import OperatorBadge from '@/components/hearst/OperatorBadge';
import { OPERATORS, OPERATORS_BY_ID } from '@/lib/hearst-constants';

// Monochrome progression — neutral grays → accent (bordeaux) as deal advances.
// Single accent system : no blue/violet/orange/green workflow colors.
const STAGES = [
  { id: 'prospecting',     label: 'Prospecting',     color: 'var(--cp-text-muted)',   bg: 'var(--cp-surface-1)' },
  { id: 'term_sheet_sent', label: 'Term Sheet Sent', color: 'var(--cp-text-body)',    bg: 'var(--cp-surface-2)' },
  { id: 'due_diligence',   label: 'Due Diligence',   color: 'var(--cp-text-body)',    bg: 'var(--cp-surface-2)' },
  { id: 'negotiation',     label: 'Negotiation',     color: 'var(--cp-text-primary)', bg: 'var(--cp-surface-3)' },
  { id: 'signed',          label: 'Signed',          color: 'var(--cp-accent)',       bg: 'var(--cp-accent-soft)' },
  { id: 'live',            label: 'Live',            color: 'var(--cp-accent-strong)',bg: 'var(--cp-accent-soft)' },
];

const DEAL_TYPES = [
  { id: 'powered_shell',     label: 'Powered Shell NNN' },
  { id: 'wholesale_lease',   label: 'Wholesale Lease' },
  { id: 'hyperscale_anchor', label: 'Hyperscale Anchor' },
  { id: 'jv',                label: 'JV' },
  { id: 'sale_leaseback',    label: 'Sale-Leaseback' },
  { id: 'manage_only',       label: 'Manage-Only' },
];

function KpiCard({ label, value, unit, accent = false }) {
  return (
    <div style={S.kpiCard}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiValueRow}>
        <span style={{ ...S.kpiValue, color: accent ? 'var(--cp-accent)' : 'var(--cp-text-primary)' }}>{value}</span>
        {unit && <span style={S.kpiUnit}>{unit}</span>}
      </div>
    </div>
  );
}

function DealCard({ deal, onDelete }) {
  const [dragging, setDragging] = useState(false);

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
      style={{ ...S.card, opacity: dragging ? 0.45 : 1 }}
    >
      <div style={S.cardHeader}>
        <OperatorBadge operatorId={deal.operator_id} size="md" showName={true} />
        <button onClick={() => onDelete(deal.id)} style={S.delBtn} title="Delete deal" aria-label="Delete deal">✕</button>
      </div>

      <div style={S.dealType}>{dealTypeLabel}</div>

      <div style={S.metricsGrid}>
        <div style={S.metric}>
          <div style={S.metricLabel}>Capacity</div>
          <div style={S.metricValue}>{deal.capacity_mw != null ? deal.capacity_mw + ' MW' : '—'}</div>
        </div>
        <div style={S.metric}>
          <div style={S.metricLabel}>Price</div>
          <div style={S.metricValue}>{deal.price_kw_month != null ? '$' + deal.price_kw_month : '—'}</div>
        </div>
        <div style={S.metric}>
          <div style={S.metricLabel}>Term</div>
          <div style={S.metricValue}>{deal.contract_term_years != null ? deal.contract_term_years + ' yr' : '—'}</div>
        </div>
      </div>

      {deal.expected_close_date && (
        <div style={S.closeDate}>
          <span style={S.closeDateLabel}>Close</span>
          <span style={S.closeDateValue}>{deal.expected_close_date}</span>
        </div>
      )}

      <div style={S.actions}>
        <a href="/admin/hearst/documents" style={S.actionBtn} title="Generate Term Sheet">Term Sheet</a>
        <a href="/admin/hearst/financial"  style={S.actionBtn} title="View Financial Model">Model</a>
        <a href="/admin/hearst/data-room"  style={S.actionBtn} title="Open Data Room">Data Room</a>
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
    if (deal_id && current_status !== stage.id) onMove(deal_id, stage.id);
  }

  return (
    <div
      style={{
        ...S.column,
        borderColor: over ? stage.color : 'var(--cp-border)',
        background:  over ? stage.bg    : 'var(--cp-surface-2)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <div style={S.columnHeader}>
        <span style={{ ...S.columnLabel, color: stage.color }}>
          <span style={{ ...S.columnDot, background: stage.color }} />
          {stage.label}
        </span>
        <span style={{ ...S.columnCount, background: stage.bg, color: stage.color }}>{deals.length}</span>
      </div>
      <div style={S.columnBody}>
        {deals.map(d => (
          <DealCard key={d.id} deal={d} onDelete={onDelete} />
        ))}
        {deals.length === 0 && <div style={S.emptyCol}>Drop deals here</div>}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div style={S.drawerScrim} onClick={onClose} />
      <aside style={S.drawer} role="dialog" aria-modal="true">{children}</aside>
    </>
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

  const [search, setSearch] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const pRes = await adminFetch('/api/admin/hearst/project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const [dRes, sRes] = await Promise.all([
          adminFetch(`/api/admin/hearst/deals?project_id=${proj.id}`),
          adminFetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`),
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
      await adminFetch(`/api/admin/hearst/deals/${deal_id}`, {
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
    try { await adminFetch(`/api/admin/hearst/deals/${deal_id}`, { method: 'DELETE' }); } catch {}
  }

  async function createDeal() {
    if (!project) return;
    setSaving(true);
    try {
      const op = OPERATORS_BY_ID[form.operator_id];
      const res = await adminFetch('/api/admin/hearst/deals', {
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

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      if (filterOperator && d.operator_id !== filterOperator) return false;
      if (filterType && d.deal_type !== filterType) return false;
      if (q) {
        const op = OPERATORS_BY_ID[d.operator_id]?.name?.toLowerCase() || '';
        const type = (DEAL_TYPES.find(t => t.id === d.deal_type)?.label || '').toLowerCase();
        if (!op.includes(q) && !type.includes(q) && !(d.notes || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [deals, search, filterOperator, filterType]);

  if (loading) return <div style={S.loading}>Loading deals…</div>;

  const signed     = deals.filter(d => d.status === 'signed' || d.status === 'live');
  const signedMW   = signed.reduce((s, d) => s + (d.capacity_mw || 0), 0);
  const pipelineMW = deals.reduce((s, d) => s + (d.capacity_mw || 0), 0);
  const priced     = deals.filter(d => d.price_kw_month != null);
  const avgPrice   = priced.length ? Math.round(priced.reduce((s, d) => s + d.price_kw_month, 0) / priced.length) : null;

  return (
    <div style={S.wrap}>
      {/* ZONE 1 — Header */}
      <header style={S.header}>
        <div>
          <h1 style={S.title}>Deal Flow</h1>
          <p style={S.subtitle}>Pipeline of leasing &amp; partnership opportunities across operators</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={S.primaryBtn} className="cp-btn-hover">
          + New Deal
        </button>
      </header>

      {error && <div style={S.errBanner}>{error}</div>}

      {/* ZONE 2 — KPI Strip */}
      <section style={S.kpiStrip} aria-label="Pipeline summary">
        <KpiCard label="Pipeline"     value={pipelineMW.toFixed(0)} unit="MW" />
        <KpiCard label="Signed"       value={signedMW.toFixed(0)}   unit="MW" accent />
        <KpiCard label="Active Deals" value={deals.length} />
        <KpiCard label="Avg Price"    value={avgPrice != null ? '$' + avgPrice : '—'} unit={avgPrice != null ? '/kW/mo' : ''} />
      </section>

      {/* ZONE 3 — Toolbar */}
      <div style={S.toolbar}>
        <div style={S.toolbarLeft}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search operator, type, notes…"
            style={S.search}
          />
          <select value={filterOperator} onChange={e => setFilterOperator(e.target.value)} style={S.filter}>
            <option value="">All operators</option>
            {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={S.filter}>
            <option value="">All deal types</option>
            {DEAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {(search || filterOperator || filterType) && (
            <button
              onClick={() => { setSearch(''); setFilterOperator(''); setFilterType(''); }}
              style={S.clearBtn}
            >
              Clear
            </button>
          )}
        </div>
        <div style={S.toolbarRight}>
          {filteredDeals.length !== deals.length && (
            <span style={S.toolbarMeta}>{filteredDeals.length} / {deals.length} deals</span>
          )}
        </div>
      </div>

      {/* ZONE 4 — Kanban board */}
      <div style={S.board}>
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={filteredDeals.filter(d => d.status === stage.id)}
            onMove={moveDeal}
            onDelete={deleteDeal}
          />
        ))}
      </div>

      {/* Drawer — Add form */}
      <Drawer open={showAdd} onClose={() => setShowAdd(false)}>
        <div style={S.drawerHeader}>
          <div>
            <div style={S.drawerEyebrow}>New entry</div>
            <div style={S.drawerTitle}>Create Deal</div>
          </div>
          <button onClick={() => setShowAdd(false)} style={S.drawerClose} aria-label="Close">✕</button>
        </div>

        <div style={S.drawerBody}>
          <div style={S.formGrid}>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Operator</label>
              <select
                value={form.operator_id}
                onChange={e => setForm(p => ({ ...p, operator_id: e.target.value, operator_name: OPERATORS_BY_ID[e.target.value]?.name || e.target.value }))}
                style={S.input}
              >
                {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Deal Type</label>
              <select value={form.deal_type} onChange={e => setForm(p => ({ ...p, deal_type: e.target.value }))} style={S.input}>
                {DEAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Stage</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={S.input}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Linked Scenario</label>
              <select value={form.linked_scenario_id || ''} onChange={e => setForm(p => ({ ...p, linked_scenario_id: e.target.value || null }))} style={S.input}>
                <option value="">— None —</option>
                {scenarios.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
            </div>

            <div style={S.formField}>
              <label style={S.fieldLabel}>Capacity (MW)</label>
              <input type="number" value={form.capacity_mw || ''} onChange={e => setForm(p => ({ ...p, capacity_mw: e.target.value }))} style={S.input} placeholder="e.g. 50" />
            </div>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Price ($/kW/mo)</label>
              <input type="number" value={form.price_kw_month || ''} onChange={e => setForm(p => ({ ...p, price_kw_month: e.target.value }))} style={S.input} placeholder="e.g. 110" />
            </div>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Term (years)</label>
              <input type="number" value={form.contract_term_years || ''} onChange={e => setForm(p => ({ ...p, contract_term_years: e.target.value }))} style={S.input} placeholder="e.g. 15" />
            </div>
            <div style={S.formField}>
              <label style={S.fieldLabel}>Expected Close</label>
              <input type="date" value={form.expected_close_date || ''} onChange={e => setForm(p => ({ ...p, expected_close_date: e.target.value }))} style={S.input} />
            </div>

            <div style={{ ...S.formField, gridColumn: '1 / -1' }}>
              <label style={S.fieldLabel}>Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, minHeight: 80, padding: 12, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        <div style={S.drawerFooter}>
          <button onClick={() => setShowAdd(false)} style={S.secondaryBtn}>Cancel</button>
          <button onClick={createDeal} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }} className="cp-btn-hover">
            {saving ? 'Creating…' : 'Create Deal'}
          </button>
        </div>
      </Drawer>
    </div>
  );
}

/* ============================================================
   Design tokens applied — spacing 4/8, radius 4/6/8/12/999,
   font-size ≥ 11px, single accent system via --cp-* tokens
   ============================================================ */
const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 13 },

  // ── ZONE 1 — Header ─────────────────────────────────────
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 24,
  },
  title:    { fontSize: 20, lineHeight: '28px', fontWeight: 800, color: 'var(--cp-text-primary)', margin: 0 },
  subtitle: { fontSize: 13, lineHeight: '20px', fontWeight: 500, color: 'var(--cp-text-muted)',  margin: '4px 0 0 0' },

  primaryBtn: {
    height: 36, padding: '0 16px', fontSize: 13, fontWeight: 700,
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)',
    border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600,
    background: 'transparent', color: 'var(--cp-text-body)',
    border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer',
    fontFamily: 'inherit',
  },

  errBanner: {
    background: 'var(--cp-error-bg)', border: '1px solid var(--cp-error)',
    borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--cp-error)',
  },

  // ── ZONE 2 — KPI Strip ──────────────────────────────────
  kpiStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
  },
  kpiCard: {
    background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)',
    borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8,
    minHeight: 80,
  },
  kpiLabel: {
    fontSize: 11, lineHeight: '14px', fontWeight: 700, letterSpacing: 0.6,
    color: 'var(--cp-text-muted)', textTransform: 'uppercase',
  },
  kpiValueRow: { display: 'flex', alignItems: 'baseline', gap: 6 },
  kpiValue:    { fontSize: 24, lineHeight: '28px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
  kpiUnit:     { fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--cp-text-muted)' },

  // ── ZONE 3 — Toolbar ────────────────────────────────────
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, height: 44,
  },
  toolbarLeft:  { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  toolbarMeta:  { fontSize: 12, color: 'var(--cp-text-muted)', fontWeight: 600 },

  search: {
    flex: '0 1 280px', height: 36, padding: '0 12px',
    fontSize: 13, color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    borderRadius: 6, fontFamily: 'inherit', boxSizing: 'border-box',
  },
  filter: {
    height: 36, padding: '0 12px', fontSize: 13,
    color: 'var(--cp-text-primary)', background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)', borderRadius: 6,
    fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box',
  },
  clearBtn: {
    height: 36, padding: '0 12px', fontSize: 12, fontWeight: 600,
    background: 'transparent', color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // ── ZONE 4 — Kanban board ───────────────────────────────
  board: {
    display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16,
    alignItems: 'flex-start',
    // Each column body scrolls independently, the board scrolls horizontally
    minHeight: 'calc(100vh - 320px)',
  },
  column: {
    flex: '0 0 280px',
    border: '1px solid',
    borderRadius: 10,
    transition: 'background .15s, border-color .15s',
    display: 'flex', flexDirection: 'column',
    maxHeight: 'calc(100vh - 320px)',
    overflow: 'hidden',
  },
  columnHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 44, padding: '0 12px',
    borderBottom: '1px solid var(--cp-border)',
    background: 'inherit',
    flexShrink: 0,
  },
  columnLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
  },
  columnDot: {
    width: 8, height: 8, borderRadius: 999, display: 'inline-block',
  },
  columnCount: {
    fontSize: 11, fontWeight: 700, padding: '2px 8px',
    borderRadius: 999, minWidth: 24, textAlign: 'center',
  },
  columnBody: {
    padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
    overflowY: 'auto', flex: 1, minHeight: 200,
  },
  emptyCol: {
    textAlign: 'center', padding: '32px 12px',
    color: 'var(--cp-text-muted)', fontSize: 12,
    borderRadius: 6, border: '1px dashed var(--cp-border)',
  },

  // ── Deal Card ───────────────────────────────────────────
  card: {
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    borderRadius: 10, padding: 12, cursor: 'grab',
    display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'border-color .15s, box-shadow .15s, transform .12s',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  delBtn: {
    width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none',
    color: 'var(--cp-text-muted)', fontSize: 12, cursor: 'pointer', borderRadius: 4,
    flexShrink: 0,
  },
  dealType: {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
    color: 'var(--cp-text-muted)', textTransform: 'uppercase',
  },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  metric: {
    background: 'var(--cp-surface-2)', borderRadius: 6, padding: 8,
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  metricLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    color: 'var(--cp-text-muted)', textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13, lineHeight: '16px', fontWeight: 800,
    color: 'var(--cp-text-primary)', fontVariantNumeric: 'tabular-nums',
  },
  closeDate: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    paddingTop: 4, borderTop: '1px solid var(--cp-border)',
  },
  closeDateLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    color: 'var(--cp-text-muted)', textTransform: 'uppercase',
  },
  closeDateValue: {
    fontSize: 12, fontWeight: 600, color: 'var(--cp-text-body)',
    fontVariantNumeric: 'tabular-nums',
  },
  actions: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
  },
  actionBtn: {
    fontSize: 11, fontWeight: 600, textAlign: 'center',
    padding: '6px 4px', background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-body)', borderRadius: 4,
    textDecoration: 'none', border: '1px solid var(--cp-border)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },

  // ── Drawer ──────────────────────────────────────────────
  drawerScrim: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 998, backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
    background: 'var(--cp-surface-1)', borderLeft: '1px solid var(--cp-border)',
    boxShadow: 'var(--cp-shadow-md)',
    zIndex: 999, display: 'flex', flexDirection: 'column',
  },
  drawerHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid var(--cp-border)', gap: 16,
  },
  drawerEyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
    color: 'var(--cp-text-muted)', marginBottom: 4,
  },
  drawerTitle: { fontSize: 18, fontWeight: 800, color: 'var(--cp-text-primary)' },
  drawerClose: {
    width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: '1px solid var(--cp-border)', borderRadius: 6,
    color: 'var(--cp-text-muted)', fontSize: 14, cursor: 'pointer', flexShrink: 0,
  },
  drawerBody: { flex: 1, overflowY: 'auto', padding: 24 },
  drawerFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '16px 24px', borderTop: '1px solid var(--cp-border)',
    background: 'var(--cp-surface-2)',
  },

  // ── Form ────────────────────────────────────────────────
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  formField: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },
  input: {
    width: '100%', height: 36, padding: '0 12px', fontSize: 13,
    color: 'var(--cp-text-primary)', background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)', borderRadius: 6,
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
};
