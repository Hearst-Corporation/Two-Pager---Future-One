/**
 * lib/oracle-live/infra-signals.js
 *
 * Sprint 3 — Infrastructure Signals Layer.
 *
 * 14 concise, decision-grade signals for Q1-Q2 2025 infrastructure context.
 * Each signal is anchored to a sourçable datapoint from lib/oracle-intelligence/datapoints.js.
 *
 * Schema (mirrors Agent-1 signals.js contract):
 * {
 *   id:                  string   — snake_case unique identifier
 *   title:               string   — ≤80 chars, plain English
 *   severity:            'low' | 'medium' | 'high' | 'critical'
 *   category:            string   — thematic bucket
 *   region:              'global' | 'gcc' | 'qatar' | 'uae' | 'saudi_arabia' | 'europe' | 'us' | 'mena'
 *   affected_archetypes: string[] — subset of the 8 canonical archetypes (empty = all)
 *   explanation:         string   — what is happening, grounded in data
 *   implication:         string   — operational consequence for an infra developer/investor
 *   confidence:          'low' | 'medium' | 'high'
 *   freshness:           string   — ISO date of underlying source
 *   recommended_action:  string   — concrete next step
 * }
 *
 * Archetype vocabulary (canonical 8):
 *   'powered_shell' | 'branded_jv' | 'manage_only' | 'white_label'
 *   'sale_leaseback' | 'neocloud_gpu' | 'hyperscaler_self_build' | 'sovereign_ai'
 */

/** @type {string[]} */
const ALL_ARCHETYPES = [
  'powered_shell',
  'branded_jv',
  'manage_only',
  'white_label',
  'sale_leaseback',
  'neocloud_gpu',
  'hyperscaler_self_build',
  'sovereign_ai',
];

/**
 * Severity ordering for sort comparisons.
 * @param {'low'|'medium'|'high'|'critical'} s
 * @returns {number}
 */
function severityRank(s) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0;
}

