'use client';
import { fmtUSD, fmtPctFromRatio, fmtX, fmtMW, fmtYears, fmtNum, MISSING } from '@/lib/hearst-format';
import Card from './ui/Card';
import SourceBadge from './SourceBadge';

/**
 * Hero KPI card for the HEARST overview and financial pages.
 * value: number|null — null triggers "N/A — Source Required" display.
 * format: 'currency' | 'number' | 'pct' | 'x' | 'years' | 'mw' | 'display'
 */
export default function KpiCard({ label, value, format = 'number', source_type, unit, sublabel, highlight, size = 'md', valueColor, emptyHint }) {
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

  // emptyHint: native tooltip shown only when value is null/undefined (display is "—")
  const titleAttr = value == null && emptyHint ? emptyHint : undefined;

  return (
    <Card
      hover
      accent={!!highlight}
      padding={isSmall ? 'sm' : 'md'}
      style={cardStyle}
      title={titleAttr}
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
    </Card>
  );
}

function formatValue(value, format) {
  if (value == null) return MISSING;
  switch (format) {
    case 'currency': return fmtUSD(value);
    case 'pct':      return fmtPctFromRatio(value);
    case 'x':        return fmtX(value);
    case 'years':    return fmtYears(value);
    case 'mw':       return fmtMW(value);
    case 'display':  return String(value);
    default:         return fmtNum(value);
  }
}

const S = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 'var(--cp-kpi-min-width)',
    minHeight: '80px',
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
    fontVariantNumeric: 'tabular-nums',
  },
  valueSm: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-tight)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
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
