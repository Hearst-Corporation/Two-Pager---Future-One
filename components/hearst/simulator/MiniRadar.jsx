'use client';

// Mini-radar SVG inline pour les cards d'archétypes (80×80 ou 100×100).
// Pas de dep, pas de recharts — pour rendre 8 cards × 1 radar à la fois.

const AXES = ['brand', 'bankability', 'speed', 'control', 'margin', 'exit'];

export default function MiniRadar({ scores = {}, size = 88, color = 'var(--cp-accent-maroon)' }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 6;
  const points = AXES.map((axis, i) => {
    const value = scores[axis] || 0;
    const angle = ((i / AXES.length) * 2 * Math.PI) - Math.PI / 2;
    const r = (value / 5) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  // Concentric grid
  const rings = [1, 2, 3, 4, 5].map(level => {
    const r = (level / 5) * maxR;
    const pts = AXES.map((_, i) => {
      const angle = ((i / AXES.length) * 2 * Math.PI) - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    return pts.join(' ');
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r, i) => (
        <polygon key={i} points={r} fill="none" stroke="var(--cp-border)" strokeOpacity={0.4} strokeWidth={0.5} />
      ))}
      {AXES.map((_, i) => {
        const angle = ((i / AXES.length) * 2 * Math.PI) - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)}
            stroke="var(--cp-border)" strokeOpacity={0.3} strokeWidth={0.5}
          />
        );
      })}
      <path d={path} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
