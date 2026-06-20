// HEARST Qatar AI & Data Center Hub — Shared constants
// Used across admin pages, API routes, and calculation engine.

export const SOURCE_TYPES = {
  official_source:   { label: 'Official Source' },
  uploaded_document: { label: 'Uploaded Document' },
  admin_input:       { label: 'Admin Input' },
  calculated:        { label: 'Calculated' },
  contract:          { label: 'Contract' },
};

export const MISSING_LABEL = 'N/A — Source Required';

// ────────────────────────────────────────────────────────
// GPU hardware refresh — sourced defaults (June 2026)
// ────────────────────────────────────────────────────────
// GPUs are redeployed every few years, not held forever. Disclosed accounting
// useful lives across public GPU-cloud operators: CoreWeave 6yr (S-1), Lambda 5yr,
// Nebius 4yr (20-F 2024), Iris Energy ~3yr (36-mo lease financing) → sector median 5.
// NVIDIA ships a new architecture every 18–24 months; short-seller view (Burry)
// puts *real* useful life at 2–3yr. We default to the sector median, user-editable.
// Net replacement cost per cycle: next-gen card is +15–46% pricier (H100→H200
// +15–20% per card, +46% per 8-GPU system), partially offset by ~95% secondary
// resale of the still-demanded outgoing generation → ~85% of initial hardware capex.
// Sources: CoreWeave S-1; Nebius 20-F 2024; CNBC 2025-11-14 (Burry/CoreWeave);
//          SiliconANGLE/theCUBE 2025-11-22; IntuitionLabs NVIDIA pricing guide.
export const GPU_REFRESH_DEFAULTS = {
  refresh_cycle_years: 5,        // sector median accounting life (CoreWeave 6 / Lambda 5 / Nebius 4 / Iris 3)
  replacement_cost_pct: 85,      // % of initial hardware capex re-spent each cycle, net of secondary resale
};

// ────────────────────────────────────────────────────────
// Financial thresholds — IC / project-finance defaults (June 2026)
// ────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every return/hurdle/discount threshold. Before this
// block, the same "viable project" line lived as 10% (sensitivity, dossier),
// 12% (memo, advisor rail, results) and 18% (investment-grade) across 6 files —
// the product contradicted itself depending on the screen. Centralized here.
//
// WACC vs hurdle are DISTINCT (real PF practice): the discount rate prices NPV
// (cost of capital), the IC hurdle is the go/no-go bar (target equity return).
//   - discount_rate_pct = 10  → WACC Qatar DC benchmarked 9–11% (Damodaran ERP
//     Qatar 4.87% vs US 4.46%, Jan 2026: Qatar is an Aa sovereign, NOT a high-
//     premium emerging market — only +0.41pt vs US).
//   - ic_hurdle_pct = 15      → Brookfield Infrastructure target equity IRR 15%
//     (avg digital portfolio, range 12–18%); QIA targets 15–20%. Aligned to the
//     project's actual named partners.
//   - investment_grade_pct = 18 → top tier of the levered DC range (15–20%).
//   - preferred_return_pct = 8  → industry-standard LP compounding hurdle (Tier 2).
//   - dscr_breach_threshold = 1.25 → standard PF lender covenant floor.
//   - dscr_strong_threshold = 1.5  → "comfortable coverage" display bar; APPROVE verdict requires
//     exceeding this (not merely clearing the covenant) to reflect investment-grade practice.
// Sources: Brookfield Infrastructure Partners Q4 2024 Supplemental (PUBLIC_SOURCES_
//          LIBRARY bkf_irr_target); Damodaran Country Risk Premiums (Jan 2026);
//          CBRE North America DC Trends 2025; standard PF covenants (1.20–1.35x).
// Convention: *_pct stored as 0..100 (divided by /100 at each consumption site),
// matching the engine's pure-percent rule. DSCR stays a raw ratio.
export const FINANCIAL_THRESHOLDS = {
  discount_rate_pct:     10,    // WACC / NPV discount when scenario.discount_rate_pct is null
  ic_hurdle_pct:         15,    // go/no-go IC bar for IRR (sensitivity break-even, memo, advisor, dossier)
  investment_grade_pct:  18,    // top-tier "investment-grade case" verdict
  preferred_return_pct:   8,    // compound LP preferred return on unreturned equity (waterfall Tier 2)
  dscr_breach_threshold: 1.25,  // lender covenant floor; below = breach year flagged
  dscr_strong_threshold: 1.5,   // "comfortable coverage" display bar — investment-grade/APPROVE verdict (above covenant)
};

