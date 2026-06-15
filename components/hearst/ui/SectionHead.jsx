'use client';
import PropTypes from 'prop-types';
import Eyebrow from './Eyebrow';

// SectionHead — en-tête de section canonique. Unifie les ~4 variantes inline.
// Défaut = CANON cockpit : H2 11px (--cp-font-xs) CAPS + filet bas + hint italique.
// `hero` = titre page --cp-font-2xl/800 (= .oracle-page-header h1). Tokens --cp-* only.

const S = {
  // Canon (défaut)
  wrap: {
    display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-2)',
    marginBottom: 'var(--cp-space-1)', borderBottom: '1px solid var(--cp-border)', paddingBottom: 'var(--cp-space-hair)',
  },
  title: { margin: 0, fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wider)' },
  hint: { fontSize: 'var(--cp-font-nano)', color: 'var(--cp-text-faint)', fontStyle: 'italic' },
  // Hero
  heroWrap: { display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-3)', flexWrap: 'wrap' },
  numBadge: {
    fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-accent-strong)',
    border: '1px solid var(--cp-border-accent)', borderRadius: 'var(--cp-radius-sm)',
    padding: 'var(--cp-space-1) var(--cp-space-2)', letterSpacing: 'var(--cp-tracking-wide)', flex: 'none',
  },
  heroBody: { display: 'flex', flexDirection: 'column', gap: 'calc(var(--cp-space-1) / 2)', minWidth: 0 },
  heroTitle: { margin: 0, fontSize: 'var(--cp-font-2xl)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', letterSpacing: 'var(--cp-tracking-tight)', lineHeight: 'var(--cp-leading-tight)' },
  heroHint: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)' },
};

/**
 * @param {object} props
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.hint]
 * @param {boolean} [props.hero=false]   Titre page 2xl/800 (sinon canon xs CAPS + filet).
 * @param {string}  [props.num]          Badge index « 01 » (hero only).
 * @param {string}  [props.eyebrow]      Sur-libellé CAPS (hero only).
 * @param {1|2|3} [props.level=2]      Hero page title : passer level={1} pour h1.
 * @param {object} [props.style]
 */
export default function SectionHead({ title, hint, hero = false, num, eyebrow, level = 2, style, ...rest }) {
  const Heading = level === 1 ? 'h1' : level === 3 ? 'h3' : 'h2';
  if (hero) {
    return (
      <div style={{ ...S.heroWrap, ...style }} {...rest}>
        {num && <span style={S.numBadge}>{num}</span>}
        <div style={S.heroBody}>
          {eyebrow && <Eyebrow block>{eyebrow}</Eyebrow>}
          <Heading style={S.heroTitle}>{title}</Heading>
          {hint && <span style={S.heroHint}>{hint}</span>}
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...S.wrap, ...style }} {...rest}>
      <Heading style={S.title}>{title}</Heading>
      {hint && <span style={S.hint}>{hint}</span>}
    </div>
  );
}

SectionHead.propTypes = {
  title: PropTypes.node.isRequired,
  hint: PropTypes.node,
  hero: PropTypes.bool,
  num: PropTypes.string,
  eyebrow: PropTypes.string,
  level: PropTypes.oneOf([1, 2, 3]),
  style: PropTypes.object,
};
