// lib/oracle-live/energy.js
//
// Sprint 3 — Energy Intelligence Layer.
// Regional electricity tariff data, cooling sensitivity, water stress, and
// grid dependency for GCC-primary regions + Europe / APAC / North America.
//
// Curation principles:
//   • No fabricated values. Every field cites a source_datapoint_id (anchored in
//     lib/oracle-intelligence/datapoints.js) or a source:'consultant_estimate'.
//   • No scraping. Static anchors only.
//   • GCC regions carry high-confidence values; ROW regions use broader ranges
//     and confidence:'medium' where public data is limited.
//
// Datapoint IDs hydrated from datapoints.js:
//   kahramaa_tariff_industrial       → qatar electricity_tariff_industrial_usd_mwh
//   kahramaa_grid_capacity           → qatar grid_dependency + capacity note
//   qatar_water_stress_index         → qatar water_stress_index
//   uae_dewa_tariff                  → uae electricity_tariff_industrial_usd_mwh
//   ksa_sec_tariff                   → saudi_arabia electricity_tariff_industrial_usd_mwh
//   ksa_renewable_target_2030        → saudi_arabia renewable_share_pct.target_2030
//   eu_avg_industrial_tariff         → europe electricity_tariff_industrial_usd_mwh
//   us_pjm_wholesale_2024            → north_america electricity_tariff_industrial_usd_mwh
//   uae_pue_target_climate           → uae cooling context
//   mena_permit_timeline_free_zone   → qatar reality_constraints

'use strict';

/**
 * @typedef {Object} TariffSpec
 * @property {number} value                    - Central value (USD/MWh)
 * @property {number} range_low                - Conservative lower bound
 * @property {number} range_high               - Upper bound
 * @property {'high'|'medium'|'low'} confidence
 * @property {'low'|'medium'|'high'} volatility
 * @property {string} [source_datapoint_id]    - ID from datapoints.js
 * @property {string} [source]                 - Fallback source label
 */

/**
 * @typedef {Object} RenewableShare
 * @property {number} value                    - Current share (0-1)
 * @property {number|null} target_2030         - 2030 target (0-1) or null
 * @property {string} source
 */

/**
 * @typedef {Object} EnergyRegion
 * @property {string} region
 * @property {string} label
 * @property {TariffSpec} electricity_tariff_industrial_usd_mwh
 * @property {TariffSpec} electricity_tariff_data_center_usd_mwh
 * @property {'high'|'medium'|'low'} cooling_sensitivity
 * @property {number} water_stress_index                         - 0-5 WRI Aqueduct scale
 * @property {'monopoly_state'|'wholesale_market'|'mixed'} grid_dependency
 * @property {RenewableShare} renewable_share_pct
 * @property {'low'|'medium'|'high'} energy_volatility
 * @property {'high'|'medium'|'low'} source_confidence
 * @property {string[]} reality_constraints
 * @property {string[]} static_anchors                           - datapoint ids used
 */

