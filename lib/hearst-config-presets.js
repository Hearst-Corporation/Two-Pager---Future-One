// Config-layer presets for the simulator's preset-driven sections.
// Leaf module: imports nothing, imported only by the page / input components.
//
// MODEL_DEFAULTS — per operating-model (archetype) canonical buyer/product pair,
// derived directly from the fit=5 anchors in hearst-fit-matrix.js. Selecting an
// operating-model card applies these so the B2B matrix always highlights an
// on-grid cell (no off-grid combos like sovereign_ai::hyperscalers) and the
// engine never receives an incoherent business_model_id / archetype pairing.

/** Hardware mix presets (colo / mixed / ai_factory). */
export const HARDWARE_PRESETS = [
  {
    id: 'colo',
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

/** Default hardware preset selection on first load. */
export const DEFAULT_HARDWARE_PRESET_ID = 'mixed';

const _defaultHwPreset = HARDWARE_PRESETS.find((p) => p.id === DEFAULT_HARDWARE_PRESET_ID);

/** Canonical initial hardware_mix fields (from the default preset patch). */
export const DEFAULT_HARDWARE_MIX = _defaultHwPreset?.patch ?? HARDWARE_PRESETS[1].patch;

/** True when live mix still matches a preset patch (all simulate-relevant fields). */
export function hardwareMixMatchesPreset(mix, patch) {
  if (!mix || !patch) return false;
  return (
    mix.classic_pct === patch.classic_pct &&
    mix.liquid_pct === patch.liquid_pct &&
    mix.ai_pct === patch.ai_pct &&
    mix.gpu_sku_id === patch.gpu_sku_id &&
    mix.utilization_pct === patch.utilization_pct &&
    mix.gpu_hour_price === patch.gpu_hour_price
  );
}

export const MODEL_DEFAULTS = {
  // powered_shell::hyperscalers fit 5 — INITIAL_STATE anchor (hyperscale_lease).
  powered_shell:          { business_model_id: 'hyperscale_lease', client_type_id: 'hyperscalers' },
  // gpu_cloud::ai_startups fit 5 — Lambda public price anchor.
  neocloud_gpu:           { business_model_id: 'gpu_cloud',        client_type_id: 'ai_startups' },
  // hyperscale_lease::hyperscalers fit 5 — tech-giant partnership has no business
  // model of its own; the long-lease pattern is the natural default.
  hyperscaler_self_build: { business_model_id: 'hyperscale_lease', client_type_id: 'hyperscalers' },
  // sovereign_ai::qatar_gov fit 5 — Qai mandate anchor.
  sovereign_ai:           { business_model_id: 'sovereign_ai',     client_type_id: 'qatar_gov' },
};
