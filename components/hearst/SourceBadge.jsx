'use client';
import { SOURCE_TYPES, MISSING_LABEL } from '@/lib/hearst-constants';

/**
 * Cockpit-aware colour map.
 * The shared SOURCE_TYPES (lib/hearst-constants.js) uses light-DS tokens
 * (var(--color-*)) and raw pastel hex — those leak through as pale pills on
 * the dark glass cockpit. Override locally with --cp-* tokens; labels still
 * come from SOURCE_TYPES so non-cockpit consumers stay untouched.
 */
// Monochrome source palette — differentiation by label only.
// "official_source" gets the single accent (bordeaux) as the highest-trust source.
const SOURCE_TYPES_CP = {
  official_source:   { bg: 'var(--cp-accent-soft)', color: 'var(--cp-accent)'        },
  uploaded_document: { bg: 'var(--cp-surface-2)',   color: 'var(--cp-text-body)'     },
  admin_input:       { bg: 'var(--cp-surface-3)',   color: 'var(--cp-text-primary)'  },
  calculated:        { bg: 'var(--cp-surface-2)',   color: 'var(--cp-text-body)'     },
  contract:          { bg: 'var(--cp-surface-3)',   color: 'var(--cp-text-primary)'  },
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
  if (size === 'xs') return { fontSize: 'var(--cp-font-micro)', padding: 'var(--cp-space-px) var(--cp-space-2)' };
  if (size === 'lg') return { fontSize: 'var(--cp-font-sm)', padding: 'var(--cp-space-1) var(--cp-space-3)' };
  return { fontSize: 'var(--cp-font-micro)', padding: 'var(--cp-space-1) var(--cp-space-2)' };
}

const S = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'var(--cp-radius-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wide)',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
};
