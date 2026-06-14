'use client';
import PropTypes from 'prop-types';

// Button — bouton canonique. Remplace les ~8 variantes inline éparpillées
// (govBtn, useBtn, navBtn, tabBtn, addBtn, validateBtn, secBtn, delBtn).
// Tokens --cp-* uniquement. Rend <button> ou, si href, <a>.

const SIZES = {
  micro: { height: 'var(--cp-control-sm)', padding: '0 var(--cp-space-2)', fontSize: 'var(--cp-font-nano)' },
  sm: { height: '24px', padding: '0 var(--cp-space-3)', fontSize: 'var(--cp-font-micro)' },
  md: { height: '32px', padding: '0 var(--cp-space-4)', fontSize: 'var(--cp-font-xs)' },
  lg: { height: '40px', padding: '0 var(--cp-space-6)', fontSize: 'var(--cp-font-sm)' },
};

const VARIANTS = {
  primary:   { background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: '1px solid var(--cp-accent)' },
  secondary: { background: 'var(--cp-surface-1)', color: 'var(--cp-text-body)', border: '1px solid var(--cp-border)' },
  ghost:     { background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)' },
  muted:     { background: 'var(--cp-surface-3)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)' },
  danger:    { background: 'transparent', color: 'var(--cp-error)', border: '1px solid var(--cp-border)' },
  dangerSolid: { background: 'var(--cp-error)', color: 'var(--cp-text-strong)', border: '1px solid var(--cp-error)' },
  link:      { height: 'auto', padding: 0, background: 'transparent', color: 'var(--cp-accent-maroon)', border: 'none', textDecoration: 'underline', textUnderlineOffset: '2px' },
};

const BASE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--cp-space-2)',
  borderRadius: 'var(--cp-radius-md)', fontWeight: 'var(--cp-weight-bold)', cursor: 'pointer',
  textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit',
  transition: 'background var(--cp-dur-base) var(--cp-ease), border-color var(--cp-dur-base) var(--cp-ease)',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'muted'|'danger'|'dangerSolid'|'link'} [props.variant='secondary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.href]      Si fourni → rend un <a> (lien/PDF/export).
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.block]    width:100%.
 * @param {object} [props.style]
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'secondary', size = 'md', href, disabled = false, block = false, style, className = '', children, ...rest
}) {
  const merged = {
    ...BASE, ...SIZES[size], ...VARIANTS[variant],
    ...(block ? { width: '100%' } : {}),
    ...(disabled ? { opacity: 'var(--cp-opacity-disabled)', cursor: 'not-allowed', pointerEvents: 'none' } : {}),
    ...style,
  };
  const cls = [variant === 'primary' ? 'cp-btn--primary' : '', className].filter(Boolean).join(' ');
  if (href && !disabled) {
    return <a href={href} style={merged} className={cls || undefined} {...rest}>{children}</a>;
  }
  return <button type="button" disabled={disabled} style={merged} className={cls || undefined} {...rest}>{children}</button>;
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'muted', 'danger', 'dangerSolid', 'link']),
  size: PropTypes.oneOf(['micro', 'sm', 'md', 'lg']),
  href: PropTypes.string,
  disabled: PropTypes.bool,
  block: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.node,
};
