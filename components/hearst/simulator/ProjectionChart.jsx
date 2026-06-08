'use client';

import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { useContainerSize } from './useContainerSize';
import { RC } from '@/lib/cp-styles';

const CHART_TOOLTIP = { ...RC.tooltip, fontSize: 'var(--cp-font-xs)' };

// Axis/tooltip in $M, promoted to $B past a billion so a 10-yr plan never shows "$1200M".
const fmtAxisM = (v) => Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`;
const fmtTipM = (v) => Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(2)}B` : `$${v.toFixed(1)}M`;

export default function ProjectionChart({ years = [], height = 280 }) {
  const [ref, size] = useContainerSize();

  if (!years.length) {
    return (
      <div style={{ ...S.empty, height }}>
        Run a simulation to view projections.
      </div>
    );
  }

  const data = years.map(y => ({
    year: y.calendar_year || y.year,
    revenue: (y.revenue || 0) / 1e6,
    ebitda: (y.ebitda || 0) / 1e6,
    fcf: (y.free_cash_flow || 0) / 1e6,
    cumFcf: (y.cumulative_fcf || 0) / 1e6,
  }));

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {size.width > 0 && size.height > 0 && (
        <ComposedChart width={size.width} height={size.height} data={data} margin={{ top: 12, right: 24, left: 8, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 'var(--cp-font-xs)', fill: 'var(--cp-text-muted)' }} />
          <YAxis tick={{ fontSize: 'var(--cp-font-xs)', fill: 'var(--cp-text-muted)' }} tickFormatter={fmtAxisM} />
          <Tooltip contentStyle={CHART_TOOLTIP} formatter={fmtTipM} />
          <Legend wrapperStyle={{ ...RC.legend, paddingTop: 'var(--cp-space-2)' }} />
          {/* break-even: where cumulative cash crosses 0 — the year an investor hunts for */}
          <ReferenceLine y={0} stroke="var(--cp-text-faint)" strokeDasharray="2 2" />
          <Area dataKey="cumFcf" name="Cumulative Cash" type="monotone"
            stroke="var(--cp-text-primary)" fill="var(--cp-text-primary)" fillOpacity={0.10} />
          {/* Revenue (volume) muted; Profit (the headline) in bright bordeaux — separated by
              luminosity, not hue, so the chart stays on-charte but the two series read apart. */}
          <Bar dataKey="revenue" name="Revenue" fill="var(--cp-accent-maroon)" opacity={0.55} />
          <Line dataKey="ebitda" name="Yearly Profit" stroke="var(--cp-accent)" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      )}
    </div>
  );
}

const S = {
  empty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-base)', fontStyle: 'italic',
  },
};
