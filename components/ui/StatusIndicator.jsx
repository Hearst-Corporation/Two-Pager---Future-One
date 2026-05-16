'use client';
/* ============================================================
   OPENCLAW · STATUS INDICATOR
   ------------------------------------------------------------
   Dot indicator with optional glow. For online/offline/active states.
   ============================================================ */

import { STATUS, ACCENT } from '@/lib/design-system/tokens';

const VARIANTS = {
  online:  { color: STATUS.success, glow: 'rgba(34,197,94,0.30)' },
  away:    { color: STATUS.warning, glow: 'rgba(245,158,11,0.30)' },
  offline: { color: '#64748b', glow: 'transparent' },
  busy:    { color: STATUS.danger, glow: 'rgba(239,68,68,0.30)' },
  active:  { color: ACCENT.main, glow: 'rgba(0,183,255,0.30)' },
};

export default function StatusIndicator({ variant = 'online', size = 8, pulse = false }) {
  const v = VARIANTS[variant] || VARIANTS.online;
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: v.color,
        boxShadow: `0 0 ${size}px ${v.glow}`,
        animation: pulse ? 'oc-pulse 2s ease-in-out infinite' : 'none',
      }}
    />
  );
}
