// lib/validators/hearst.js
// Zod schemas for HEARST admin API routes.
//
// Discipline:
//   - Every object schema uses .strict() so unknown keys -> 400.
//   - Every free-text field has a reasonable .max() cap.
//   - Every numeric field is .finite() and bounded where the domain is known.
//   - Every UUID is .uuid().
//   - Enums come from lib/hearst-constants.js / lib/hearst-advisor-tools.js
//     (kept here as small literal arrays to avoid pulling DOM colour tokens
//     into the validator bundle).
//
// No z.any() / z.unknown() shortcuts.

import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────
// Enums (mirror the constants — keep in sync if you add a new option)
// ────────────────────────────────────────────────────────────────────────

// Mirrors keys of SOURCE_TYPES in lib/hearst-constants.js (and the DB CHECK).
const SOURCE_TYPE_VALUES = [
  'official_source',
  'uploaded_document',
  'admin_input',
  'calculated',
  'contract',
];

// Mirrors keys of SITE_READINESS in lib/hearst-constants.js.
const SITE_READINESS_VALUES = [
  'greenfield',
  'land_secured',
  'power_reserved',
  'substation_ready',
  'powered_shell',
  'operational',
];

// Mirrors BUSINESS_MODELS[].id.
const BUSINESS_MODEL_VALUES = [
  'retail_colo',
  'wholesale_colo',
  'hyperscale_lease',
  'powered_shell',
  'turnkey',
  'equinix_zone',
  'multi_operator',
  'sovereign_ai',
  'gpu_cloud',
  'ai_training',
  'ai_inference',
  'government',
  'enterprise',
];

// Mirrors CLIENT_TYPES[].id (used as prospect_type).
const CLIENT_TYPE_VALUES = [
  'hyperscalers',
  'operators',
  'neocloud',
  'qatar_gov',
  'defense',
  'banks',
  'telecoms',
  'enterprise',
  'ai_startups',
];

// hearst_scenarios.scenario_type DB CHECK.
const SCENARIO_TYPE_VALUES = ['downside', 'base', 'upside', 'custom'];

// hearst_data_room.status / category DB CHECKs.
const DATA_ROOM_STATUS_VALUES = ['missing', 'in_progress', 'uploaded', 'reviewed', 'approved'];
const DATA_ROOM_CATEGORY_VALUES = [
  'corporate', 'land', 'power', 'permits', 'technical', 'commercial',
  'financial', 'legal', 'esg', 'tax', 'insurance',
];

// hearst_pipeline.status DB CHECK.
const PIPELINE_STATUS_VALUES = ['prospect', 'loi', 'term_sheet', 'contracted'];

// hearst_sources.triangulation_status / used_in_scenario DB CHECKs.
const TRIANGULATION_STATUS_VALUES = ['pending', 'single', 'triangulated'];
const USED_IN_SCENARIO_VALUES = ['all', 'downside', 'base', 'upside'];

// hearst_scenarios.operator_strategy — mirrors OPERATOR_STRATEGIES[].id.
const OPERATOR_STRATEGY_VALUES = [
  'equinix_only', 'digital_realty', 'ntt_only', 'multi_operator',
  'hearst_managed', 'hearst_equinix', 'brookfield_infra', 'powered_shell',
  'jv_equinix', 'jv_multi',
];

// hearst_scenarios.input_mode — point d'entrée du simulator (cf. /admin/hearst/simulator).
const INPUT_MODE_VALUES = ['mw_first', 'capital_first', 'target_irr_first'];

// DEAL_ARCHETYPES[].id — voir lib/hearst-deal-structures.js.
const ARCHETYPE_VALUES = [
  'powered_shell', 'branded_jv', 'manage_only', 'white_label', 'sale_leaseback',
  'neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai',
];

// Lever utilisé par solveForTargetIrr (lib/hearst-solver.js).
const SOLVER_LEVER_VALUES = ['capex_per_mw', 'pricing', 'leverage', 'mw'];

// Catalogue GPU — vendors et use cases.
const GPU_VENDOR_VALUES = ['NVIDIA', 'AMD', 'Intel', 'Other'];
const GPU_USE_CASE_VALUES = ['training', 'inference', 'mixed'];

// ────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ────────────────────────────────────────────────────────────────────────

const Uuid = z.string().uuid();

const ShortText = (max = 200) => z.string().min(1).max(max);
const FreeText  = (max = 4000) => z.string().max(max);
const Url       = z.string().url().max(2048);

