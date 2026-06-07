'use client';
import PropTypes from 'prop-types';
import Eyebrow from './Eyebrow';

// SectionHead — en-tête de section canonique. Unifie les ~4 variantes inline
// (dossier `SectionHeading`, results `sectionHead`, deals `SectionHead`,
// simulator `boardHead`). Tokens --cp-* uniquement.

const S = {
  wrap: { display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-3)', flexWrap: 'wrap' },
  numBadge: {
    fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-accent-strong)',
    border: '1px solid var(--cp-border-accent)', borderRadius: 'var(--cp-radius-sm)',
    padding: 'var(--cp-space-1) var(--cp-space-2)', letterSpacing: 'var(--cp-tracking-wide)', flex: 'none',
  },
  body: { display: 'flex', flexDirection: 'column', gap: 'calc(var(--cp-space-1) / 2)', minWidth: 0 },
  title: { margin: 0, fontSize: 'var(--cp-font-xl)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', letterSpacing: 'var(--cp-tracking-tight)', lineHeight: 'var(--cp-leading-tight)' },
  hint: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', fontStyle: 'italic' },
};

/**
 * @param {object} props
 * @param {React.ReactNode} props.title    Titre de section (rendu <h2>).
 * @param {string}  [props.num]            Index « 01 » rendu en badge accent.
 * @param {string}  [props.eyebrow]        Sur-libellé CAPS au lieu du badge num.
 * @param {React.ReactNode} [props.hint]   Aide/contexte à droite ou sous le titre.
 * @param {2|3} [props.level=2]            Niveau de titre (h2 par défaut).
 * @param {object} [props.style]
 */
export default function SectionHead({ title, num, eyebrow, hint, level = 2, style, ...rest }) {
  const Heading = level === 3 ? 'h3' : 'h2';
  return (
    <div style={{ ...S.wrap, ...style }} {...rest}>
      {num && <span style={S.numBadge}>{num}</span>}
      <div style={S.body}>
        {eyebrow && <Eyebrow block>{eyebrow}</Eyebrow>}
        <Heading style={S.title}>{title}</Heading>
        {hint && <span style={S.hint}>{hint}</span>}
      </div>
    </div>
  );
}

SectionHead.propTypes = {
  title: PropTypes.node.isRequired,
  num: PropTypes.string,
  eyebrow: PropTypes.string,
  hint: PropTypes.node,
  level: PropTypes.oneOf([2, 3]),
  style: PropTypes.object,
};
