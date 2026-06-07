'use client';
import PropTypes from 'prop-types';

// Field — libellé + contrôle (input/select/textarea/number). Remplace les blocs
// fieldLabel + input/select/textarea inline du CRUD `sources`. Tokens --cp-* only.

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  label: { fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-muted)' },
  control: {
    width: '100%', padding: 'var(--cp-space-2) var(--cp-space-3)', fontSize: 'var(--cp-font-sm)',
    border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-xs)',
    background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  textarea: { minHeight: 'calc(var(--cp-space-12) + var(--cp-space-2))', resize: 'vertical' },
};

/**
 * @param {object} props
 * @param {string}  props.label
 * @param {'text'|'number'|'url'|'date'|'select'|'textarea'} [props.type='text']
 * @param {boolean} [props.required]
 * @param {Array<{value:string,label:string}|string>} [props.options]  Pour type='select'.
 * @param {object}  [props.style]   Style du wrapper.
 * @param {object}  [props.controlStyle]  Style du contrôle.
 *  Les autres props (value, onChange, placeholder…) sont passées au contrôle.
 */
export default function Field({ label, type = 'text', required = false, options = [], style, controlStyle, ...rest }) {
  const cs = { ...S.control, ...(type === 'textarea' ? S.textarea : {}), ...controlStyle };
  let control;
  if (type === 'select') {
    control = (
      <select style={cs} {...rest}>
        {options.map(o => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    );
  } else if (type === 'textarea') {
    control = <textarea style={cs} {...rest} />;
  } else {
    control = <input type={type} style={cs} {...rest} />;
  }
  return (
    <label style={{ ...S.wrap, ...style }}>
      {label && <span style={S.label}>{label}{required && ' *'}</span>}
      {control}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'number', 'url', 'date', 'select', 'textarea']),
  required: PropTypes.bool,
  options: PropTypes.array,
  style: PropTypes.object,
  controlStyle: PropTypes.object,
};
