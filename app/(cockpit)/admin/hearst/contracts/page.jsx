'use client';
import { useState, useEffect } from 'react';
import KpiCard from '@/components/hearst/KpiCard';
import SectionTabs from '@/components/hearst/SectionTabs';

// Monochrome workflow — only true negatives (expired/terminated) keep --cp-error.
const CONTRACT_STATUSES = {
  draft:      { label: 'Draft',      color: 'var(--cp-text-muted)',   bg: 'var(--cp-surface-1)' },
  negotiation:{ label: 'Negotiation',color: 'var(--cp-text-body)',    bg: 'var(--cp-surface-2)' },
  executed:   { label: 'Executed',   color: 'var(--cp-accent)',       bg: 'var(--cp-accent-soft)' },
  expired:    { label: 'Expired',    color: 'var(--cp-error)',        bg: 'var(--cp-error-bg)' },
  terminated: { label: 'Terminated', color: 'var(--cp-error)',        bg: 'var(--cp-error-bg)' },
};

function fmtVal(v) {
  if (v == null) return '—';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v;
}

export default function ContractsPage() {
  const [project, setProject] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ status: 'draft', contract_type: 'loi' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const cRes = await fetch(`/api/admin/hearst/contracts?project_id=${proj.id}`);
        const { contracts: ct } = await cRes.json();
        setContracts(ct || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function add() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hearst/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id }),
      });
      const { contract } = await res.json();
      setContracts(prev => [contract, ...prev]);
      setForm({ status: 'draft', contract_type: 'loi' });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    const previous = contracts;
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c)); // optimistic
    try {
      const res = await fetch(`/api/admin/hearst/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const { contract } = await res.json();
      setContracts(prev => prev.map(c => c.id === id ? contract : c));
    } catch (e) {
      setContracts(previous); // revert
      setError(`Status update failed: ${e.message}`);
      setTimeout(() => setError(null), 4000);
    }
  }

  if (loading) return <div style={S.loading}>Loading contracts…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const filtered = contracts.filter(c =>
    !filter || JSON.stringify(c).toLowerCase().includes(filter.toLowerCase())
  );

  const exVal = contracts.filter(c => c.status === 'executed').reduce((sum, c) => sum + (c.contract_value_usd || 0), 0);
  const negVal = contracts.filter(c => c.status === 'negotiation').reduce((sum, c) => sum + (c.contract_value_usd || 0), 0);

  return (
    <div style={S.wrap}>
      <SectionTabs section="hub" />
      <div style={S.topBar}>
        <div style={S.pageTitle}>Contract Library</div>
        <button onClick={() => setShowAdd(v => !v)} className="cp-btn-hover" style={S.addBtn}>{showAdd ? '✕' : '+ Add Contract'}</button>
      </div>

      {/* Summary */}
      <div style={S.kpiStrip}>
        <KpiCard label="Executed Value"  value={exVal}  format="currency" highlight />
        <KpiCard label="In Negotiation"  value={negVal} format="currency" />
        <KpiCard label="Total Contracts" value={contracts.length} format="number" />
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={S.addForm}>
          <div style={S.addTitle}>ADD CONTRACT</div>
          <div style={S.addGrid}>
            <div><label style={S.lbl}>Title *</label><input value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Counterparty</label><input value={form.counterparty || ''} onChange={e => setForm(p => ({ ...p, counterparty: e.target.value }))} style={S.inp} /></div>
            <div>
              <label style={S.lbl}>Type</label>
              <select value={form.contract_type} onChange={e => setForm(p => ({ ...p, contract_type: e.target.value }))} style={S.inp}>
                {['loi','mou','term_sheet','ppa','lease','services','jv','epc','o_and_m','other'].map(t => <option key={t} value={t}>{t.toUpperCase().replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={S.inp}>
                {Object.keys(CONTRACT_STATUSES).map(s => <option key={s} value={s}>{CONTRACT_STATUSES[s].label}</option>)}
              </select>
            </div>
            <div><label style={S.lbl}>Value (USD)</label><input type="number" value={form.contract_value_usd || ''} onChange={e => setForm(p => ({ ...p, contract_value_usd: parseFloat(e.target.value) || null }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Signed Date</label><input type="date" value={form.signed_date || ''} onChange={e => setForm(p => ({ ...p, signed_date: e.target.value }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Expiry Date</label><input type="date" value={form.expiry_date || ''} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Notes</label><input value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={S.inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
            <button
              onClick={add}
              disabled={saving || !form.title}
              className="cp-btn-hover"
              style={{
                ...S.saveBtn,
                ...((saving || !form.title) ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
            >
              {saving ? 'Saving…' : 'Add Contract'}
            </button>
          </div>
        </div>
      )}

      <input placeholder="Search contracts…" value={filter} onChange={e => setFilter(e.target.value)} style={S.search} />

      {/* Contracts table */}
      {filtered.length === 0 ? (
        <div style={S.empty}>No contracts yet. Add your first contract above.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Title</th>
              <th style={S.th}>Type</th>
              <th style={S.th}>Counterparty</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Value</th>
              <th style={S.th}>Signed</th>
              <th style={S.th}>Expiry</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const sm = CONTRACT_STATUSES[c.status] || CONTRACT_STATUSES.draft;
              return (
                <tr key={c.id} style={S.tr}>
                  <td style={S.tdBold}>{c.title}</td>
                  <td style={S.td}>{c.contract_type?.toUpperCase() || '—'}</td>
                  <td style={S.td}>{c.counterparty || '—'}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sm.bg, color: sm.color }}>
                      {sm.label}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{fmtVal(c.contract_value_usd)}</td>
                  <td style={S.td}>{c.signed_date || '—'}</td>
                  <td style={S.td}>{c.expiry_date || '—'}</td>
                  <td style={S.td}>
                    <select
                      value={c.status}
                      onChange={e => updateStatus(c.id, e.target.value)}
                      style={{ fontSize: 10, padding: '4px 6px', border: '1px solid var(--cp-border)', borderRadius: 4, background: 'transparent', cursor: 'pointer' }}
                    >
                      {Object.keys(CONTRACT_STATUSES).map(s => <option key={s} value={s}>{CONTRACT_STATUSES[s].label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 20, lineHeight: '28px', fontWeight: 800, color: 'var(--cp-text-primary)' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '8px 16px', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  addForm: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 },
  addTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 12 },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px 14px' },
  lbl: { display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', marginBottom: 3 },
  inp: { width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box' },
  saveBtn: { fontSize: 12, fontWeight: 700, padding: '8px 16px', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  cancelBtn: { fontSize: 12, padding: '8px 12px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer' },
  search: { width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 6, background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', marginBottom: 14, boxSizing: 'border-box' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--cp-text-muted)', fontSize: 13, background: 'var(--cp-surface-2)', borderRadius: 10 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)', borderRadius: 10, overflow: 'hidden' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: '8px 12px', color: 'var(--cp-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: '8px 12px', fontWeight: 700, color: 'var(--cp-text-primary)', verticalAlign: 'middle', maxWidth: 200 },
};
