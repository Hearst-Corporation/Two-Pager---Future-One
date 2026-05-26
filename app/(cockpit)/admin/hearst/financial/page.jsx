'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart,
} from 'recharts';
import { detectAlerts } from '@/lib/hearst-alerts';
import AlertBanner from '@/components/hearst/AlertBanner';
import KpiCard from '@/components/hearst/KpiCard';
import {
  generateDebtSchedule, generateWaterfall, generateSensitivity,
} from '@/lib/hearst-calculations';

// Scenario palette : accent for upside, neutral for base, error only for downside
// (downside is a true risk warning, not just a third color).
const COLORS = { base: 'var(--cp-text-primary)', downside: 'var(--cp-error)', upside: 'var(--cp-accent)' };

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


export default function FinancialPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('table');
  const [exporting, setExporting] = useState(null); // 'xlsx' | 'memo' | null
  const [sensitivityX, setSensitivityX] = useState('target_occupancy_pct');
  const [sensitivityY, setSensitivityY] = useState('electricity_price_mwh');

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

  // Derived values — computed before early returns so hooks are always called in same order
  const visible = scenarios.filter(s => activeIds.includes(s.id));
  const base = visible.find(s => s.name?.toLowerCase().includes('base') || s.scenario_type === 'base') || visible[0];
  const proj = base?.projection || {};

  const debtSchedule = useMemo(() => {
    if (!base) return null;
    const ebitda_by_year = (proj.years || []).map(y => y.ebitda ?? 0);
    return generateDebtSchedule(base, { ebitda_by_year });
  }, [base, proj.years]);

  const waterfall = useMemo(() => {
    if (!base || !proj.years?.length) return null;
    return generateWaterfall(base, proj);
  }, [base, proj.years]);

  const sensitivity = useMemo(() => {
    if (!base) return null;
    return generateSensitivity(base, sensitivityX, sensitivityY, 5);
  }, [base, sensitivityX, sensitivityY]);

  if (loading) return <div style={S.loading}>Loading financial model…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  async function handleExport(type) {
    if (!base) return;
    setExporting(type);
    try {
      const res = await fetch(`/api/admin/hearst/export/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: base.id, project_id: project?.id }),
      });
      if (!res.ok) { alert('Export failed — route not yet implemented'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'xlsx'
        ? `hearst-financial-model-${Date.now()}.xlsx`
        : `hearst-investment-memo-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

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
                style={{ ...S.scBtn, borderColor: color, background: active ? color : 'transparent', color: active ? 'var(--cp-bg-deep)' : color }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {[
            { id: 'table',       label: '⊞ Table' },
            { id: 'charts',      label: '⟁ Charts' },
            { id: 'debt',        label: '⬡ Debt Schedule' },
            { id: 'waterfall',   label: '▣ Waterfall' },
            { id: 'sensitivity', label: '⊠ Sensitivity' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tabBtn, ...(tab === t.id ? S.tabBtnActive : {}) }}>
              {t.label}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--cp-border)', margin: '0 4px' }} />
          <button onClick={() => handleExport('xlsx')} disabled={!!exporting || !hasProjection} style={{ ...S.exportBtn, opacity: exporting === 'xlsx' ? 0.6 : 1 }}>
            {exporting === 'xlsx' ? '…' : '⬇ Excel'}
          </button>
          <button onClick={() => handleExport('memo')} disabled={!!exporting || !hasProjection} style={{ ...S.exportBtn, opacity: exporting === 'memo' ? 0.6 : 1 }}>
            {exporting === 'memo' ? '…' : '⬇ Memo PDF'}
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={S.kpiGrid}>
        <KpiCard label="Total CAPEX" value={proj.total_capex} format="currency" />
        <KpiCard label="Project IRR" value={proj.irr} format="pct" sublabel={base?.source_score != null ? `Source score: ${base.source_score}/100` : undefined} highlight={proj.irr != null} />
        <KpiCard label="NPV (10yr)" value={proj.npv} format="currency" />
        <KpiCard label="MOIC" value={proj.moic} format="x" />
        <KpiCard label="DSCR (Stab.)" value={proj.dscr_stabilized} format="x" />
        <KpiCard label="Payback" value={proj.payback_years} format="years" />
        <KpiCard label="Terminal Value" value={proj.terminal_value} format="currency" />
        <KpiCard label="Stab. Revenue" value={proj.stabilized_revenue} format="currency" sublabel="per year" />
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
                    <td key={y.year} style={{ ...S.td, color: col.key === 'ebitda' || col.key === 'free_cash_flow' ? (y[col.key] >= 0 ? 'var(--cp-accent)' : 'var(--cp-error)') : 'inherit' }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" />
                <XAxis dataKey="year" style={{ fontSize: 11 }} tick={{ fill: 'var(--cp-text-body)' }} />
                <YAxis style={{ fontSize: 11 }} tick={{ fill: 'var(--cp-text-body)' }} tickFormatter={v => '$' + v + 'M'} />
                <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', color: 'var(--cp-text-strong)', borderRadius: 6, boxShadow: 'var(--cp-shadow-md)' }} itemStyle={{ color: 'var(--cp-text-body)' }} labelStyle={{ color: 'var(--cp-text-muted)', fontSize: 11 }} />
                <Legend wrapperStyle={{ color: 'var(--cp-text-body)', fontSize: 11 }} />
                <Bar dataKey="Revenue" fill="var(--cp-text-primary)" opacity={0.6} />
                <Line type="monotone" dataKey="EBITDA" stroke="var(--cp-accent)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={S.chartCard}>
            <div style={S.chartTitle}>Cumulative Free Cash Flow ($M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" />
                <XAxis dataKey="year" style={{ fontSize: 11 }} tick={{ fill: 'var(--cp-text-body)' }} />
                <YAxis style={{ fontSize: 11 }} tick={{ fill: 'var(--cp-text-body)' }} tickFormatter={v => '$' + v + 'M'} />
                <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', color: 'var(--cp-text-strong)', borderRadius: 6, boxShadow: 'var(--cp-shadow-md)' }} itemStyle={{ color: 'var(--cp-text-body)' }} labelStyle={{ color: 'var(--cp-text-muted)', fontSize: 11 }} />
                <Area type="monotone" dataKey="Cum. FCF" stroke="var(--cp-accent)" fill="var(--cp-accent-soft)" fillOpacity={0.45} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Debt Schedule tab */}
      {hasProjection && tab === 'debt' && (
        <div>
          {!debtSchedule ? (
            <div style={S.noData}>
              <div style={S.noDataTitle}>No Debt Configured</div>
              <div style={S.noDataSub}>Set Debt % and Interest Rate in <Link href="/admin/hearst/assumptions" style={S.noDataLink}>Assumptions →</Link></div>
            </div>
          ) : (
            <>
              <div style={S.debtSummary}>
                {[
                  { label: 'Principal', value: '$' + (debtSchedule.summary.principal / 1e6).toFixed(1) + 'M' },
                  { label: 'Total Interest', value: '$' + (debtSchedule.summary.total_interest / 1e6).toFixed(1) + 'M' },
                  { label: 'Term', value: debtSchedule.summary.debt_term_years + ' yr' },
                  { label: 'IO Period', value: debtSchedule.summary.io_years + ' yr' },
                  { label: 'Min DSCR', value: debtSchedule.summary.min_dscr ? debtSchedule.summary.min_dscr + 'x' : 'N/A' },
                  { label: 'Avg DSCR', value: debtSchedule.summary.avg_dscr ? debtSchedule.summary.avg_dscr + 'x' : 'N/A' },
                  { label: 'Covenant Breaches', value: debtSchedule.summary.breach_years?.length ? debtSchedule.summary.breach_years.join(', ') : 'None' },
                ].map(kpi => (
                  <KpiCard key={kpi.label} size="sm" label={kpi.label} value={kpi.value} format="number" />
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Debt Balance Over Time ($M)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={debtSchedule.schedule.map(r => ({ year: 'Y' + r.year, Balance: +(r.closing_balance / 1e6).toFixed(1), 'Debt Service': +(r.total_service / 1e6).toFixed(2), IO: r.is_io }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" />
                      <XAxis dataKey="year" tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} />
                      <YAxis yAxisId="balance" tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} tickFormatter={v => '$' + v + 'M'} />
                      <YAxis yAxisId="service" orientation="right" tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} tickFormatter={v => '$' + v + 'M'} />
                      <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', color: 'var(--cp-text-strong)', borderRadius: 6 }} />
                      <Legend wrapperStyle={{ color: 'var(--cp-text-body)', fontSize: 11 }} />
                      <Area yAxisId="balance" type="monotone" dataKey="Balance" stroke="var(--cp-error)" fill="var(--cp-error-bg)" strokeWidth={2} fillOpacity={0.3} />
                      <Bar yAxisId="service" dataKey="Debt Service" fill="var(--cp-accent)" opacity={0.7} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Year', 'Opening Balance', 'Interest', 'Principal', 'Closing Balance', 'Total Service', 'DSCR'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {debtSchedule.schedule.map(r => (
                      <tr key={r.year} style={{ background: r.is_io ? 'var(--cp-surface-3)' : 'transparent' }}>
                        <td style={S.tdLabel}>Y{r.year}{r.is_io ? ' (IO)' : ''}</td>
                        <td style={S.td}>{fmtM(r.opening_balance)}</td>
                        <td style={S.td}>{fmtM(r.interest)}</td>
                        <td style={S.td}>{fmtM(r.principal)}</td>
                        <td style={S.td}>{fmtM(r.closing_balance)}</td>
                        <td style={S.td}>{fmtM(r.total_service)}</td>
                        <td style={{ ...S.td, color: r.dscr == null ? 'var(--cp-text-muted)' : r.dscr < 1.25 ? 'var(--cp-error)' : r.dscr < 1.5 ? 'var(--cp-text-body)' : 'var(--cp-accent)' }}>
                          {r.dscr != null ? r.dscr + 'x' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Waterfall tab */}
      {hasProjection && tab === 'waterfall' && (
        <div>
          {!waterfall ? (
            <div style={S.noData}>
              <div style={S.noDataTitle}>No Equity Structure</div>
              <div style={S.noDataSub}>Set HEARST / Brookfield / Qatar equity % in <Link href="/admin/hearst/assumptions" style={S.noDataLink}>Assumptions →</Link></div>
            </div>
          ) : (
            <>
              <div style={S.debtSummary}>
                {Object.entries(waterfall.by_investor).filter(([k]) => k !== 'lender').map(([key, inv]) => (
                  <KpiCard
                    key={key}
                    size="sm"
                    label={key.toUpperCase()}
                    value={inv.irr != null ? (inv.irr * 100).toFixed(1) + '% IRR' : 'N/A'}
                    format="number"
                    sublabel={`MOIC: ${inv.moic != null ? inv.moic + 'x' : 'N/A'} · Invested: ${inv.equity_invested ? '$' + (inv.equity_invested / 1e6).toFixed(1) + 'M' : '—'}`}
                    valueColor={inv.irr != null ? { hearst: 'var(--cp-op-qia)', brookfield: 'var(--cp-op-brookfield)' }[key] ?? 'var(--cp-op-qai)' : undefined}
                  />
                ))}
                <KpiCard
                  size="sm"
                  label="LENDER"
                  value={waterfall.by_investor.lender.total_repaid ? fmtM(waterfall.by_investor.lender.total_repaid) : '—'}
                  format="number"
                  sublabel={`Interest: ${fmtM(waterfall.by_investor.lender.total_interest)} · Principal: ${fmtM(waterfall.by_investor.lender.total_principal)}`}
                  valueColor={waterfall.by_investor.lender.total_repaid ? 'var(--cp-text-muted)' : undefined}
                />
              </div>
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Equity Distributions by Investor ($M)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={(proj.years || []).map((y, i) => ({
                    year: 'Y' + y.year,
                    HEARST: waterfall.by_investor.hearst?.cash_flows?.[i + 1] ? +(waterfall.by_investor.hearst.cash_flows[i + 1] / 1e6).toFixed(2) : 0,
                    Brookfield: waterfall.by_investor.brookfield?.cash_flows?.[i + 1] ? +(waterfall.by_investor.brookfield.cash_flows[i + 1] / 1e6).toFixed(2) : 0,
                    Qatar: waterfall.by_investor.qatar?.cash_flows?.[i + 1] ? +(waterfall.by_investor.qatar.cash_flows[i + 1] / 1e6).toFixed(2) : 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" />
                    <XAxis dataKey="year" tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} tickFormatter={v => '$' + v + 'M'} />
                    <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', borderRadius: 6 }} />
                    <Legend wrapperStyle={{ color: 'var(--cp-text-body)', fontSize: 11 }} />
                    <Bar dataKey="HEARST" stackId="a" fill="var(--cp-op-qia)" />
                    <Bar dataKey="Brookfield" stackId="a" fill="var(--cp-op-brookfield)" />
                    <Bar dataKey="Qatar" stackId="a" fill="var(--cp-op-qai)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sensitivity tab */}
      {hasProjection && tab === 'sensitivity' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={S.chartTitle}>Sensitivity Matrix — IRR</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
              <label style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>X-Axis</label>
              <select value={sensitivityX} onChange={e => setSensitivityX(e.target.value)} style={S.sensitivitySelect}>
                {SENSITIVITY_PARAM_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <label style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>Y-Axis</label>
              <select value={sensitivityY} onChange={e => setSensitivityY(e.target.value)} style={S.sensitivitySelect}>
                {SENSITIVITY_PARAM_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>
          {!sensitivity ? (
            <div style={S.noData}><div style={S.noDataSub}>Could not compute sensitivity — check that both parameters are set in the base scenario.</div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...S.table, width: 'auto', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, minWidth: 120 }}>{sensitivity.axis_y.label} ↓ / {sensitivity.axis_x.label} →</th>
                    {sensitivity.axis_x.values.map((v, i) => (
                      <th key={i} style={S.th}>{formatSensVal(v, sensitivity.axis_x.unit)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.cells.map((row, ri) => (
                    <tr key={ri}>
                      <td style={S.tdLabel}>{formatSensVal(sensitivity.axis_y.values[ri], sensitivity.axis_y.unit)}</td>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          ...S.td,
                          background: cell.irr == null ? 'var(--cp-surface-2)'
                            : cell.irr < 0 ? 'color-mix(in srgb, var(--color-error) 30%, black)'
                            : cell.irr < 0.08 ? 'color-mix(in srgb, var(--color-error) 60%, black)'
                            : cell.irr < 0.12 ? 'color-mix(in srgb, var(--color-warning) 50%, black)'
                            : cell.irr < 0.15 ? 'color-mix(in srgb, var(--color-success) 50%, black)'
                            : 'color-mix(in srgb, var(--color-success) 30%, black)',
                          color: 'var(--cp-text-primary)',
                          fontWeight: ri === 2 && ci === 2 ? 900 : 600,
                          fontSize: 11,
                          textAlign: 'center',
                          border: ri === 2 && ci === 2 ? '2px solid var(--cp-text-primary)' : 'none',
                        }}>
                          {cell.irr != null ? (cell.irr * 100).toFixed(1) + '%' : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { bg: 'color-mix(in srgb, var(--color-error) 30%, black)', label: '< 0% IRR' },
                  { bg: 'color-mix(in srgb, var(--color-error) 60%, black)', label: '0–8%' },
                  { bg: 'color-mix(in srgb, var(--color-warning) 50%, black)', label: '8–12%' },
                  { bg: 'color-mix(in srgb, var(--color-success) 50%, black)', label: '12–15%' },
                  { bg: 'color-mix(in srgb, var(--color-success) 30%, black)', label: '> 15%' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--cp-text-muted)' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: l.bg, display: 'inline-block' }} />
                    {l.label}
                  </div>
                ))}
                <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginLeft: 8 }}>Bold border = baseline scenario</span>
              </div>
            </div>
          )}
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

const SENSITIVITY_PARAM_OPTIONS = [
  { key: 'electricity_price_mwh',     label: 'Electricity Price' },
  { key: 'target_occupancy_pct',      label: 'Occupancy %' },
  { key: 'price_retail_colo_kw_month',label: 'Retail Price' },
  { key: 'price_wholesale_kw_month',  label: 'Wholesale Price' },
  { key: 'price_hyperscale_kw_month', label: 'Hyperscale Price' },
  { key: 'total_mw',                  label: 'IT Capacity (MW)' },
  { key: 'debt_pct',                  label: 'Debt Leverage' },
  { key: 'exit_multiple',             label: 'Exit Multiple' },
  { key: 'pue',                       label: 'PUE' },
];

function formatSensVal(v, unit) {
  if (unit === 'ratio' || unit === '%') return (v * 100).toFixed(0) + '%';
  if (unit === '×') return v.toFixed(1) + 'x';
  if (unit === 'ratio/year') return (v * 100).toFixed(1) + '%/yr';
  if (unit?.includes('$/')) return '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0));
  if (unit === 'MW') return v.toFixed(0) + ' MW';
  return v.toFixed(2);
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  pageTitle: { fontSize: 20, lineHeight: '28px', fontWeight: 800, color: 'var(--cp-text-primary)' },
  scBtn: { fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer', transition: 'all .15s' },
  tabBtn: { fontSize: 11, fontWeight: 600, padding: '5px 12px', border: '1px solid var(--cp-border)', background: 'transparent', color: 'var(--cp-text-muted)', borderRadius: 4, cursor: 'pointer' },
  tabBtnActive: { background: 'var(--cp-text-primary)', color: 'var(--cp-bg-deep)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  noData: { background: 'var(--cp-surface-2)', border: '1px dashed var(--cp-border-strong)', borderRadius: 10, padding: '28px 24px', textAlign: 'center', marginBottom: 24 },
  noDataTitle: { fontSize: 15, fontWeight: 700, color: 'var(--cp-text-primary)', marginBottom: 8 },
  noDataSub: { fontSize: 13, color: 'var(--cp-text-muted)' },
  noDataLink: { color: 'var(--cp-accent)', fontWeight: 700, textDecoration: 'underline' },
  missingTag: { fontSize: 11, background: 'var(--cp-surface-2)', border: '1px solid var(--cp-error)', color: 'var(--cp-error)', padding: '2px 8px', borderRadius: 4 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)' },
  th: { padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap' },
  td: { padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--cp-border)', fontSize: 12 },
  tdLabel: { padding: '8px 16px', fontWeight: 600, fontSize: 12, color: 'var(--cp-text-primary)', background: 'var(--cp-surface-2)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap', minWidth: 160 },
  chartCard: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 10, padding: '16px 20px' },
  chartTitle: { fontSize: 12, fontWeight: 700, color: 'var(--cp-text-muted)', marginBottom: 12, letterSpacing: 0.5 },
  warnBox: { background: 'var(--cp-error-bg)', border: '1px solid var(--cp-error)', borderRadius: 10, padding: '16px 16px', marginTop: 20 },
  warnTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-error)', marginBottom: 8 },
  warnRow: { fontSize: 12, color: 'var(--cp-error)', padding: '3px 0', borderBottom: '1px solid var(--cp-error-bg)' },
  exportBtn: { fontSize: 11, fontWeight: 700, padding: '5px 12px', background: 'var(--cp-surface-3)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  debtSummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 },
  sensitivitySelect: { fontSize: 11, padding: '4px 8px', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 4, color: 'var(--cp-text-primary)', cursor: 'pointer' },
};
