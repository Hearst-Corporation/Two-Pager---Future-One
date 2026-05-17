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
  sm: { badge: { gap: 4, padding: '1px 6px', borderRadius: 3 }, dot: 6, font: 9 },
  md: { badge: { gap: 5, padding: '3px 8px', borderRadius: 4 }, dot: 7, font: 10 },
  lg: { badge: { gap: 6, padding: '4px 10px', borderRadius: 5 }, dot: 8, font: 12 },
};

const S = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid',
    whiteSpace: 'nowrap',
    fontFamily: '"Inter", sans-serif',
  },
  dot: {
    borderRadius: '50%',
    display: 'inline-block',
  },
  label: {
    fontWeight: 700,
    letterSpacing: 0.2,
    lineHeight: 1,
  },
};
