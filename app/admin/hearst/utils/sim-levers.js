// app/admin/hearst/utils/sim-levers.js
// Config UI exhaustive des leviers du moteur /simulate.
// Source : SimulateRequestSchema + ScenarioWritableFields (lib/validators/hearst.js),
// BUSINESS_MODELS / OPERATOR_STRATEGIES (lib/hearst-constants.js),
// DEAL_ARCHETYPES (lib/hearst-deal-structures.js), solver levers (lib/hearst-solver.js).
//
// NOTE moteur : la route /simulate NE consomme PAS client_type_id ni hardware_mix.gpu_mix
// (ils sont dans le schéma mais ignorés par route.js). On ne les expose donc pas ici —
// ce serait câbler des contrôles morts.

// ── Points d'entrée (input_mode) ──────────────────────────────────────────────
export const INPUT_MODES = [
  { id: 'mw_first',         label: 'MW',        hint: 'Capacité cible → rendement' },
  { id: 'capital_first',    label: 'Capital',   hint: 'Budget CAPEX → MW résolus' },
  { id: 'target_irr_first', label: 'Target IRR', hint: 'IRR visé → levier résolu' },
];

// Leviers du solveur (target_irr_first)
export const SOLVER_LEVERS = [
  { id: 'pricing',      label: 'Pricing' },
  { id: 'capex_per_mw', label: 'CAPEX/MW' },
  { id: 'leverage',     label: 'Leverage' },
  { id: 'mw',           label: 'MW' },
];

// ── Archétypes (8) — id = archetype_id moteur ─────────────────────────────────
export const ARCHETYPE_OPTIONS = [
  { id: 'neocloud_gpu',           label: 'Compute Cloud',        code: 'F' },
  { id: 'powered_shell',          label: 'Shell + Long Lease',   code: 'B' },
  { id: 'sovereign_ai',           label: 'Government AI Cluster', code: 'H' },
  { id: 'branded_jv',             label: 'Co-branded JV (51/49)', code: 'A' },
  { id: 'manage_only',            label: 'In-House Ops',         code: 'C' },
  { id: 'white_label',            label: 'Hidden Operator',      code: 'D' },
  { id: 'sale_leaseback',         label: 'Build & Sell',         code: 'E' },
  { id: 'hyperscaler_self_build', label: 'Tech Giant (Minority)', code: 'G' },
];

// ── Business model (13) — décale les defaults pricing/comps au bootstrap ──────
export const BUSINESS_MODEL_OPTIONS = [
  { id: '',                 label: '— auto (archétype) —' },
  { id: 'retail_colo',      label: 'Retail Colocation' },
  { id: 'wholesale_colo',   label: 'Wholesale Colocation' },
  { id: 'hyperscale_lease', label: 'Hyperscale Lease' },
  { id: 'powered_shell',    label: 'Powered Shell' },
  { id: 'turnkey',          label: 'Turnkey Data Center' },
  { id: 'equinix_zone',     label: 'Equinix-operated Zone' },
  { id: 'multi_operator',   label: 'Multi-operator' },
  { id: 'sovereign_ai',     label: 'Government AI Cloud' },
  { id: 'gpu_cloud',        label: 'Compute Cloud' },
  { id: 'ai_training',      label: 'High-Performance Compute' },
  { id: 'ai_inference',     label: 'Managed Compute Services' },
  { id: 'government',       label: 'Government / Defense' },
  { id: 'enterprise',       label: 'Enterprise / Banking / Telecom' },
];

// ── Géographie (6) — résolue en comps régionaux au bootstrap ──────────────────
export const GEOGRAPHY_OPTIONS = [
  { id: 'qatar',  label: 'Qatar' },
  { id: 'uae',    label: 'UAE' },
  { id: 'ksa',    label: 'KSA' },
  { id: 'gcc',    label: 'GCC' },
  { id: 'mena',   label: 'MENA' },
  { id: 'global', label: 'Global' },
];

// ── Operator strategy (scenario_overrides.operator_strategy) ──────────────────
export const OPERATOR_STRATEGY_OPTIONS = [
  { id: '',                 label: '— défaut —' },
  { id: 'equinix_only',     label: 'Equinix Only' },
  { id: 'digital_realty',   label: 'Digital Realty' },
  { id: 'ntt_only',         label: 'NTT Only' },
  { id: 'multi_operator',   label: 'Multi-operator' },
  { id: 'hearst_managed',   label: 'HEARST-managed' },
  { id: 'hearst_equinix',   label: 'HEARST / Equinix Zone' },
  { id: 'brookfield_infra', label: 'Brookfield Infra' },
  { id: 'powered_shell',    label: 'Powered Shell Lease' },
  { id: 'jv_equinix',       label: 'JV Equinix' },
  { id: 'jv_multi',         label: 'JV Multi' },
];

