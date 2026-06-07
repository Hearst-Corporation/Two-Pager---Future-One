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
import { Button } from '@/components/hearst/ui';
import {
  generateDebtSchedule, generateWaterfall, generateSensitivity,
} from '@/lib/hearst-calculations';
import { fmtUSD, fmtPctFromRatio, fmtPctRaw, fmtX } from '@/lib/hearst-format';
import { UI } from '@/lib/ui-strings';
import {
  canonicalScenarioColorType,
  dedupeSavedPlans,
  groupCanonicalScenarios,
  pickDefaultPrimaryScenarioId,
} from '@/lib/financial-scenario-picker';

// Scenario palette : accent for upside, neutral for base, error only for downside
// (downside is a true risk warning, not just a third color).
const COLORS = { base: 'var(--cp-text-primary)', downside: 'var(--cp-error)', upside: 'var(--cp-accent)' };

// Delegated to the shared formatter so the financial page matches the simulator
// result page (tiered $B/$M/$K, lowercase 'x', single "—" missing token).
const fmtM = fmtUSD;

const METRIC_COLS = [
  { key: 'revenue', label: 'Revenue', fmt: fmtM },
  { key: 'power_cost', label: 'Power Cost', fmt: fmtM },
  { key: 'opex', label: 'OpEx', fmt: fmtM },
  { key: 'ebitda', label: 'EBITDA', fmt: fmtM },
  { key: 'ebitda_margin', label: 'EBITDA Margin', fmt: v => fmtPctRaw(v, 1) },
  { key: 'debt_service', label: 'Debt Service', fmt: fmtM },
  { key: 'free_cash_flow', label: 'Free Cash Flow', fmt: fmtM },
  { key: 'cumulative_fcf', label: 'Cumulative FCF', fmt: fmtM },
  { key: 'occupancy_pct', label: 'Occupancy', fmt: v => fmtPctRaw(v) },
];


