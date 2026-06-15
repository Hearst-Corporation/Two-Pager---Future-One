'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';
import './simulator-config.css';

const MODES = [
  { id: 'capital_first', label: UI.SIM_MODE_BUDGET },
  { id: 'mw_first', label: UI.SIM_MODE_SIZE },
  { id: 'target_irr_first', label: UI.SIM_MODE_RETURN },
];

export default function InputModeSwitcher({ mode, onChange }) {
  return (
    <div data-input-mode-segment role="group" aria-label={UI.SIM_INPUT_MODE_ARIA}>
      {MODES.map((m) => {
        const pressed = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            data-input-mode-option
            aria-pressed={pressed}
            onClick={() => {
              if (pressed) return;
              onChange?.(m.id);
            }}
          >
            {m.label}
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
