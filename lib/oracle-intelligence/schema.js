// lib/oracle-intelligence/schema.js
//
// Sprint 2 — Infrastructure Intelligence schema.
// Une seule définition des shapes que les datapoints, entities, comparables,
// tensions, absorption et reality blocks doivent respecter. Aucune classe
// — juste des constantes et des helpers de validation light pour développeur.

// ────────────────────────────────────────────────────────────────────────
// Enums — figés. Toute extension passe par revue.
// ────────────────────────────────────────────────────────────────────────

const ENTITY_CATEGORIES = [
  'datacenter_operator',     // Equinix, DLR, NTT, Vantage, CyrusOne, QTS, Switch, Data4
  'ai_native_infra',         // CoreWeave, Crusoe, Lambda, Nebius, TensorWave, Together, Fluidstack
  'sovereign_regional',      // G42, NEOM, NSDA, QIA, KAHRAMAA, Qatar partnerships
  'infra_economics',         // Brookfield, Blackstone, CBRE, JLL, utilities, supply chain
  'hyperscaler',             // AWS, Azure, GCP, Oracle Cloud, Meta
  'hardware_vendor',         // NVIDIA, AMD, Broadcom, Supermicro
];

export const SOURCE_TYPES = [
  '10k',                     // SEC annual filing
  '10q',                     // SEC quarterly filing
  '8k',                      // SEC current report
  'investor_day',            // Investor presentation
  'earnings_call',           // Earnings transcript
  'press_release',
  'product_sheet',
  'rate_card',               // Public pricing
  'market_report',           // CBRE / JLL / Synergy / Gartner
  'industry_analyst',        // Dell'Oro / 451 Research / Omdia
  'deal_comp',               // Disclosed transaction
  'partnership_announcement',
  'national_strategy',       // Government white paper
  'sovereign_disclosure',    // SWF / state-owned entity disclosure
  'utility_disclosure',
  'supplier_disclosure',     // Vertiv, Schneider, Siemens guidance
  'rfp_excerpt',
  'consultant_estimate',     // T&T, Arcadis, Mott MacDonald
  'admin_input',             // manually injected (lower trust)
];

const SOURCE_AUTHORITY = [
  'tier_1',  // SEC filing / signed contract / government publication / SWF disclosure
  'tier_2',  // Earnings call / investor day / consultant benchmark (T&T, CBRE, JLL)
  'tier_3',  // Press release / partnership announcement / industry analyst
  'tier_4',  // Vendor product sheet / public rate card
  'tier_5',  // Admin input / model assumption / community-sourced
];

const CONFIDENCE_LEVELS = [
  'high',     // Sourced + recent + corroborated by ≥2 comparables
  'medium',   // Sourced but partial coverage or single comparable
  'low',      // Inferred / extrapolated / no public comparable
];

const VOLATILITY = [
  'low',      // CAPEX/MW shell, PUE, lease terms — moves <10%/yr
  'medium',   // Pricing $/kW/mo, EBITDA margins — moves 10-25%/yr
  'high',     // GPU $/hr, GPU MSRP, supply chain lead times — moves >25%/yr
];

const COMPARABLE_TYPES = [
  'pricing',
  'capex',
  'opex',
  'pue_efficiency',
  'leverage',
  'contract_term',
  'occupancy_ramp',
  'utilization',
  'gpu_economics',
  'energy',
  'cooling',
  'supply_chain_lead_time',
  'partnership_structure',
  'sovereign_alignment',
  'commercial_absorption',
];

// ────────────────────────────────────────────────────────────────────────
// Datapoint shape — what each public source / benchmark must carry
// ────────────────────────────────────────────────────────────────────────

