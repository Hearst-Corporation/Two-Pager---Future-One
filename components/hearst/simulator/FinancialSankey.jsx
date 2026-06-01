'use client';

import { useMemo } from 'react';
import { Sankey, Tooltip } from 'recharts';
import { useContainerSize } from './useContainerSize';

/**
 * Build Sankey data depuis projection + waterfall.
 *
 * Topology (5 colonnes) :
 *   [HEARST/Brookfield/Qai/Debt] → [CAPEX Land/Shell/MEP/Cool/Sub/Grid] → [Total CAPEX]
 *   → [Revenue Colo/AI] → [OPEX/Debt service/EBITDA equity]
 */
function buildSankeyData(scenario, projection) {
  if (!projection || !scenario) {
    return { nodes: [{ name: 'No data' }], links: [] };
  }

  const total_capex = projection.total_capex || 0;
  const stab_rev = projection.stabilized_revenue || 0;
  const stab_ebitda = projection.stabilized_ebitda || 0;
  const stab_opex = Math.max(0, stab_rev - stab_ebitda);
  const stab_debt = (() => {
    if (!projection.years?.length) return 0;
    const stab_year = projection.years.find(y => y.occupancy_pct >= 70) || projection.years[projection.years.length - 1];
    return stab_year?.debt_service || 0;
  })();
  const stab_ebt = Math.max(0.001, stab_ebitda - stab_debt);

  // Equity & debt shares
  const debt_ratio = (scenario.debt_pct || 0) / 100; // debt_pct is 0..100 percent → convert to ratio
  const eq_share_hearst = scenario.equity_hearst_pct || 0;
  const eq_share_bkf = scenario.equity_brookfield_pct || 0;
  const eq_share_qatar = scenario.equity_qatar_pct || 0;
  const total_equity = total_capex * (1 - debt_ratio);
  const total_debt = total_capex * debt_ratio;
  const eq_total_share = eq_share_hearst + eq_share_bkf + eq_share_qatar || 1;
  const eq_hearst = total_equity * (eq_share_hearst / eq_total_share);
  const eq_bkf = total_equity * (eq_share_bkf / eq_total_share);
  const eq_qatar = total_equity * (eq_share_qatar / eq_total_share);

  // Convert to $M for readability
  const M = (v) => Math.max(0.01, v / 1e6);

  const nodes = [
    { name: 'HEARST money',      fill: 'var(--cp-accent-maroon)' },   // 0
    { name: 'Brookfield money',  fill: 'var(--cp-accent)' },          // 1
    { name: 'Qatar money',       fill: 'var(--cp-accent-maroon)' },   // 2
    { name: 'Bank loan',         fill: 'var(--cp-text-muted)' },      // 3
    { name: 'Total Build Cost',  fill: 'var(--cp-text-primary)' },    // 4
    { name: 'Yearly Revenue',    fill: 'var(--cp-accent-maroon)' },   // 5
    { name: 'Running costs',     fill: 'var(--cp-text-muted)' },      // 6
    { name: 'Loan repayments',   fill: 'var(--cp-accent-maroon)' },   // 7
    { name: 'Profit to owners',  fill: 'var(--cp-text-strong)' },     // 8
  ];

  const links = [
    // Sources → CAPEX
    { source: 0, target: 4, value: M(eq_hearst) },
    { source: 1, target: 4, value: M(eq_bkf) },
    { source: 2, target: 4, value: M(eq_qatar) },
    { source: 3, target: 4, value: M(total_debt) },
    // CAPEX → Revenue (proxy : revenu généré annuellement)
    { source: 4, target: 5, value: M(stab_rev) },
    // Revenue → P&L
    { source: 5, target: 6, value: M(stab_opex) },
    { source: 5, target: 7, value: M(stab_debt) },
    { source: 5, target: 8, value: M(stab_ebt) },
  ];

  // Filter out near-zero links to avoid recharts crash
  return { nodes, links: links.filter(l => l.value > 0.01) };
}

function SankeyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const value = item.value != null ? `$${item.value.toFixed(1)}M` : '';
  const label = item.payload?.name || item.name || '';
  const sourceName = item.source?.name || '';
  const targetName = item.target?.name || '';
  return (
    <div style={S.tooltip}>
      {sourceName && targetName ? (
        <div>{sourceName} {'→'} {targetName}: <b>{value}</b></div>
      ) : (
        <div>{label}: <b>{value}</b></div>
      )}
    </div>
  );
}

// Custom node: recharts <Sankey> draws bare rects by default (names appear only
// on hover — useless for a money-flow an investor must read at a glance). This
// renders the node rect PLUS its name + $M value, placed left or right of the bar
// depending on which half it sits in so labels stay inside the frame.
function SankeyNode({ x, y, width, height, payload, chartWidth = 0 }) {
  const rightHalf = x + width / 2 > chartWidth / 2;
  const labelX = rightHalf ? x - 8 : x + width + 8;
  const anchor = rightHalf ? 'end' : 'start';
  const val = payload?.value != null ? `$${Math.round(payload.value)}M` : '';
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={2}
        fill={payload?.fill || 'var(--cp-accent-maroon)'} stroke="var(--cp-border)" />
      <text x={labelX} y={y + height / 2 - 3} textAnchor={anchor}
        fontSize={11} fontWeight={700} fill="var(--cp-text-primary)">{payload?.name}</text>
      <text x={labelX} y={y + height / 2 + 11} textAnchor={anchor}
        fontSize={10} fill="var(--cp-text-muted)">{val}</text>
    </g>
  );
}

export default function FinancialSankey({ scenario, projection, height = 380 }) {
  const [ref, size] = useContainerSize();
  const data = useMemo(() => buildSankeyData(scenario || {}, projection || {}), [scenario, projection]);

  if (!data.links?.length) {
    return (
      <div style={{ ...S.empty, height }}>
        Run a simulation to view capital allocation.
      </div>
    );
  }

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {size.width > 0 && size.height > 0 && (
        <Sankey
          width={size.width}
          height={size.height}
          data={data}
          nodePadding={20}
          nodeWidth={12}
          linkCurvature={0.5}
          iterations={64}
          link={{ stroke: 'var(--cp-border)', strokeOpacity: 0.4 }}
          node={<SankeyNode chartWidth={size.width} />}
        >
          <Tooltip content={<SankeyTooltip />} />
        </Sankey>
      )}
    </div>
  );
}

const S = {
  empty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--cp-text-muted)', fontSize: 13, fontStyle: 'italic',
  },
  tooltip: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 11,
    color: 'var(--cp-text-primary)',
  },
};