// "Pct" stored as a ratio in 0..1 (e.g. capex_contingency_pct = 0.10).
const RatioPct = z.number().finite().min(0).max(1);
// "Pct" stored as 0..100 integer / float (e.g. debt_pct = 65, opex_maintenance_pct = 8).
const Percent100 = z.number().finite().min(0).max(100);
// "Pct" stored as 0..100 integer (e.g. probability_pct).
const IntegerPct = z.number().int().min(0).max(100);

const NonNegNumber = z.number().finite().min(0);
// MW capacity bounded loosely; sanity ceiling 10 000 MW.
const Megawatts = z.number().finite().min(0).max(10_000);
const YearInt   = z.number().int().min(2000).max(2100);
const Confidence1to5 = z.number().int().min(1).max(5);
const PueRatio  = z.number().finite().min(1).max(5); // PUE typically 1.0–2.5

// Generic ISO date or empty string-as-null (some clients send '').
const IsoDate = z.string().min(1).max(40);

// ────────────────────────────────────────────────────────────────────────
// 1. Advisor
//    POST /api/admin/hearst/advisor
// ────────────────────────────────────────────────────────────────────────

// One message in the conversation. Both Anthropic-style (content as array of
// blocks) and OpenAI-style (content as plain string) are accepted because the
// advisor route normalises them in-flight.
const TextBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string().max(64_000),
}).strict();

const ToolUseBlockSchema = z.object({
  type: z.literal('tool_use'),
  id: z.string().max(200),
  name: z.string().max(200),
  input: z.record(z.string().max(200), z.unknown()).optional(),
}).strict();

const ToolResultBlockSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string().max(200),
  content: z.union([z.string().max(200_000), z.array(z.unknown()).max(50)]),
  is_error: z.boolean().optional(),
}).strict();

const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  ToolUseBlockSchema,
  ToolResultBlockSchema,
]);

const AdvisorMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.union([
    z.string().max(64_000),
    z.array(ContentBlockSchema).max(200),
  ]),
}).strict();

// Page context block — keep it loose-but-bounded. The advisor route only
// stringifies it into the system prompt.
//
// Real clients pass HEARST_PAGE_CONTEXT[path] which carries many cosmetic /
// UI-only keys (title, mission, keyFields, advisorTips, suggestedPrompts,
// qatarDefaults, …). We don't want to enumerate every one of them — they're
// not security-sensitive, the route never trusts the values, and a `.strict()`
// here was 400-ing every legitimate advisor request. So: keep the well-known
// keys typed for ergonomics, but `.passthrough()` everything else.
const PageContextSchema = z.object({
  page: z.string().max(200).optional(),
  path: z.string().max(500).optional(),
  text: z.string().max(8000).optional(),
  data: z.unknown().optional(),
}).passthrough();

export const AdvisorRequestSchema = z.object({
  project_id: Uuid,
  conversation_id: Uuid.nullable().optional(),
  // The original ticket lists a single `message: string` field, but the
  // current route handler accepts an array of structured messages. Both
  // shapes are validated; the handler picks what it needs.
  message: z.string().min(1).max(8000).optional(),
  messages: z.array(AdvisorMessageSchema).min(1).max(200).optional(),
  // Clients commonly send `page_context: pageContext || null`. Accept null
  // explicitly so a missing context object isn't a 400.
  page_context: PageContextSchema.nullable().optional(),
}).strict().refine(
  (v) => Boolean(v.message) || Boolean(v.messages),
  { message: 'either "message" or "messages" must be provided', path: ['messages'] },
);

// ────────────────────────────────────────────────────────────────────────
// 2. Project
//    PATCH /api/admin/hearst/project
// ────────────────────────────────────────────────────────────────────────

export const ProjectUpdateSchema = z.object({
  id: Uuid,
  name: ShortText(200).optional(),
  country: ShortText(100).optional(),
  sponsor: ShortText(200).optional(),
  institutional_partner: ShortText(400).optional(),
  infrastructure_investor: ShortText(400).optional(),
  potential_operator: ShortText(400).optional(),
  currency: z.string().min(3).max(8).optional(),
  launch_date: IsoDate.optional().nullable(),
  projection_years: z.number().int().min(1).max(50).optional(),
  site_readiness: z.enum(SITE_READINESS_VALUES).optional(),
  active_scenario_id: Uuid.optional().nullable(),
}).strict();

