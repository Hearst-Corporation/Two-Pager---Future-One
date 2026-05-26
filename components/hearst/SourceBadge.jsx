'use client';
import { SOURCE_TYPES, MISSING_LABEL } from '@/lib/hearst-constants';

/**
 * Cockpit-aware colour map.
 * The shared SOURCE_TYPES (lib/hearst-constants.js) uses light-DS tokens
 * (var(--color-*)) and raw pastel hex — those leak through as pale pills on
 * the dark glass cockpit. Override locally with --cp-* tokens; labels still
 * come from SOURCE_TYPES so non-cockpit consumers stay untouched.
 */
export const SOURCE_TYPES_CP = {
  official_source:   { bg: 'var(--cp-success-bg)',     color: 'var(--cp-success)'     },
  uploaded_document: { bg: 'var(--cp-info-bg)',        color: 'var(--cp-info)'        },
  admin_input:       { bg: 'var(--cp-warning-bg)',     color: 'var(--cp-warning)'     },
  calculated:        { bg: 'var(--cp-violet-bg)',      color: 'var(--cp-violet)'      },
  contract:          { bg: 'var(--cp-info-strong-bg)', color: 'var(--cp-info-strong)' },
};

/**
 * Shows the source classification of a value.
 * source_type: 'official_source' | 'uploaded_document' | 'admin_input' | 'calculated' | 'contract' | null
 */
export default function SourceBadge({ source_type, size = 'sm' }) {
  if (!source_type) {
    return (
      <span style={{ ...S.badge, ...S.sm, background: 'var(--cp-error-bg)', color: 'var(--cp-error)', ...sizeStyle(size) }}>
        {MISSING_LABEL}
      </span>
    );
  }
  const t = SOURCE_TYPES[source_type];
  if (!t) return null;
  const cp = SOURCE_TYPES_CP[source_type];
  if (!cp) {
    console.error('[SourceBadge] missing cockpit mapping for source_type:', source_type);
  }
  const safeBg = cp?.bg || 'var(--cp-surface-1)';
  const safeColor = cp?.color || 'var(--cp-text-muted)';
  return (
    <span style={{ ...S.badge, background: safeBg, color: safeColor, ...sizeStyle(size) }}>
      {t.label}
    </span>
  );
}

function sizeStyle(size) {
  if (size === 'xs') return { fontSize: 9, padding: '1px 5px' };
  if (size === 'lg') return { fontSize: 12, padding: '4px 10px' };
  return { fontSize: 10, padding: '2px 7px' };
}

const S = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 3,
    fontWeight: 700,
    letterSpacing: 0.3,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
};
