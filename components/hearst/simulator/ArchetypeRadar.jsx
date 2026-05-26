'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AXES = [
  { key: 'brand',       label: 'Brand visibility' },
  { key: 'bankability', label: 'Easy to finance' },
  { key: 'speed',       label: 'Time to launch' },
  { key: 'control',     label: 'Control' },
  { key: 'margin',      label: 'Margin' },
  { key: 'exit',        label: 'Easy to sell later' },
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
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="var(--cp-border)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--cp-text-muted)', fontSize: 11 }} />
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
          <Tooltip contentStyle={S.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const S = {
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  tooltip: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    fontSize: 11,
    color: 'var(--cp-text-primary)',
  },
};

export { ARCHETYPE_PALETTE };
