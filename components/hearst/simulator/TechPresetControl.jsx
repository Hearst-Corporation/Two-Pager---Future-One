'use client';
import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { HARDWARE_PRESETS } from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';

const PRESET_LABEL = {
  colo: UI.HW_PRESET_COLO_NAME,
  mixed: UI.HW_PRESET_MIXED_NAME,
  ai_factory: UI.HW_PRESET_AI_NAME,
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
    <>
      {HARDWARE_PRESETS.map((p) => {
        const selected = isPresetSelected(hardwareMix, p);
        return (
          <Card
            key={p.id}
            as="button"
            variant="card"
            surface={selected ? 2 : 1}
            padding="md"
            hover
            accent={selected}
            onClick={() => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: p.patch })}
            aria-pressed={selected}
            data-tech-card={p.id}
            data-selected={selected}
          >
            <span data-tech-name>{PRESET_LABEL[p.id]}</span>
            <span data-tech-mix>
              {`Classic / Liquid / AI · ${p.patch.classic_pct}/${p.patch.liquid_pct}/${p.patch.ai_pct}`}
            </span>
          </Card>
        );
      })}
    </>
  );
}

TechPresetControl.propTypes = {
  hardwareMix: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};