// ────────────────────────────────────────────────────────────────────────
// 3. Scenarios
//    POST /api/admin/hearst/scenarios
//    PATCH /api/admin/hearst/scenarios/[id]
// ────────────────────────────────────────────────────────────────────────

// Mirrors SCENARIO_WRITABLE_FIELDS in lib/hearst-advisor-tools.js, plus the
// *_source_id columns that the human admin UI also writes through.

const CommercialSplitSchema = z.record(
  z.enum(BUSINESS_MODEL_VALUES),
  z.number().finite().min(0).max(100),
);

const ScenarioWritableFields = {
  // Identity / meta
  project_id: Uuid.optional(),
  name: ShortText(200).optional(),
  scenario_type: z.enum(SCENARIO_TYPE_VALUES).optional(),
  description: FreeText(4000).optional(),
  is_active: z.boolean().optional(),
  is_locked: z.boolean().optional(),

  // Capacity phasing
  total_mw: Megawatts.optional().nullable(),
  total_mw_source_id: Uuid.optional().nullable(),
  phase1_mw: Megawatts.optional().nullable(),
  phase1_complete_year: z.number().int().min(0).max(50).optional().nullable(),
  phase2_mw: Megawatts.optional().nullable(),
  phase2_complete_year: z.number().int().min(0).max(50).optional().nullable(),
  phase3_mw: Megawatts.optional().nullable(),
  phase3_complete_year: z.number().int().min(0).max(50).optional().nullable(),

  // Power
  pue: PueRatio.optional().nullable(),
  pue_source_id: Uuid.optional().nullable(),
  target_occupancy_pct: z.number().finite().min(0).max(100).optional().nullable(),
  start_year: YearInt.optional().nullable(),

  // CAPEX — per-MW dollars: cap at $50M/MW to catch unit-mismatch bugs
  capex_shell_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_shell_source_id: Uuid.optional().nullable(),
  capex_mep_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_mep_source_id: Uuid.optional().nullable(),
  capex_substation_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_substation_source_id: Uuid.optional().nullable(),
  capex_cooling_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_cooling_source_id: Uuid.optional().nullable(),
  capex_grid_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_grid_source_id: Uuid.optional().nullable(),
  capex_contingency_pct: RatioPct.optional().nullable(),
  capex_liquid_cooling_premium_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_land_per_mw: z.number().finite().min(0).max(50_000_000).optional().nullable(),
  capex_land_source_id: Uuid.optional().nullable(),

  // OPEX
  electricity_price_mwh: z.number().finite().min(0).max(10_000).optional().nullable(),
  electricity_price_source_id: Uuid.optional().nullable(),
  opex_maintenance_pct: RatioPct.optional().nullable(),
  opex_staff_annual_musd: z.number().finite().min(0).max(1000).optional().nullable(),
  opex_insurance_pct: RatioPct.optional().nullable(),
  opex_ga_pct: RatioPct.optional().nullable(),
  opex_operator_mgmt_fee_pct: RatioPct.optional().nullable(),

  // Revenue
  price_retail_colo_kw_month: z.number().finite().min(0).max(10_000).optional().nullable(),
  price_retail_source_id: Uuid.optional().nullable(),
  price_wholesale_kw_month: z.number().finite().min(0).max(10_000).optional().nullable(),
  price_wholesale_source_id: Uuid.optional().nullable(),
  price_hyperscale_kw_month: z.number().finite().min(0).max(10_000).optional().nullable(),
  price_hyperscale_source_id: Uuid.optional().nullable(),
  annual_escalation_pct: z.number().finite().min(-1).max(1).optional().nullable(),

  // Capital structure
  equity_hearst_pct: RatioPct.optional().nullable(),
  equity_brookfield_pct: RatioPct.optional().nullable(),
  equity_qatar_pct: RatioPct.optional().nullable(),
  debt_pct: RatioPct.optional().nullable(),
  debt_interest_rate: z.number().finite().min(-0.1).max(1).optional().nullable(),
  debt_interest_source_id: Uuid.optional().nullable(),
  debt_term_years: z.number().int().min(1).max(30).optional().nullable(),

  // Exit
  exit_multiple: z.number().finite().min(0).max(100).optional().nullable(),
  exit_multiple_source_id: Uuid.optional().nullable(),
  exit_year: z.number().int().min(1).max(50).optional().nullable(),

  // Commercial
  commercial_split: CommercialSplitSchema.optional().nullable(),
  operator_strategy: z.enum(OPERATOR_STRATEGY_VALUES).optional().nullable(),

  // Simulator metadata (set by /admin/hearst/simulator at "Save as Scenario").
  // input_mode = quel point de départ a été utilisé pour générer ce scenario.
  // input_value = le payload brut saisi par l'utilisateur (mw/capital/irr+lever).
  // hardware_mix = densités + SKU GPU + paramètres AI.
  input_mode: z.enum(INPUT_MODE_VALUES).optional().nullable(),
  input_value: z.record(z.string().max(64), z.unknown()).optional().nullable(),
  hardware_mix: z.record(z.string().max(64), z.unknown()).optional().nullable(),
};

