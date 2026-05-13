'use client';
import { useState, useEffect } from 'react';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border-light)', paddingBottom: 6, marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function KpiLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border-light)', fontSize: 13 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

function fmtM(v) { if (!v) return 'N/A'; return '$' + (v / 1e6).toFixed(0) + 'M'; }
function fmtPct(v) { if (!v) return 'N/A'; return (v * 100).toFixed(1) + '%'; }

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; }
  #hearst-report { max-width: none !important; box-shadow: none !important; border: none !important; }
}
`;

export default function ReportsPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [dataRoom, setDataRoom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const [sRes, drRes] = await Promise.all([
          fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`),
          fetch(`/api/admin/hearst/data-room?project_id=${proj.id}`),
        ]);
        const { scenarios: sc } = await sRes.json();
        const { items: dr } = await drRes.json();
        setScenarios(sc || []);
        setDataRoom(dr || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handlePrint() {
    window.print();
  }

  if (loading) return <div style={S.loading}>Loading report data…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const base = scenarios.find(s => s.scenario_type === 'base' || s.name?.toLowerCase().includes('base')) || scenarios[0];
  const proj = base?.projection || {};
  const drApproved = dataRoom.filter(d => d.status === 'approved' || d.status === 'reviewed').length;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={S.wrap}>
      {/* Export actions (hidden in print) */}
      <div style={{ ...S.actions, display: 'flex' }} className="no-print">
        <div style={S.pageTitle}>Reports & Export</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={S.exportBtn}>
            🖨 Print / Save PDF
          </button>
        </div>
      </div>

      <div style={S.hint} className="no-print">
        Use Print / Save PDF to export this report. In the print dialog, select "Save as PDF" for a digital copy.
      </div>

      {/* Report content */}
      <div style={S.reportDoc} id="hearst-report">
        {/* Cover */}
        <div style={S.reportHeader}>
          <div style={S.reportBadge}>CONFIDENTIAL</div>
          <div style={S.reportTitle}>HEARST Qatar AI & Data Center Hub</div>
          <div style={S.reportSub}>Investment Summary Report</div>
          <div style={S.reportDate}>Generated {today} · Source-Backed Evidence Mode</div>
        </div>

        <Section title="Project Overview">
          <KpiLine label="Project Name" value={project?.name || 'HEARST Qatar Data Center Hub'} />
          <KpiLine label="Location" value={base?.location || 'Qatar'} />
          <KpiLine label="Total IT Capacity" value={base?.total_mw ? base.total_mw + ' MW' : 'N/A'} />
          <KpiLine label="Planned COD" value={base?.planned_cod || 'N/A — Set in Assumptions'} />
          <KpiLine label="Source Compliance Score" value={(base?.source_score ?? 0) + '/100'} />
          <KpiLine label="Data Room Completeness" value={drApproved + '/' + dataRoom.length + ' documents'} />
        </Section>

        <Section title="Financial Summary — Base Case">
          <KpiLine label="Total CAPEX" value={fmtM(proj.total_capex)} />
          <KpiLine label="Equity Required" value={(() => { const eq = (base?.equity_hearst_pct ?? 0) + (base?.equity_brookfield_pct ?? 0) + (base?.equity_qatar_pct ?? 0); return eq > 0 && proj.total_capex ? fmtM(proj.total_capex * eq / 100) : 'N/A'; })()} />
          <KpiLine label="Debt Financing" value={base?.debt_pct ? fmtM(proj.total_capex * base.debt_pct / 100) : 'N/A'} />
          <KpiLine label="Stabilized Annual Revenue" value={fmtM(proj.stabilized_revenue)} />
          <KpiLine label="Stabilized EBITDA" value={fmtM(proj.stabilized_ebitda)} />
          <KpiLine label="Project IRR" value={fmtPct(proj.irr)} />
          <KpiLine label="NPV (10yr, WACC)" value={fmtM(proj.npv)} />
          <KpiLine label="MOIC" value={proj.moic ? proj.moic.toFixed(2) + 'x' : 'N/A'} />
          <KpiLine label="DSCR (Stabilized)" value={proj.dscr_stabilized ? proj.dscr_stabilized.toFixed(2) + 'x' : 'N/A'} />
          <KpiLine label="Payback Period" value={proj.payback_years ? proj.payback_years.toFixed(1) + ' years' : 'N/A'} />
          <KpiLine label="Terminal Value (10yr)" value={fmtM(proj.terminal_value)} />
        </Section>

        {/* Scenario comparison */}
        {scenarios.length > 1 && (
          <Section title="Scenario Comparison">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'left', background: 'var(--color-bg-main)', fontSize: 10 }}>Metric</th>
                  {scenarios.map(sc => <th key={sc.id} style={{ padding: '6px 8px', textAlign: 'center', background: 'var(--color-bg-main)', fontSize: 10 }}>{sc.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'IRR', get: sc => fmtPct(sc.projection?.irr) },
                  { label: 'NPV', get: sc => fmtM(sc.projection?.npv) },
                  { label: 'MOIC', get: sc => sc.projection?.moic ? sc.projection.moic.toFixed(2) + 'x' : 'N/A' },
                  { label: 'DSCR', get: sc => sc.projection?.dscr_stabilized ? sc.projection.dscr_stabilized.toFixed(2) + 'x' : 'N/A' },
                  { label: 'Source Score', get: sc => (sc.source_score ?? 0) + '/100' },
                ].map(row => (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{row.label}</td>
                    {scenarios.map(sc => <td key={sc.id} style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 700 }}>{row.get(sc)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Disclaimers */}
        <Section title="Disclaimers & Source Statement">
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            This report was generated in Source-Backed Evidence Mode. All financial projections are based solely on
            admin-entered inputs, uploaded documents, official public sources, and calculated values derived from those
            sourced inputs. Values marked "N/A — Source Required" have not been estimated or invented. This report does
            not constitute investment advice. Past performance of comparable projects is not indicative of future results.
            All projections are subject to change as inputs are updated and sources are verified.
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: 8 }}>
            Source Compliance Score at time of generation: {base?.source_score ?? 0}/100.
            A score below 70 indicates material inputs remain unsourced and projections should be treated as indicative only.
          </p>
        </Section>
      </div>

      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
  error: { padding: 24, color: '#DC2626', fontSize: 13, background: '#FEF2F2', borderRadius: 6 },
  actions: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' },
  exportBtn: { fontSize: 12, fontWeight: 700, padding: '8px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  hint: { fontSize: 12, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 14px', marginBottom: 20 },
  reportDoc: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border-light)',
    borderRadius: 8, padding: '32px 40px', maxWidth: 820,
  },
  reportHeader: { marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid var(--color-border-light)' },
  reportBadge: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#DC2626', background: '#FEF2F2', padding: '2px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 12 },
  reportTitle: { fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: 4 },
  reportSub: { fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 6 },
  reportDate: { fontSize: 11, color: 'var(--color-text-muted)' },
};
