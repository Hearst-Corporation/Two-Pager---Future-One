'use client';
import { MISSING_LABEL } from '@/lib/hearst-constants';
import { C, T, W, LS } from '@/lib/admin-tokens';
import SourceBadge from './SourceBadge';

/**
 * Hero KPI card for the HEARST overview and financial pages.
 * value: number|null — null triggers "N/A — Source Required" display.
 * format: 'currency' | 'number' | 'pct' | 'x' | 'years' | 'mw'
 */
export default function KpiCard({ label, value, format = 'number', source_type, unit, sublabel, highlight, width }) {
  const display = formatValue(value, format);

  return (
    <div style={{ ...S.card, ...(highlight ? S.cardHighlight : {}), width }}>
      <div style={S.label}>{label}</div>
      <div style={{ ...S.value, color: value == null ? C.textMuted : (highlight ? C.textInverse : C.textPrimary) }}>
        {display}
        {unit && value != null && <span style={S.unit}> {unit}</span>}
      </div>
      {sublabel && <div style={S.sublabel}>{sublabel}</div>}
      {source_type !== undefined && (
        <div style={{ marginTop: 6 }}>
          <SourceBadge source_type={source_type} size="xs" />
        </div>
      )}
    </div>
  );
}

function formatValue(value, format) {
  if (value == null) return MISSING_LABEL;
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'pct':  return `${value.toFixed(1)}%`;
    case 'x':    return `${value.toFixed(1)}×`;
    case 'years':return `${value.toFixed(0)}y`;
    case 'mw':   return `${value.toFixed(1)} MW`;
    default:     return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}

const S = {
  card: {
    background: C.surface,
    border: `1px solid ${C.borderLight}`,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 140,
  },
  cardHighlight: {
    background: 'var(--color-accent-strong)',
    border: '1px solid var(--color-accent-strong)',
    color: C.textInverse,
  },
  label: {
    fontSize: T.caption,
    fontWeight: W.bold,
    letterSpacing: LS.wider,
    textTransform: 'uppercase',
    color: C.textMuted,
  },
  value: {
    fontSize: T.h1,
    fontWeight: W.heavy,
    letterSpacing: -0.5,
    lineHeight: 1.1,
    marginTop: 2,
  },
  unit: {
    fontSize: T.body,
    fontWeight: W.semibold,
    opacity: 0.7,
  },
  sublabel: {
    fontSize: T.caption,
    color: C.textMuted,
    marginTop: 2,
  },
};