// Part Hearst en structure minoritaire (Brookfield = opérateur majority)
export const MINORITY_EQUITY_SHARE_DEFAULT = 0.20;

// ── Operational income tax (minimum defensible layer — P0-2) ───────────────
// Qatar corporate income tax = 10% (Law No. 24 of 2018). Same statutory rate
// already used for capital-gains on disposition in hearst-deal-structures.js.
// Applied to annual operating EARNINGS only: taxable_income = EBITDA − D&A −
// interest (both deductible). Tax never creates a refund (loss years → 0).
// Terminal value keeps the existing capital-gains treatment (no double-tax).
// Straight-line depreciation across the project horizon — NO accelerated
// schedule, NO loss carryforwards, NO deferred tax assets, NO jurisdiction engine.
export const TAX_DEFAULTS = {
  income_tax_rate_pct:   10,    // Qatar corporate income tax (Law No. 24 of 2018)
  depreciable_life_years: 10,   // straight-line; capex written off over the modelled horizon
};

export const SITE_READINESS = {
  greenfield:      { label: 'Greenfield — Nothing Ready',        risk: 5, dev_months: 12, contingency_pct: 0.20, cod_offset_months: 36 },
  land_secured:    { label: 'Land Secured',                      risk: 4, dev_months: 10, contingency_pct: 0.15, cod_offset_months: 30 },
  power_reserved:  { label: 'Power Reserved',                    risk: 3, dev_months:  8, contingency_pct: 0.12, cod_offset_months: 24 },
  substation_ready:{ label: 'Substation Ready',                  risk: 2, dev_months:  6, contingency_pct: 0.10, cod_offset_months: 18 },
  powered_shell:   { label: 'Powered Shell Ready',               risk: 1, dev_months:  3, contingency_pct: 0.05, cod_offset_months:  9 },
  operational:     { label: 'Operational Expansion',             risk: 1, dev_months:  2, contingency_pct: 0.05, cod_offset_months:  6 },
};

export const BUSINESS_MODELS = [
  { id: 'retail_colo',      label: 'Retail Colocation',                 price_key: 'price_retail_colo_kw_month',   margin_range: [0.45, 0.65] },
  { id: 'wholesale_colo',   label: 'Wholesale Colocation',              price_key: 'price_wholesale_kw_month',     margin_range: [0.40, 0.55] },
  { id: 'hyperscale_lease', label: 'Hyperscale Lease',                  price_key: 'price_hyperscale_kw_month',    margin_range: [0.35, 0.50] },
  { id: 'powered_shell',    label: 'Powered Shell',                     price_key: 'price_hyperscale_kw_month',    margin_range: [0.55, 0.70] },
  { id: 'turnkey',          label: 'Turnkey Data Center',               price_key: 'price_retail_colo_kw_month',   margin_range: [0.40, 0.55] },
  { id: 'equinix_zone',     label: 'Equinix-operated Zone',             price_key: 'price_retail_colo_kw_month',   margin_range: [0.30, 0.45] },
  { id: 'multi_operator',   label: 'Multi-operator Zone',               price_key: 'price_wholesale_kw_month',     margin_range: [0.35, 0.50] },
  { id: 'sovereign_ai',     label: 'Government AI Cloud',                price_key: 'price_hyperscale_kw_month',    margin_range: [0.50, 0.70] },
  { id: 'gpu_cloud',        label: 'Compute Cloud',                     price_key: 'price_wholesale_kw_month',     margin_range: [0.30, 0.60] },
  { id: 'ai_training',      label: 'High-Performance Compute',          price_key: 'price_wholesale_kw_month',     margin_range: [0.35, 0.55] },
  { id: 'ai_inference',     label: 'Managed Compute Services',          price_key: 'price_wholesale_kw_month',     margin_range: [0.40, 0.60] },
  { id: 'government',       label: 'Government / Defense / Government',  price_key: 'price_hyperscale_kw_month',    margin_range: [0.45, 0.65] },
  { id: 'enterprise',       label: 'Enterprise / Banking / Telecom',    price_key: 'price_retail_colo_kw_month',   margin_range: [0.40, 0.60] },
];

