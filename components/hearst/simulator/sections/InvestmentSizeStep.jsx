'use client';

import PropTypes from 'prop-types';
import { SectionHead, Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, MISSING } from '@/lib/hearst-format';

// Per-mode driven-field config — the one value the user controls. The other two
// quantities are always engine-computed (read from the live simResult, never
// invented). Size mode (mw_first) is the default and shows "50 MW" as the driver.
const DRIVER = {
  mw_first:         { unit: UI.SIM_MODE_SIZE_UNIT,   parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
  capital_first:    { unit: UI.SIM_MODE_BUDGET_UNIT,  parse: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0, format: (v) => (v ? v.toLocaleString('en-US') : '') },
  target_irr_first: { unit: UI.SIM_MODE_RETURN_UNIT,  parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
};

/**
 * InvestmentSizeStep — SECTION 02, stripped to the bone. The driven value is one
 * editable number; Budget and Target Return are read straight off the live
 * projection. No segmented control, no quick-start, no labels, no autofill — just:
 *   50 MW  /  Budget $372M  /  Target Return 24%
 */
export default function InvestmentSizeStep({ mode, inputValue, projection, scenario, derived, onInputChange }) {
  const cfg = DRIVER[mode] || DRIVER.mw_first;
  const mw = derived?.mw ?? scenario?.total_mw;
  const budget = projection?.total_capex;
  const irr = projection?.irr;

  return (
    <Card as="section" data-sim-size variant="flat" style={S.deck} padding="lg">
      <SectionHead hero title={UI.SIM_SIZE_TITLE} style={{ marginBottom: 0 }} />

      <div data-sim-size-driver style={S.driver}>
        <input
          type="text"
          value={cfg.format(inputValue)}
          onChange={(e) => onInputChange?.(cfg.parse(e.target.value))}
          placeholder={UI.SIM_FIELD_SIZE_PLACEHOLDER}
          aria-label={UI.SIM_SIZE_TITLE}
          style={S.input}
        />
        <span style={S.unit}>{mode === 'mw_first' ? UI.SIM_MODE_SIZE_UNIT : cfg.unit}</span>
      </div>

      <div data-sim-size-readout style={S.readout}>
        <div style={S.line}>
          <span style={S.lineLabel}>{UI.SIM_RESULT_BUDGET}</span>
          <strong style={S.lineValue}>{budget != null ? fmtUSD(budget) : MISSING}</strong>
        </div>
        <div style={S.line}>
          <span style={S.lineLabel}>{UI.SIM_RESULT_RETURN_LONG}</span>
          <strong style={S.lineValue}>{irr != null ? fmtPctFromRatio(irr) : MISSING}</strong>
        </div>
        {mode !== 'mw_first' && (
          <div style={S.line}>
            <span style={S.lineLabel}>{UI.SIM_RESULT_SIZE}</span>
            <strong style={S.lineValue}>{mw != null ? fmtMW(mw, 0) : MISSING}</strong>
          </div>
        )}
      </div>
    </Card>
  );
}

InvestmentSizeStep.propTypes = {
  mode: PropTypes.string.isRequired,
  inputValue: PropTypes.number,
  projection: PropTypes.object,
  scenario: PropTypes.object,
  derived: PropTypes.object,
  onInputChange: PropTypes.func.isRequired,
};

const S = {
  deck: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  driver: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-3)',
  },
  input: {
    width: 'auto',
    minWidth: 0,
    flex: '0 1 auto',
    fontSize: 'var(--cp-display-input)',
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
    fontSize: 'var(--cp-display-unit)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
  },
  readout: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--cp-space-2) var(--cp-space-8)',
  },
  line: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-3)',
  },
  lineLabel: {
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
  },
  lineValue: {
    fontSize: 'var(--cp-font-xl)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
  },
};
