'use client';
import PropTypes from 'prop-types';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { HARDWARE_PRESETS } from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';

const PRESET_LABEL = {
  colo: UI.HW_PRESET_COLO_NAME,
  mixed: UI.HW_PRESET_MIXED_NAME,
  ai_factory: UI.HW_PRESET_AI_NAME,
};

const PRESET_INFO = {
  colo: UI.HW_PRESET_COLO_INFO,
  mixed: UI.HW_PRESET_MIXED_INFO,
  ai_factory: UI.HW_PRESET_AI_INFO,
};

function isPresetSelected(hardwareMix, preset) {
  if (!hardwareMix) return false;
  return (
    hardwareMix.classic_pct === preset.patch.classic_pct &&
    hardwareMix.liquid_pct === preset.patch.liquid_pct &&
    hardwareMix.ai_pct === preset.patch.ai_pct
  );
}

export default function TechPresetControl({ hardwareMix, dispatch }) {
  const selectedPreset = HARDWARE_PRESETS.find(p => isPresetSelected(hardwareMix, p)) || HARDWARE_PRESETS[1];

  return (
    <div data-master-detail>
      <div data-md-list role="tablist">
        {HARDWARE_PRESETS.map((p) => {
          const selected = isPresetSelected(hardwareMix, p);
          return (
            <button
              key={p.id}
              role="tab"
              onClick={() => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: p.patch })}
              aria-selected={selected}
              data-md-item
              data-selected={selected}
            >
              {PRESET_LABEL[p.id]}
            </button>
          );
        })}
      </div>

      <div data-md-content role="tabpanel">
        <p data-md-narrative>
          {PRESET_INFO[selectedPreset.id]}
        </p>

        <div data-md-ledger>
          <div data-md-ledger-item>
            <span data-md-ledger-k>Standard Compute</span>
            <span data-md-ledger-v>{selectedPreset.patch.classic_pct}%</span>
          </div>
          <div data-md-ledger-item>
            <span data-md-ledger-k>Dense Compute</span>
            <span data-md-ledger-v>{selectedPreset.patch.liquid_pct}%</span>
          </div>
          <div data-md-ledger-item>
            <span data-md-ledger-k>High-Density AI</span>
            <span data-md-ledger-v>{selectedPreset.patch.ai_pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

TechPresetControl.propTypes = {
  hardwareMix: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};
