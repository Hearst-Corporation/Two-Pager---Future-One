'use client';
import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { UI } from '@/lib/ui-strings';
import './simulator-config.css';

// TechPresetControl — 3 presets hardware concrets, RÉ-DÉCLARÉS en local (issus
// de l'ancien mixer orphelin, sans l'importer). Sélectionner une carte dispatch
// SET_HARDWARE_MIX avec le patch du preset ; le reducer merge dans
// state.hardware_mix. Pas d'edit manuel en v1 : la détection « selected »
// compare les 3 pourcentages classic/liquid/ai.

const HW_PRESETS = [
  {
    id: 'colo',
    name: UI.HW_PRESET_COLO_NAME,
    patch: {
      classic_pct: 80,
      liquid_pct: 15,
      ai_pct: 5,
      gpu_sku_id: 'h200_sxm5',
      utilization_pct: 70,
      gpu_hour_price: 2.99,
    },
  },
  {
    id: 'mixed',
    name: UI.HW_PRESET_MIXED_NAME,
    patch: {
      classic_pct: 40,
      liquid_pct: 35,
      ai_pct: 25,
      gpu_sku_id: 'gb200_nvl72',
      utilization_pct: 75,
      gpu_hour_price: 5,
    },
  },
  {
    id: 'ai_factory',
    name: UI.HW_PRESET_AI_NAME,
    patch: {
      classic_pct: 10,
      liquid_pct: 20,
      ai_pct: 70,
      gpu_sku_id: 'gb200_nvl72',
      utilization_pct: 85,
      gpu_hour_price: 5,
    },
  },
];

// Un preset est sélectionné si les 3 pourcentages du state matchent le patch.
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
      {HW_PRESETS.map((p) => {
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
            <span data-tech-name>{p.name}</span>
            <span data-tech-mix>
              {/* fallback littéral : UI.HW_PRESET_MIX_LABEL absent de ui-strings.ts */}
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
