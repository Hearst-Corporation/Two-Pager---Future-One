'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { MISSING_LABEL } from '@/lib/hearst-constants';
import { detectAlerts } from '@/lib/hearst-alerts';
import AlertBanner from '@/components/hearst/AlertBanner';

const COLORS = { base: 'var(--cp-info)', downside: 'var(--cp-error)', upside: 'var(--cp-success)' };

function fmtM(v) { if (v == null) return 'N/A'; return '$' + (v / 1e6).toFixed(1) + 'M'; }
function fmtPct(v) { if (v == null) return 'N/A'; return (v * 100).toFixed(1) + '%'; }
function fmtX(v) { if (v == null) return 'N/A'; return v.toFixed(2) + 'x'; }

const METRIC_COLS = [
  { key: 'revenue', label: 'Revenue', fmt: fmtM },
  { key: 'power_cost', label: 'Power Cost', fmt: fmtM },
  { key: 'opex', label: 'OpEx', fmt: fmtM },
  { key: 'ebitda', label: 'EBITDA', fmt: fmtM },
  { key: 'ebitda_margin', label: 'EBITDA Margin', fmt: v => v != null ? v.toFixed(1) + '%' : 'N/A' },
  { key: 'debt_service', label: 'Debt Service', fmt: fmtM },
  { key: 'free_cash_flow', label: 'Free Cash Flow', fmt: fmtM },
  { key: 'cumulative_fcf', label: 'Cumulative FCF', fmt: fmtM },
  { key: 'occupancy_pct', label: 'Occupancy', fmt: v => v != null ? v.toFixed(0) + '%' : 'N/A' },
];

function SummaryKpi({ label, value, sub }) {
  return (
    <div style={SK.card}>
      <div style={SK.label}>{label}</div>
      <div style={SK.value}>{value}</div>
      {sub && <div style={SK.sub}>{sub}</div>}
    </div>
  );
}

const SK = {
  card: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, padding: '14px 18px' },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 22, fontWeight: 900, color: 'var(--cp-text-primary)' },
  sub: { fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2 },
};