export const CLIENT_TYPES = [
  { id: 'hyperscalers',  label: 'Hyperscalers (AWS, Microsoft, Google, Oracle, Meta)',   contract_term_yr: [10, 20], risk: 'low' },
  { id: 'operators',     label: 'Operators (Equinix, Digital Realty, NTT, Vantage)',     contract_term_yr: [5, 15],  risk: 'low' },
  { id: 'neocloud',      label: 'Compute Cloud Operators',               contract_term_yr: [1, 5],   risk: 'medium' },
  { id: 'qatar_gov',     label: 'Qatar Government / QIA / Qai',                         contract_term_yr: [5, 20],  risk: 'low' },
  { id: 'defense',       label: 'Defense / Government',                                  contract_term_yr: [5, 15],  risk: 'low' },
  { id: 'banks',         label: 'Banks',                                                 contract_term_yr: [3, 10],  risk: 'low' },
  { id: 'telecoms',      label: 'Telecoms',                                              contract_term_yr: [5, 10],  risk: 'medium' },
  { id: 'enterprise',    label: 'Large Enterprises',                                     contract_term_yr: [3, 7],   risk: 'medium' },
  { id: 'ai_startups',   label: 'AI Startups',                                           contract_term_yr: [1, 3],   risk: 'high' },
];

export const OPERATOR_STRATEGIES = [
  { id: 'equinix_only',      label: 'Single Operator — Equinix Only',               control: 2, bankability: 5, speed: 4, margin: 3 },
  { id: 'digital_realty',    label: 'Single Operator — Digital Realty Only',        control: 2, bankability: 5, speed: 4, margin: 3 },
  { id: 'ntt_only',          label: 'Single Operator — NTT Only',                   control: 2, bankability: 4, speed: 4, margin: 3 },
  { id: 'multi_operator',    label: 'Multi-Operator Campus',                         control: 4, bankability: 4, speed: 3, margin: 4 },
  { id: 'hearst_managed',    label: 'HEARST-owned / Third-Party Managed',            control: 5, bankability: 3, speed: 3, margin: 5 },
  { id: 'hearst_equinix',    label: 'HEARST-owned / Equinix-operated Zone',          control: 4, bankability: 4, speed: 3, margin: 4 },
  { id: 'brookfield_infra',  label: 'Brookfield InfraCo + Multiple OpCos',           control: 3, bankability: 5, speed: 3, margin: 4 },
  { id: 'powered_shell',     label: 'Powered Shell Leased to Operators',             control: 3, bankability: 4, speed: 5, margin: 3 },
  { id: 'jv_equinix',        label: 'JV with Equinix',                               control: 3, bankability: 5, speed: 3, margin: 4 },
  { id: 'jv_multi',          label: 'JV with Multiple Operators',                    control: 3, bankability: 4, speed: 3, margin: 4 },
];