export const ScenarioCreateSchema = z.object({
  project_id: Uuid,
  name: ShortText(200),
  // The ticket calls this `kind`; the route + DB call it `scenario_type`.
  // Accept either form and let the handler map.
  scenario_type: z.enum(SCENARIO_TYPE_VALUES).optional(),
  kind: z.enum(SCENARIO_TYPE_VALUES).optional(),
  base_scenario_id: Uuid.optional(),
  // Allow setting writable fields at creation time too.
  ...ScenarioWritableFields,
}).strict().refine(
  (v) => Boolean(v.scenario_type) || Boolean(v.kind),
  { message: 'either "scenario_type" or "kind" must be provided', path: ['scenario_type'] },
);

export const ScenarioUpdateSchema = z.object(ScenarioWritableFields).strict();

// ────────────────────────────────────────────────────────────────────────
// 4. Sources
//    POST /api/admin/hearst/sources
//    PATCH /api/admin/hearst/sources/[id]
// ────────────────────────────────────────────────────────────────────────

const SourceFields = {
  project_id: Uuid.optional().nullable(),
  metric_id: ShortText(200),
  metric_name: ShortText(400),
  value: z.number().finite().optional().nullable(),
  value_text: FreeText(4000).optional().nullable(),
  unit: z.string().max(40).optional().nullable(),
  currency: z.string().max(8).optional().nullable(),
  geography: z.string().max(120).optional().nullable(),
  date_published: IsoDate.optional().nullable(),
  date_accessed: IsoDate.optional().nullable(),
  source_name: ShortText(400),
  source_type: z.enum(SOURCE_TYPE_VALUES),
  source_url: Url.optional().nullable(),
  document_title: ShortText(400).optional().nullable(),
  page_number: z.string().max(40).optional().nullable(),
  quoted_excerpt: FreeText(8000).optional().nullable(),
  confidence_score: Confidence1to5.optional().nullable(),
  triangulation_status: z.enum(TRIANGULATION_STATUS_VALUES).optional().nullable(),
  second_source_id: Uuid.optional().nullable(),
  third_source_id: Uuid.optional().nullable(),
  used_in_model: z.boolean().optional(),
  used_in_scenario: z.enum(USED_IN_SCENARIO_VALUES).optional(),
  admin_override: z.boolean().optional(),
  override_reason: FreeText(4000).optional().nullable(),
  calculation_formula: FreeText(4000).optional().nullable(),
  caveat: FreeText(4000).optional().nullable(),
  applicability_to_qatar: FreeText(4000).optional().nullable(),
};

export const SourceCreateSchema = z.object(SourceFields).strict();

// PATCH: every field optional (including the otherwise-required ones).
const SourceOptionalFields = {
  ...SourceFields,
  metric_id: ShortText(200).optional(),
  metric_name: ShortText(400).optional(),
  source_name: ShortText(400).optional(),
  source_type: z.enum(SOURCE_TYPE_VALUES).optional(),
};
export const SourceUpdateSchema = z.object(SourceOptionalFields).strict();

// ────────────────────────────────────────────────────────────────────────
// 5. Contracts
//    POST /api/admin/hearst/contracts
//    PATCH /api/admin/hearst/contracts/[id]
// ────────────────────────────────────────────────────────────────────────

const ContractFields = {
  project_id: Uuid,
  document_type: ShortText(200),
  title: ShortText(400),
  source_org: ShortText(400).optional().nullable(),
  author: ShortText(400).optional().nullable(),
  date_published: IsoDate.optional().nullable(),
  url: Url.optional().nullable(),
  jurisdiction: ShortText(200).optional().nullable(),
  relevance_to_hearst: FreeText(4000).optional().nullable(),
  extracted_numbers: z.record(z.string().max(200), z.unknown()).optional().nullable(),
  extracted_clauses: z.record(z.string().max(200), z.unknown()).optional().nullable(),
  usable_in_model: z.boolean().optional(),
  confidence: Confidence1to5.optional().nullable(),
  citation: FreeText(4000).optional().nullable(),
  notes: FreeText(4000).optional().nullable(),
};

