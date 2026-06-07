// @enable-adrien:layer=front-cockpit v=1
// ui-strings.ts — source de vérité pour les strings UI visibles par l'utilisateur.
// Importer UI.* dans les composants au lieu de strings en dur.
// Ajout de clés : additif uniquement (ne jamais réécrire une valeur existante).

export const UI = {
  // Navigation
  NAV_SIMULATOR: 'Simulator',
  NAV_FINANCIAL: 'Financial',
  NAV_DEALS: 'Deals',
  NAV_WORKSPACE: 'Workspace',
  NAV_DOSSIER: 'Dossier',
  NAV_SOURCES: 'Sources',

  // Actions génériques
  ACTION_SAVE: 'Save',
  ACTION_DELETE: 'Delete',
  ACTION_CANCEL: 'Cancel',
  ACTION_RETRY: 'Retry',
  ACTION_CONFIRM: 'Confirm',
  ACTION_OPEN: 'Open',
  ACTION_EXPORT: 'Export',
  ACTION_GENERATE: 'Generate',

  // États
  STATE_LOADING: 'Loading…',
  STATE_SAVING: 'Saving…',
  STATE_CALCULATING: 'Calculating…',
  STATE_ERROR: 'An error occurred',

  // Simulator
  SIM_VALIDATE: 'Validate & see results →',
  SIM_SAVING: 'Saving…',
  SIM_READY: 'Configuration ready.',
  SIM_FILL: 'Fill in your numbers to run the simulation.',
  SIM_FIX_ERROR: 'Fix the error above to continue.',
  SIM_PROJECT_UNAVAILABLE: 'Project unavailable — see error above.',
  SIM_LOADING_PROJECT: 'Loading project…',

  // Workspace
  WS_NO_SCENARIOS: 'No saved scenarios yet. Build one in the Simulator and click "Save this plan".',
  WS_NO_REPORTS: 'No reports yet. Generate a strategic memo from the Simulator.',
  WS_DELETE_CONFIRM: (name: string) => `Delete scenario "${name}"? This cannot be undone.`,

  // Sources
  SOURCES_NO_DATA: 'No sources found.',
  SOURCES_ADD: 'Add source',
  SOURCES_DELETE_CONFIRM: 'Delete this source? This cannot be undone.',

  // Dossier
  DOSSIER_NO_REPORTS: 'No reports for this scenario yet. Generate a strategic memo from the',
  DOSSIER_NO_RISKS: 'No risks logged.',
  DOSSIER_NO_VERSIONS: 'No versions.',
  DOSSIER_GO_SIMULATOR: 'the Simulator',

  // Errors
  ERR_GENERIC: 'Something went wrong. Please try again.',
  ERR_PROJECT_LOAD: 'Project load failed',
  ERR_PROJECT_TIMEOUT: 'Project load timed out — please refresh.',
  ERR_SAVE: 'Could not save',
  ERR_DELETE: 'Delete failed',
} as const;

export type UIKey = keyof typeof UI;