export const DATA_ROOM_REQUIRED = [
  // Corporate
  { category: 'corporate', title: 'Corporate Structure / UBO', required: true,  metric_ids: [] },
  { category: 'corporate', title: 'KYC / AML Documentation',  required: true,  metric_ids: [] },
  // Land
  { category: 'land',    title: 'Land Title or Land Lease',   required: true,  metric_ids: ['capex_land_per_mw'] },
  { category: 'land',    title: 'Site Coordinates',            required: true,  metric_ids: [] },
  // Power
  { category: 'power',   title: 'Power Allocation Letter',     required: true,  metric_ids: ['electricity_price_mwh'] },
  { category: 'power',   title: 'KAHRAMAA Tariff / PPA / Grid Connection Letter', required: true, metric_ids: ['electricity_price_mwh'] },
  { category: 'power',   title: 'Substation Status Report',    required: true,  metric_ids: ['capex_substation_per_mw'] },
  // Permits
  { category: 'permits', title: 'Zoning and Permits',          required: true,  metric_ids: [] },
  { category: 'permits', title: 'Government Support Letter',    required: false, metric_ids: [] },
  { category: 'permits', title: 'QIA / Qai / Al Thani Confirmation', required: false, metric_ids: [] },
  // Technical
  { category: 'technical', title: 'EPC Quote',                 required: true,  metric_ids: ['capex_shell_per_mw','capex_mep_per_mw'] },
  { category: 'technical', title: 'MEP Quote',                 required: true,  metric_ids: ['capex_mep_per_mw'] },
  { category: 'technical', title: 'Cooling Proposal',          required: true,  metric_ids: ['capex_cooling_per_mw'] },
  { category: 'technical', title: 'Fiber / Carrier Letters',   required: false, metric_ids: [] },
  // Commercial
  { category: 'commercial', title: 'Operator LOIs',            required: true,  metric_ids: ['target_occupancy_pct'] },
  { category: 'commercial', title: 'Equinix Proposal',         required: false, metric_ids: [] },
  { category: 'commercial', title: 'Digital Realty / NTT / Other Proposals', required: false, metric_ids: [] },
  { category: 'commercial', title: 'Hyperscaler LOIs',         required: false, metric_ids: ['price_hyperscale_kw_month'] },
  { category: 'commercial', title: 'Commercial Pipeline',      required: true,  metric_ids: [] },
  // Financial
  { category: 'financial', title: 'Financing Term Sheets',     required: true,  metric_ids: ['debt_pct','debt_interest_rate'] },
  { category: 'financial', title: 'Brookfield Term Sheet or Correspondence', required: true, metric_ids: [] },
  // Legal
  { category: 'legal',   title: 'Legal Structure Memo',        required: true,  metric_ids: [] },
  { category: 'legal',   title: 'Export Controls Memo',         required: false, metric_ids: [] },
  { category: 'tax',     title: 'Tax Structure Advice',         required: false, metric_ids: [] },
  // ESG
  { category: 'esg',     title: 'ESG / Water Report',           required: false, metric_ids: [] },
  // Insurance
  { category: 'insurance', title: 'Insurance Quote',            required: false, metric_ids: [] },
];

export const SMART_ALERTS = [
  { id: 'pue_unsourced',       message: 'PUE not sourced — energy cost cannot be calculated.',          severity: 'critical', field: 'pue_source_id' },
  { id: 'elec_unsourced',      message: 'Electricity price not from PPA or utility contract.',           severity: 'critical', field: 'electricity_price_source_id' },
  { id: 'capex_unsourced',     message: 'Capex per MW not triangulated — at least 2 sources required.', severity: 'critical', field: 'capex_shell_source_id' },
  { id: 'revenue_unsourced',   message: 'No sourced colocation pricing — revenue engine blocked.',       severity: 'critical', field: 'price_retail_source_id' },
  { id: 'exit_multiple',       message: 'Exit multiple not supported by transaction comps.',             severity: 'warning',  field: 'exit_multiple_source_id' },
  { id: 'debt_terms',          message: 'Debt terms not supported by lender term sheet.',               severity: 'warning',  field: 'debt_interest_source_id' },
  { id: 'greenfield_risk',     message: 'Greenfield site — high execution risk and no revenue for 36+ months.', severity: 'info', field: 'site_readiness' },
];

// ────────────────────────────────────────────────────────
// Operators / Market Participants
// ────────────────────────────────────────────────────────