export const ContractCreateSchema = z.object(ContractFields).strict();

const ContractOptionalFields = {
  ...ContractFields,
  project_id: Uuid.optional(),
  document_type: ShortText(200).optional(),
  title: ShortText(400).optional(),
};
export const ContractUpdateSchema = z.object(ContractOptionalFields).strict();

// ────────────────────────────────────────────────────────────────────────
// 6. Data Room
//    POST /api/admin/hearst/data-room
//    PATCH /api/admin/hearst/data-room/[id]
// ────────────────────────────────────────────────────────────────────────

const DataRoomFields = {
  project_id: Uuid,
  category: z.enum(DATA_ROOM_CATEGORY_VALUES),
  document_type: ShortText(200),
  title: ShortText(400),
  description: FreeText(4000).optional().nullable(),
  status: z.enum(DATA_ROOM_STATUS_VALUES).optional(),
  file_url: Url.optional().nullable(),
  file_name: ShortText(400).optional().nullable(),
  required_for_base_case: z.boolean().optional(),
  linked_metric_ids: z.array(z.string().min(1).max(200)).max(100).optional(),
  reviewer_id: Uuid.optional().nullable(),
  reviewed_at: IsoDate.optional().nullable(),
  notes: FreeText(4000).optional().nullable(),
};

export const DataRoomCreateSchema = z.object(DataRoomFields).strict();

const DataRoomOptionalFields = {
  ...DataRoomFields,
  project_id: Uuid.optional(),
  category: z.enum(DATA_ROOM_CATEGORY_VALUES).optional(),
  document_type: ShortText(200).optional(),
  title: ShortText(400).optional(),
};
export const DataRoomUpdateSchema = z.object(DataRoomOptionalFields).strict();

// ────────────────────────────────────────────────────────────────────────
// 7. Pipeline
//    POST /api/admin/hearst/pipeline
//    PATCH /api/admin/hearst/pipeline/[id]
// ────────────────────────────────────────────────────────────────────────

// `prospect_type` is loosely a CLIENT_TYPES id, but the human admin UI also
// types it free-form. Accept the closed set OR a short free-text string.
const ProspectTypeSchema = z.union([
  z.enum(CLIENT_TYPE_VALUES),
  ShortText(120),
]);

const PipelineFields = {
  project_id: Uuid,
  prospect_name: ShortText(400),
  prospect_type: ProspectTypeSchema,
  mw_requested: Megawatts.optional().nullable(),
  target_price_kw_month: NonNegNumber.max(10_000).optional().nullable(),
  probability_pct: IntegerPct.optional().nullable(),
  expected_signing_date: IsoDate.optional().nullable(),
  contract_length_years: z.number().int().min(0).max(50).optional().nullable(),
  status: z.enum(PIPELINE_STATUS_VALUES).optional(),
  credit_quality: ShortText(40).optional().nullable(),
  strategic_value: FreeText(4000).optional().nullable(),
  cooling_type: ShortText(40).optional().nullable(),
  fit_out_required: z.boolean().optional(),
  notes: FreeText(4000).optional().nullable(),
};

export const PipelineCreateSchema = z.object(PipelineFields).strict();

const PipelineOptionalFields = {
  ...PipelineFields,
  project_id: Uuid.optional(),
  prospect_name: ShortText(400).optional(),
  prospect_type: ProspectTypeSchema.optional(),
};
export const PipelineUpdateSchema = z.object(PipelineOptionalFields).strict();

// ────────────────────────────────────────────────────────────────────────
// 8. Simulator
//    POST /api/admin/hearst/simulate   (stateless preview)
// ────────────────────────────────────────────────────────────────────────

// Payload du champ vedette par mode. Chaque mode a sa shape distincte.
const InputValueSchema = z.union([
  // mw_first
  z.object({
    total_mw: Megawatts,
    phase_split: z.object({
      p1: Megawatts.optional(),
      p2: Megawatts.optional(),
      p3: Megawatts.optional(),
    }).strict().optional(),
  }).strict(),
  // capital_first
  z.object({
    total_capex_usd: z.number().finite().min(1_000_000).max(50_000_000_000),
  }).strict(),
  // target_irr_first
  z.object({
    target_irr_pct: z.number().finite().min(0).max(60),
    lever: z.enum(SOLVER_LEVER_VALUES),
    total_mw: Megawatts.optional(),
  }).strict(),
]);

