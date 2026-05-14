'use client';
/* ============================================================
   OPENCLAW · RIGHT CONTEXT PANEL
   ------------------------------------------------------------
   Fixed-width right panel for secondary info, metrics,
   details, and contextual actions. Scrolls internally.
   ============================================================ */

import { BG, CARD, TEXT, SP, T, W, LS, BORDER, ACCENT, STATUS } from '@/lib/design-system/tokens';

export default function RightContextPanel({ header, children }) {
  return (
    <div style={S.panel}>
      {header && (
        <div style={S.header}>
          {header}
        </div>
      )}
      <div style={S.scroll}>
        {children}
      </div>
    </div>
  );
}

/** Metric card for the right panel */
export function MetricCard({ label, value, unit, trend, trendUp }) {
  return (
    <div style={S.metricCard}>
      <div style={S.metricLabel}>{label}</div>
      <div style={S.metricValueRow}>
        <span style={S.metricValue}>{value}</span>
        {unit && <span style={S.metricUnit}>{unit}</span>}
      </div>
      {trend && (
        <div style={{
          ...S.metricTrend,
          color: trendUp ? STATUS.success : STATUS.danger,
        }}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  );
}

/** Action button for the right panel */
export function PanelAction({ label, icon, onClick, variant = 'default' }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      style={{
        ...S.actionBtn,
        ...(isPrimary ? S.actionBtnPrimary : {}),
      }}
    >
      {icon && <span style={S.actionIcon}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

const S = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    flexShrink: 0,
    padding: `${SP[4]}px ${SP[5]}px`,
    borderBottom: `1px solid ${BORDER.color}`,
    background: `linear-gradient(180deg, ${BG.elevated} 0%, transparent 100%)`,
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: `${SP[4]}px ${SP[5]}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${SP[4]}px`,
  },
  metricCard: {
    background: CARD.bg,
    border: `1px solid ${CARD.border}`,
    borderRadius: CARD.radiusSm,
    padding: `${SP[4]}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${SP[2]}px`,
    transition: 'border-color 0.15s ease, background 0.15s ease',
  },
  metricLabel: {
    fontSize: T.mini,
    fontWeight: W.black,
    letterSpacing: LS.caps,
    color: TEXT.muted,
    textTransform: 'uppercase',
  },
  metricValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: `${SP[2]}px`,
  },
  metricValue: {
    fontSize: T.statS,
    fontWeight: W.black,
    color: TEXT.primary,
    letterSpacing: LS.tight,
  },
  metricUnit: {
    fontSize: T.small,
    fontWeight: W.semibold,
    color: TEXT.secondary,
  },
  metricTrend: {
    fontSize: T.caption,
    fontWeight: W.bold,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${SP[2]}px`,
    width: '100%',
    padding: `${SP[3]}px ${SP[4]}px`,
    borderRadius: CARD.radiusSm,
    background: CARD.bg,
    border: `1px solid ${CARD.border}`,
    color: TEXT.secondary,
    fontSize: T.body,
    fontWeight: W.semibold,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background 0.12s ease, border-color 0.12s ease, color 0.12s ease',
  },
  actionBtnPrimary: {
    background: ACCENT.main,
    borderColor: ACCENT.main,
    color: TEXT.inverse,
    boxShadow: `0 0 16px ${ACCENT.glow}`,
  },
  actionIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
  },
};
