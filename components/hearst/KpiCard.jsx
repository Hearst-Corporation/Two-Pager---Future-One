'use client';
import { MISSING_LABEL } from '@/lib/hearst-constants';
import SourceBadge from './SourceBadge';

/**
 * Hero KPI card for the HEARST overview and financial pages.
 * value: number|null — null triggers "N/A — Source Required" display.
 * format: 'currency' | 'number' | 'pct' | 'x' | 'years' | 'mw'
 */
export default function KpiCard({ label, value, format = 'number', source_type, unit, sublabel, highlight, size = 'md', valueColor }) {
  const display = formatValue(value, format);
  const isSmall = size === 'sm';

  const cardStyle = isSmall
    ? { ...S.card, padding: 'var(--cp-space-3) var(--cp-space-4)' }
    : S.card;

  const valueStyle = {
    ...(isSmall ? S.valueSm : S.value),
    color: value == null ? 'var(--cp-text-muted)' : (valueColor ?? 'var(--cp-text-strong)'),
  };

  const sublabelStyle = isSmall
    ? { ...S.sublabel, marginTop: 0 }
    : S.sublabel;

  return (
    <div
      className={`cp-card cp-card-hover${highlight ? ' cp-card-accent' : ''}`}
      style={cardStyle}
    >
      <div style={S.label}>{label}</div>
      <div style={valueStyle}>
        {display}
        {unit && value != null && <span style={S.unit}> {unit}</span>}
      </div>
      {sublabel && <div style={sublabelStyle}>{sublabel}</div>}
      {source_type !== undefined && (
        // opacity mutes the badge's own background + text together;
        // switching to `color` alone would leave the badge background at full intensity.
        <div style={{ marginTop: 'var(--cp-space-1)', opacity: 0.7 }}>
          <SourceBadge source_type={source_type} size="xs" />
        </div>
      )}
    </div>
  );
}

function formatValue(value, format) {
  if (value == null) return '—';
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'pct':  return `${(value * 100).toFixed(1)}%`;
    case 'x':    return `${value.toFixed(1)}×`;
    case 'years':return `${value.toFixed(0)}y`;
    case 'mw':   return `${value.toFixed(1)} MW`;
    default:     return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}

const S = {
  card: {
    padding: 'var(--cp-space-4) var(--cp-space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 'var(--cp-kpi-min-width)',
    minHeight: 'var(--cp-space-12)',
  },
  label: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },
  value: {
    fontSize: 'var(--cp-font-2xl)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-tight)',
    lineHeight: 'var(--cp-leading-tight)',
    marginTop: 'var(--cp-space-1)',
    color: 'var(--cp-text-strong)',
  },
  valueSm: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-tight)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-strong)',
  },
  unit: {
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
  },
  sublabel: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    marginTop: 'var(--cp-space-1)',
  },
};