export default function FinancialPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('table');

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);
        setActiveIds(sc?.map(s => s.id) || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading financial model…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const visible = scenarios.filter(s => activeIds.includes(s.id));
  const base = visible.find(s => s.name?.toLowerCase().includes('base') || s.scenario_type === 'base') || visible[0];
  const proj = base?.projection || {};

  // Build chart data from base scenario years
  const chartData = (proj.years || []).map(y => ({
    year: 'Y' + y.year,
    Revenue: y.revenue ? +(y.revenue / 1e6).toFixed(2) : null,
    EBITDA: y.ebitda ? +(y.ebitda / 1e6).toFixed(2) : null,
    'Free CF': y.free_cash_flow ? +(y.free_cash_flow / 1e6).toFixed(2) : null,
    'Cum. FCF': y.cumulative_fcf ? +(y.cumulative_fcf / 1e6).toFixed(2) : null,
    Occupancy: y.occupancy_pct || null,
  }));

  const hasProjection = proj.years?.length > 0;

  return (
    <div style={S.wrap}>
      {/* Scenario toggles */}
      <div style={S.topBar}>
        <div style={S.pageTitle}>10-Year Financial Projection</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {scenarios.map(s => {
            const active = activeIds.includes(s.id);
            const color = s.name?.toLowerCase().includes('up') ? COLORS.upside
              : s.name?.toLowerCase().includes('down') ? COLORS.downside : COLORS.base;
            return (
              <button
                key={s.id}
                onClick={() => setActiveIds(prev => active ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                style={{ ...S.scBtn, borderColor: color, background: active ? color : 'transparent', color: active ? '#fff' : color }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {['table', 'charts'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...S.tabBtn, ...(tab === t ? S.tabBtnActive : {}) }}>
              {t === 'table' ? '⊞ Table' : '📊 Charts'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={S.kpiGrid}>
        <SummaryKpi label="Total CAPEX" value={proj.total_capex ? '$' + (proj.total_capex / 1e6).toFixed(0) + 'M' : MISSING_LABEL} />
        <SummaryKpi label="Project IRR" value={fmtPct(proj.irr)} sub={base?.source_score != null ? `Source score: ${base.source_score}/100` : ''} />
        <SummaryKpi label="NPV (10yr)" value={proj.npv ? '$' + (proj.npv / 1e6).toFixed(0) + 'M' : MISSING_LABEL} />
        <SummaryKpi label="MOIC" value={proj.moic ? fmtX(proj.moic) : MISSING_LABEL} />
        <SummaryKpi label="DSCR (Stab.)" value={proj.dscr_stabilized ? fmtX(proj.dscr_stabilized) : MISSING_LABEL} />
        <SummaryKpi label="Payback" value={proj.payback_years ? proj.payback_years.toFixed(1) + ' yr' : MISSING_LABEL} />
        <SummaryKpi label="Terminal Value" value={proj.terminal_value ? '$' + (proj.terminal_value / 1e6).toFixed(0) + 'M' : MISSING_LABEL} />
        <SummaryKpi label="Stab. Revenue" value={proj.stabilized_revenue ? '$' + (proj.stabilized_revenue / 1e6).toFixed(0) + 'M/yr' : MISSING_LABEL} />
      </div>

      {!hasProjection ? (
        <>
          {/* Smart alerts when projection is blocked */}
          {(() => {
            const alerts = detectAlerts(base, project);
            return alerts.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <AlertBanner alerts={alerts.filter(a => a.severity === 'critical')} />
              </div>
            ) : null;
          })()}
          <div style={S.noData}>
            <div style={S.noDataTitle}>Projection Cannot Run</div>
            <div style={S.noDataSub}>
              Complete the <Link href="/admin/hearst/assumptions" style={S.noDataLink}>Assumptions tab →</Link> to generate the 10-year financial model.
            </div>
            {proj.missing_inputs?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {proj.missing_inputs.map((m, i) => <span key={i} style={S.missingTag}>{m}</span>)}
              </div>
            )}
          </div>
        </>
      ) : tab === 'table' ? (
        /* Projection table */
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Metric</th>
                {(proj.years || []).map(y => <th key={y.year} style={S.th}>Year {y.year}</th>)}
              </tr>
            </thead>
            <tbody>
              {METRIC_COLS.map(col => (
                <tr key={col.key}>
                  <td style={S.tdLabel}>{col.label}</td>
                  {(proj.years || []).map(y => (
                    <td key={y.year} style={{ ...S.td, color: col.key === 'ebitda' || col.key === 'free_cash_flow' ? (y[col.key] >= 0 ? 'var(--cp-success)' : 'var(--cp-error)') : 'inherit' }}>
                      {col.fmt(y[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Charts */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={S.chartCard}>
            <div style={S.chartTitle}>Revenue & EBITDA ($M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="year" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 11 }} tickFormatter={v => '$' + v + 'M'} />
                <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} />
                <Legend />
                <Bar dataKey="Revenue" fill="var(--cp-info)" opacity={0.8} />
                <Line type="monotone" dataKey="EBITDA" stroke="var(--cp-success)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={S.chartCard}>
            <div style={S.chartTitle}>Cumulative Free Cash Flow ($M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="year" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 11 }} tickFormatter={v => '$' + v + 'M'} />
                <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} />
                <Area type="monotone" dataKey="Cum. FCF" stroke="var(--cp-violet)" fill="var(--cp-violet-bg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Warnings */}
      {proj.warnings?.length > 0 && (
        <div style={S.warnBox}>
          <div style={S.warnTitle}>INVESTMENT WARNINGS</div>
          {proj.warnings.map((w, i) => <div key={i} style={S.warnRow}>⚠ {w}</div>)}
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)' },
  scBtn: { fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer', transition: 'all .15s' },
  tabBtn: { fontSize: 11, fontWeight: 600, padding: '5px 12px', border: '1px solid var(--cp-border)', background: 'transparent', color: 'var(--cp-text-muted)', borderRadius: 4, cursor: 'pointer' },
  tabBtnActive: { background: 'var(--cp-text-primary)', color: 'var(--cp-bg-deep)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  noData: { background: 'var(--cp-warning-bg)', border: '1px solid var(--cp-warning-bg)', borderRadius: 8, padding: '28px 24px', textAlign: 'center', marginBottom: 24 },
  noDataTitle: { fontSize: 15, fontWeight: 700, color: 'var(--cp-warning)', marginBottom: 8 },
  noDataSub: { fontSize: 13, color: 'var(--cp-warning)' },
  noDataLink: { color: 'var(--cp-info)', fontWeight: 700, textDecoration: 'underline' },
  missingTag: { fontSize: 11, background: '#fff', border: '1px solid var(--cp-error)', color: 'var(--cp-error)', padding: '2px 8px', borderRadius: 4 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)' },
  th: { padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', background: 'var(--cp-bg-deep)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap' },
  td: { padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid var(--cp-border)', fontSize: 12 },
  tdLabel: { padding: '7px 14px', fontWeight: 600, fontSize: 12, color: 'var(--cp-text-primary)', background: 'var(--cp-surface-2)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap', minWidth: 160 },
  chartCard: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, padding: '16px 20px' },
  chartTitle: { fontSize: 12, fontWeight: 700, color: 'var(--cp-text-muted)', marginBottom: 12, letterSpacing: 0.5 },
  warnBox: { background: 'var(--cp-error-bg)', border: '1px solid var(--cp-error)', borderRadius: 8, padding: '14px 18px', marginTop: 20 },
  warnTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-error)', marginBottom: 8 },
  warnRow: { fontSize: 12, color: 'var(--cp-error)', padding: '3px 0', borderBottom: '1px solid var(--cp-error-bg)' },
};
