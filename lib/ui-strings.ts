// @enable-adrien:layer=front-cockpit v=1
// ui-strings.ts — source de vérité pour les strings UI visibles par l'utilisateur.
// Importer UI.* dans les composants au lieu de strings en dur.
// Ajout de clés : additif uniquement (ne jamais réécrire une valeur existante).

export const UI = {
  // Navigation
  NAV_RAIL_ARIA: 'Hearst cockpit sections',
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

  // Assistant chat (FAB mobile)
  CHAT_OPEN: 'Open assistant',
  CHAT_CLOSE: 'Close assistant',

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
  SIM_READY_SCENARIOS: 'Ready scenarios',
  SIM_WHAT_TO_CHANGE: 'What to change',
  SIM_INPUT_MODE_ARIA: 'Input mode',
  B2B_TH_CORNER: 'What we sell',
  HW_TOPOLOGY_ARIA: 'Hardware allocation topology',
  HW_GPU_UTIL_ARIA: 'AI chip utilization percentage',
  SIM_VALIDATE: 'Validate & see results →',
  SIM_SAVING: 'Saving…',
  SIM_SAVING_SCENARIO: 'Saving your scenario…',
  SIM_READY: 'Configuration ready.',
  SIM_FILL: 'Fill in your numbers to run the simulation.',
  SIM_FIX_ERROR: 'Fix the error above to continue.',
  SIM_PROJECT_UNAVAILABLE: 'Project unavailable — see error above.',
  SIM_LOADING_PROJECT: 'Resolving project…',
  RESULTS_LOADING_SCENARIO: 'Running scenario…',
  RESULTS_LOADING_ECOSYSTEM: 'Loading industry players…',
  RESULTS_LOADING_SANKEY: 'Loading money flow…',
  RESULTS_SCENARIO_SAVED: 'Scenario already saved',
  RESULTS_RISK_NOTE: 'Debt coverage sits below returns in the hierarchy.',
  RESULTS_CTA_FILL: 'Fill in your numbers to generate a plan',
  RESULTS_CTA_PLAN_READY: 'Plan ready',
  RESULTS_CTA_PLAN_REVIEW: 'Plan needs review',
  RESULTS_CTA_EXPORT: 'Export Summary',
  RESULTS_CTA_SAVE: 'Save Scenario',
  RESULTS_CTA_MEMO: 'Generate Strategic Memo',
  RESULTS_VERDICT_INSUFFICIENT: 'Insufficient data',
  RESULTS_VERDICT_NO_DATA: 'NO DATA',

  // Deals
  DEALS_NAV_ARIA: 'Deal models sections',
  DEALS_CALLOUT_SOVEREIGN: 'The sovereign rule',
  DEALS_CALLOUT_LOCAL: 'Implication for a local deal (a hub like Futur One)',
  DEALS_CLOSING_BOLD: 'The central reflex:',
  DEALS_CLOSING_BODY: 'value is not captured at the equity line alone. The operator keeps 20% but pockets recurring development + operations fees, and whoever holds land + power controls the bottleneck. Knowing which role you play determines what you negotiate.',

  // Workspace (scenarios only — reports → Dossier)
  WS_PAGE_SUBTITLE: 'Saved scenarios for this project. Reopen in the Simulator; strategic reports live in',
  WS_NO_SCENARIOS: 'No saved scenarios yet. Build one in the Simulator and click "Save this plan".',
  WS_NO_REPORTS: 'No reports yet. Generate a strategic memo from the Simulator.',
  WS_DELETE_CONFIRM: (name: string) => `Delete scenario "${name}"? This cannot be undone.`,

  // Sources
  SOURCES_LOADING: 'Loading market intelligence…',
  SOURCES_MY_SECTION: 'MY SOURCES — Admin & Project-specific',
  SOURCES_NO_DATA: 'No sources found.',
  SOURCES_NO_ADMIN: 'No admin sources yet.',
  SOURCES_NO_FILTER: 'No results matching filters.',
  SOURCES_ADD: 'Add source',
  SOURCES_DELETE_CONFIRM: 'Delete this source? This cannot be undone.',

  // Dossier
  DOSSIER_NO_REPORTS: 'No reports for this scenario yet. Generate a strategic memo from the',
  DOSSIER_NO_SCENARIO_REPORTS: 'No reports for this scenario yet.',
  DOSSIER_LOADING_MEMOS: 'Loading memos…',
  DOSSIER_NO_RISKS: 'No risks logged.',
  DOSSIER_NO_VERSIONS: 'No versions.',
  DOSSIER_GO_SIMULATOR: 'the Simulator',
  DOSSIER_EYEBROW_CONDITIONS: 'Conditions before approval',
  DOSSIER_EYEBROW_PEERS: "Why peers aren't directly comparable",
  DOSSIER_VERDICT_NOTE: 'Synthesized from return, risk, freshness & confidence signals',
  DOSSIER_PLACEHOLDER_STACK: 'Capital structure not available for this memo version',
  DOSSIER_PLACEHOLDER_TIMELINE: 'Deployment timeline not available for this memo version',
  DOSSIER_PLACEHOLDER_COMPARABLES: 'No comparable peers cited in this memo version',
  DOSSIER_PLACEHOLDER_RISKS: 'No risks logged for this memo version',
  DOSSIER_RISK_WHY: 'Why it matters ·',

  // Financial
  FIN_PAGE_TITLE: '10-Year Financial Projection',
  FIN_SAVED_PLAN_LABEL: 'Saved plan',
  FIN_SAVED_PLAN_PLACEHOLDER: 'Select a saved scenario…',
  FIN_LOADING: 'Loading financial model…',
  FIN_EXCEL_SOON_TITLE: 'Excel export is not available yet',
  FIN_MEMO_DOSSIER_TITLE: "Open this scenario's strategic memo in the Dossier (PDF export available there)",

  // Errors
  ERR_GENERIC: 'Something went wrong. Please try again.',
  ERR_PROJECT_LOAD: 'Project load failed',
  ERR_PROJECT_TIMEOUT: 'Project load timed out — please refresh.',
  ERR_SAVE: 'Could not save',
  ERR_SAVE_DETAIL: (msg: string) => `Could not save: ${msg}`,
  ERR_DELETE: 'Delete failed',

  // Memo / advisor chrome
  MEMO_JOB_ARIA: 'Reopen the memo being generated',
  MEMO_JOB_TITLE: 'Memo in progress',
  MEMO_TOAST_DISMISS_ARIA: 'Dismiss notification',
  MEMO_COPY_TITLE: 'Copy markdown',
  MEMO_REGENERATE_TITLE: 'Regenerate',
  MEMO_GENERATING_LABEL: 'Generating strategic memo…',
  ADVISOR_RAIL_ARIA: 'ORACLE Investment Committee Advisor',

  // Login (legacy layer — hors cockpit)
  LOGIN_PASSWORD_PLACEHOLDER: 'Password',
} as const;

export type UIKey = keyof typeof UI;
