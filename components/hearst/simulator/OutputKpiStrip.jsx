'use client';

import KpiCard from '@/components/hearst/KpiCard';

export default function OutputKpiStrip({ projection }) {
  const p = projection || {};
  const irrHighlight = p.irr != null && p.irr >= 0.15;

  return (
    <div style={S.grid}>
      <KpiCard label="Total Build Cost" value={p.total_capex} format="currency" />
      <KpiCard label="Yearly Revenue" value={p.stabilized_revenue} format="currency" sublabel="/yr" />
      <KpiCard label="Yearly Profit" value={p.stabilized_ebitda} format="currency" sublabel="/yr" />
      <KpiCard label="Annual Return" value={p.irr} format="pct" highlight={irrHighlight} />
      <KpiCard label="Money Multiplier" value={p.moic} format="x" />
      <KpiCard label="Years to Break Even" value={p.payback_years} format="years" />
      <KpiCard label="Debt Safety" value={p.dscr_stabilized} format="x" />
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
  },
};
