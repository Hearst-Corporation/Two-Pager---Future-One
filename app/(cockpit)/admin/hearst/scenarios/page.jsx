'use client';
import { useState, useEffect } from 'react';
import { MISSING_LABEL } from '@/lib/hearst-constants';
import SectionTabs from '@/components/hearst/SectionTabs';

function fmtVal(v, type) {
  if (v == null) return MISSING_LABEL;
  if (type === 'currency_m') return '$' + (v / 1e6).toFixed(0) + 'M';
  if (type === 'pct') return (v * 100).toFixed(1) + '%';
  if (type === 'x') return v.toFixed(2) + 'x';
  if (type === 'years') return v.toFixed(1) + ' yr';
  if (type === 'mw') return v + ' MW';
  return String(v);
}

const COMPARE_ROWS = [
  { label: 'IT Capacity', key: 'total_mw', src: 'input', type: 'mw' },
  { label: 'PUE', key: 'pue', src: 'input', type: 'x' },
  { label: 'Shell CAPEX / MW', key: 'capex_shell_per_mw', src: 'input', type: null, suffix: '$/MW' },
  { label: 'Electricity Price', key: 'electricity_price_mwh', src: 'input', type: null, suffix: '$/MWh' },
  { label: 'Target Occupancy', key: 'target_occupancy_pct', src: 'input', type: null, suffix: '%' },
  { label: 'Colo Price (Retail)', key: 'price_retail_colo_kw_month', src: 'input', type: null, suffix: '$/kW/mo' },
  { divider: 'FINANCIAL OUTPUTS' },
  { label: 'Total CAPEX', key: 'total_capex', src: 'proj', type: 'currency_m' },
  { label: 'Stabilized Revenue', key: 'stabilized_revenue', src: 'proj', type: 'currency_m' },
  { label: 'Stabilized EBITDA', key: 'stabilized_ebitda', src: 'proj', type: 'currency_m' },
  { label: 'Project IRR', key: 'irr', src: 'proj', type: 'pct', highlight: true },
  { label: 'NPV (10yr)', key: 'npv', src: 'proj', type: 'currency_m' },
  { label: 'MOIC', key: 'moic', src: 'proj', type: 'x' },
  { label: 'DSCR (Stabilized)', key: 'dscr_stabilized', src: 'proj', type: 'x' },
  { label: 'Payback Period', key: 'payback_years', src: 'proj', type: 'years' },
  { label: 'Terminal Value', key: 'terminal_value', src: 'proj', type: 'currency_m' },
  { divider: 'QUALITY METRICS' },
  { label: 'Source Score', key: 'source_score', src: 'direct', type: null, suffix: '/100' },
  { label: 'Missing Inputs', key: 'missing_count', src: 'computed', type: null, suffix: ' fields' },
];

// Scenario palette : neutral base, accent upside, error downside (true risk semantic).
const SC_COLORS = {
  base:     { border: 'var(--cp-border-strong)', bg: 'var(--cp-surface-2)',  label: 'var(--cp-text-primary)' },
  downside: { border: 'var(--cp-error)',         bg: 'var(--cp-error-bg)',   label: 'var(--cp-error)' },
  upside:   { border: 'var(--cp-accent)',        bg: 'var(--cp-accent-soft)',label: 'var(--cp-accent)' },
};

function getColor(sc) {
  const name = sc.name?.toLowerCase() || '';
  if (name.includes('up')) return SC_COLORS.upside;
  if (name.includes('down')) return SC_COLORS.downside;
  return SC_COLORS.base;
}

