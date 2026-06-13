'use client';

/**
 * Inline alert banner for HEARST smart alerts.
 * severity: 'critical' | 'warning' | 'info'
 */
export default function AlertBanner({ alerts = [] }) {
  if (!alerts.length) return null;
  return (
    <div style={S.wrap}>
      {alerts.map((a, i) => (
        <div key={a.id || i} style={{ ...S.row, ...severityStyle(a.severity) }}>
          <span style={S.icon} aria-hidden="true">{SeverityIcon(a.severity)}</span>
          <span style={S.msg}>{a.message}</span>
          {a.mitigation && (
            <span style={S.mitigation}>→ {a.mitigation}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Alert severities — critical = danger, warning = status-warning (not brand accent).
function severityStyle(s) {
  if (s === 'critical') return { borderLeftColor: 'var(--cp-error)',         background: 'var(--cp-error-bg)' };
  if (s === 'warning')  return { borderLeftColor: 'var(--cp-status-warning)', background: 'var(--cp-status-warning-soft)' };
  return                       { borderLeftColor: 'var(--cp-border-strong)', background: 'var(--cp-surface-2)' };
}

function SeverityIcon(s) {
  if (s === 'critical') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ color: 'var(--cp-error)' }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (s === 'warning') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ color: 'var(--cp-status-warning)' }}>
      <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ color: 'var(--cp-text-muted)' }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    borderLeft: 'var(--cp-border-w-bar) solid',
    borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  icon: { flexShrink: 0, display: 'flex', alignItems: 'center' },
  msg: {
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-primary)',
  },
  mitigation: {
    color: 'var(--cp-text-muted)',
    marginLeft: 'auto',
    flexShrink: 0,
  },
};
