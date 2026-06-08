'use client';

import PropTypes from 'prop-types';
import { SectionHead, Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// Per-mode driven-field config — the one value the user controls. Budget / return
// are surfaced by the Case Header above, never duplicated here.
const DRIVER = {
  mw_first:         { unit: UI.SIM_MODE_SIZE_UNIT,   parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
  capital_first:    { unit: UI.SIM_MODE_BUDGET_UNIT,  parse: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0, format: (v) => (v ? v.toLocaleString('en-US') : '') },
  target_irr_first: { unit: UI.SIM_MODE_RETURN_UNIT,  parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
};

/**
 * InvestmentSizeStep — SECTION 02 EDITOR. One editable value that drives the case.
 * Demoted to a secondary editor: it changes the Case Header above, it is not the
 * hero. No computed read-out here — budget and return live in the Case Header.
 */
export default function InvestmentSizeStep({ mode, inputValue, onInputChange }) {
  const cfg = DRIVER[mode] || DRIVER.mw_first;
  return (
    <Card as="section" data-sim-size variant="flat" style={S.deck} padding="lg">
      <SectionHead title={UI.SIM_SIZE_TITLE} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }} />
      <div data-sim-size-driver style={S.driver}>
        <input
          type="text"
          value={cfg.format(inputValue)}
          onChange={(e) => onInputChange?.(cfg.parse(e.target.value))}
          placeholder={UI.SIM_FIELD_SIZE_PLACEHOLDER}
          aria-label={UI.SIM_SIZE_TITLE}
          style={S.input}
        />
        <span style={S.unit}>{cfg.unit}</span>
      </div>
    </Card>
  );
}

InvestmentSizeStep.propTypes = {
  mode: PropTypes.string.isRequired,
  inputValue: PropTypes.number,
  onInputChange: PropTypes.func.isRequired,
};

const S = {
  deck: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  driver: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    paddingBottom: 'var(--cp-space-2)',
    borderBottom: '2px solid var(--cp-border-accent)',
    width: 'fit-content',
    minWidth: 120,
  },
  input: {
    width: 'auto',
    minWidth: 0,
    flex: '0 1 auto',
    fontSize: 'var(--cp-font-2xl)',
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
  },
};
