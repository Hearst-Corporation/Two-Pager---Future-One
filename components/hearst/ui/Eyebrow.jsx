'use client';
import PropTypes from 'prop-types';

// Eyebrow — micro-libellé CAPS au-dessus d'un titre/section. Tokens --cp-* uniquement.
// Remplace les ~4 définitions inline de `EYEBROW`/`eyebrow`/`kicker` dans les pages.

const BASE = {
  fontSize: 'var(--cp-font-micro)',
  fontWeight: 'var(--cp-weight-black)',
  color: 'var(--cp-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--cp-tracking-eyebrow)',
};

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.accent]   Couleur accent au lieu de muted.
 * @param {boolean} [props.block]    display:block + petit margin-bottom.
 * @param {object}  [props.style]    Overrides ponctuels.
 */
export default function Eyebrow({ children, accent = false, block = false, style, ...rest }) {
  return (
    <span
      style={{
        ...BASE,
        color: accent ? 'var(--cp-accent-strong)' : BASE.color,
        ...(block ? { display: 'block', marginBottom: 'var(--cp-space-1)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

Eyebrow.propTypes = {
  children: PropTypes.node,
  accent: PropTypes.bool,
  block: PropTypes.bool,
  style: PropTypes.object,
};
