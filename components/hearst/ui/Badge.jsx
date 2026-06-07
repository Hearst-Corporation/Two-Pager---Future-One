'use client';
import PropTypes from 'prop-types';

// Badge — pastille/label générique. Couvre les cas neutre/accent + statut
// sémantique (success/warning/danger via --cp-status-*). Pour les badges
// MÉTIER spécifiques garder OperatorBadge/SourceBadge. Tokens --cp-* only.

const TONES = {
  neutral: { background: 'var(--cp-surface-3)', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)' },
  accent:  { background: 'var(--cp-accent-soft)', color: 'var(--cp-text-strong)', border: '1px solid var(--cp-accent)' },
  success: { background: 'var(--cp-status-success-soft)', color: 'var(--cp-status-success)', border: '1px solid var(--cp-status-success-border)' },
  warning: { background: 'var(--cp-status-warning-soft)', color: 'var(--cp-status-warning)', border: '1px solid var(--cp-status-warning-border)' },
  danger:  { background: 'var(--cp-status-danger-soft)', color: 'var(--cp-status-danger)', border: '1px solid var(--cp-status-danger-border)' },
};

const BASE = {
  display: 'inline-flex', alignItems: 'center', gap: 'var(--cp-space-1)',
  fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-bold)',
  letterSpacing: 'var(--cp-tracking-eyebrow)', textTransform: 'uppercase',
  padding: '0 var(--cp-space-2)', minHeight: 'var(--cp-badge-size)', borderRadius: 'var(--cp-radius-pill)',
  whiteSpace: 'nowrap',
};

/**
 * @param {object} props
 * @param {'neutral'|'accent'|'success'|'warning'|'danger'} [props.tone='neutral']
 * @param {boolean} [props.pill=true]  Coins arrondis pill (sinon radius-xs).
 * @param {object} [props.style]
 * @param {React.ReactNode} props.children
 */
export default function Badge({ tone = 'neutral', pill = true, style, children, ...rest }) {
  return (
    <span style={{ ...BASE, ...TONES[tone], ...(pill ? {} : { borderRadius: 'var(--cp-radius-xs)' }), ...style }} {...rest}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.oneOf(['neutral', 'accent', 'success', 'warning', 'danger']),
  pill: PropTypes.bool,
  style: PropTypes.object,
  children: PropTypes.node,
};