/**
 * Datapoint structure (mandatory fields :
 *   id, entity_id, category, region, source_type, source_authority,
 *   timestamp, confidence, volatility, comparable_type, relevance_score,
 *   metrics, notes)
 *
 * Example :
 * {
 *   id: 'eqx_retail_price_2024',
 *   entity_id: 'equinix',
 *   category: 'datacenter_operator',
 *   region: 'global',
 *   source_type: '10k',
 *   source_authority: 'tier_1',
 *   timestamp: '2025-02-15',
 *   confidence: 'high',
 *   volatility: 'medium',
 *   comparable_type: 'pricing',
 *   relevance_score: 4, // 1..5
 *   metrics: { price_retail_colo_kw_month: 165, unit: '$/kW/month' },
 *   notes: {
 *     source_name: 'Equinix 2024 Form 10-K',
 *     url: 'https://...',
 *     quoted_excerpt: 'Average MRR per cabinet...',
 *     applicability: 'Global benchmark — Qatar +10–15% expected',
 *     caveat: 'Global blend, MENA not in footprint',
 *   },
 * }
 */
export function validateDatapoint(d) {
  const errors = [];
  const required = ['id', 'entity_id', 'category', 'region', 'source_type', 'source_authority', 'timestamp', 'confidence', 'volatility', 'comparable_type', 'relevance_score', 'metrics', 'notes'];
  for (const k of required) {
    if (d[k] === undefined || d[k] === null) errors.push(`missing ${k}`);
  }
  if (d.category && !ENTITY_CATEGORIES.includes(d.category)) errors.push(`unknown category : ${d.category}`);
  if (d.source_type && !SOURCE_TYPES.includes(d.source_type)) errors.push(`unknown source_type : ${d.source_type}`);
  if (d.source_authority && !SOURCE_AUTHORITY.includes(d.source_authority)) errors.push(`unknown source_authority : ${d.source_authority}`);
  if (d.confidence && !CONFIDENCE_LEVELS.includes(d.confidence)) errors.push(`unknown confidence : ${d.confidence}`);
  if (d.volatility && !VOLATILITY.includes(d.volatility)) errors.push(`unknown volatility : ${d.volatility}`);
  if (d.comparable_type && !COMPARABLE_TYPES.includes(d.comparable_type)) errors.push(`unknown comparable_type : ${d.comparable_type}`);
  if (d.relevance_score != null && (d.relevance_score < 1 || d.relevance_score > 5)) errors.push(`relevance_score out of range : ${d.relevance_score}`);
  return { ok: errors.length === 0, errors };
}

// ────────────────────────────────────────────────────────────────────────
// Entity shape — the operators / SWFs / utilities the datapoints reference
// ────────────────────────────────────────────────────────────────────────

/**
 * Entity structure :
 * {
 *   id: 'equinix',
 *   name: 'Equinix, Inc.',
 *   category: 'datacenter_operator',
 *   ticker: 'EQIX',
 *   headquarters: 'US',
 *   commercial_model: ['retail_colo', 'wholesale_colo', 'xscale_hyperscale'],
 *   sovereign_alignment: 'commercial' | 'sovereign' | 'mixed',
 *   strategic_notes: { ... },
 * }
 */

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

/**
 * Freshness score 0..1 based on volatility class and elapsed days.
 * - low volatility : 0.5 after 24 months
 * - medium         : 0.5 after 12 months
 * - high           : 0.5 after  6 months
 */
export function freshnessScore(timestamp, volatility = 'medium') {
  if (!timestamp) return 0;
  const days = (Date.now() - new Date(timestamp).getTime()) / MS_PER_DAY;
  if (days < 0) return 1;
  const halfLifeDays = volatility === 'high' ? 180 : volatility === 'low' ? 730 : 365;
  return Math.max(0, Math.min(1, Math.pow(0.5, days / halfLifeDays)));
}

/**
 * Composite trust score 0..100.
 * Weights : authority 40% · confidence 30% · freshness 20% · relevance 10%.
 */
export function trustScore(dp) {
  if (!dp) return 0;
  const authorityWeight = { tier_1: 1.0, tier_2: 0.85, tier_3: 0.65, tier_4: 0.5, tier_5: 0.3 };
  const confidenceWeight = { high: 1.0, medium: 0.7, low: 0.4 };
  const a = authorityWeight[dp.source_authority] ?? 0.3;
  const c = confidenceWeight[dp.confidence] ?? 0.4;
  const f = freshnessScore(dp.timestamp, dp.volatility);
  const r = (dp.relevance_score || 3) / 5;
  return Math.round((a * 40 + c * 30 + f * 20 + r * 10));
}