// ── scenario_overrides : groupes de champs numériques ────────────────────────
// Chaque champ : key = nom moteur exact, label, unit, step, min/max alignés au schéma.
// Laisser vide = hérite du default Qatar (le moteur merge { ...boot.scenario, ...overrides }).
export const OVERRIDE_GROUPS = [
  {
    id: 'phasing',
    title: 'Capacity Phasing',
    fields: [
      { key: 'phase1_mw',            label: 'Phase 1 MW',      unit: 'MW', step: 5 },
      { key: 'phase1_complete_year', label: 'P1 Year',         unit: 'yr', step: 1 },
      { key: 'phase2_mw',            label: 'Phase 2 MW',      unit: 'MW', step: 5 },
      { key: 'phase2_complete_year', label: 'P2 Year',         unit: 'yr', step: 1 },
      { key: 'phase3_mw',            label: 'Phase 3 MW',      unit: 'MW', step: 5 },
      { key: 'phase3_complete_year', label: 'P3 Year',         unit: 'yr', step: 1 },
    ],
  },
  {
    id: 'power',
    title: 'Power & Occupancy',
    // NB: `pue` is driven by the dedicated PUE slider in the left panel
    // (sent as scenario_overrides.pue), so it is intentionally not duplicated here.
    fields: [
      { key: 'target_occupancy_pct', label: 'Occupancy',       unit: '%',  step: 1 },
      { key: 'start_year',           label: 'Start Year',      unit: '',   step: 1 },
    ],
  },
  {
    id: 'capex',
    title: 'CAPEX (per MW)',
    fields: [
      { key: 'capex_shell_per_mw',                 label: 'Shell',         unit: '$/MW', step: 100000 },
      { key: 'capex_mep_per_mw',                   label: 'MEP',           unit: '$/MW', step: 100000 },
      { key: 'capex_substation_per_mw',            label: 'Substation',    unit: '$/MW', step: 100000 },
      { key: 'capex_cooling_per_mw',               label: 'Cooling',       unit: '$/MW', step: 100000 },
      { key: 'capex_grid_per_mw',                  label: 'Grid',          unit: '$/MW', step: 100000 },
      { key: 'capex_land_per_mw',                  label: 'Land',          unit: '$/MW', step: 100000 },
      { key: 'capex_liquid_cooling_premium_per_mw', label: 'Liquid Premium', unit: '$/MW', step: 100000 },
      { key: 'capex_contingency_pct',              label: 'Contingency',   unit: '%',    step: 1 },
    ],
  },
  {
    id: 'opex',
    title: 'OPEX',
    fields: [
      { key: 'electricity_price_mwh',       label: 'Electricity',    unit: '$/MWh', step: 1 },
      { key: 'opex_maintenance_pct',        label: 'Maintenance',    unit: '%',     step: 0.5 },
      { key: 'opex_staff_annual_musd',      label: 'Staff',          unit: '$M/yr', step: 0.5 },
      { key: 'opex_insurance_pct',          label: 'Insurance',      unit: '%',     step: 0.5 },
      { key: 'opex_ga_pct',                 label: 'G&A',            unit: '%',     step: 0.5 },
      { key: 'opex_operator_mgmt_fee_pct',  label: 'Operator Fee',   unit: '%',     step: 0.5 },
    ],
  },
  {
    id: 'revenue',
    title: 'Revenue',
    fields: [
      { key: 'price_retail_colo_kw_month',  label: 'Retail Colo',    unit: '$/kW/mo', step: 5 },
      { key: 'price_wholesale_kw_month',    label: 'Wholesale',      unit: '$/kW/mo', step: 5 },
      { key: 'price_hyperscale_kw_month',   label: 'Hyperscale',     unit: '$/kW/mo', step: 5 },
      { key: 'annual_escalation_pct',       label: 'Escalation',     unit: '%/yr',    step: 0.5 },
    ],
  },
  {
    id: 'capital',
    title: 'Capital Structure',
    fields: [
      { key: 'equity_hearst_pct',     label: 'Equity HEARST',     unit: '%',  step: 1 },
      { key: 'equity_brookfield_pct', label: 'Equity Brookfield', unit: '%',  step: 1 },
      { key: 'equity_qatar_pct',      label: 'Equity Qatar',      unit: '%',  step: 1 },
      { key: 'debt_pct',              label: 'Debt',              unit: '%',  step: 1 },
      { key: 'debt_interest_rate',    label: 'Interest Rate',     unit: '%',  step: 0.1 },
      { key: 'debt_term_years',       label: 'Debt Term',         unit: 'yr', step: 1 },
    ],
  },
  {
    id: 'exit',
    title: 'Exit',
    fields: [
      { key: 'exit_multiple', label: 'Exit Multiple', unit: '×',  step: 0.5 },
      { key: 'exit_year',     label: 'Exit Year',     unit: 'yr', step: 1 },
    ],
  },
];

// Liste plate des clés override (pour construire le payload)
export const OVERRIDE_KEYS = OVERRIDE_GROUPS.flatMap(g => g.fields.map(f => f.key));
