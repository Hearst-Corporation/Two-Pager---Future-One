// app/admin/hearst/utils/constants.js
// Source de vérité unique pour les constantes Hearst partagées entre pages.

// ── Archetypes & géographie ──
export const ARCHETYPES = {
  shell:   'powered_shell',
  compute: 'neocloud_gpu',
  gov:     'sovereign_ai',
};

export const DEFAULT_GEOGRAPHY = 'qatar';

// ── Paramètres par défaut du simulateur ──
export const DEFAULT_SIM_SCALE_MW  = 150;
export const DEFAULT_SIM_AI_MIX_PCT = 50;
export const DEFAULT_SIM_ARCHETYPE  = ARCHETYPES.compute;

// ── Labels de risque (source de vérité — ne pas comparer des strings inline) ──
export const RISK_LABELS = {
  shell:   'Low (secured yield)',
  compute: 'High (merchant compute)',
  gov:     'Low (sovereign backed)',
  default: 'Moderate',
};

// ── Debounce du simulateur ──
export const SIM_DEBOUNCE_MS = 600;

// ── Presets UI simulateur ──
export const SCALE_PRESETS_MW    = [50, 150, 300, 500];
export const AI_MIX_PRESETS_PCT  = [0, 25, 50, 75, 100];

// ── GPU profile (neocloud / AI compute) — branche hardware_mix vers le moteur ──
// Les `id` reflètent lib/hearst-gpu-catalog.js (GPU_CATALOG). Le moteur ne calcule
// un revenu AI que si un gpu_sku_id ET un gpu_hour_price sont fournis : sans ça,
// un scénario AI factory porte le CAPEX GPU mais n'encaisse aucun revenu compute.
export const GPU_SKU_PRESETS = [
  { id: 'h100_sxm5',   label: 'H100' },
  { id: 'h200_sxm5',   label: 'H200' },
  { id: 'gb200_nvl72', label: 'GB200' },
  { id: 'mi300x',      label: 'MI300X' },
];
// $/GPU-heure — repères marché 2025/2026 (Lambda, CoreWeave, RunPod, spot).
export const GPU_HOUR_PRICE_PRESETS = [1.5, 2.5, 3.5, 4.5];

export const DEFAULT_GPU_SKU        = 'h100_sxm5';
export const DEFAULT_GPU_HOUR_PRICE = 2.5;
export const DEFAULT_GPU_UTIL_PCT   = 75;

// ── Pagination ──
export const WORKSPACE_PAGE_SIZE  = 20;
export const FEATURED_DOCS_LIMIT  = 6;