export default function FinancialPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [primaryId, setPrimaryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('table');
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
        const list = sc || [];
        setScenarios(list);
        setPrimaryId(pickDefaultPrimaryScenarioId(list));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived values — computed before early returns so hooks are always called in same order
  const canonicalScenarios = useMemo(() => groupCanonicalScenarios(scenarios), [scenarios]);
  const savedPlans = useMemo(() => dedupeSavedPlans(scenarios), [scenarios]);
  const base = scenarios.find((s) => s.id === primaryId)
    || canonicalScenarios.find((s) => s.scenario_type === 'base')
    || scenarios[0]
    || null;
  const proj = base?.projection || {};
  const savedPlanValue = savedPlans.some((s) => s.id === primaryId) ? primaryId : '';

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

  if (loading) return <div style={S.loading}>{UI.FIN_LOADING}</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  // Export: the memo PDF lives in the Dossier (the working per-memo PDF route).
  // Excel/server-side exports are not built yet, so we don't pretend — the
  // button is disabled with an honest label rather than hitting a 404 route.

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
    <>
    <style>{`
      @media (max-width: 1100px) {
        [data-financial-kpi-grid] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
      @media (max-width: 900px) {
        [data-financial-tab-row] {
          flex-wrap: nowrap !important;
          overflow-x: auto;
        }
      }
      @media (max-width: 600px) {
        [data-financial-kpi-grid] {
          grid-template-columns: 1fr !important;
        }
        [data-financial-top-bar] {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        [data-financial-scenario-row] {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        [data-financial-tab-row] {
          overflow-x: auto !important;
          flex-wrap: nowrap !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          margin-left: 0 !important;
        }
        [data-financial-tab-row]::-webkit-scrollbar { display: none; }
        [data-financial-table-scroll] {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
      }
    `}</style>
    <div className="oracle-page">
      {/* Scenario toggles */}
      <div data-financial-top-bar style={S.topBar}>
        <div style={S.pageTitle}>{UI.FIN_PAGE_TITLE}</div>
        <div data-financial-scenario-row style={S.scenarioRow}>
          {canonicalScenarios.map((s) => {
            const active = primaryId === s.id;
            const tone = canonicalScenarioColorType(s.scenario_type) || 'base';
            const color = COLORS[tone];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setPrimaryId(s.id)}
                style={{
                  ...S.scBtn,
                  borderColor: color,
                  background: active ? color : 'transparent',
                  color: active ? 'var(--cp-bg-deep)' : color,
                }}
              >
                {s.name}
              </button>
            );
          })}
          {savedPlans.length > 0 && (
            <label style={S.savedPlanWrap}>
              <span style={S.savedPlanLabel}>{UI.FIN_SAVED_PLAN_LABEL}</span>
              <select
                value={savedPlanValue}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) setPrimaryId(id);
                }}
                style={S.savedPlanSelect}
              >
                <option value="">{UI.FIN_SAVED_PLAN_PLACEHOLDER}</option>
                {savedPlans.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div data-financial-tab-row style={{ display: 'flex', gap: 'var(--cp-space-1)', marginLeft: 'auto', flexWrap: 'wrap' }}>
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
          <div style={{ width: 1, background: 'var(--cp-border)', margin: '0 var(--cp-space-1)' }} />
          <Button variant="muted" size="sm" disabled title="Excel export is not available yet">Excel (soon)</Button>
          <Button
            variant="muted"
            size="sm"
            href={base ? `/admin/hearst/dossier?scenario=${base.id}` : '/admin/hearst/dossier'}
            title="Open this scenario's strategic memo in the Dossier (PDF export available there)"
          >
            Memo →
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div data-financial-kpi-grid style={S.kpiGrid}>
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
              <div style={{ marginBottom: 'var(--cp-space-4)' }}>
                <AlertBanner alerts={alerts.filter(a => a.severity === 'critical')} />
              </div>
            ) : null;
          })()}
          <div style={S.noData}>
            <div style={S.noDataTitle}>Projection Cannot Run</div>
            <div style={S.noDataSub}>
              Configure and save a scenario in the <Link href="/admin/hearst/simulator" style={S.noDataLink}>Simulator →</Link> to generate the 10-year financial model.
            </div>
            {proj.missing_inputs?.length > 0 && (
              <div style={{ marginTop: 'var(--cp-space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--cp-space-2)' }}>
                {proj.missing_inputs.map((m, i) => <span key={i} style={S.missingTag}>{m}</span>)}
              </div>
            )}
          </div>
        </>
      ) : tab === 'table' ? (
        /* Projection table */
        <div data-financial-table-scroll style={{ overflowX: 'auto' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-7)' }}>
          <div style={S.chartCard}>
            <div style={S.chartTitle}>Revenue & EBITDA ($M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" />
                <XAxis dataKey="year" style={{ fontSize: 'var(--cp-font-xs)' }} tick={{ fill: 'var(--cp-text-body)' }} />
                <YAxis style={{ fontSize: 'var(--cp-font-xs)' }} tick={{ fill: 'var(--cp-text-body)' }} tickFormatter={v => '$' + v + 'M'} />
                <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', color: 'var(--cp-text-strong)', borderRadius: 'var(--cp-radius-sm)', boxShadow: 'var(--cp-shadow-md)' }} itemStyle={{ color: 'var(--cp-text-body)' }} labelStyle={{ color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs)' }} />
                <Legend wrapperStyle={{ color: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} />
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
                <XAxis dataKey="year" style={{ fontSize: 'var(--cp-font-xs)' }} tick={{ fill: 'var(--cp-text-body)' }} />
                <YAxis style={{ fontSize: 'var(--cp-font-xs)' }} tick={{ fill: 'var(--cp-text-body)' }} tickFormatter={v => '$' + v + 'M'} />
                <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', color: 'var(--cp-text-strong)', borderRadius: 'var(--cp-radius-sm)', boxShadow: 'var(--cp-shadow-md)' }} itemStyle={{ color: 'var(--cp-text-body)' }} labelStyle={{ color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs)' }} />
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
              <div style={S.noDataSub}>Set debt % and interest rate when saving a scenario in the <Link href="/admin/hearst/simulator" style={S.noDataLink}>Simulator →</Link></div>
            </div>
          ) : (
            <>
              <div style={S.debtSummary}>
                {[
                  { label: 'Principal', value: '$' + (debtSchedule.summary.principal / 1e6).toFixed(1) + 'M' },
                  { label: 'Total Interest', value: '$' + (debtSchedule.summary.total_interest / 1e6).toFixed(1) + 'M' },
                  { label: 'Term', value: debtSchedule.summary.debt_term_years + ' yr' },
                  { label: 'IO Period', value: debtSchedule.summary.io_years + ' yr' },
                  { label: 'Min DSCR', value: fmtX(debtSchedule.summary.min_dscr) },
                  { label: 'Avg DSCR', value: fmtX(debtSchedule.summary.avg_dscr) },
                  { label: 'Covenant Breaches', value: debtSchedule.summary.breach_years?.length ? debtSchedule.summary.breach_years.join(', ') : 'None' },
                ].map(kpi => (
                  <KpiCard key={kpi.label} size="sm" label={kpi.label} value={kpi.value} format="number" />
                ))}
              </div>
              <div style={{ marginBottom: 'var(--cp-space-5)' }}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Debt Balance Over Time ($M)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={debtSchedule.schedule.map(r => ({ year: 'Y' + r.year, Balance: +(r.closing_balance / 1e6).toFixed(1), 'Debt Service': +(r.total_service / 1e6).toFixed(2), IO: r.is_io }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" />
                      <XAxis dataKey="year" tick={{ fill: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} />
                      <YAxis yAxisId="balance" tick={{ fill: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} tickFormatter={v => '$' + v + 'M'} />
                      <YAxis yAxisId="service" orientation="right" tick={{ fill: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} tickFormatter={v => '$' + v + 'M'} />
                      <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', color: 'var(--cp-text-strong)', borderRadius: 'var(--cp-radius-sm)' }} />
                      <Legend wrapperStyle={{ color: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} />
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
                          {fmtX(r.dscr)}
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
              <div style={S.noDataSub}>Set HEARST / Brookfield / Qatar equity % when saving a scenario in the <Link href="/admin/hearst/simulator" style={S.noDataLink}>Simulator →</Link></div>
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
                    sublabel={`MOIC: ${fmtX(inv.moic)} · Invested: ${inv.equity_invested ? fmtUSD(inv.equity_invested) : '—'}`}
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
                    <XAxis dataKey="year" tick={{ fill: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} />
                    <YAxis tick={{ fill: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} tickFormatter={v => '$' + v + 'M'} />
                    <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', borderRadius: 'var(--cp-radius-sm)' }} />
                    <Legend wrapperStyle={{ color: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' }} />
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
          <div style={{ display: 'flex', gap: 'var(--cp-space-3)', alignItems: 'center', marginBottom: 'var(--cp-space-4)' }}>
            <div style={S.chartTitle}>Sensitivity Matrix — IRR</div>
            <div style={{ display: 'flex', gap: 'var(--cp-space-2)', alignItems: 'center', marginLeft: 'auto' }}>
              <label style={{ fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)' }}>X-Axis</label>
              <select value={sensitivityX} onChange={e => setSensitivityX(e.target.value)} style={S.sensitivitySelect}>
                {SENSITIVITY_PARAM_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <label style={{ fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)' }}>Y-Axis</label>
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
                            : cell.irr < 0 ? 'color-mix(in srgb, var(--cp-status-danger) 30%, black)'
                            : cell.irr < 0.08 ? 'color-mix(in srgb, var(--cp-status-danger) 60%, black)'
                            : cell.irr < 0.12 ? 'color-mix(in srgb, var(--cp-status-warning) 50%, black)'
                            : cell.irr < 0.15 ? 'color-mix(in srgb, var(--cp-status-success) 50%, black)'
                            : 'color-mix(in srgb, var(--cp-status-success) 30%, black)',
                          color: 'var(--cp-text-primary)',
                          fontWeight: ri === 2 && ci === 2 ? 900 : 600,
                          fontSize: 'var(--cp-font-xs)',
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
              <div style={{ display: 'flex', gap: 'var(--cp-space-3)', marginTop: 'var(--cp-space-3)', flexWrap: 'wrap' }}>
                {[
                  { bg: 'color-mix(in srgb, var(--cp-status-danger) 30%, black)', label: '< 0% IRR' },
                  { bg: 'color-mix(in srgb, var(--cp-status-danger) 60%, black)', label: '0–8%' },
                  { bg: 'color-mix(in srgb, var(--cp-status-warning) 50%, black)', label: '8–12%' },
                  { bg: 'color-mix(in srgb, var(--cp-status-success) 50%, black)', label: '12–15%' },
                  { bg: 'color-mix(in srgb, var(--cp-status-success) 30%, black)', label: '> 15%' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)' }}>
                    <span style={{ width: 'var(--cp-space-3)', height: 'var(--cp-space-3)', borderRadius: 'var(--cp-radius-xs)', background: l.bg, display: 'inline-block' }} />
                    {l.label}
                  </div>
                ))}
                <span style={{ fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', marginLeft: 'var(--cp-space-2)' }}>Bold border = baseline scenario</span>
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
    </>
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
  // Two conventions coexist in SENSITIVITY_PARAMS:
  //   unit='ratio' — PUE is a real number (1..5), NOT a percent. Display as-is with 2 decimals.
  //   unit='%'     — all _pct params (debt_pct, target_occupancy_pct…) are pure 0..100; display as-is.
  if (unit === 'ratio') return v.toFixed(2);
  if (unit === '%') return v.toFixed(0) + '%';
  if (unit === '×') return v.toFixed(1) + 'x';
  if (unit === 'ratio/year') return (v * 100).toFixed(1) + '%/yr';
  if (unit?.includes('$/')) return '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0));
  if (unit === 'MW') return v.toFixed(0) + ' MW';
  return v.toFixed(2);
}

const S = {
  loading: { padding: 'var(--cp-space-12)', textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-md)' },
  error: { padding: 'var(--cp-space-6)', color: 'var(--cp-error)', fontSize: 'var(--cp-font-base)', background: 'var(--cp-error-bg)', borderRadius: 'var(--cp-radius-sm)' },
  topBar: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-3)', flexWrap: 'wrap' },
  pageTitle: { fontSize: 'var(--cp-font-xl)', lineHeight: 'var(--cp-leading-tight)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)' },
  scenarioRow: { display: 'flex', gap: 'var(--cp-space-2)', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 280px', minWidth: 0 },
  scBtn: { fontSize: 'var(--cp-font-xs)', fontWeight: 700, padding: 'var(--cp-space-2) var(--cp-space-3)', borderRadius: 'var(--cp-radius-pill)', border: '2px solid', cursor: 'pointer', transition: 'all var(--cp-dur-base) var(--cp-ease)', whiteSpace: 'nowrap' },
  savedPlanWrap: { display: 'inline-flex', alignItems: 'center', gap: 'var(--cp-space-2)', minWidth: 0, flex: '1 1 220px' },
  savedPlanLabel: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-wide)', color: 'var(--cp-text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  savedPlanSelect: { flex: '1 1 180px', minWidth: 0, maxWidth: 360, fontSize: 'var(--cp-font-xs)', padding: 'var(--cp-space-2) var(--cp-space-3)', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-pill)', color: 'var(--cp-text-primary)', cursor: 'pointer' },
  tabBtn: { fontSize: 'var(--cp-font-xs)', fontWeight: 600, padding: 'var(--cp-space-2) var(--cp-space-3)', border: '1px solid var(--cp-border)', background: 'transparent', color: 'var(--cp-text-muted)', borderRadius: 'var(--cp-radius-xs)', cursor: 'pointer' },
  tabBtnActive: { background: 'var(--cp-text-primary)', color: 'var(--cp-bg-deep)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--cp-space-3)', marginBottom: 'var(--cp-space-6)' },
  noData: { background: 'var(--cp-surface-2)', border: '1px dashed var(--cp-border-strong)', borderRadius: 'var(--cp-radius-md)', padding: 'var(--cp-space-7) var(--cp-space-6)', textAlign: 'center', marginBottom: 'var(--cp-space-6)' },
  noDataTitle: { fontSize: 'var(--cp-font-md)', fontWeight: 700, color: 'var(--cp-text-primary)', marginBottom: 'var(--cp-space-2)' },
  noDataSub: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-muted)' },
  noDataLink: { color: 'var(--cp-accent)', fontWeight: 700, textDecoration: 'underline' },
  missingTag: { fontSize: 'var(--cp-font-xs)', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-error)', color: 'var(--cp-error)', padding: 'var(--cp-space-1) var(--cp-space-2)', borderRadius: 'var(--cp-radius-xs)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)', background: 'var(--cp-surface-2)' },
  th: { padding: 'var(--cp-space-2) var(--cp-space-3)', textAlign: 'right', fontSize: 'var(--cp-font-micro)', fontWeight: 700, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap' },
  td: { padding: 'var(--cp-space-2) var(--cp-space-3)', textAlign: 'right', borderBottom: '1px solid var(--cp-border)', fontSize: 'var(--cp-font-sm)' },
  tdLabel: { padding: 'var(--cp-space-2) var(--cp-space-4)', fontWeight: 600, fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-primary)', background: 'var(--cp-surface-2)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap', minWidth: 160 },
  chartCard: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)', padding: 'var(--cp-space-4) var(--cp-space-5)' },
  chartTitle: { fontSize: 'var(--cp-font-sm)', fontWeight: 700, color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-3)', letterSpacing: 'var(--cp-tracking-wider)' },
  warnBox: { background: 'var(--cp-error-bg)', border: '1px solid var(--cp-error)', borderRadius: 'var(--cp-radius-md)', padding: 'var(--cp-space-4)', marginTop: 'var(--cp-space-5)' },
  warnTitle: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-error)', marginBottom: 'var(--cp-space-2)' },
  warnRow: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-error)', padding: 'var(--cp-space-1) 0', borderBottom: '1px solid var(--cp-error-bg)' },
  debtSummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--cp-space-3)', marginBottom: 'var(--cp-space-5)' },
  sensitivitySelect: { fontSize: 'var(--cp-font-xs)', padding: 'var(--cp-space-1) var(--cp-space-2)', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)', color: 'var(--cp-text-primary)', cursor: 'pointer' },
};
