'use client';

import { C } from '@/lib/admin-tokens';

/**
 * Inline alert banner for HEARST smart alerts.
 * severity: 'critical' | 'warning' | 'info'
 */
export default function AlertBanner({ alerts = [], compact }) {
  if (!alerts.length) return null;
  return (
    <div style={S.wrap}>
      {alerts.map((a, i) => (
        <div key={a.id || i} style={{ ...S.row, ...severityStyle(a.severity) }}>
          <span style={S.icon}>{severityIcon(a.severity)}</span>
          <span style={S.msg}>{a.message}</span>
          {a.mitigation && !compact && (
            <span style={S.mitigation}>→ {a.mitigation}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function severityStyle(s) {
  if (s === 'critical') return { borderLeftColor: C.error,   background: C.errorBg   };
  if (s === 'warning')  return { borderLeftColor: C.warning, background: C.warningBg };
  return                       { borderLeftColor: C.info,    background: C.infoBg    };
}

function severityIcon(s) {
  if (s === 'critical') return '⛔';
  if (s === 'warning')  return '⚠️';
  return 'ℹ️';
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 12px',
    borderLeft: '3px solid',
    fontSize: 12,
  },
  icon: { flexShrink: 0, marginTop: 1 },
  msg: { fontWeight: 600, color: C.textPrimary },
  mitigation: { color: C.textMuted, marginLeft: 'auto', flexShrink: 0 },
};