export default function ScenariosPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [cloneFrom, setCloneFrom] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addScenario() {
    if (!newName) return;
    setSaving(true);
    try {
      const base = cloneFrom ? scenarios.find(s => s.id === cloneFrom) : null;
      const payload = {
        project_id: project.id,
        name: newName,
        scenario_type: 'custom',
        ...(base ? {
          total_mw: base.total_mw,
          pue: base.pue,
          capex_shell_per_mw: base.capex_shell_per_mw,
          capex_mep_per_mw: base.capex_mep_per_mw,
          capex_substation_per_mw: base.capex_substation_per_mw,
          capex_cooling_per_mw: base.capex_cooling_per_mw,
          capex_grid_per_mw: base.capex_grid_per_mw,
          capex_land_per_mw: base.capex_land_per_mw,
          capex_contingency_pct: base.capex_contingency_pct,
          electricity_price_mwh: base.electricity_price_mwh,
          target_occupancy_pct: base.target_occupancy_pct,
          price_retail_colo_kw_month: base.price_retail_colo_kw_month,
          price_wholesale_kw_month: base.price_wholesale_kw_month,
          price_hyperscale_kw_month: base.price_hyperscale_kw_month,
          equity_hearst_pct: base.equity_hearst_pct,
          equity_brookfield_pct: base.equity_brookfield_pct,
          equity_qatar_pct: base.equity_qatar_pct,
          debt_pct: base.debt_pct,
          debt_interest_rate: base.debt_interest_rate,
          exit_multiple: base.exit_multiple,
          exit_year: base.exit_year,
        } : {}),
      };
      const res = await fetch('/api/admin/hearst/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { scenario } = await res.json();
      setScenarios(prev => [...prev, scenario]);
      setNewName('');
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={S.loading}>Loading scenarios…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  return (
    <div style={S.wrap}>
      <SectionTabs section="modeling" />
      <div style={S.topBar}>
        <div style={S.pageTitle}>Scenario Comparison</div>
        <button onClick={() => setShowAdd(v => !v)} className="cp-btn-hover" style={S.addBtn}>{showAdd ? '✕' : '+ New Scenario'}</button>
      </div>

      {showAdd && (
        <div style={S.addForm}>
          <input
            placeholder="Scenario name (e.g. Conservative, Stress Test)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={S.inp}
          />
          <select value={cloneFrom} onChange={e => setCloneFrom(e.target.value)} style={S.inp}>
            <option value="">Start from scratch</option>
            {scenarios.map(s => <option key={s.id} value={s.id}>Clone from: {s.name}</option>)}
          </select>
          <button
            onClick={addScenario}
            disabled={saving || !newName}
            className="cp-btn-hover"
            style={{
              ...S.saveBtn,
              ...((saving || !newName) ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            }}
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
          <button onClick={() => setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
        </div>
      )}

      {/* Comparison table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Metric</th>
              {scenarios.map(sc => {
                const col = getColor(sc);
                return (
                  <th key={sc.id} style={{ ...S.th, textAlign: 'center', background: col.bg, color: col.label, borderTop: `3px solid ${col.border}` }}>
                    <div>{sc.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>Score: {sc.source_score ?? 0}/100</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, i) => {
              if (row.divider) {
                return (
                  <tr key={i}>
                    <td colSpan={scenarios.length + 1} style={S.divider}>{row.divider}</td>
                  </tr>
                );
              }
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--cp-surface-0)' }}>
                  <td style={S.tdLabel}>{row.label}</td>
                  {scenarios.map(sc => {
                    let raw;
                    if (row.src === 'input') raw = sc[row.key];
                    else if (row.src === 'proj') raw = sc.projection?.[row.key];
                    else if (row.src === 'direct') raw = sc[row.key];
                    else if (row.src === 'computed') raw = sc.projection?.missing_inputs?.length;

                    const display = raw != null
                      ? (row.type ? fmtVal(raw, row.type) : String(raw) + (row.suffix || ''))
                      : (row.src === 'proj' ? MISSING_LABEL : '—');

                    const isMissing = display === MISSING_LABEL;
                    const col = getColor(sc);

                    // Highlight if best value
                    const isHighlighted = row.highlight && raw != null;

                    return (
                      <td key={sc.id} style={{ ...S.td, textAlign: 'center', color: isMissing ? 'var(--cp-error)' : isHighlighted ? col.label : 'inherit', fontWeight: isHighlighted ? 800 : isMissing ? 400 : 'inherit', fontStyle: isMissing ? 'italic' : 'normal', fontSize: isMissing ? 11 : 13 }}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
  addForm: { display: 'flex', gap: 12, background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 10, padding: '16px' },
  inp: { flex: 1, padding: '8px 10px', fontSize: 12, border: '1px solid var(--cp-border)', borderRadius: 6, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)' },
  saveBtn: { fontSize: 12, fontWeight: 700, padding: '8px 16px', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 6, cursor: 'pointer' },
  cancelBtn: { fontSize: 12, padding: '8px 12px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 6, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--cp-surface-2)', borderRadius: 10 },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '2px solid var(--cp-border)' },
  tdLabel: { padding: '9px 16px', fontWeight: 600, color: 'var(--cp-text-muted)', fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid var(--cp-border)', minWidth: 180 },
  td: { padding: '9px 16px', borderBottom: '1px solid var(--cp-border)' },
  divider: { padding: '6px 16px', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', textTransform: 'uppercase' },
};
