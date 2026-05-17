'use client';
import { useState, useEffect, useCallback } from 'react';
import SourceBadge from '@/components/hearst/SourceBadge';

const GROUPS = [
  {
    title: 'SITE & CAPACITY',
    fields: [
      { key: 'total_mw', label: 'IT Capacity (MW)', type: 'number', unit: 'MW', note: 'Total IT load capacity' },
      { key: 'pue', label: 'PUE', type: 'number', unit: '', note: 'Power Usage Effectiveness. Qatar climate: 1.4–1.6 typical' },
      { key: 'site_readiness', label: 'Site Readiness', type: 'select', options: ['greenfield','land_secured','power_reserved','substation_ready','powered_shell','operational'] },
      { key: 'planned_cod', label: 'Planned COD', type: 'date', note: 'Commercial Operations Date' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
  },
  {
    title: 'CONSTRUCTION & CAPEX',
    fields: [
      { key: 'capex_shell_per_mw', label: 'Shell CAPEX', type: 'number', unit: '$/MW', note: 'Civil & shell construction per MW' },
      { key: 'capex_mep_per_mw', label: 'MEP CAPEX', type: 'number', unit: '$/MW', note: 'Mechanical, electrical & plumbing per MW' },
      { key: 'capex_substation_per_mw', label: 'Substation CAPEX', type: 'number', unit: '$/MW', note: 'HV substation per MW' },
      { key: 'capex_cooling_per_mw', label: 'Cooling CAPEX', type: 'number', unit: '$/MW', note: 'Cooling systems per MW' },
      { key: 'capex_grid_per_mw', label: 'Grid Connection CAPEX', type: 'number', unit: '$/MW', note: 'Grid connection per MW' },
      { key: 'capex_land_per_mw', label: 'Land CAPEX', type: 'number', unit: '$/MW', note: 'Land cost per MW' },
      { key: 'capex_contingency_pct', label: 'Contingency', type: 'number', unit: '%', note: 'As % of base CAPEX (e.g. 10 = 10%)' },
    ],
  },
  {
    title: 'POWER & ENERGY',
    fields: [
      { key: 'electricity_price_mwh', label: 'Electricity Price', type: 'number', unit: 'USD/MWh', note: 'Qatar industrial tariff: ~$30–50/MWh' },
    ],
  },
  {
    title: 'REVENUE — COLOCATION',
    fields: [
      { key: 'price_retail_colo_kw_month', label: 'Retail Colo Price', type: 'number', unit: '$/kW/month' },
      { key: 'price_wholesale_kw_month', label: 'Wholesale Colo Price', type: 'number', unit: '$/kW/month' },
      { key: 'price_hyperscale_kw_month', label: 'Hyperscale Price', type: 'number', unit: '$/kW/month' },
      { key: 'target_occupancy_pct', label: 'Target Occupancy', type: 'number', unit: '%', note: 'Stabilized occupancy' },
      { key: 'annual_escalation_pct', label: 'Annual Price Escalation', type: 'number', unit: '%', note: 'Revenue escalation per year (e.g. 2 = 2%)' },
      { key: 'ramp_months', label: 'Ramp-up Period', type: 'number', unit: 'months' },
    ],
  },
  {
    title: 'OPEX',
    fields: [
      { key: 'opex_maintenance_pct', label: 'Maintenance', type: 'number', unit: '% revenue', note: '% of annual revenue' },
      { key: 'opex_insurance_pct', label: 'Insurance', type: 'number', unit: '% revenue', note: '% of annual revenue' },
      { key: 'opex_ga_pct', label: 'G&A', type: 'number', unit: '% revenue', note: 'General & admin % of annual revenue' },
      { key: 'opex_operator_mgmt_fee_pct', label: 'Operator Management Fee', type: 'number', unit: '% revenue', note: '% of annual revenue' },
      { key: 'opex_staff_annual_musd', label: 'Annual Staff Cost', type: 'number', unit: '$M/yr', note: 'Fixed annual staff cost in $M' },
    ],
  },
  {
    title: 'FINANCING',
    fields: [
      { key: 'equity_hearst_pct', label: 'Hearst Equity', type: 'number', unit: '%', note: 'Hearst equity share' },
      { key: 'equity_brookfield_pct', label: 'Brookfield Equity', type: 'number', unit: '%', note: 'Brookfield equity share' },
      { key: 'equity_qatar_pct', label: 'Qatar Equity', type: 'number', unit: '%', note: 'Qatar equity share' },
      { key: 'debt_pct', label: 'Debt Share', type: 'number', unit: '%' },
      { key: 'debt_interest_rate', label: 'Debt Interest Rate', type: 'number', unit: '%/yr' },
    ],
  },
  {
    title: 'EXIT & RETURNS',
    fields: [
      { key: 'exit_multiple', label: 'Exit Multiple', type: 'number', unit: 'x EBITDA', note: 'Terminal value exit multiple' },
      { key: 'exit_year', label: 'Exit Year', type: 'number', unit: 'yr', note: 'Year of exit (default 10)' },
      { key: 'start_year', label: 'Start Year', type: 'number', unit: '', note: 'Calendar year of year 1 (default 2026)' },
    ],
  },
];

function FieldRow({ fieldDef, value, onSave, scenarioId }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  function startEdit() {
    setDraft(value ?? '');
    setSaveError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { [fieldDef.key]: fieldDef.type === 'number' ? parseFloat(draft) || null : draft };
      const res = await fetch(`/api/admin/hearst/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      onSave(fieldDef.key, payload[fieldDef.key]);
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); setEditing(false); setSaveError(null); }
  }

  const display = value != null ? String(value) + (fieldDef.unit ? ' ' + fieldDef.unit : '') : null;

  return (
    <div style={S.fieldRow}>
      <div style={S.fieldLeft}>
        <div style={S.fieldLabel}>{fieldDef.label}</div>
        {fieldDef.note && <div style={S.fieldNote}>{fieldDef.note}</div>}
      </div>
      <div style={S.fieldRight}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {fieldDef.type === 'select' ? (
                <select value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKey} style={S.input}>
                  <option value="">— select —</option>
                  {fieldDef.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={fieldDef.type === 'number' ? 'number' : fieldDef.type === 'date' ? 'date' : 'text'}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  style={S.input}
                  autoFocus
                />
              )}
              <button onClick={save} disabled={saving} style={{ ...S.saveBtn, opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? '…' : 'Save'}</button>
              <button onClick={() => { setEditing(false); setSaveError(null); }} style={S.cancelBtn}>Cancel</button>
            </div>
            {saveError && <div style={S.saveError}>⛔ {saveError}</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={display ? { ...S.valueText, color: justSaved ? 'var(--cp-success)' : S.valueText.color, transition: 'color .3s' } : S.emptyText}>
              {display || '—'}
              {justSaved && ' ✓'}
            </span>
            {display && <SourceBadge source_type="admin_input" />}
            <button onClick={startEdit} style={S.editBtn}>{display ? 'Edit' : '+ Renseigner'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssumptionsPage() {
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();

        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);

        const base = sc?.find(s => s.scenario_type === 'base' || s.name?.toLowerCase().includes('base')) || sc?.[0];
        if (base) {
          setActiveId(base.id);
          setInputs(base);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function switchScenario(id) {
    setActiveId(id);
    const sc = scenarios.find(s => s.id === id);
    if (sc) setInputs(sc);
  }

  const handleSave = useCallback((key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  }, []);

  if (loading) return <div style={S.loading}>Loading assumptions…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  return (
    <div style={S.wrap}>
      <div style={S.topBar}>
        <div style={S.pageTitle}>Financial Assumptions</div>
        <div style={S.tabs}>
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => switchScenario(s.id)}
              style={{ ...S.tab, ...(activeId === s.id ? S.tabActive : {}) }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
      {GROUPS.map(group => (
        <div key={group.title} style={S.group}>
          <div style={S.groupTitle}>{group.title}</div>
          {group.fields.map(field => (
            <FieldRow
              key={field.key}
              fieldDef={field}
              value={inputs[field.key]}
              scenarioId={activeId}
              onSave={handleSave}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)' },
  tabs: { display: 'flex', gap: 6 },
  tab: { fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--cp-border)', background: 'transparent', cursor: 'pointer', color: 'var(--cp-text-muted)' },
  tabActive: { background: 'var(--cp-info-strong-cta)', color: 'var(--cp-text-strong)', borderColor: 'var(--cp-info-strong-cta)' },
  group: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  groupTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', padding: '8px 16px', borderBottom: '1px solid var(--cp-border)' },
  fieldRow: { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--cp-border)' },
  fieldLeft: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: 'var(--cp-text-primary)' },
  fieldNote: { fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2 },
  fieldRight: { flexShrink: 0, minWidth: 280, display: 'flex', justifyContent: 'flex-end' },
  valueText: { fontSize: 13, fontWeight: 600, color: 'var(--cp-text-primary)' },
  emptyText: { fontSize: 13, color: 'var(--cp-text-muted)', fontStyle: 'italic' },
  input: { fontSize: 12, padding: '4px 8px', border: '1px solid var(--cp-border)', borderRadius: 4, background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', width: 160 },
  saveBtn: { fontSize: 11, fontWeight: 700, padding: '4px 12px', background: 'var(--cp-info-strong-cta)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 4, cursor: 'pointer' },
  cancelBtn: { fontSize: 11, padding: '4px 10px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  editBtn: { fontSize: 11, padding: '3px 10px', background: 'transparent', color: 'var(--cp-info)', border: '1px solid var(--cp-info)', borderRadius: 4, cursor: 'pointer' },
  saveError: { fontSize: 11, color: 'var(--cp-error)', fontWeight: 600, marginTop: 2 },
};
