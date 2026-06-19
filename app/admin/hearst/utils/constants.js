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

// ── Pagination ──
export const WORKSPACE_PAGE_SIZE  = 20;
export const FEATURED_DOCS_LIMIT  = 6;
