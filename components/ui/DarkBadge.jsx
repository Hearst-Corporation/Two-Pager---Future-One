'use client';
/* ============================================================
   OPENCLAW · DARK BADGE
   ------------------------------------------------------------
   Status badge for dark UI. Small, clean, color-coded.
   ============================================================ */

import { TEXT, T, W, LS, SP, ACCENT, STATUS } from '@/lib/design-system/tokens';

const VARIANTS = {
  default: { bg: 'rgba(255,255,255,0.08)', color: TEXT.secondary },
  accent:  { bg: 'rgba(0,183,255,0.12)', color: ACCENT.strong },
  success: { bg: 'rgba(34,197,94,0.12)', color: STATUS.success },
  warning: { bg: 'rgba(245,158,11,0.12)', color: STATUS.warning },
  danger:  { bg: 'rgba(239,68,68,0.12)', color: STATUS.danger },
  info:    { bg: 'rgba(59,130,246,0.12)', color: STATUS.info },
};

export default function DarkBadge({ children, variant = 'default', size = 'sm' }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  const isSmall = size === 'sm';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isSmall ? T.micro : T.mini,
        fontWeight: W.black,
        letterSpacing: LS.caps,
        textTransform: 'uppercase',
        color: v.color,
        background: v.bg,
        padding: isSmall ? `1px ${SP[2]}px` : `${SP[1]}px ${SP[2]}px`,
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