export const OPERATORS = [
  // Core DC operators — couleurs via design tokens
  { id: 'equinix',         name: 'Equinix',                        type: 'operator',    region: 'Global'        },
  { id: 'digital_realty',  name: 'Digital Realty',                 type: 'operator',    region: 'Global'        },
  { id: 'ntt',             name: 'NTT Global DC',                  type: 'operator',    region: 'Global'        },
  { id: 'vantage',         name: 'Vantage Data Centers',           type: 'operator',    region: 'Americas/EMEA' },
  { id: 'coreweave',       name: 'CoreWeave',                      type: 'operator',    region: 'US/EU'         },
  { id: 'lambda',          name: 'Lambda Labs',                    type: 'operator',    region: 'US'            },
  // Hyperscalers
  { id: 'aws',             name: 'Amazon AWS',                     type: 'hyperscaler', region: 'Global'        },
  { id: 'microsoft',       name: 'Microsoft Azure',                type: 'hyperscaler', region: 'Global'        },
  { id: 'google',          name: 'Google Cloud',                   type: 'hyperscaler', region: 'Global'        },
  { id: 'meta',            name: 'Meta',                           type: 'hyperscaler', region: 'Global'        },
  { id: 'oracle',          name: 'Oracle Cloud',                   type: 'hyperscaler', region: 'Global'        },
  { id: 'nvidia',          name: 'NVIDIA',                         type: 'hyperscaler', region: 'Global'        },
  // Investors
  { id: 'brookfield',      name: 'Brookfield Infrastructure',      type: 'investor',    region: 'Global'        },
  { id: 'qia',             name: 'QIA',                            type: 'investor',    region: 'Qatar'         },
  { id: 'qai',             name: 'Qai',                            type: 'investor',    region: 'Qatar'         },
  // Brokers / Advisory
  { id: 'cbre',            name: 'CBRE',                           type: 'broker',      region: 'Global'        },
  { id: 'jll',             name: 'JLL',                            type: 'broker',      region: 'Global'        },
  { id: 'turner_townsend', name: 'Turner & Townsend',              type: 'broker',      region: 'Global'        },
  { id: 'cushman',         name: 'Cushman & Wakefield',            type: 'broker',      region: 'Global'        },
  // Regulators
  { id: 'kahramaa',        name: 'KAHRAMAA',                       type: 'regulator',   region: 'Qatar'         },
  { id: 'cra',             name: 'CRA Qatar',                      type: 'regulator',   region: 'Qatar'         },
  { id: 'moct',            name: 'MoCT Qatar',                     type: 'regulator',   region: 'Qatar'         },
  // Telcos
  { id: 'ooredoo',         name: 'Ooredoo',                        type: 'telco',       region: 'Qatar/MENA'    },
  { id: 'vodafone_qatar',  name: 'Vodafone Qatar',                  type: 'telco',       region: 'Qatar'         },
  // Legal
  { id: 'mayer_brown',     name: 'Mayer Brown',                    type: 'legal',       region: 'Global'        },
  { id: 'baker_mckenzie',  name: 'Baker McKenzie',                  type: 'legal',       region: 'Global'        },
  // Standards
  { id: 'uptime',          name: 'Uptime Institute',               type: 'standards',   region: 'Global'        },
  { id: 'sec',             name: 'SEC (US)',                        type: 'standards',   region: 'US'            },
];


export const OPERATORS_BY_ID = Object.fromEntries(OPERATORS.map(o => [o.id, o]));

// PUBLIC_SOURCES_LIBRARY relocated to lib/oracle-intelligence/source-library.js (2026-06).

// ────────────────────────────────────────────────────────
// Re-export engine constants from lib/constants.ts so callers that already
// import from hearst-constants don't need a second import path.
// ────────────────────────────────────────────────────────
export {
  HOURS_PER_YEAR,
  KW_PER_MW,
  MAINTENANCE_CAPEX_RATIO,
  CAPEX_BENCHMARK_PER_MW,
  CAPEX_RECONCILE_TOLERANCE,
  OCCUPANCY_STABILIZATION_PCT,
  OCCUPANCY_RAMP,
} from './constants';
