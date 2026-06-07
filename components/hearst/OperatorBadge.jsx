'use client';
import { OPERATORS_BY_ID } from '@/lib/hearst-constants';

/**
 * Colored badge/pill for a data center market participant.
 * operatorId: matches OPERATORS[].id from hearst-constants.js
 * size: 'sm' | 'md' | 'lg'
 * showDot: show colored dot only (no name)
 * showName: show name label (default true)
 */
export default function OperatorBadge({ operatorId, size = 'md', showDot = true, showName = true }) {
  const op = OPERATORS_BY_ID[operatorId];
  const color = op ? `var(--cp-op-${operatorId}, var(--cp-op-default))` : 'var(--cp-op-default)';
  const name = op?.name || operatorId || 'Unknown';

  const sz = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <span style={{ ...S.badge, ...sz.badge, borderColor: color }}>
      {showDot && (
        <span style={{ ...S.dot, width: sz.dot, height: sz.dot, background: color, flexShrink: 0 }} />
      )}
      {showName && (
        <span style={{ ...S.label, fontSize: sz.font, color }}>{name}</span>
      )}
    </span>
  );
}

const SIZE_MAP = {
  sm: { badge: { gap: 'var(--cp-space-1)', padding: '1px var(--cp-space-2)', borderRadius: 'var(--cp-radius-xs)' }, dot: 6, font: 'var(--cp-font-micro)' },
  md: { badge: { gap: 'var(--cp-space-2)', padding: 'var(--cp-space-1) var(--cp-space-2)', borderRadius: 'var(--cp-radius-xs)' }, dot: 7, font: 'var(--cp-font-micro)' },
  lg: { badge: { gap: 'var(--cp-space-2)', padding: 'var(--cp-space-1) var(--cp-space-3)', borderRadius: 'var(--cp-radius-sm)' }, dot: 8, font: 'var(--cp-font-sm)' },
};

const S = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--cp-surface-1, rgba(255,255,255,0.04))',
    border: '1px solid',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  dot: {
    borderRadius: '50%',
    display: 'inline-block',
  },
  label: {
    fontWeight: 700,
    letterSpacing: 'var(--cp-tracking-wide)',
    lineHeight: 1,
  },
};
