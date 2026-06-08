'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import { useContainerSize } from './useContainerSize';
import { RC } from '@/lib/cp-styles';

const CHART_TOOLTIP = { ...RC.tooltip, fontSize: 'var(--cp-font-xs)' };

const AXES = [
  { key: 'brand',       label: 'Brand Visibility' },
  { key: 'bankability', label: 'Bankability' },
  { key: 'speed',       label: 'Time-to-Market' },
  { key: 'control',     label: 'Operational Control' },
  { key: 'margin',      label: 'Margin' },
  { key: 'exit',        label: 'Exit Liquidity' },
];

// Monochromatic palette — bordeaux + white tints only.
// All archetypes use one of {accent-strong, accent, accent-maroon, text-*}
// to differentiate by tone, never by hue.
const ARCHETYPE_PALETTE = {
  powered_shell:         'var(--cp-accent-maroon)',
  branded_jv:            'var(--cp-accent)',
  manage_only:           'var(--cp-accent-maroon)',
  white_label:           'var(--cp-text-primary)',
  sale_leaseback:        'var(--cp-text-muted)',
  neocloud_gpu:          'var(--cp-accent-maroon)',
  hyperscaler_self_build:'var(--cp-accent-maroon)',
  sovereign_ai:          'var(--cp-text-primary)',
};

export default function ArchetypeRadar({ archetypes = [], highlighted = null, height = 320 }) {
  const [ref, size] = useContainerSize();

  if (!archetypes.length) {
    return (
      <div style={{ ...S.empty, height }}>
        Pick at least one deal model to see its strengths.
      </div>
    );
  }

  // Pivot : un row par axe, columns = archetype.id
  const data = AXES.map(axis => {
    const row = { axis: axis.label };
    for (const a of archetypes) {
      row[a.id] = a.scores?.[axis.key] ?? 0;
    }
    return row;
  });

  const highlightSet = highlighted ? new Set(highlighted) : null;

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {size.width > 0 && size.height > 0 && (
        <RadarChart width={size.width} height={size.height} data={data} outerRadius="78%">
          <PolarGrid stroke="var(--cp-border)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--cp-text-muted)', fontSize: 'var(--cp-chart-tick)' }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} angle={90} tick={false} stroke="var(--cp-border-soft)" />
          {archetypes.map(a => {
            const isHi = !highlightSet || highlightSet.has(a.id);
            const color = ARCHETYPE_PALETTE[a.id] || 'var(--cp-accent-maroon)';
            return (
              <Radar
                key={a.id}
                name={a.label || a.id}
                dataKey={a.id}
                stroke={color}
                fill={color}
                fillOpacity={isHi ? 0.30 : 0.06}
                strokeWidth={isHi ? 2 : 1}
              />
            );
          })}
          <Tooltip contentStyle={CHART_TOOLTIP} />
          <Legend wrapperStyle={{ ...RC.legend, paddingTop: 'var(--cp-space-2)' }} />
        </RadarChart>
      )}
    </div>
  );
}

const S = {
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-base)',
    fontStyle: 'italic',
  },
};