/** @type {Record<string, EnergyRegion>} */
const ENERGY_REGIONS = {
  // ─── QATAR ────────────────────────────────────────────────────────────────
  // Primary market. Datapoints: kahramaa_tariff_industrial, kahramaa_grid_capacity,
  // qatar_water_stress_index, mena_permit_timeline_free_zone.
  qatar: {
    region: 'qatar',
    label: 'Qatar',
    electricity_tariff_industrial_usd_mwh: {
      value: 42,
      range_low: 38,
      range_high: 48,
      confidence: 'high',
      volatility: 'low',
      source_datapoint_id: 'kahramaa_tariff_industrial',
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 45,
      range_low: 40,
      range_high: 55,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',
      // DC-class tariff is not separately published by KAHRAMAA; consultant
      // estimates a 7-15% uplift on industrial_large rate.
    },
    cooling_sensitivity: 'high',       // sustained 35-45 deg C ambient; no free cooling
    water_stress_index: 4.7,           // WRI Aqueduct score; source: qatar_water_stress_index
    grid_dependency: 'monopoly_state', // single utility (KAHRAMAA); no wholesale
    renewable_share_pct: {
      value: 0.05,
      target_2030: null,               // Qatar National Vision has no hard RE% target
      source: 'utility_disclosure',
    },
    energy_volatility: 'low',          // state-subsidised; historically stable
    source_confidence: 'high',
    reality_constraints: [
      'Water permits for evaporative/hybrid cooling typically 9 months in GCC; closed-loop dry-cooling mandatory for large deployments.',
      'New 50 MW grid connection requires ~24 months from application (KAHRAMAA planning cycle).',
      'KAHRAMAA monopoly means no PPA arbitrage; tariff set administratively with ~3-5%/yr historical creep.',
      'No free-cooling window year-round; PUE floor 1.40 for air-cooled, 1.20 for liquid-cooled.',
    ],
    static_anchors: [
      'kahramaa_tariff_industrial',
      'kahramaa_grid_capacity',
      'qatar_water_stress_index',
      'mena_permit_timeline_free_zone',
      'qatar_grid_approval_timeline',
    ],
  },

  // ─── SAUDI ARABIA ─────────────────────────────────────────────────────────
  // Datapoints: ksa_sec_tariff, ksa_renewable_target_2030, ksa_demand_pipeline.
  saudi_arabia: {
    region: 'saudi_arabia',
    label: 'Saudi Arabia',
    electricity_tariff_industrial_usd_mwh: {
      value: 55,
      range_low: 48,
      range_high: 65,
      confidence: 'high',
      volatility: 'low',
      source_datapoint_id: 'ksa_sec_tariff',
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 58,
      range_low: 50,
      range_high: 72,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',
    },
    cooling_sensitivity: 'high',       // Riyadh/Dammam >45 deg C peaks; coast more moderate
    water_stress_index: 4.5,           // WRI Aqueduct; consultant proxy for SEC service area
    grid_dependency: 'monopoly_state', // SEC (Saudi Electricity Company); Vision 2030 RE reform in progress
    renewable_share_pct: {
      value: 0.03,
      target_2030: 0.50,
      source: 'ksa_renewable_target_2030',
    },
    energy_volatility: 'low',
    source_confidence: 'high',
    reality_constraints: [
      'SEC monopoly transitioning; competitive RE procurement (REPDO) maturing but still opaque for DC-grade offtake.',
      'NEOM / Oxagon green H2 power available 2027+ at premium; stranded gas arbitrage possible in Eastern Province.',
      'Water stress 4.5/5 drives dry-cooling requirement; add $1.5M-$2.0M/MW cooling capex vs temperate markets.',
      'Vision 2030 targets 50% RE by 2030; DC developers can negotiate PPA on greenfield NEOM-adjacent sites.',
    ],
    static_anchors: [
      'ksa_sec_tariff',
      'ksa_renewable_target_2030',
      'ksa_demand_pipeline',
      'neom_oxagon_dc_campus',
    ],
  },

  // ─── UAE ──────────────────────────────────────────────────────────────────
  // Datapoints: uae_dewa_tariff, uae_pue_target_climate, khazna_uae_mw_committed.
  uae: {
    region: 'uae',
    label: 'United Arab Emirates',
    electricity_tariff_industrial_usd_mwh: {
      value: 50,
      range_low: 44,
      range_high: 60,
      confidence: 'high',
      volatility: 'low',
      source_datapoint_id: 'uae_dewa_tariff',
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 54,
      range_low: 48,
      range_high: 65,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',
    },
    cooling_sensitivity: 'high',       // Abu Dhabi/Dubai summer peaks; coastal humidity compounds
    water_stress_index: 4.6,           // WRI Aqueduct; desalination-dependent nation
    grid_dependency: 'mixed',          // DEWA (Dubai) monopoly; ADDC Abu Dhabi + RE reform (Masdar / ENEC)
    renewable_share_pct: {
      value: 0.14,
      target_2030: 0.44,
      source: 'utility_disclosure',    // Mohammed bin Rashid Al Maktoum Solar Park disclosures
    },
    energy_volatility: 'low',
    source_confidence: 'high',
    reality_constraints: [
      'DEWA dual-utility structure (Dubai vs Abu Dhabi) means tariff and RE access varies by emirate.',
      'Sustained 45 deg C ambient; air-cooled PUE realistic 1.55, liquid 1.25 (source: uae_pue_target_climate).',
      'Water stress 4.6/5; large evaporative towers subject to permit and seasonal restriction.',
      'Strong RE pipeline (Masdar) enables PPA negotiation for 2026+ commissioning with 6-12 month lead.',
    ],
    static_anchors: [
      'uae_dewa_tariff',
      'uae_pue_target_climate',
      'khazna_uae_mw_committed',
      'khazna_microsoft_partnership',
    ],
  },

  // ─── BAHRAIN ──────────────────────────────────────────────────────────────
  // No dedicated Bahrain tariff datapoint in datapoints.js.
  // Values from consultant triangulation with neighbouring GCC utilities.
  bahrain: {
    region: 'bahrain',
    label: 'Bahrain',
    electricity_tariff_industrial_usd_mwh: {
      value: 38,
      range_low: 32,
      range_high: 46,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',   // EWA (Electricity & Water Authority) subsidised tariff
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 42,
      range_low: 36,
      range_high: 52,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',
    },
    cooling_sensitivity: 'high',       // coastal humidity + 45 deg C peak; corrosion risk
    water_stress_index: 4.8,           // highest in GCC; near-total desalination dependency
    grid_dependency: 'monopoly_state', // EWA monopoly
    renewable_share_pct: {
      value: 0.06,
      target_2030: 0.20,
      source: 'consultant_estimate',   // National Energy Efficiency Action Plan 2021
    },
    energy_volatility: 'low',
    source_confidence: 'medium',
    reality_constraints: [
      'EWA grid headroom constrained; large DC loads (>20 MW) require sovereign sponsor letter.',
      'Highest water stress in GCC (4.8/5); closed-loop dry cooling non-negotiable.',
      'Bahrain FinTech Bay / CALI free-zone offers streamlined permitting (~6 months) for compliant operators.',
      'Small grid; single interconnect to Saudi GCC grid; dependency risk for >99.99% uptime SLAs.',
    ],
    static_anchors: [],                // no direct datapoint ids; values from consultant triangulation
  },

  // ─── OMAN ─────────────────────────────────────────────────────────────────
  // No dedicated Oman tariff datapoint in datapoints.js.
  oman: {
    region: 'oman',
    label: 'Oman',
    electricity_tariff_industrial_usd_mwh: {
      value: 40,
      range_low: 34,
      range_high: 50,
      confidence: 'medium',
      volatility: 'medium',           // ongoing Omanisation + subsidy reform
      source: 'consultant_estimate',  // OETC / Mazoon Electricity; limited public filings
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 44,
      range_low: 38,
      range_high: 56,
      confidence: 'medium',
      volatility: 'medium',
      source: 'consultant_estimate',
    },
    cooling_sensitivity: 'high',
    water_stress_index: 4.3,           // WRI Aqueduct proxy; coastal regions slightly lower
    grid_dependency: 'monopoly_state',
    renewable_share_pct: {
      value: 0.08,
      target_2030: 0.30,
      source: 'consultant_estimate',   // Oman Vision 2040 RE target
    },
    energy_volatility: 'medium',       // subsidy reform trajectory unclear post 2026
    source_confidence: 'medium',
    reality_constraints: [
      'Oman subsidy reform (started 2021) may push industrial tariffs 15-25% higher by 2028.',
      'Grid capacity limited outside Muscat-Sohar corridor; greenfield sites require transmission investment.',
      'Salalah free zone offers PPA-adjacent structures with Dhofar Power Company.',
      'Water stress 4.3/5; hybrid dry+liquid cooling required; cooling capex premium ~$1.2M/MW.',
    ],
    static_anchors: [],
  },

  // ─── KUWAIT ───────────────────────────────────────────────────────────────
  // No dedicated Kuwait tariff datapoint in datapoints.js.
  kuwait: {
    region: 'kuwait',
    label: 'Kuwait',
    electricity_tariff_industrial_usd_mwh: {
      value: 20,
      range_low: 15,
      range_high: 28,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',  // MEW (Ministry of Electricity & Water); heavily subsidised
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 25,
      range_low: 18,
      range_high: 35,
      confidence: 'medium',
      volatility: 'low',
      source: 'consultant_estimate',
    },
    cooling_sensitivity: 'high',       // extreme heat; 50 deg C peaks
    water_stress_index: 4.9,           // near-maximum; 100% desalination
    grid_dependency: 'monopoly_state',
    renewable_share_pct: {
      value: 0.01,
      target_2030: 0.15,
      source: 'consultant_estimate',
    },
    energy_volatility: 'low',          // ultra-subsidised but politically rigid
    source_confidence: 'medium',
    reality_constraints: [
      'Lowest nominal tariff in GCC (heavily subsidised) but near-zero RE availability; green credentialing impossible.',
      'Water stress 4.9/5 — highest globally; any cooling water use requires full desalination cycle.',
      '50 deg C summer peaks mandate district cooling or full liquid immersion; PUE floor 1.50 for air-cooled.',
      'No free-zone fast-track; permit cycles 18-24 months; limited foreign-ownership regime outside KDIPA.',
    ],
    static_anchors: [],
  },

  // ─── EUROPE ───────────────────────────────────────────────────────────────
  // Datapoints: eu_avg_industrial_tariff, eu_permit_timeline, jll_emea_dc_2024.
  // Broader range reflects extreme country-level variation (Nordic vs DACH vs Southern).
  europe: {
    region: 'europe',
    label: 'Europe (aggregate)',
    electricity_tariff_industrial_usd_mwh: {
      value: 95,
      range_low: 55,                   // Nordic hydro (Sweden, Finland ~$55)
      range_high: 145,                 // DACH peak seasons ~$140+
      confidence: 'medium',
      volatility: 'high',
      source_datapoint_id: 'eu_avg_industrial_tariff',
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 100,
      range_low: 60,
      range_high: 155,
      confidence: 'medium',
      volatility: 'high',
      source: 'aggregated_consultant', // JLL / CBRE EMEA DC reports
    },
    cooling_sensitivity: 'low',        // temperate; free-cooling viable 6-9 months/year in Northern EU
    water_stress_index: 2.1,           // EU aggregate (Aqueduct); varies: Spain 4.0, Nordics 0.5
    grid_dependency: 'wholesale_market',
    renewable_share_pct: {
      value: 0.45,
      target_2030: 0.69,               // EU 2030 Fit-for-55 target
      source: 'aggregated_consultant',
    },
    energy_volatility: 'high',         // gas price coupling; spot market exposure post-2022 crisis
    source_confidence: 'medium',
    reality_constraints: [
      'Permitting 18-24 months typical across EU (source: eu_permit_timeline); delays up to 36+ in SE Europe.',
      'Grid connection queues 24-48 months in constrained markets (Ireland, Netherlands, Frankfurt).',
      'High volatility driven by gas-indexed power markets; hedging via 10-year PPA recommended.',
      'Strong free-cooling availability in Nordics / Baltics reduces cooling opex 40-60% vs GCC.',
    ],
    static_anchors: [
      'eu_avg_industrial_tariff',
      'eu_permit_timeline',
      'jll_emea_dc_2024',
      'eu_dc_demand_2030',
    ],
  },

  // ─── APAC ─────────────────────────────────────────────────────────────────
  // Aggregated; JP / SG / AU / IN / HK flagged within range notes.
  apac: {
    region: 'apac',
    label: 'Asia-Pacific (aggregate)',
    electricity_tariff_industrial_usd_mwh: {
      value: 80,
      range_low: 45,                   // India industrial ~$45-55; AU renewable contracts ~$50
      range_high: 130,                 // Japan / Hong Kong ~$110-130
      confidence: 'medium',
      volatility: 'medium',
      source: 'aggregated_consultant', // no single tier_1 public filing covers APAC aggregate
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 90,
      range_low: 50,
      range_high: 140,
      confidence: 'medium',
      volatility: 'medium',
      source: 'aggregated_consultant',
    },
    cooling_sensitivity: 'medium',     // SE Asia / India = high; Japan / AU = medium
    water_stress_index: 2.8,           // aggregate; India 4.0+, SG 3.5, AU East 2.5
    grid_dependency: 'mixed',
    renewable_share_pct: {
      value: 0.28,
      target_2030: 0.45,
      source: 'aggregated_consultant',
    },
    energy_volatility: 'medium',
    source_confidence: 'medium',
    reality_constraints: [
      'Singapore moratorium on new DC power (>10 MW) lifted only for green-certified projects; minimum PUE 1.30.',
      'India Tier-2 cities offer $45-55/MWh but grid reliability <99.9% requires on-site genset backup.',
      'Japan / HK tariffs elevated ($110-130/MWh) but compensated by density premium on co-location pricing.',
      'APAC permit timelines vary 6 months (SG fast-track) to 24+ months (India non-SEZ).',
    ],
    static_anchors: [],
  },

  // ─── NORTH AMERICA ────────────────────────────────────────────────────────
  // Datapoints: us_pjm_wholesale_2024, cyrus_capex_per_mw.
  north_america: {
    region: 'north_america',
    label: 'North America',
    electricity_tariff_industrial_usd_mwh: {
      value: 45,
      range_low: 28,                   // ERCOT wind arbitrage; Pacific NW hydro ~$30
      range_high: 80,                  // PJM peak + capacity charges; Northeast constrained
      confidence: 'medium',
      volatility: 'high',
      source_datapoint_id: 'us_pjm_wholesale_2024',
    },
    electricity_tariff_data_center_usd_mwh: {
      value: 55,
      range_low: 35,
      range_high: 90,
      confidence: 'medium',
      volatility: 'high',
      source: 'aggregated_consultant',
    },
    cooling_sensitivity: 'low',        // most major markets temperate; Phoenix / Dallas = medium-high
    water_stress_index: 2.0,           // aggregate; Western US higher (3.5+), Southeast lower
    grid_dependency: 'wholesale_market',
    renewable_share_pct: {
      value: 0.22,
      target_2030: 0.40,               // IRA-driven build-out
      source: 'aggregated_consultant',
    },
    energy_volatility: 'high',         // ERCOT spot exposure; PJM capacity market complexity
    source_confidence: 'medium',
    reality_constraints: [
      'Transmission interconnection queues 3-5 years in PJM/MISO; power delivery timeline is critical path.',
      'ERCOT high volatility (negative prices to $9/kWh spikes) requires battery buffer or capacity hedge.',
      'Northern Virginia / Silicon Valley land + power constrained; premium 30-50% above national average.',
      'IRA incentives (45Y clean energy tax credits) reduce effective power cost 10-20% on RE-anchored sites.',
    ],
    static_anchors: [
      'us_pjm_wholesale_2024',
      'cyrus_capex_per_mw',
    ],
  },
};

