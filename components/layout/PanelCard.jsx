'use client';
/* ============================================================
   OPENCLAW · PANEL CARD
   ------------------------------------------------------------
   Reusable dark card component for panels.
   Glassmorphism, subtle borders, hover states.
   ============================================================ */

import { CARD, TEXT, SP, T, W } from '@/lib/design-system/tokens';

export default function PanelCard({ title, children, padding, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...S.card,
        padding: padding != null ? padding : `${SP[4]}px`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {title && <div style={S.title}>{title}</div>}
      {children}
    </div>
  );
}

const S = {
  card: {
    background: CARD.bg,
    border: `1px solid ${CARD.border}`,
    borderRadius: CARD.radius,
    transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  },
  title: {
    fontSize: T.small,
    fontWeight: W.bold,
    color: TEXT.primary,
    marginBottom: `${SP[3]}px`,
  },
};
