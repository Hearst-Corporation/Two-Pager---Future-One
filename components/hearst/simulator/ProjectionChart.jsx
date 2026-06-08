'use client';

import { memo } from 'react';
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

/** Round ceiling to a readable $M step for the flows axis. */
function niceCeilM(value, min = 80) {
  if (!Number.isFinite(value) || value <= 0) return min;
  const padded = value * 1.2;
  const step = padded <= 120 ? 20 : padded <= 300 ? 50 : padded <= 600 ? 100 : 200;
  return Math.max(min, Math.ceil(padded / step) * step);
}

function flowsDomain(data) {
  const peak = Math.max(0, ...data.map((d) => Math.max(d.revenue, d.ebitda)));
  return [0, niceCeilM(peak)];
}

function cumDomain(data) {
  const vals = data.map((d) => d.cumFcf);
  const min = Math.min(0, ...vals);
  const max = Math.max(0, ...vals);
  const pad = Math.max(40, (max - min) * 0.06);
  return [min - pad, max + pad];
}

function ProjectionChart({ years = [], height = 280 }) {
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

  const yFlows = flowsDomain(data);
  const yCum = cumDomain(data);

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {size.width > 0 && size.height > 0 && (
        <ComposedChart width={size.width} height={size.height} data={data} margin={{ top: 12, right: 52, left: 8, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 'var(--cp-font-xs)', fill: 'var(--cp-text-muted)' }} />
          {/* Left: annual revenue + profit — own scale so bars/lines are not crushed by exit cash */}
          <YAxis
            yAxisId="flows"
            domain={yFlows}
            tick={{ fontSize: 'var(--cp-font-xs)', fill: 'var(--cp-text-muted)' }}
            tickFormatter={fmtAxisM}
            width={56}
          />
          {/* Right: cumulative cash incl. terminal — full exit range */}
          <YAxis
            yAxisId="cum"
            orientation="right"
            domain={yCum}
            tick={{ fontSize: 'var(--cp-font-xs)', fill: 'var(--cp-accent)' }}
            tickFormatter={fmtAxisM}
            width={52}
          />
          <Tooltip contentStyle={CHART_TOOLTIP} formatter={fmtTipM} />
          <Legend wrapperStyle={{ ...RC.legend, paddingTop: 'var(--cp-space-2)' }} />
          <ReferenceLine yAxisId="flows" y={0} stroke="var(--cp-text-faint)" strokeDasharray="2 2" />
          <ReferenceLine yAxisId="cum" y={0} stroke="var(--cp-accent)" strokeDasharray="2 2" strokeOpacity={0.35} />
          <Area
            yAxisId="cum"
            dataKey="cumFcf"
            name="Cumulative Cash"
            type="monotone"
            stroke="var(--cp-accent)"
            fill="var(--cp-accent)"
            fillOpacity={0.10}
          />
          <Bar yAxisId="flows" dataKey="revenue" name="Revenue" fill="var(--cp-accent-maroon)" opacity={0.55} />
          <Line yAxisId="flows" dataKey="ebitda" name="Yearly Profit" stroke="var(--cp-success)" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      )}
    </div>
  );
}

export default memo(ProjectionChart);

const S = {
  empty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-base)', fontStyle: 'italic',
  },
};