/** @type {Array<object>} */
export const INFRA_SIGNALS = [
  // ─── 1. SUPPLY CHAIN ──────────────────────────────────────────────────────

  {
    id: 'transformer_shortage_global',
    title: 'Power transformer lead times at 22 months — critical build-path constraint',
    severity: 'high',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ALL_ARCHETYPES,
    explanation:
      'Schneider/Siemens 2024 guidance (datapoint: transformer_lead_time_2024) puts 50 MVA ' +
      'transformer lead times at 22 months globally. Demand surge from AI-driven DC pipelines ' +
      'has exhausted near-term manufacturing capacity. Slight easing expected 2026 as new ' +
      'production lines come online.',
    implication:
      'Any Qatar DC project breaking ground in H2 2025 without a transformer on order today ' +
      'risks energisation slipping to late 2027, adding 6–12 months to the delivery schedule ' +
      'and triggering penalty clauses with anchor tenants.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action:
      'Pre-order with utility MOU + 24-month planning horizon. Secure transformer slot before ' +
      'land/permit finalisation — equipment lead time now drives the critical path.',
  },

  {
    id: 'gb200_allocation_scarcity',
    title: 'GB200 NVL72 allocation: 12-month wait, hyperscalers prioritised',
    severity: 'high',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['neocloud_gpu', 'sovereign_ai'],
    explanation:
      'NVIDIA Q4 FY25 commentary (datapoint: nvidia_gb200_allocation) confirms a 12-month ' +
      'allocation lead time for GB200 NVL72 racks with explicit hyperscaler priority. Each rack ' +
      'draws 132 kW and requires CDU liquid cooling — a further constraint on delivery speed.',
    implication:
      'A sovereign AI or neocloud operator targeting GB200 deployment in 2025 must place ' +
      'allocation orders now and co-ordinate liquid-cooling infrastructure in parallel. ' +
      'Missing the allocation window pushes first compute online to 2027.',
    confidence: 'high',
    freshness: '2025-01-15',
    recommended_action:
      'Engage NVIDIA channel allocator and preferred partners (e.g., CoreWeave, Crusoe) for ' +
      'reserved block. Pair order with CDU procurement from Vertiv (9-month lead per ' +
      'datapoint: vertiv_cdu_lead_time).',
  },

  {
    id: 'cdu_lead_time_easing',
    title: 'Liquid CDU lead times down to 9 months — cooling bottleneck improving',
    severity: 'medium',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai', 'branded_jv'],
    explanation:
      'Vertiv 2024 capacity guidance (datapoint: vertiv_cdu_lead_time) reports liquid CDU lead ' +
      'times at 9 months, down from 12–14 months in 2023. Vertiv and aligned OEMs have added ' +
      'capacity. This easing is specific to CDUs; dry-side electrical gear remains constrained.',
    implication:
      'CDU procurement no longer sets the liquid-cooling critical path — transformer/switchgear ' +
      'supply does. Projects can sequence CDU orders later without schedule risk, freeing capital.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action:
      'Confirm CDU specs tied to GB200 NVL72 (132 kW/rack) or H200 density, place orders at ' +
      'month 3 of project timeline (not day 0). Focus early capital lock-in on transformers and ' +
      'MV switchgear instead.',
  },

  {
    id: 'mv_switchgear_lead_time',
    title: 'MV switchgear at 15-month lead time — secondary electrical bottleneck',
    severity: 'medium',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['powered_shell', 'branded_jv', 'hyperscaler_self_build', 'sovereign_ai'],
    explanation:
      'Schneider Q4 2024 guidance (datapoint: switchgear_mv_lead_time) places MV switchgear ' +
      'lead times at 15 months. Combined with the 22-month transformer constraint, electrical ' +
      'infrastructure procurement must begin before design is fully frozen.',
    implication:
      'For a 50 MW powered-shell targeting 2026 delivery, all primary/secondary switchgear ' +
      'must be on order by Q3 2025 or the electrical energisation date slips.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action:
      'Issue letters of intent to Schneider and ABB in parallel with transformer LoIs. ' +
      'Specify equipment to shell design rather than final fit-out drawings.',
  },

  // ─── 2. COMMERCIAL ABSORPTION ─────────────────────────────────────────────

  {
    id: 'gcc_oversupply_risk_2027',
    title: 'GCC DC pipeline at 4,500 MW by 2030 — 25% oversupply risk if unanchored',
    severity: 'medium',
    category: 'commercial_absorption',
    region: 'gcc',
    affected_archetypes: ['powered_shell', 'branded_jv'],
    explanation:
      'CBRE Q1 2025 (datapoint: gcc_oversupply_risk) flags a 25% probability of GCC supply ' +
      'outpacing demand by 2027 if all announced projects are built without pre-committed anchor ' +
      'tenants. Current total installed base is ~800 MW with a 4,500 MW committed pipeline to 2030 ' +
      '(datapoint: mena_dc_demand_2030).',
    implication:
      'Speculative powered-shell development without a signed hyperscaler or sovereign LOI carries ' +
      'vacancy risk. Lease-up timelines could extend beyond pro-forma assumptions, compressing IRR.',
    confidence: 'medium',
    freshness: '2025-04-01',
    recommended_action:
      'Gate construction start on signed anchor-tenant LOI covering ≥60% of capacity. ' +
      'Explore pre-agreed sale-leaseback exit with an infra fund (e.g., Brookfield, Blackstone) ' +
      'as risk mitigation before breaking ground.',
  },

  {
    id: 'hyperscaler_capex_acceleration',
    title: 'Hyperscaler capex at record pace — Meta $65B, Microsoft $20B/quarter',
    severity: 'high',
    category: 'demand',
    region: 'global',
    affected_archetypes: ['powered_shell', 'branded_jv', 'sale_leaseback', 'hyperscaler_self_build'],
    explanation:
      'Meta guided $65B AI infrastructure capex for 2025 (datapoint: meta_self_build_capex_2024); ' +
      'Microsoft is running at $20B per quarter (datapoint: microsoft_capex_q3_2024). Combined with ' +
      'AWS ($75B annualised) and Google ($50B), the top-4 hyperscalers represent ~$210B annual infra ' +
      'spend — generating unmet demand for third-party powered shell and wholesale supply.',
    implication:
      'Lease demand from hyperscalers is real and durable. A Qatar powered-shell or JV asset with ' +
      'Tier III+ certification and 50–200 MW capacity is highly fundable if it can deliver ' +
      'within hyperscaler timelines.',
    confidence: 'high',
    freshness: '2025-02-01',
    recommended_action:
      'Position asset to hyperscaler procurement teams with 15-year NNN lease structure. ' +
      'Target delivery within 30 months of LOI; use QFZA fast-track permit (6 months) as ' +
      'competitive advantage over EU alternatives.',
  },

  // ─── 3. REGIONAL / GCC DEMAND ─────────────────────────────────────────────

  {
    id: 'qatar_water_stress_premium',
    title: 'Qatar water stress index 4.7/5 — wet cooling is not viable',
    severity: 'medium',
    category: 'cooling',
    region: 'qatar',
    affected_archetypes: ALL_ARCHETYPES,
    explanation:
      'WRI Aqueduct + KAHRAMAA (datapoint: qatar_water_stress_index) places Qatar at 4.7/5 on ' +
      'the global water stress index. Traditional evaporative/wet cooling towers consume ' +
      '2–4 L/kWh; at 50 MW this is ~70,000 m³/yr of potable water equivalent — operationally ' +
      'and reputationally untenable.',
    implication:
      'All Qatar DC designs must default to closed-loop dry or adiabatic cooling for IT inlet, ' +
      'with direct liquid cooling (DLC) for high-density GPU racks. PUE target is realistically ' +
      '1.4–1.5 for air, 1.2 for liquid (per T&T MENA guidance). ' +
      'Cooling capex premium ~$1.5M/MW (datapoint: tt_cooling_mena_2024) must be budgeted.',
    confidence: 'high',
    freshness: '2024-09-01',
    recommended_action:
      'Commission adiabatic + DLC hybrid cooling design from day one. Include $750K/MW liquid ' +
      'retrofit premium (datapoint: tt_liquid_premium) in base capex for GPU-dense halls. ' +
      'Avoid water-cooled chiller plant in base design.',
  },

  {
    id: 'ksa_humain_compute_demand',
    title: 'Humain KSA targeting 1,000 MW sovereign compute by 2030 — $100B PIF-backed',
    severity: 'high',
    category: 'demand',
    region: 'saudi_arabia',
    affected_archetypes: ['sovereign_ai', 'branded_jv', 'powered_shell'],
    explanation:
      'Humain (PIF-backed KSA sovereign AI vehicle) launched with $100B initial capital ' +
      '(datapoint: humain_ksa_2024) and targets 1,000 MW of sovereign AI compute by 2030 ' +
      '(datapoint: ksa_humain_ambition). JLL Q4 2024 records 1,400 MW of announced KSA DC ' +
      'pipeline (datapoint: ksa_demand_pipeline). KSA electricity at $55/MWh industrial ' +
      '(datapoint: ksa_sec_tariff) is favourable.',
    implication:
      'A Hearst branded-JV or powered-shell positioned as Humain infrastructure partner — ' +
      'comparable to the G42-Microsoft model in UAE — could secure an anchor contract and ' +
      'replicate the Hyperion JV structure ($27B, 80% Brookfield / Meta anchor).',
    confidence: 'medium',
    freshness: '2024-09-01',
    recommended_action:
      'Initiate sovereign alignment conversations with Humain/SDAIA via NEOM or PIF ' +
      'intro channels. Prepare a branded-JV term sheet with NVIDIA-anchored GPU infrastructure ' +
      'and 15-year leaseback optionality.',
  },

  {
    id: 'uae_g42_microsoft_momentum',
    title: 'G42-Microsoft $1.5B partnership — UAE sovereign + hyperscaler model validated',
    severity: 'medium',
    category: 'partnership',
    region: 'uae',
    affected_archetypes: ['sovereign_ai', 'branded_jv'],
    explanation:
      'The April 2024 G42-Microsoft announcement (datapoints: g42_microsoft_2024, ' +
      'khazna_microsoft_partnership) locked in $1.5B of hyperscaler capital into UAE sovereign ' +
      'AI infrastructure. Khazna committed to 1,000 MW (datapoint: khazna_uae_mw_committed). ' +
      'UAE DEWA tariff at $50/MWh (datapoint: uae_dewa_tariff) and PUE target 1.55 air / ' +
      '1.25 liquid.',
    implication:
      'The template is proven and replicable in Qatar: sovereign entity + global hyperscaler + ' +
      'neutral infrastructure operator, with 100% foreign ownership and tax-free QFZA wrapper ' +
      '(datapoint: qfza_tax_regime). Faster mover advantage is closing — act in 2025.',
    confidence: 'high',
    freshness: '2024-04-15',
    recommended_action:
      'Use G42-Microsoft term sheet as negotiation reference. Map Hearst positioning as the ' +
      '"neutral operator" layer (manage-only or white-label) to avoid sovereign sensitivity ' +
      'while capturing management fee + equity upside.',
  },

  // ─── 4. CAPITAL / FINANCIAL ───────────────────────────────────────────────

  {
    id: 'brookfield_qia_partnership_unlock',
    title: 'QIA-Brookfield $20B AI infrastructure partnership — Qatar capital available now',
    severity: 'high',
    category: 'capital_availability',
    region: 'qatar',
    affected_archetypes: ['powered_shell', 'branded_jv', 'sale_leaseback', 'sovereign_ai'],
    explanation:
      'QIA and Brookfield announced a $20B AI infrastructure partnership in May 2024 ' +
      '(datapoint: qia_brookfield_2024). Brookfield manages $1T AUM ' +
      '(datapoint: brookfield_aum_2024) and executed the $27B Hyperion JV with Meta/Blue Owl ' +
      '(datapoint: brookfield_hyperion_jv_2025). Capital is explicitly designated for AI DC ' +
      'deployment and is seeking deployment vehicles in GCC.',
    implication:
      'A Qatar powered-shell or JV asset with a signed hyperscaler or sovereign anchor is ' +
      'immediately financeable via the QIA-Brookfield vehicle — likely at 60–65% LTV, ' +
      '5.5–7% exit cap rate (comp: datapoint dlr_exit_cap_rate). This is the lowest-friction ' +
      'capital path for a Qatar deal.',
    confidence: 'high',
    freshness: '2024-05-01',
    recommended_action:
      'Position Hearst deal as co-investment opportunity for QIA-Brookfield vehicle. ' +
      'Prepare a data room with QFZA entity structure, utility MOU, and anchor-tenant LOI. ' +
      'Target Brookfield infrastructure team directly — they need deployment assets.',
  },

  {
    id: 'coreweave_concentration_risk_warning',
    title: 'CoreWeave: top-2 customers = 62% revenue — GPU cloud concentration risk',
    severity: 'medium',
    category: 'credit_risk',
    region: 'global',
    affected_archetypes: ['neocloud_gpu', 'white_label'],
    explanation:
      'CoreWeave FY2024 S-1 (datapoints: crwv_customer_concentration, crwv_leverage) shows ' +
      '62% revenue concentration in two customers and net debt/EBITDA of 4.5x. The GPU cloud ' +
      'model at hyperscale requires extreme capex/revenue ratios of 3.2x ' +
      '(datapoint: crwv_capex_intensity) and 6-year weighted contract terms ' +
      '(datapoint: crwv_contract_term).',
    implication:
      'Any Hearst GPU cloud (neocloud) or white-label tenant should be stress-tested for ' +
      'customer concentration. A single large GPU tenant departing can create a debt-service ' +
      'crisis. The CoreWeave model is not replicable without an anchor hyperscaler pre-commitment.',
    confidence: 'high',
    freshness: '2025-04-30',
    recommended_action:
      'For neocloud or white-label structures, require minimum 3 independent anchor customers ' +
      'before financial close. Cap single-customer revenue exposure at 35%. Benchmark contract ' +
      'WALT against CoreWeave 6-year standard.',
  },

  // ─── 5. REGULATORY / PERMITTING ───────────────────────────────────────────

  {
    id: 'eu_permit_compression',
    title: 'EU DC permits: 24-month average — Qatar QFZA at 6 months is a structural advantage',
    severity: 'medium',
    category: 'regulatory',
    region: 'europe',
    affected_archetypes: ['powered_shell', 'branded_jv', 'hyperscaler_self_build'],
    explanation:
      'CBRE EU data (datapoint: eu_permit_timeline) records 24-month average permitting timelines ' +
      'in Europe. Qatar QFZA free zone fast-track (datapoint: mena_permit_timeline_free_zone) ' +
      'delivers in 6 months with 100% foreign ownership and zero corporate tax ' +
      '(datapoint: qfza_tax_regime). EU energy-use and noise regulations are adding further ' +
      'friction in key markets (Netherlands, Ireland, Frankfurt).',
    implication:
      'A Qatar hyperscaler seeking to diversify build geography faces an 18-month time-to-power ' +
      'advantage in Qatar vs Europe. For a 2026 delivery target, Qatar is the viable option; ' +
      'EU cannot deliver until 2028+.',
    confidence: 'high',
    freshness: '2024-09-01',
    recommended_action:
      'Lead hyperscaler conversations with the 6-month QFZA permit as a headline differentiator. ' +
      'Prepare a side-by-side time-to-power comparison (Qatar vs EU vs US Virginia) for the ' +
      'hyperscaler procurement deck.',
  },

  // ─── 6. FORWARD-LOOKING ───────────────────────────────────────────────────

  {
    id: 'power_transformer_easing_2026',
    title: 'Transformer lead times easing to ~14 months by 2026 — window closing now',
    severity: 'low',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ALL_ARCHETYPES,
    explanation:
      'The datapoint note on transformer_lead_time_2024 flags easing "2026 onwards" as ' +
      'Siemens, Schneider, and Hitachi Energy expand manufacturing capacity. Lead times are ' +
      'projected to drop from 22 months toward 14–16 months by late 2026 as new production ' +
      'lines in Mexico, India, and Central Europe come online.',
    implication:
      'Projects that order now lock in 22-month delivery (2026/2027). Projects that wait for ' +
      'easing may find shorter lead times but face higher equipment prices due to sustained ' +
      'AI-driven demand. First-mover advantage on transformer procurement is real.',
    confidence: 'medium',
    freshness: '2024-12-01',
    recommended_action:
      'Do not wait for easing. Pre-order transformers on site-readiness LOI — early procurement ' +
      'is the single highest-leverage action for a 2026 energisation target.',
  },

  {
    id: 'qatar_grid_connection_timeline',
    title: 'KAHRAMAA new 50 MW grid connection: 24-month process — parallels transformer lead time',
    severity: 'high',
    category: 'utility_infrastructure',
    region: 'qatar',
    affected_archetypes: ['powered_shell', 'branded_jv', 'sovereign_ai', 'hyperscaler_self_build'],
    explanation:
      'KAHRAMAA capacity planning briefings (datapoint: qatar_grid_approval_timeline) put a ' +
      'new 50 MW grid connection at 24 months end-to-end. Grid headroom exists (8,000 MW ' +
      'available, datapoint: kahramaa_grid_capacity) but process timeline is fixed. Qatar ' +
      'electricity at $42/MWh industrial (datapoint: kahramaa_tariff_industrial) remains ' +
      'competitive vs UAE ($50) and KSA ($55).',
    implication:
      'KAHRAMAA grid application must be submitted simultaneously with QFZA permit — not after. ' +
      'A 24-month grid process running in parallel with 22-month transformer procurement means ' +
      'both can resolve by mid-2027 if kicked off in Q3 2025. Serial sequencing adds 2 years.',
    confidence: 'high',
    freshness: '2024-09-01',
    recommended_action:
      'Submit KAHRAMAA grid capacity application at same time as QFZA permit filing. ' +
      'Engage KAHRAMAA pre-application meeting to confirm substation availability at the ' +
      'selected site. Commission utility MOU as a prerequisite for investor data room.',
  },

  {
    id: 'wholesale_rent_growth_momentum',
    title: 'Global DC wholesale rents up 12% YoY — pricing environment strongly positive',
    severity: 'high',
    category: 'commercial_absorption',
    region: 'global',
    affected_archetypes: ['powered_shell', 'sale_leaseback', 'branded_jv'],
    explanation:
      'CBRE Global Data Center Trends H1 2025 (datapoint: cbre_global_dc_trends_h1_2025) records ' +
      '12% YoY wholesale rent growth with global vacancy at 3%. Average hyperscale lease term ' +
      'is 14 years (datapoint: hyperscale_lease_term_avg_2024). Construction cost inflation ' +
      'is running at 7% YoY (datapoint: cbre_construction_inflation) but is more than offset ' +
      'by rent growth in supply-constrained markets.',
    implication:
      'Qatar powered-shell NNN rents of $7–9M/MW/yr (per DLR comp, datapoint: ' +
      'dlr_powered_shell_annual) are defensible and likely to grow. An asset built at ' +
      '$9.4M/MW total capex (T&T MENA: shell $4.4M + MEP $3.8M + substation $1.2M) and leased ' +
      'at $8M/MW/yr NNN achieves ~85% yield-on-cost before financing.',
    confidence: 'high',
    freshness: '2025-04-01',
    recommended_action:
      'Anchor financial model on $7.5M/MW/yr NNN (conservative) with 12% annual escalation ' +
      'in sensitivity upside. Use CBRE 12% YoY rent growth as supporting evidence in investor ' +
      'materials. Exit underwriting at 6% cap rate (DLR comp).',
  },
];

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * GCC member states for region-matching logic.
 * @type {string[]}
 */
