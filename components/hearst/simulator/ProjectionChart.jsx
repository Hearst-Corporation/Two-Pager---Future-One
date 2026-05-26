'use client';

import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function ProjectionChart({ years = [], height = 280 }) {
  if (!years.length) {
    return (
      <div style={{ ...S.empty, height }}>
        Fill in your numbers above to see the projection.
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
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--cp-text-muted)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--cp-text-muted)' }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
          <Tooltip contentStyle={S.tooltip} formatter={(v) => `$${v.toFixed(1)}M`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area dataKey="cumFcf" name="Cumulative Cash" type="monotone"
            stroke="var(--cp-text-primary)" fill="var(--cp-text-primary)" fillOpacity={0.10} />
          <Bar dataKey="revenue" name="Revenue" fill="var(--cp-accent-maroon)" opacity={0.85} />
          <Line dataKey="ebitda" name="Yearly Profit" stroke="var(--cp-accent-maroon)" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
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
    fontSize: 11,
    color: 'var(--cp-text-primary)',
  },
};
