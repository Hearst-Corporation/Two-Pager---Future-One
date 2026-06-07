'use client';
import PropTypes from 'prop-types';

// Card — surface conteneur canonique. Unifie les 3 idiomes concurrents :
// classe CSS `.cp-card`, objet inline `S.card`, et le wrapper de KpiCard.
// S'appuie sur les classes `.cp-card*` (cockpit.css) + padding tokenisé.

const PADDING = {
  sm: 'var(--cp-space-3) var(--cp-space-4)',
  md: 'var(--cp-space-4) var(--cp-space-5)',
  lg: 'var(--cp-space-6)',
};

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.padding='md']
 * @param {boolean} [props.accent]   Keyline/accent (classe .cp-card-accent).
 * @param {boolean} [props.hover]    Élévation au survol (classe .cp-card-hover).
 * @param {'div'|'section'|'article'} [props.as='div']
 * @param {string}  [props.className] Classes additionnelles.
 * @param {object}  [props.style]
 * @param {React.ReactNode} props.children
 */
export default function Card({
  padding = 'md', accent = false, hover = false, as: Tag = 'div', className = '', style, children, ...rest
}) {
  const cls = ['cp-card', accent && 'cp-card-accent', hover && 'cp-card-hover', className]
    .filter(Boolean).join(' ');
  return (
    <Tag className={cls} style={{ padding: PADDING[padding], ...style }} {...rest}>
      {children}
    </Tag>
  );
}

Card.propTypes = {
  padding: PropTypes.oneOf(['sm', 'md', 'lg']),
  accent: PropTypes.bool,
  hover: PropTypes.bool,
  as: PropTypes.oneOf(['div', 'section', 'article']),
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
};
