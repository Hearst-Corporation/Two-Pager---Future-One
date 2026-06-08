'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Gauge } from 'lucide-react';
import { SectionHead, Card, Button } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// Per-mode driven-field config — the one value the user controls. The case's
// size / budget / return live in the Case Header; this is just the input.
const DRIVER = {
  mw_first:         { unit: UI.SIM_MODE_SIZE_UNIT,   parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
  capital_first:    { unit: UI.SIM_MODE_BUDGET_UNIT,  parse: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0, format: (v) => (v ? v.toLocaleString('en-US') : '') },
  target_irr_first: { unit: UI.SIM_MODE_RETURN_UNIT,  parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
};

/**
 * InvestmentSizeStep — SECTION EDITOR, collapsed by default. The case's capacity
 * is shown by the Case Header; the input field is an editor the board opens only
 * when it wants to resize. Outputs are the case; controls are editors.
 */
export default function InvestmentSizeStep({ mode, inputValue, onInputChange }) {
  const [open, setOpen] = useState(true);
  const cfg = DRIVER[mode] || DRIVER.mw_first;
  return (
    <Card as="section" data-sim-size variant="flat" style={S.deck} padding="lg">
      <div style={S.head}>
        <div style={S.titleGroup}>
          <span style={S.icon} aria-hidden="true"><Gauge size={18} strokeWidth={1.8} /></span>
          <SectionHead title={UI.SIM_SIZE_TITLE} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }} />
        </div>
        <Button
          variant={open ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="sim-size-editor"
        >
          {open ? UI.SIM_SIZE_DONE : UI.SIM_SIZE_CHANGE}
        </Button>
      </div>

      {open && (
        <div id="sim-size-editor" data-sim-size-driver style={S.driver}>
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
      )}
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
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    flex: '0 0 36px',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-md)',
  },
  driver: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    padding: 'var(--cp-space-5) 0 var(--cp-space-3)',
    borderBottom: '2px solid var(--cp-border-accent)',
    width: '100%',
    minWidth: 0,
  },
  input: {
    width: '100%',
    minWidth: 0,
    flex: '1 1 auto',
    fontSize: 'clamp(32px, 4vw, 56px)',
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
