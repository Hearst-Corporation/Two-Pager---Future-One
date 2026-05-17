'use client';
import { useState, useEffect } from 'react';

const STAGES = ['prospecting', 'qualified', 'proposal', 'negotiation', 'committed', 'lost'];
const STAGE_META = {
  prospecting: { label: 'Prospecting', color: 'var(--cp-text-muted)' },
  qualified:   { label: 'Qualified',   color: 'var(--cp-info)' },
  proposal:    { label: 'Proposal',    color: 'var(--cp-warning)' },
  negotiation: { label: 'Negotiation', color: 'var(--cp-violet)' },
  committed:   { label: 'Committed',   color: 'var(--cp-success)' },
  lost:        { label: 'Lost',        color: 'var(--cp-error)' },
};

function fmtMw(v) { if (!v) return '—'; return v + ' MW'; }
function fmtM(v) { if (!v) return '—'; return '$' + (v / 1e6).toFixed(1) + 'M'; }
function fmtPct(v) { if (v == null) return '—'; return v + '%'; }

export default function PipelinePage() {
  const [project, setProject] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageFilter, setStageFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ stage: 'prospecting', probability_pct: 50 });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  function startEdit(p) {
    setEditing(p.id);
    setEditDraft({
      prospect_name: p.prospect_name || '',
      prospect_type: p.prospect_type || '',
      mw_requested: p.mw_requested ?? '',
      target_price_kw_month: p.target_price_kw_month ?? '',
      probability_pct: p.probability_pct ?? '',
      contract_length_years: p.contract_length_years ?? '',
      expected_signing_date: p.expected_signing_date || '',
      notes: p.notes || '',
    });
  }

  async function saveEdit(id) {
    const payload = {
      prospect_name: editDraft.prospect_name || null,
      prospect_type: editDraft.prospect_type || null,
      mw_requested: editDraft.mw_requested === '' ? null : parseFloat(editDraft.mw_requested),
      target_price_kw_month: editDraft.target_price_kw_month === '' ? null : parseFloat(editDraft.target_price_kw_month),
      probability_pct: editDraft.probability_pct === '' ? null : parseInt(editDraft.probability_pct, 10),
      contract_length_years: editDraft.contract_length_years === '' ? null : parseInt(editDraft.contract_length_years, 10),
      expected_signing_date: editDraft.expected_signing_date || null,
      notes: editDraft.notes || null,
    };
    await updateProspect(id, payload);
  }

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const prRes = await fetch(`/api/admin/hearst/pipeline?project_id=${proj.id}`);
        const { prospects: pr } = await prRes.json();
        setProspects(pr || []);
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
      const res = await fetch('/api/admin/hearst/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id }),
      });
      const { prospect } = await res.json();
      setProspects(prev => [...prev, prospect].sort((a, b) => (b.probability_pct || 0) - (a.probability_pct || 0)));
      setForm({ stage: 'prospecting', probability_pct: 50 });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateProspect(id, data) {
    const previous = prospects;
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)); // optimistic
    try {
      const res = await fetch(`/api/admin/hearst/pipeline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const { prospect } = await res.json();
      setProspects(prev => prev.map(p => p.id === id ? prospect : p));
      setEditing(null);
    } catch (e) {
      setProspects(previous); // revert
      setError(`Update failed: ${e.message}`);
      setTimeout(() => setError(null), 4000);
    }
  }

  async function deleteProspect(id) {
    const previous = prospects;
    setProspects(prev => prev.filter(p => p.id !== id)); // optimistic
    setConfirmingDelete(null);
    try {
      const res = await fetch(`/api/admin/hearst/pipeline/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    } catch (e) {
      setProspects(previous); // revert
      setError(`Delete failed: ${e.message}`);
      setTimeout(() => setError(null), 4000);
    }
  }

  if (loading) return <div style={S.loading}>Loading pipeline…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const filtered = prospects.filter(p => !stageFilter || p.stage === stageFilter);

  // Weighted pipeline metrics
  const committed = prospects.filter(p => p.stage === 'committed');
  const committedMw = committed.reduce((s, p) => s + (p.capacity_mw || 0), 0);
  const weightedMw = prospects.filter(p => p.stage !== 'lost').reduce((s, p) => {
    return s + (p.capacity_mw || 0) * ((p.probability_pct || 0) / 100);
  }, 0);

  // Stage counts
  const stageCounts = STAGES.reduce((acc, st) => {
    acc[st] = prospects.filter(p => p.stage === st).length;
    return acc;
  }, {});

  return (
    <div style={S.wrap}>
      <div style={S.topBar}>
        <div style={S.pageTitle}>Commercial Pipeline</div>
        <button onClick={() => setShowAdd(v => !v)} className="cp-btn-hover" style={S.addBtn}>{showAdd ? '✕' : '+ Add Prospect'}</button>
      </div>

      {/* Summary */}
      <div style={S.summaryRow}>
        <div style={S.sumCard}>
          <div style={S.sumLabel}>COMMITTED CAPACITY</div>
          <div style={{ ...S.sumVal, color: 'var(--cp-success)' }}>{committedMw.toFixed(0)} MW</div>
        </div>
        <div style={S.sumCard}>
          <div style={S.sumLabel}>WEIGHTED PIPELINE</div>
          <div style={{ ...S.sumVal, color: 'var(--cp-info)' }}>{weightedMw.toFixed(1)} MW</div>
        </div>
        <div style={S.sumCard}>
          <div style={S.sumLabel}>TOTAL PROSPECTS</div>
          <div style={S.sumVal}>{prospects.filter(p => p.stage !== 'lost').length}</div>
        </div>
      </div>

      {/* Kanban stage tabs */}
      <div style={S.stageRow}>
        <button onClick={() => setStageFilter('')} style={{ ...S.stagePill, background: !stageFilter ? 'var(--cp-text-body)' : 'transparent', color: !stageFilter ? 'var(--cp-bg-deep)' : 'var(--cp-text-muted)' }}>
          All ({prospects.length})
        </button>
        {STAGES.map(st => (
          <button
            key={st}
            onClick={() => setStageFilter(st === stageFilter ? '' : st)}
            style={{ ...S.stagePill, borderColor: STAGE_META[st].color, background: stageFilter === st ? STAGE_META[st].color : 'transparent', color: stageFilter === st ? 'var(--cp-bg-deep)' : STAGE_META[st].color }}
          >
            {STAGE_META[st].label} ({stageCounts[st] || 0})
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={S.addForm}>
          <div style={S.addTitle}>ADD PROSPECT</div>
          <div style={S.addGrid}>
            <div><label style={S.lbl}>Company / Prospect *</label><input value={form.company_name || ''} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Contact Name</label><input value={form.contact_name || ''} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} style={S.inp} /></div>
            <div>
              <label style={S.lbl}>Stage</label>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} style={S.inp}>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
              </select>
            </div>
            <div><label style={S.lbl}>Probability (%)</label><input type="number" min="0" max="100" value={form.probability_pct} onChange={e => setForm(p => ({ ...p, probability_pct: parseInt(e.target.value) }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Capacity (MW)</label><input type="number" value={form.capacity_mw || ''} onChange={e => setForm(p => ({ ...p, capacity_mw: parseFloat(e.target.value) || null }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Est. Revenue (USD/yr)</label><input type="number" value={form.estimated_revenue_usd || ''} onChange={e => setForm(p => ({ ...p, estimated_revenue_usd: parseFloat(e.target.value) || null }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Contract Term (yr)</label><input type="number" value={form.contract_term_years || ''} onChange={e => setForm(p => ({ ...p, contract_term_years: parseInt(e.target.value) || null }))} style={S.inp} /></div>
            <div><label style={S.lbl}>Expected Close Date</label><input type="date" value={form.expected_close_date || ''} onChange={e => setForm(p => ({ ...p, expected_close_date: e.target.value }))} style={S.inp} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={S.lbl}>Notes</label><input value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={S.inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
            <button
              onClick={add}
              disabled={saving || !form.company_name}
              className="cp-btn-hover"
              style={{
                ...S.saveBtn,
                ...((saving || !form.company_name) ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
            >
              {saving ? 'Saving…' : 'Add Prospect'}
            </button>
          </div>
        </div>
      )}

      {/* Prospects table */}
      {filtered.length === 0 ? (
        <div style={S.empty}>No prospects yet. Add your first prospect above.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Company</th>
              <th style={S.th}>Stage</th>
              <th style={S.th}>Prob.</th>
              <th style={S.th}>Capacity</th>
              <th style={S.th}>Est. Revenue</th>
              <th style={S.th}>Close Date</th>
              <th style={S.th}>Term</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const sm = STAGE_META[p.stage] || STAGE_META.prospecting;
              if (editing === p.id) {
                return (
                  <tr key={p.id} style={{ ...S.tr, background: 'var(--cp-surface-1)' }}>
                    <td style={S.td}>
                      <input value={editDraft.prospect_name} onChange={e => setEditDraft(d => ({ ...d, prospect_name: e.target.value }))} placeholder="Prospect name" style={S.editInp} />
                      <input value={editDraft.prospect_type} onChange={e => setEditDraft(d => ({ ...d, prospect_type: e.target.value }))} placeholder="Type" style={{ ...S.editInp, marginTop: 4 }} />
                    </td>
                    <td style={S.td}>
                      <select value={p.stage} onChange={e => updateProspect(p.id, { stage: e.target.value })} style={{ ...S.editInp }}>
                        {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                      </select>
                    </td>
                    <td style={S.td}><input type="number" min="0" max="100" value={editDraft.probability_pct} onChange={e => setEditDraft(d => ({ ...d, probability_pct: e.target.value }))} style={S.editInp} /></td>
                    <td style={S.td}><input type="number" value={editDraft.mw_requested} onChange={e => setEditDraft(d => ({ ...d, mw_requested: e.target.value }))} style={S.editInp} /></td>
                    <td style={S.td}><input type="number" value={editDraft.target_price_kw_month} onChange={e => setEditDraft(d => ({ ...d, target_price_kw_month: e.target.value }))} placeholder="$/kW/mo" style={S.editInp} /></td>
                    <td style={S.td}><input type="date" value={editDraft.expected_signing_date} onChange={e => setEditDraft(d => ({ ...d, expected_signing_date: e.target.value }))} style={S.editInp} /></td>
                    <td style={S.td}><input type="number" value={editDraft.contract_length_years} onChange={e => setEditDraft(d => ({ ...d, contract_length_years: e.target.value }))} placeholder="yr" style={S.editInp} /></td>
                    <td style={S.td}>
                      <button onClick={() => saveEdit(p.id)} style={S.saveBtnSm}>Save</button>
                      <button onClick={() => setEditing(null)} style={S.cancelBtnSm}>Cancel</button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={p.id} style={S.tr}>
                  <td style={S.tdBold}>
                    <div>{p.prospect_name || p.company_name || '—'}</div>
                    {p.prospect_type && <div style={{ fontSize: 10, color: 'var(--cp-text-muted)' }}>{p.prospect_type}</div>}
                  </td>
                  <td style={S.td}>
                    <select
                      value={p.stage}
                      onChange={e => updateProspect(p.id, { stage: e.target.value })}
                      style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sm.bg || 'var(--cp-surface-1)', color: sm.color, border: `1px solid ${sm.color}`, cursor: 'pointer' }}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                    </select>
                  </td>
                  <td style={{ ...S.td, fontWeight: 700, color: p.probability_pct >= 70 ? 'var(--cp-success)' : p.probability_pct >= 40 ? 'var(--cp-warning)' : 'var(--cp-error)' }}>
                    {fmtPct(p.probability_pct)}
                  </td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{fmtMw(p.mw_requested ?? p.capacity_mw)}</td>
                  <td style={S.td}>{p.target_price_kw_month ? '$' + p.target_price_kw_month + '/kW' : (fmtM(p.estimated_revenue_usd) || '—')}</td>
                  <td style={S.td}>{p.expected_signing_date || p.expected_close_date || '—'}</td>
                  <td style={S.td}>{(p.contract_length_years || p.contract_term_years) ? (p.contract_length_years || p.contract_term_years) + 'yr' : '—'}</td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <button onClick={() => startEdit(p)} style={S.editIcon} title="Edit prospect">✎</button>
                      {confirmingDelete === p.id ? (
                        <>
                          <button onClick={() => deleteProspect(p.id)} style={S.confirmYes} title="Confirm delete">✓</button>
                          <button onClick={() => setConfirmingDelete(null)} style={S.confirmNo} title="Cancel">✕</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmingDelete(p.id)} style={S.deleteBtn} title="Delete">✕</button>
                      )}
                    </span>
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
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '7px 16px', background: 'var(--cp-info-strong-cta)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  summaryRow: { display: 'flex', gap: 14, marginBottom: 18 },
  sumCard: { flex: 1, background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, padding: '12px 16px' },
  sumLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)', marginBottom: 4 },
  sumVal: { fontSize: 22, fontWeight: 900, color: 'var(--cp-text-primary)' },
  stageRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  stagePill: { fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all .15s' },
  addForm: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, padding: '16px 20px', marginBottom: 16 },
  addTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 12 },
  addGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px 14px' },
  lbl: { display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', marginBottom: 3 },
  inp: { width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box' },
  saveBtn: { fontSize: 12, fontWeight: 700, padding: '7px 16px', background: 'var(--cp-info-strong-cta)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  cancelBtn: { fontSize: 12, padding: '7px 12px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)', borderRadius: 8, overflow: 'hidden' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: '8px 12px', color: 'var(--cp-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: '8px 12px', fontWeight: 700, color: 'var(--cp-text-primary)', verticalAlign: 'middle' },
  deleteBtn: { fontSize: 12, color: 'var(--cp-error)', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 },
  editIcon: { fontSize: 12, color: 'var(--cp-text-body)', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 },
  confirmYes: { fontSize: 11, fontWeight: 700, color: 'var(--cp-text-strong)', background: 'var(--cp-error-strong)', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 4 },
  confirmNo: { fontSize: 10, color: 'var(--cp-text-muted)', background: 'transparent', border: '1px solid var(--cp-border)', cursor: 'pointer', padding: '3px 6px', borderRadius: 4 },
  editInp: { width: '100%', fontSize: 11, padding: '4px 6px', border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box' },
  saveBtnSm: { fontSize: 11, fontWeight: 700, color: 'var(--cp-text-strong)', background: 'var(--cp-success-strong)', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 4, marginRight: 4 },
  cancelBtnSm: { fontSize: 11, color: 'var(--cp-text-muted)', background: 'transparent', border: '1px solid var(--cp-border)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--cp-text-muted)', fontSize: 13, background: 'var(--cp-surface-2)', borderRadius: 8 },
};
