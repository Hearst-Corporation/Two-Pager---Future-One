// lib/oracle-intelligence/reality.js
//
// Sprint 2 — Reality Layer.
// Étend les operational_realism du Sprint 0 avec un vocabulaire structuré,
// utilisable par l'endpoint memo pour détecter mécaniquement les
// "financially attractive but operationally constrained" scenarios.

const REALITY_CONSTRAINTS = {
  transformer_lead_time: {
    label: 'Power transformer lead time (>50 MVA)',
    benchmark_months: 22,
    range_months: [18, 28],
    constraint_type: 'supply_chain',
    severity: 'high',
    region_modifier: { gcc: -2, europe: 0, north_america: +2, apac: 0 },
    mitigation: 'Pre-order with anchor LOI ; partner with utility for shared spares ; modular substation strategy',
    breaks_timeline_below_months: 18,
  },
  switchgear_mv_lead_time: {
    label: 'Medium-voltage switchgear',
    benchmark_months: 15,
    range_months: [12, 20],
    constraint_type: 'supply_chain',
    severity: 'medium',
    mitigation: 'Early Schneider / Siemens allocation ; pre-spec to standard ratings',
  },
  liquid_cooling_cdu_lead_time: {
    label: 'Liquid-cooling CDU (Vertiv/Stulz/Schneider)',
    benchmark_months: 9,
    range_months: [6, 14],
    constraint_type: 'supply_chain',
    severity: 'medium',
    mitigation: 'Vertiv reservation ; dual-source ; pre-piped white-space',
  },
  gb200_allocation_lead_time: {
    label: 'NVIDIA GB200 NVL72 rack allocation',
    benchmark_months: 12,
    range_months: [10, 18],
    constraint_type: 'supply_chain',
    severity: 'high',
    mitigation: 'NVIDIA Elite partner status + hyperscaler co-allocation ; consider H200 bridge fleet',
    breaks_timeline_below_months: 10,
  },
  h100_allocation_lead_time: {
    label: 'NVIDIA H100/H200 allocation',
    benchmark_months: 4,
    range_months: [3, 8],
    constraint_type: 'supply_chain',
    severity: 'medium',
    mitigation: 'NVIDIA partner channel + anchor customer LOI',
  },
  utility_grid_50mw_approval: {
    label: 'New >50 MW grid connection approval',
    benchmark_months: 27,
    range_months: [18, 36],
    constraint_type: 'regulatory',
    severity: 'high',
    region_modifier: { gcc: -3, europe: +3, north_america: 0, apac: +6 },
    mitigation: 'Utility MOU early ; phased connection 25MW → 50MW ; government acceleration where available',
    breaks_timeline_below_months: 18,
  },
  permit_free_zone: {
    label: 'Permit cycle (free zone / government expedited)',
    benchmark_months: 7,
    range_months: [4, 12],
    constraint_type: 'regulatory',
    severity: 'low',
    region_modifier: { gcc: -2, europe: +12, north_america: +6, apac: +3 },
    mitigation: 'QFZA / NEOM / Khazna fast-track ; pre-engagement with regulator',
  },
  permit_greenfield_eu: {
    label: 'Permit cycle (EU greenfield with EIA + water + heat-reuse)',
    benchmark_months: 24,
    range_months: [18, 36],
    constraint_type: 'regulatory',
    severity: 'high',
    mitigation: 'Brownfield site re-use ; EIA-light path ; municipality partnership',
    breaks_timeline_below_months: 18,
  },
  subsea_cable_landing: {
    label: 'New subsea cable landing',
    benchmark_months: 36,
    range_months: [24, 48],
    constraint_type: 'regulatory',
    severity: 'high',
    mitigation: 'Land on existing systems (Khor Fakkan, Salalah, Marseille) ; metro-fiber to existing landing',
  },
  cooling_water_permit: {
    label: 'Water permit for evaporative cooling',
    benchmark_months: 9,
    range_months: [6, 18],
    constraint_type: 'regulatory',
    severity: 'medium',
    region_modifier: { gcc: +3, europe: +6, north_america: 0, apac: 0 },
    mitigation: 'Closed-loop dry cooling ; reclaimed water ; air-cooled where ambient permits',
  },
  cooling_climate_constraint: {
    label: 'Hot-climate cooling constraint (sustained 45°C ambient)',
    benchmark_pct_premium: 0.20,
    range_pct: [0.15, 0.25],
    constraint_type: 'operational',
    severity: 'medium',
    mitigation: 'Liquid-assist + closed-loop dry ; desalination integration ; underground/buried structures',
  },
  interconnect_carrier_neutral: {
    label: 'Carrier-neutral fabric activation',
    benchmark_weeks: 6,
    range_weeks: [4, 12],
    constraint_type: 'operational',
    severity: 'low',
    mitigation: 'Megaport / Console + pre-provisioned ports',
  },
  hyperscaler_direct_onramp: {
    label: 'Direct hyperscaler on-ramp (Direct Connect / ExpressRoute / Interconnect)',
    benchmark_weeks: 12,
    range_weeks: [8, 20],
    constraint_type: 'operational',
    severity: 'low',
    mitigation: 'Pre-coordinate with hyperscaler ops ; whitelist process early',
  },
  staffing_specialized_ops: {
    label: 'Specialized DC ops staffing (Tier IV + liquid)',
    benchmark_months: 9,
    range_months: [6, 18],
    constraint_type: 'operational',
    severity: 'medium',
    region_modifier: { gcc: +3, europe: 0, north_america: 0, apac: +3 },
    mitigation: 'Partner with experienced operator ; expat + local training pipeline ; managed services',
  },
  procurement_anchor_contract: {
    label: 'Anchor tenant LOI → signed contract',
    benchmark_months: 6,
    range_months: [3, 12],
    constraint_type: 'commercial',
    severity: 'high',
    mitigation: 'Strong commercial term sheet ; tenant credit underwriting; government anchor commitment',
  },
  occupancy_ramp_hyperscale: {
    label: 'Hyperscale occupancy ramp (post-COD)',
    pct_year_1: 0.80,
    pct_year_2: 0.90,
    constraint_type: 'commercial',
    severity: 'medium',
    mitigation: 'Anchor LOI pre-COD ; phased capacity matching tenant ramp',
  },
  occupancy_ramp_retail_colo: {
    label: 'Retail colo occupancy ramp (mature market)',
    pct_year_1: 0.25,
    pct_year_2: 0.45,
    pct_year_3: 0.60,
    pct_year_5: 0.80,
    constraint_type: 'commercial',
    severity: 'medium',
    mitigation: 'Channel partner activation; ecosystem-driven cross-connect demand',
  },
  occupancy_ramp_neocloud: {
    label: 'GPU neocloud utilization (post-ramp)',
    pct_post_ramp: 0.78,
    pct_year_1: 0.50,
    constraint_type: 'commercial',
    severity: 'high',
    mitigation: 'Reserved capacity contracts ; flex into spot ; hyperscaler offtake',
  },
};