const HardwareMixSchema = z.object({
  classic_pct: Percent100.optional(),
  liquid_pct: Percent100.optional(),
  ai_pct: Percent100.optional(),
  gpu_sku_id: z.string().min(1).max(60).optional().nullable(),
  gpu_mix: z.array(z.object({
    sku_id: z.string().min(1).max(60),
    pct: Percent100,
  }).strict()).max(10).optional(),
  num_racks: z.number().int().min(0).max(10_000).optional(),
  utilization_pct: Percent100.optional(),
  gpu_hour_price: z.number().finite().min(0).max(50).optional(),
}).strict();

export const SimulateRequestSchema = z.object({
  input_mode: z.enum(INPUT_MODE_VALUES),
  input_value: InputValueSchema,
  archetype_id: z.enum(ARCHETYPE_VALUES),
  business_model_id: z.enum(BUSINESS_MODEL_VALUES).optional(),
  client_type_id: z.enum(CLIENT_TYPE_VALUES).optional(),
  geography: z.enum(['qatar', 'mena', 'global']).optional(),
  hardware_mix: HardwareMixSchema.optional(),
  scenario_overrides: z.object(ScenarioWritableFields).strict().optional(),
}).strict();

// ────────────────────────────────────────────────────────────────────────
// 9. Catalog
//    Rows renvoyés par GET /api/admin/hearst/catalog/gpus
//    (validation côté serveur avant retour client)
// ────────────────────────────────────────────────────────────────────────

export const GpuCatalogRowSchema = z.object({
  id: Uuid,
  sku: ShortText(120),
  vendor: z.enum(GPU_VENDOR_VALUES),
  tdp_w: z.number().finite().min(1).max(10_000_000),
  msrp_usd: z.number().finite().min(0).max(50_000_000),
  density_per_rack: z.number().int().min(1).max(256),
  perf_tflops_fp16: z.number().finite().min(0).optional().nullable(),
  perf_tflops_fp8: z.number().finite().min(0).optional().nullable(),
  hbm_gb: z.number().int().min(0).max(2000).optional().nullable(),
  available_from: IsoDate.optional().nullable(),
  use_case: z.enum(GPU_USE_CASE_VALUES).optional().nullable(),
  reference_url: Url.optional().nullable(),
  source_id: Uuid.optional().nullable(),
  notes: FreeText(2000).optional().nullable(),
}).strict();

export const ArchetypeDefaultsRowSchema = z.object({
  id: Uuid,
  archetype_id: z.enum(ARCHETYPE_VALUES),
  business_model_id: z.enum(BUSINESS_MODEL_VALUES),
  geography: ShortText(60),
  capex_per_mw_usd: z.number().finite().min(0).max(100_000_000).optional().nullable(),
  opex_pct: RatioPct.optional().nullable(),
  pricing_kw_month: z.number().finite().min(0).max(10_000).optional().nullable(),
  margin_pct: RatioPct.optional().nullable(),
  source_id: Uuid.optional().nullable(),
  notes: FreeText(2000).optional().nullable(),
}).strict();

// ────────────────────────────────────────────────────────────────────────
// 10. Deals
//     POST /api/admin/hearst/deals
//     PATCH /api/admin/hearst/deals/[id]
// ────────────────────────────────────────────────────────────────────────

const IsoDateStrict = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const DEAL_STATUS_VALUES = ['prospecting', 'term_sheet_sent', 'due_diligence', 'negotiation', 'signed', 'live'];
export const DEAL_TYPE_VALUES = ['powered_shell', 'wholesale_lease', 'hyperscale_anchor', 'jv', 'sale_leaseback', 'manage_only'];

export const DealCreateSchema = z.object({
  project_id: Uuid,
  operator_id: ShortText(100),
  operator_name: ShortText(200),
  deal_type: z.enum(DEAL_TYPE_VALUES),
  status: z.enum(DEAL_STATUS_VALUES).default('prospecting'),
  capacity_mw: z.number().finite().min(0).max(10_000).optional().nullable(),
  price_kw_month: z.number().finite().min(0).max(10_000).optional().nullable(),
  contract_term_years: z.number().int().min(1).max(50).optional().nullable(),
  expected_close_date: IsoDateStrict.optional().nullable(),
  linked_scenario_id: Uuid.optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
}).strict();

export const DealUpdateSchema = DealCreateSchema.omit({ project_id: true }).partial();
