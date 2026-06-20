'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';

// The three control variables. One is active at a time — it drives the model;
// the other two are shown as computed results in InputFieldHero.
const MODES = [
  { id: 'capital_first',    label: UI.SIM_MODE_BUDGET, unit: UI.SIM_MODE_BUDGET_UNIT },
  { id: 'mw_first',         label: UI.SIM_MODE_SIZE,   unit: UI.SIM_MODE_SIZE_UNIT },
  { id: 'target_irr_first', label: UI.SIM_MODE_RETURN, unit: UI.SIM_MODE_RETURN_UNIT },
];

/**
 * InputModeSwitcher — a single segmented control welded directly above the hero
 * field. Picking a segment only re-labels the field below; it never swaps a panel.
 * @param {object} props
 * @param {string} props.mode active mode id
 * @param {(id: string) => void} props.onChange
 */
export default function InputModeSwitcher({ mode, onChange }) {
  return (
    <div data-input-mode-grid style={S.segmented} role="radiogroup" aria-label={UI.SIM_INPUT_MODE_ARIA}>
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(m.id)}
            style={{ ...S.segment, ...(active ? S.segmentActive : {}) }}
          >
            <span style={S.segmentLabel}>{m.label}</span>
            <span style={{ ...S.segmentUnit, ...(active ? S.segmentUnitActive : {}) }}>{m.unit}</span>
          </button>
        );
      })}
    </div>
  );
}

InputModeSwitcher.propTypes = {
  mode: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const S = {
  segmented: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-1)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-pill)',
    minHeight: 'calc(var(--cp-icon-btn-size) + var(--cp-space-2))',
    flexShrink: 0,
    minWidth: 0,
  },
  segment: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--cp-space-2)',
    height: 'var(--cp-icon-btn-size)',
    padding: '0 var(--cp-space-3)',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid transparent',
    borderRadius: 'var(--cp-radius-pill)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wide)',
    transition: 'background var(--cp-dur-base) var(--cp-ease), color var(--cp-dur-base) var(--cp-ease), border-color var(--cp-dur-base) var(--cp-ease)',
  },
  segmentActive: {
    background: 'var(--cp-surface-3)',
    color: 'var(--cp-text-primary)',
    borderColor: 'var(--cp-border-strong)',
  },
  segmentLabel: {
    whiteSpace: 'nowrap',
  },
  segmentUnit: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-faint)',
    fontVariantNumeric: 'tabular-nums',
  },
  segmentUnitActive: {
    color: 'var(--cp-text-strong)',
    opacity: 'var(--cp-opacity-subtle)',
  },
};
