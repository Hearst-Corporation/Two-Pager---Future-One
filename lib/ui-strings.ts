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
  SIM_PAGE_EYEBROW: 'Oracle capital cockpit',
  SIM_PAGE_TITLE: 'Investment Simulator',
  SIM_PAGE_SUBTITLE: 'Shape a Qatar AI/data-center thesis from capital, operating model and GPU density.',
  SIM_BUILD_BRIEF_EYEBROW: 'Build brief',
  SIM_BUILD_BRIEF_TITLE: 'Set the investment constraint, then size the machine.',
  SIM_BUILD_BRIEF_HINT: 'Pick how the IC wants to think first: budget, power capacity, or target return. The simulator keeps the downstream scenario coherent.',
  SIM_PANEL_START_EYEBROW: 'Starting Point',
  SIM_PANEL_START_TITLE: 'Choose the control variable',
  SIM_PANEL_SIZE_EYEBROW: 'Project Size / Targets',
  SIM_PANEL_SIZE_TITLE: 'Calibrate the initial scenario',
  SIM_OS_EYEBROW: 'Operating thesis',
  SIM_OS_TITLE: 'Operating Model',
  SIM_OS_HINT: 'Choose one operating thesis',
  SIM_HW_EYEBROW: 'Technology stack',
  SIM_HW_TITLE: 'Hardware Allocation',
  SIM_HW_HINT: 'Power mix, rack density and GPU economics',
  SIM_VALIDATE: 'Validate & see results →',
  SIM_SAVING: 'Saving…',
  SIM_SAVING_SCENARIO: 'Saving your scenario…',
  SIM_READY: 'Configuration ready.',
  SIM_FILL: 'Fill in your numbers to run the simulation.',
  SIM_FIX_ERROR: 'Fix the error above to continue.',
  SIM_PROJECT_UNAVAILABLE: 'Project unavailable — see error above.',
  SIM_LOADING_PROJECT: 'Resolving project…',

  // Workspace (scenarios only — reports → Dossier)
  WS_PAGE_SUBTITLE: 'Saved scenarios for this project. Reopen in the Simulator; strategic reports live in',
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

  // Financial
  FIN_PAGE_TITLE: '10-Year Financial Projection',
  FIN_SAVED_PLAN_LABEL: 'Saved plan',
  FIN_SAVED_PLAN_PLACEHOLDER: 'Select a saved scenario…',
  FIN_LOADING: 'Loading financial model…',

  // Errors
  ERR_GENERIC: 'Something went wrong. Please try again.',
  ERR_PROJECT_LOAD: 'Project load failed',
  ERR_PROJECT_TIMEOUT: 'Project load timed out — please refresh.',
  ERR_SAVE: 'Could not save',
  ERR_DELETE: 'Delete failed',
} as const;

export type UIKey = keyof typeof UI;