const GCC_REGIONS = ['qatar', 'uae', 'saudi_arabia', 'gcc', 'bahrain', 'kuwait', 'oman'];

/**
 * Returns true if a signal's region applies to the requested region.
 *
 * Rules:
 *   - signal.region === 'global'  → always matches
 *   - signal.region === region    → exact match
 *   - region is a GCC member and signal.region === 'gcc' → matches
 *   - region === 'gcc' and signal is any GCC-member region → matches
 *   - region === 'mena' and signal is gcc / GCC member / mena → matches
 *
 * @param {string} signalRegion
 * @param {string} requestedRegion
 * @returns {boolean}
 */
function regionMatches(signalRegion, requestedRegion) {
  if (signalRegion === 'global') return true;
  if (signalRegion === requestedRegion) return true;
  if (signalRegion === 'gcc' && GCC_REGIONS.includes(requestedRegion)) return true;
  if (requestedRegion === 'gcc' && GCC_REGIONS.includes(signalRegion)) return true;
  if (
    requestedRegion === 'mena' &&
    (signalRegion === 'gcc' || signalRegion === 'mena' || GCC_REGIONS.includes(signalRegion))
  ) return true;
  return false;
}

/**
 * Filters and sorts infrastructure signals by region, archetype, and minimum severity.
 *
 * @param {object}  [opts]
 * @param {string}  [opts.region='qatar']           — target region
 * @param {string|null} [opts.archetype_id=null]    — canonical archetype id; null = no filter
 * @param {'low'|'medium'|'high'|'critical'} [opts.min_severity='low'] — minimum threshold
 * @returns {Array<object>}  signals sorted by severity descending
 */
export function getInfrastructureSignals({
  region = 'qatar',
  archetype_id = null,
  min_severity = 'low',
} = {}) {
  const minRank = severityRank(min_severity);

  return INFRA_SIGNALS
    .filter(s => {
      if (!regionMatches(s.region, region)) return false;
      if (severityRank(s.severity) < minRank) return false;
      if (archetype_id !== null) {
        if (s.affected_archetypes.length > 0 && !s.affected_archetypes.includes(archetype_id)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

/**
 * Returns only high or critical severity signals for a given region.
 *
 * @param {object} [opts]
 * @param {string} [opts.region='qatar']
 * @returns {Array<object>}
 */
export function getCriticalSignals({ region = 'qatar' } = {}) {
  return getInfrastructureSignals({ region, min_severity: 'high' });
}
