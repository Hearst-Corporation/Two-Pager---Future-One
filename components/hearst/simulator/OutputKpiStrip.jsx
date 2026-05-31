'use client';

import KpiCard from '@/components/hearst/KpiCard';

export default function OutputKpiStrip({ projection }) {
  const p = projection || {};
  const irrHighlight = p.irr != null && p.irr >= 0.15;

  return (
    <div style={S.grid}>
      <KpiCard label="Total CAPEX" value={p.total_capex} format="currency" />
      <KpiCard label="Stabilized Revenue" value={p.stabilized_revenue} format="currency" sublabel="/yr" />
      <KpiCard label="Stabilized EBITDA" value={p.stabilized_ebitda} format="currency" sublabel="/yr" />
      <KpiCard label="IRR" value={p.irr} format="pct" />
      <KpiCard label="MOIC" value={p.moic} format="x" />
      <KpiCard label="Payback Period" value={p.payback_years} format="years" />
      <KpiCard label="DSCR" value={p.dscr_stabilized} format="x" />
      <KpiCard label="Terminal Value" value={p.terminal_value} format="currency" />
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 'var(--cp-space-3, 12px)',
  },
};