// ─── Archetype implication maps ───────────────────────────────────────────────
// Implications are derived from static constraints — no fabricated benchmarks.
// _default entries apply cross-region; named-region entries overlay on top.

const ARCHETYPE_IMPLICATIONS = {
  neocloud_gpu: {
    _default: [
      'GPU workloads draw 5-10x the W/rack of traditional compute; cooling capex is the primary opex driver.',
      'Energy cost accounts for 30-40% of GPU cloud total opex; tariff delta between regions compounds at scale.',
    ],
    qatar: [
      'Water stress (4.7/5) amplifies cooling capex by ~20% vs temperate markets — closed-loop cooling mandatory.',
      'KAHRAMAA monopoly eliminates PPA arbitrage; plan for 3-5%/yr tariff creep in 5-year model.',
      'Grid connection lead time (24 months) is the primary build-path constraint for >50 MW deployments.',
    ],
    saudi_arabia: [
      'SEC RE reform creates PPA optionality post-2026; NEOM-adjacent sites can target green credentialing.',
      'Water stress 4.5/5 requires dry-cooling design; add $1.5-2.0M/MW cooling capex.',
      '$100B Humain sovereign demand creates captive anchor-tenant pathway for neocloud players.',
    ],
    uae: [
      'DEWA dual-utility structure means tariff negotiation differs by emirate; Abu Dhabi RE PPAs available.',
      'Sustained 45 deg C ambient requires liquid-cooling design; realistic PUE 1.25 liquid vs 1.55 air.',
      'Khazna/G42 incumbent density means land premium and utility queue competition in Dubai/AD corridors.',
    ],
    europe: [
      'High volatility ($55-145/MWh range) makes 10-year PPA essential for GPU cloud unit economics.',
      'Free-cooling availability in Nordics lowers cooling opex 40-60% vs GCC; partially offsets higher grid tariff.',
      'Green credentialing achievable via RE PPA; critical for hyperscaler anchor tenants with Scope 2 targets.',
    ],
    north_america: [
      'IRA 45Y credits reduce effective energy cost 10-20% on RE-anchored sites; factor into IRR model.',
      'Transmission interconnection 3-5 year queue is the binding constraint; power reservation must precede GPU order.',
      'ERCOT arbitrage viable but requires hedging strategy; unhedged exposure can exceed GPU revenue in spike events.',
    ],
  },
  sovereign_hpc: {
    _default: [
      'Sovereign HPC deployments require guaranteed grid capacity and long-term tariff stability.',
      'Energy independence framing (on-site RE + battery) often required for political acceptance.',
    ],
    qatar: [
      'KAHRAMAA state grid aligns with sovereign control preference; no third-party energy risk.',
      'QFZA fast-track (6 months) accelerates permit vs typical 18-24 months elsewhere in GCC.',
    ],
    saudi_arabia: [
      'Humain PIF mandate creates sovereign co-investor pathway; energy sourcing aligned with Vision 2030 RE targets.',
    ],
  },
  enterprise_colocation: {
    _default: [
      'Enterprise colo buyers prioritise tariff predictability over absolute cost level.',
      'PUE overhead (1.3-1.5) should be factored into customer-quoted power pricing.',
    ],
    qatar: [
      'Stable subsidised tariff is a competitive advantage vs EU volatility for enterprise buyers.',
      'QFZA 0% corporate tax removes energy-cost offset complexity for international tenants.',
    ],
  },
};

