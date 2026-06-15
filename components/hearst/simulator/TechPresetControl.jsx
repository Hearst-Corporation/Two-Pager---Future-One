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
  return (
    <div data-focus-stage>
      {HARDWARE_PRESETS.map((p) => {
        const selected = isPresetSelected(hardwareMix, p);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: p.patch })}
            aria-pressed={selected}
            data-focus-item
            data-focused={selected ? 'true' : undefined}
            data-dimmed={!selected ? 'true' : undefined}
          >
            <div data-focus-title>{PRESET_LABEL[p.id]}</div>

            <div data-focus-detail>
              <p className="archetype-ideal-for">{PRESET_INFO[p.id]}</p>
              <div className="archetype-meta-row">
                <div>
                  <span className="archetype-meta-label">{UI.SIM_HW_STANDARD}</span>
                  <span className="archetype-meta-value">{p.patch.classic_pct}%</span>
                </div>
                <div>
                  <span className="archetype-meta-label">{UI.SIM_HW_HIGH_DENSITY}</span>
                  <span className="archetype-meta-value">{p.patch.ai_pct}%</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

TechPresetControl.propTypes = {
  hardwareMix: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};
