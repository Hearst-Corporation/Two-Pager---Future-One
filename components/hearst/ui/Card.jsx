'use client';
import PropTypes from 'prop-types';

// Card — surface canonique. `variant="card"` peint une vraie carte, `flat`/`bare`
// servent aux conteneurs imbriqués pour éviter les bordures concentriques.
// S'appuie sur les classes `.cp-card*` (cockpit.css) + padding tokenisé.

const PADDING = {
  sm: 'var(--cp-space-3) var(--cp-space-4)',
  md: 'var(--cp-space-4) var(--cp-space-5)',
  lg: 'var(--cp-space-6)',
};

const SURFACES = {
  0: 'cp-surface-0',
  1: 'cp-surface-1',
  2: 'cp-surface-2',
  3: 'cp-surface-3',
};

const VARIANTS = {
  card: 'cp-card',
  flat: 'cp-card cp-card-flat',
  bare: 'cp-card-bare',
};

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.padding='md']
 * @param {0|1|2|3} [props.surface=1]
 * @param {boolean} [props.accent]   Keyline/accent (classe .cp-card-accent).
 * @param {boolean} [props.hover]    Élévation au survol (classe .cp-card-hover).
 * @param {'card'|'flat'|'bare'} [props.variant='card'] Rôle de surface.
 * @param {'div'|'section'|'article'|'button'} [props.as='div']
 * @param {string}  [props.className] Classes additionnelles.
 * @param {object}  [props.style]
 * @param {React.ReactNode} props.children
 */
export default function Card({
  padding = 'md',
  surface = 1,
  accent = false,
  hover = false,
  variant = 'card',
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...rest
}) {
  const isPainted = variant === 'card';
  const isButton = Tag === 'button';
  const cls = [
    VARIANTS[variant] || VARIANTS.card,
    isPainted && SURFACES[surface],
    isPainted && accent ? 'cp-card-accent' : '',
    isPainted && hover ? 'cp-card-hover' : '',
    isButton ? 'cp-card-button' : '',
    className,
  ]
    .filter(Boolean).join(' ');
  const buttonProps = isButton ? { type: rest.type || 'button' } : {};
  return (
    <Tag className={cls} style={{ padding: PADDING[padding], ...style }} {...buttonProps} {...rest}>
      {children}
    </Tag>
  );
}

Card.propTypes = {
  padding: PropTypes.oneOf(['sm', 'md', 'lg']),
  surface: PropTypes.oneOf([0, 1, 2, 3]),
  accent: PropTypes.bool,
  hover: PropTypes.bool,
  variant: PropTypes.oneOf(['card', 'flat', 'bare']),
  as: PropTypes.oneOf(['div', 'section', 'article', 'button']),
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
};
