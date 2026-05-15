'use client';
import { SOURCE_TYPES, MISSING_LABEL } from '@/lib/hearst-constants';

/**
 * Shows the source classification of a value.
 * source_type: 'official_source' | 'uploaded_document' | 'admin_input' | 'calculated' | 'contract' | null
 */
export default function SourceBadge({ source_type, size = 'sm' }) {
  if (!source_type) {
    return (
      <span style={{ ...S.badge, ...S.sm, background: '#FEE2E2', color: '#DC2626', ...sizeStyle(size) }}>
        {MISSING_LABEL}
      </span>
    );
  }
  const t = SOURCE_TYPES[source_type];
  if (!t) return null;
  return (
    <span style={{ ...S.badge, background: t.bg, color: t.color, ...sizeStyle(size) }}>
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
    fontFamily: '"Inter", sans-serif',
    whiteSpace: 'nowrap',
  },
};
