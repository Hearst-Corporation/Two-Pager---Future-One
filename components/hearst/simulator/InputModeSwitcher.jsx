'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';
import { G } from '@/lib/cp-styles';

const MODES = [
  { id: 'capital_first', label: UI.SIM_MODE_BUDGET, unit: UI.SIM_MODE_BUDGET_UNIT },
  { id: 'mw_first', label: UI.SIM_MODE_SIZE, unit: UI.SIM_MODE_SIZE_UNIT },
  { id: 'target_irr_first', label: UI.SIM_MODE_RETURN, unit: UI.SIM_MODE_RETURN_UNIT },
];

const MODE_ICONS = {
  capital_first: (
    <>
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M9.5 9.5c0-1.5 1.1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 2.5-5 2-5 5h5" />
    </>
  ),
  mw_first: (
    <>
      <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />
    </>
  ),
  target_irr_first: (
    <>
      <path d="M4 17l4-4 3 3 5-7 4 4" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </>
  ),
};

function ModeIcon({ id, active }) {
  return (
    <span style={{ ...S.iconBadge, ...(active ? S.iconBadgeActive : {}) }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={S.iconSvg}>
        {MODE_ICONS[id]}
      </svg>
    </span>
  );
}
ModeIcon.propTypes = { id: PropTypes.string, active: PropTypes.bool };

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
            style={{ ...S.segment, ...(active ? { ...G.selected, color: 'var(--cp-text-primary)' } : {}) }}
          >
            <ModeIcon id={m.id} active={active} />
            <span style={S.segmentLabel}>{m.label}</span>
            <span style={{ ...S.segmentUnit, ...(active ? { color: 'var(--cp-text-strong)' } : {}) }}>{m.unit}</span>
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
    gap: 'var(--cp-space-px)',
    padding: 'var(--cp-space-px)',
    background: 'var(--cp-border)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    minHeight: 'var(--cp-tile-minh)',
    flexShrink: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  segment: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--cp-space-1)',
    height: 'auto',
    minHeight: 'var(--cp-tile-minh)',
    padding: 'var(--cp-space-2) var(--cp-space-1)',
    cursor: 'pointer',
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-muted)',
    border: 'none',
    borderRadius: 0,
    transition: 'border-color var(--cp-dur-base) var(--cp-ease)',
  },
  iconBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--cp-control-md)',
    height: 'var(--cp-control-md)',
    borderRadius: 'var(--cp-radius-xs)',
    border: '1px solid var(--cp-border)',
    background: 'var(--cp-surface-1)',
    color: 'var(--cp-text-muted)',
    flexShrink: 0,
  },
  iconBadgeActive: {
    borderColor: 'var(--cp-border-strong)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
  },
  iconSvg: {
    width: 'var(--cp-icon-sm)',
    height: 'var(--cp-icon-sm)',
    strokeWidth: '1.5px',
  },
  segmentLabel: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wide)',
    lineHeight: 'var(--cp-leading-snug)',
    whiteSpace: 'nowrap',
  },
  segmentUnit: {
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-faint)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 'var(--cp-leading-none)',
  },
};