/**
 * Inspect a proposed timeline against the constraints above and return
 * structured flags. The memo endpoint can pass these flags as raw input
 * to the LLM (which then surfaces them in section 10 — Deployment Roadmap).
 */
export function detectRealityViolations({ months_to_cod, region = 'qatar', has_liquid_cooling = false, gpu_sku = null }) {
  const flags = [];
  const r = region in { gcc: 1, qatar: 1, uae: 1, saudi_arabia: 1, oman: 1, bahrain: 1, kuwait: 1 } ? 'gcc' : region;

  function checkOne(constraintId) {
    const c = REALITY_CONSTRAINTS[constraintId];
    if (!c) return;
    const breaksBelow = c.breaks_timeline_below_months;
    if (!breaksBelow) return;
    let effective = breaksBelow;
    if (c.region_modifier && c.region_modifier[r] != null) effective += c.region_modifier[r];
    if (months_to_cod < effective) {
      flags.push({
        constraint_id: constraintId,
        constraint: c.label,
        severity: c.severity,
        message: `${c.label} typically requires ≥ ${effective} months; proposed ${months_to_cod} months. ${c.mitigation || ''}`.trim(),
      });
    }
  }

  checkOne('transformer_lead_time');
  checkOne('utility_grid_50mw_approval');
  if (region === 'europe') checkOne('permit_greenfield_eu');
  if (has_liquid_cooling) checkOne('liquid_cooling_cdu_lead_time');
  if (gpu_sku && /gb200/i.test(gpu_sku)) checkOne('gb200_allocation_lead_time');

  return flags;
}
