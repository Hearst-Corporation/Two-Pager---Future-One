'use client';

import PropTypes from 'prop-types';
import { SCENARIO_CASES } from '@/lib/hearst-scenario-cases';
import { UI } from '@/lib/ui-strings';

const TONE_BORDER = {
  caution: 'var(--cp-status-warning)',
  neutral: 'var(--cp-border-strong)',
  positive: 'var(--cp-status-success)',
};

/**
 * CaseSwitcher — segmented control for the investment case
 * (Conservative / Base / Upside). Picking a case sets scenario_overrides on the
 * /simulate payload (Base ⇒ live bootstrap, no override).
 *
 * @param {object} props
 * @param {string} props.value active case id
 * @param {(id: string) => void} props.onChange
 */
export default function CaseSwitcher({ value, onChange }) {
  return (
    <div style={S.segmented} role="radiogroup" aria-label={UI.SIM_CASE_ARIA}>
      {SCENARIO_CASES.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(c.id)}
            style={{
              ...S.segment,
              ...(active ? S.segmentActive : {}),
              ...(active ? { borderColor: TONE_BORDER[c.tone] } : {}),
            }}
          >
            <span style={S.label}>{UI[c.labelKey]}</span>
            <span style={{ ...S.sub, ...(active ? S.subActive : {}) }}>{UI[c.subKey]}</span>
          </button>
        );
      })}
    </div>
  );
}

CaseSwitcher.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const S = {
  segmented: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-2)',
    width: '100%',
    minWidth: 0,
  },
  segment: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    cursor: 'pointer',
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    textAlign: 'left',
    transition: 'background var(--cp-dur-base) var(--cp-ease), color var(--cp-dur-base) var(--cp-ease), border-color var(--cp-dur-base) var(--cp-ease)',
    minWidth: 0,
  },
  segmentActive: {
    background: 'var(--cp-surface-3)',
    color: 'var(--cp-text-primary)',
  },
  label: {
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wide)',
    whiteSpace: 'nowrap',
  },
  sub: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-faint)',
    lineHeight: 'var(--cp-leading-snug)',
  },
  subActive: {
    color: 'var(--cp-text-muted)',
  },
};