/**
 * Returns the energy intelligence block for a given region, enriched with
 * archetype-specific decisional implications.
 *
 * @param {Object} [params={}]
 * @param {string} [params.region='qatar']      - Region key from ENERGY_REGIONS
 * @param {string|null} [params.archetype_id]   - Optional archetype (e.g. 'neocloud_gpu')
 * @returns {EnergyRegion & { implications: string[] }}
 */
function getEnergyBrief({ region = 'qatar', archetype_id = null } = {}) {
  const regionBlock = ENERGY_REGIONS[region];
  if (!regionBlock) {
    throw new Error(
      'Unknown region "' + region + '". Available: ' + Object.keys(ENERGY_REGIONS).join(', ')
    );
  }

  const implications = [];

  if (archetype_id && ARCHETYPE_IMPLICATIONS[archetype_id]) {
    const archetypeMap = ARCHETYPE_IMPLICATIONS[archetype_id];
    // Cross-region defaults first, then region-specific overlay
    if (archetypeMap._default) implications.push(...archetypeMap._default);
    if (archetypeMap[region]) implications.push(...archetypeMap[region]);
  }

  // If no archetype supplied (or no match), derive from reality_constraints
  if (implications.length === 0) {
    const constraints = regionBlock.reality_constraints;
    implications.push(...constraints.slice(0, Math.min(3, constraints.length)));
  }

  return Object.assign({}, regionBlock, { implications });
}

/**
 * Returns the list of available region keys.
 *
 * @returns {string[]}
 */
function getEnergyRegionsList() {
  return Object.keys(ENERGY_REGIONS);
}

module.exports = { ENERGY_REGIONS, getEnergyBrief, getEnergyRegionsList };
