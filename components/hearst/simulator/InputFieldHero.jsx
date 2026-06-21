'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// Per-mode config for the driven field (label / unit / placeholder / parse / format).
// Strings come from UI.* — no hardcoded copy. No invented numbers: every computed
// result is read from the live simResult, never derived in the UI.
const MODE_CONFIG = {
  capital_first: {
    label: UI.SIM_FIELD_BUDGET_LABEL,
    unit: UI.SIM_MODE_BUDGET_UNIT,
    placeholder: UI.SIM_FIELD_BUDGET_PLACEHOLDER,
    description: UI.SIM_FIELD_BUDGET_DESC,
    parseValue: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0,
    formatValue: (v) => (!v ? '' : v.toLocaleString('en-US')),
  },
  mw_first: {
    label: UI.SIM_FIELD_SIZE_LABEL,
    unit: UI.SIM_MODE_SIZE_UNIT,
    placeholder: UI.SIM_FIELD_SIZE_PLACEHOLDER,
    description: UI.SIM_FIELD_SIZE_DESC,
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
  target_irr_first: {
    label: UI.SIM_FIELD_RETURN_LABEL,
    unit: UI.SIM_MODE_RETURN_UNIT,
    placeholder: UI.SIM_FIELD_RETURN_PLACEHOLDER,
    description: UI.SIM_FIELD_RETURN_DESC,
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
};

/**
 * InputFieldHero — the driven number for the active mode (your choice input only).
 * Computed results (Size / Budget / IRR) have been moved to InvestmentResultSummary.
 */
export default function InputFieldHero({ mode, value, onChange, embedded = false }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.mw_first;

  const body = (
    <div data-brief-bar-row style={S.row}>
      {/* Driven field — the one number the user controls */}
      <div style={S.fieldCol}>
        <div style={S.choiceTag} title={`${UI.SIM_YOUR_CHOICE} · ${cfg.label}`}>
          {UI.SIM_YOUR_CHOICE} · {cfg.label}
        </div>
        <div style={S.inputRow}>
          <input
            type="text"
            value={cfg.formatValue(value)}
            onChange={(e) => onChange?.(cfg.parseValue(e.target.value))}
            placeholder={cfg.placeholder}
            style={S.input}
          />
          <span style={S.unit}>{cfg.unit}</span>
        </div>
        <div style={S.desc}>{cfg.description}</div>
      </div>
    </div>
  );

  if (embedded) {
    return <div data-sim-input-hero style={S.bar}>{body}</div>;
  }

  return (
    <Card surface={0} padding="lg" style={S.bar}>
      {body}
    </Card>
  );
}

InputFieldHero.propTypes = {
  mode: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  embedded: PropTypes.bool,
};

const S = {
  bar: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  row: {
    display: 'grid',
    alignItems: 'stretch',
    minHeight: '100%',
    minWidth: 0,
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    justifyContent: 'flex-start',
    minWidth: 0,
    minHeight: '100%',
  },
  choiceTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-accent-maroon)',
    textTransform: 'uppercase',
    minHeight: '2.75em',
    lineHeight: 'var(--cp-leading-tight)',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    paddingBottom: 'var(--cp-space-2)',
    borderBottom: '2px solid var(--cp-border-accent)',
    minHeight: 'var(--cp-space-12)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 'var(--cp-display-input)',
    lineHeight: 'var(--cp-space-12)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    minWidth: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  unit: {
    fontSize: 'var(--cp-display-unit)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
  },
  desc: {
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-muted)',
    minHeight: 'calc(var(--cp-leading-tight) * 2 * 1em)',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
};
