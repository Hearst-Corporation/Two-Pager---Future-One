'use client';

import { C, T, W, LS } from '@/lib/admin-tokens';

/**
 * Label — standardised UPPERCASE metadata label.
 * Replaces the repeated { fontSize:10, fontWeight:800, letterSpacing:2.5,
 * textTransform:'uppercase', color:'var(--color-text-muted)' } pattern.
 *
 * Props:
 *   children  ReactNode
 *   size      'xs'|'sm'|'md'     (default 'sm')
 *   color     string CSS value   (default C.textMuted)
 *   as        string HTML tag    (default 'span')
 *   style     object             (merged last)
 */
export default function Label({
  children,
  size = 'sm',
  color,
  as: Tag = 'span',
  style,
}) {
  const sz = SIZE[size] || SIZE.sm;
  return (
    <Tag style={{
      fontSize:      sz.fontSize,
      fontWeight:    sz.fontWeight,
      letterSpacing: sz.letterSpacing,
      textTransform: 'uppercase',
      color:         color || C.textMuted,
      lineHeight:    1,
      ...style,
    }}>
      {children}
    </Tag>
  );
}

const SIZE = {
  xs: { fontSize: T.micro,   fontWeight: W.heavy,   letterSpacing: LS.capsWide },
  sm: { fontSize: T.mini,    fontWeight: W.heavy,   letterSpacing: LS.capsMax  },
  md: { fontSize: T.caption, fontWeight: W.semibold, letterSpacing: LS.caps    },
};
