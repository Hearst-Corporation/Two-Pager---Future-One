'use client';

import KpiCard from '@/components/hearst/KpiCard';

export default function OutputKpiStrip({ projection }) {
  const p = projection || {};
  const irrHighlight = p.irr != null && p.irr >= 0.15;

  // Task 5: NNN pass-through hint when EBITDA === Revenue (legitimate on triple-net deals)
  const ebitdaSublabel =
    p.stabilized_ebitda != null && p.stabilized_revenue != null && Math.abs(p.stabilized_ebitda - p.stabilized_revenue) < 1
      ? 'NNN pass-through'
      : '/yr';

  return (
    <div style={S.grid}>
      <KpiCard label="Total CAPEX" value={p.total_capex} format="currency" />
      <KpiCard label="Stabilized Revenue" value={p.stabilized_revenue} format="currency" sublabel="/yr" />
      <KpiCard label="Stabilized EBITDA" value={p.stabilized_ebitda} format="currency" sublabel={ebitdaSublabel} />
      <KpiCard label="IRR" value={p.irr} format="pct" />
      <KpiCard label="NPV" value={p.npv} format="currency" />
      <KpiCard label="MOIC" value={p.moic} format="x" />
      <KpiCard
        label="Payback Period"
        value={p.payback_years}
        format="years"
        emptyHint="Exceeds modeled horizon"
      />
      <KpiCard label="DSCR" value={p.dscr_stabilized} format="x" />
      <KpiCard label="Terminal Value" value={p.terminal_value} format="currency" />
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(var(--cp-kpi-min-width, 160px), 1fr))',
    gap: 'var(--cp-space-3, 12px)',
  },
};
