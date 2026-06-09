'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';

const DRIVER = {
  mw_first:         { unit: UI.SIM_MODE_SIZE_UNIT,   parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
  capital_first:    { unit: UI.SIM_MODE_BUDGET_UNIT,  parse: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0, format: (v) => (v ? v.toLocaleString('en-US') : '') },
  target_irr_first: { unit: UI.SIM_MODE_RETURN_UNIT,  parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
};

export default function InvestmentSizeStep({ mode, inputValue, onInputChange }) {
  const cfg = DRIVER[mode] || DRIVER.mw_first;
  
  return (
    <div data-sim-size style={S.driver}>
      <input
        type="text"
        value={cfg.format(inputValue)}
        onChange={(e) => onInputChange?.(cfg.parse(e.target.value))}
        placeholder={UI.SIM_FIELD_SIZE_PLACEHOLDER}
        style={S.input}
      />
      <span style={S.unit}>{cfg.unit}</span>
    </div>
  );
}

InvestmentSizeStep.propTypes = {
  mode: PropTypes.string.isRequired,
  inputValue: PropTypes.number,
  onInputChange: PropTypes.func.isRequired,
};

const S = {
  driver: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    padding: '0 0 var(--cp-space-2)',
    borderBottom: '2px solid var(--cp-border-accent)',
    width: '100%',
    minWidth: 0,
  },
  input: {
    width: '100%',
    minWidth: 0,
    flex: '1 1 auto',
    fontSize: 'clamp(var(--cp-font-2xl), 3vw, 40px)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    fontVariantNumeric: 'tabular-nums',
  },
  unit: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
    paddingBottom: 'var(--cp-space-2)',
  },
};
