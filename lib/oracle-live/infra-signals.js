/**
 * lib/oracle-live/infra-signals.js
 *
 * Sprint 3.1 — Infrastructure Signal Intelligence (smarter).
 *
 * 15 decision-impact signals for Q1-Q2 2025 GCC/global infrastructure context.
 * Each signal is anchored to a sourçable datapoint from lib/oracle-intelligence/datapoints.js.
 *
 * Extended schema (Sprint 3.1 additions marked with [NEW]):
 * {
 *   id:                  string   — snake_case unique identifier
 *   title:               string   — ≤80 chars, decision-impact framing
 *   severity:            'low' | 'medium' | 'high' | 'critical'
 *   category:            string   — thematic bucket
 *   region:              'global' | 'gcc' | 'qatar' | 'uae' | 'saudi_arabia' | 'europe' | 'us' | 'mena'
 *   affected_archetypes: string[] — subset of the 8 canonical archetypes (empty = all)
 *   affected_regions:    string[] — [NEW] explicit region list for multi-region signals
 *   explanation:         string   — operator facts grounded in data, strip news tone
 *   implication:         string   — quantified operational consequence
 *   confidence:          'low' | 'medium' | 'high'
 *   freshness:           string   — ISO date of underlying source
 *   recommended_action:  string   — concrete next step
 *   impact_score:        number   — [NEW] 1..10 base score (recomputed per-context via computeImpactScore)
 *   timeline_horizon:    'now' | '3-6mo' | '6-12mo' | '12-24mo' | '24mo+' — [NEW]
 *   mitigation_hint:     string   — [NEW] 1-line operator-grade mitigation (how to live with it)
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

/**
 * Freshness decay factor: signals older than 12 months lose weight.
 * @param {string} isoDate
 * @returns {number} 0.5..1.0
 */
function freshnessFactor(isoDate) {
  const ageMs = Date.now() - new Date(isoDate).getTime();
  const ageDays = ageMs / 86_400_000;
  if (ageDays < 90) return 1.0;
  if (ageDays < 180) return 0.9;
  if (ageDays < 365) return 0.8;
  return 0.5;
}

/** @type {Array<object>} */
const INFRA_SIGNALS = [
  // ─── 1. SUPPLY CHAIN ──────────────────────────────────────────────────────

  {
    id: 'transformer_shortage_global',
    title: '22-month transformer lead time drives critical path on every GCC DC build',
    severity: 'high',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ALL_ARCHETYPES,
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'europe', 'us'],
    explanation:
      'Schneider/Siemens 2024 guidance (datapoint: transformer_lead_time_2024) confirms 50 MVA ' +
      'transformer lead times at 22 months globally. AI-driven DC pipeline has consumed near-term ' +
      'manufacturing capacity. Easing to ~14 months expected only in late 2026 as Siemens, ' +
      'Schneider, and Hitachi Energy add production lines in Mexico, India, and Central Europe.',
    implication:
      'A Qatar project breaking ground in H2 2025 without a transformer on order today risks ' +
      'energisation slipping to late 2027 — a 6–12 month schedule overrun that triggers ' +
      'anchor-tenant penalty clauses worth $500K–$2M per month of delay.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action:
      'Issue transformer LoI before land/permit finalisation. Equipment lead time is now the ' +
      'critical path — front-run it by 6 months minimum.',
    impact_score: 9,
    timeline_horizon: 'now',
    mitigation_hint:
      'Lock a slot with a secondary supplier (ABB or Hitachi) in parallel with the primary ' +
      'Schneider/Siemens LoI; dual-sourcing adds ~3% capex but halves delivery-slip exposure.',
  },

  {
    id: 'gb200_allocation_scarcity',
    title: 'GB200 NVL72: 12-month allocation wait, hyperscalers first — GCC greenfield at risk',
    severity: 'high',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['neocloud_gpu', 'sovereign_ai'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'us'],
    explanation:
      'NVIDIA Q4 FY25 commentary (datapoint: nvidia_gb200_allocation) confirms 12-month ' +
      'allocation lead time for GB200 NVL72 racks with explicit hyperscaler-first priority. ' +
      'Each rack draws 132 kW and requires direct liquid cooling (CDU), a second-order ' +
      'procurement constraint. Non-hyperscaler GCC operators have no reserved allocation path ' +
      'without a committed NVIDIA SI partner.',
    implication:
      'A sovereign AI or neocloud operator targeting GB200 deployment in 2025 must place ' +
      'allocation orders now via an NVIDIA preferred partner. Missing this window delays ' +
      'first compute online to mid-2027, shifting 18+ months of GPU revenue. ' +
      'GB200 allocation pressure may delay greenfield AI cluster deployments by 6–10 months ' +
      'in GCC markets.',
    confidence: 'high',
    freshness: '2025-01-15',
    recommended_action:
      'Engage NVIDIA channel allocator and a preferred SI (CoreWeave, Crusoe, or regional ' +
      'equivalent) for a reserved block. Pair order with CDU procurement (9-month lead, ' +
      'datapoint: vertiv_cdu_lead_time) — both must run in parallel.',
    impact_score: 9,
    timeline_horizon: 'now',
    mitigation_hint:
      'If GB200 allocation is unavailable, H200 SXM5 NVL8 racks are in stock at most NVIDIA ' +
      'partners; 70–75% of GB200 perf/$ for training workloads, cooling footprint halved.',
  },

  {
    id: 'cdu_lead_time_easing',
    title: 'Liquid CDU lead times at 9 months — no longer the critical cooling constraint',
    severity: 'medium',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai', 'branded_jv'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'europe', 'us'],
    explanation:
      'Vertiv 2024 capacity guidance (datapoint: vertiv_cdu_lead_time) reports liquid CDU lead ' +
      'times at 9 months, down from 12–14 months in 2023. Added OEM capacity is specific to ' +
      'CDUs; dry-side electrical gear (transformers, switchgear) remains tightly constrained.',
    implication:
      'CDU procurement no longer sets the liquid-cooling critical path — transformer and switchgear ' +
      'do. Projects can defer CDU orders to month 3 of the build timeline without schedule risk, ' +
      'releasing ~$2–4M of early-stage capital tied up in cooling equipment.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action:
      'Sequence CDU orders at month 3 of project timeline. Front-load capital on transformers ' +
      'and MV switchgear instead. Confirm CDU specs match GB200 NVL72 (132 kW/rack) density.',
    impact_score: 5,
    timeline_horizon: '3-6mo',
    mitigation_hint:
      'Use the 9-month lead to lock final rack-density spec before placing CDU order — ' +
      'avoids a costly re-spec if GPU generation changes between LoI and delivery.',
  },

  {
    id: 'mv_switchgear_lead_time',
    title: 'MV switchgear at 15-month lead time — secondary electrical bottleneck after transformers',
    severity: 'medium',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['powered_shell', 'branded_jv', 'hyperscaler_self_build', 'sovereign_ai'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'europe'],
    explanation:
      'Schneider Q4 2024 guidance (datapoint: switchgear_mv_lead_time) puts MV switchgear at ' +
      '15 months. Paired with the 22-month transformer constraint, electrical procurement must ' +
      'begin before design freeze. Electrical infrastructure lead times now collectively exceed ' +
      'most building permit timelines.',
    implication:
      'For a 50 MW powered-shell targeting 2026 delivery, MV switchgear must be on order by ' +
      'Q3 2025 or electrical energisation slips by 3–6 months. Combined with transformers, ' +
      'the electrical procurement window closes Q2 2025 for any 2027 energisation.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action:
      'Issue parallel LoIs to Schneider and ABB for MV switchgear alongside transformer orders. ' +
      'Specify to shell design, not final fit-out — final spec can be refined later without ' +
      'losing the manufacturing slot.',
    impact_score: 7,
    timeline_horizon: 'now',
    mitigation_hint:
      'Over-specify switchgear capacity by 20% at order stage; right-sizing after manufacture ' +
      'is trivial, under-specifying requires a new order and restarts the 15-month clock.',
  },

  // ─── 2. COMMERCIAL ABSORPTION ─────────────────────────────────────────────

  {
    id: 'gcc_oversupply_risk_2027',
    title: 'GCC DC pipeline 4,500 MW by 2030 — 25% oversupply probability without anchor tenant',
    severity: 'medium',
    category: 'commercial_absorption',
    region: 'gcc',
    affected_archetypes: ['powered_shell', 'branded_jv'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia'],
    explanation:
      'CBRE Q1 2025 (datapoint: gcc_oversupply_risk) flags a 25% probability of GCC supply ' +
      'outpacing demand by 2027 if all announced projects build without pre-committed anchor tenants. ' +
      'Total GCC installed base is ~800 MW; committed pipeline to 2030 is 4,500 MW ' +
      '(datapoint: mena_dc_demand_2030). KSA alone has 1,400 MW in announced pipeline ' +
      '(datapoint: ksa_demand_pipeline).',
    implication:
      'Speculative powered-shell development without a signed hyperscaler or sovereign LOI faces ' +
      'vacancy risk that compresses levered IRR by 400–600 bps vs underwrite. Lease-up slipping ' +
      '12 months from 2027 to 2028 reduces project NPV by ~15% at a 7% discount rate.',
    confidence: 'medium',
    freshness: '2025-04-01',
    recommended_action:
      'Gate construction start on a signed anchor-tenant LOI covering ≥60% of capacity. ' +
      'Pre-agree a sale-leaseback exit with Brookfield or Blackstone before breaking ground ' +
      'to cap downside.',
    impact_score: 6,
    timeline_horizon: '12-24mo',
    mitigation_hint:
      'Structure a conditional build-to-suit with the anchor tenant — they fund 30–40% of ' +
      'build cost in exchange for a 20-year NNN lock, reducing developer vacancy exposure ' +
      'to the remaining speculative tranche.',
  },

  {
    id: 'hyperscaler_capex_acceleration',
    title: 'Top-4 hyperscalers at $210B/yr capex — third-party supply demand is structural, not cyclical',
    severity: 'high',
    category: 'demand',
    region: 'global',
    affected_archetypes: ['powered_shell', 'branded_jv', 'sale_leaseback', 'hyperscaler_self_build'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'us', 'europe'],
    explanation:
      'Meta guided $65B AI infrastructure capex for 2025 (datapoint: meta_self_build_capex_2024); ' +
      'Microsoft is running at $20B/quarter (datapoint: microsoft_capex_q3_2024). AWS at $75B ' +
      'annualised and Google at $50B combine for ~$210B annual infra spend across the top-4. ' +
      'Self-build capacity cannot absorb this — third-party powered shell is a structural relief valve.',
    implication:
      'A Qatar powered-shell or JV at 50–200 MW with Tier III+ and delivery within 30 months ' +
      'of LOI is directly financeable. Global DC wholesale vacancy is at 3%; demand is ' +
      'outpacing supply in every constrained market.',
    confidence: 'high',
    freshness: '2025-02-01',
    recommended_action:
      'Position asset to hyperscaler procurement teams on a 15-year NNN structure. Lead with ' +
      'QFZA 6-month permit as the 18-month time-to-power advantage over EU alternatives.',
    impact_score: 8,
    timeline_horizon: '6-12mo',
    mitigation_hint:
      'Run procurement conversations with at least 2 hyperscalers simultaneously — exclusivity ' +
      'before term sheet hands negotiating leverage to the tenant.',
  },

  // ─── 3. REGIONAL / GCC DEMAND ─────────────────────────────────────────────

  {
    id: 'qatar_water_stress_premium',
    title: 'Qatar water stress 4.7/5 — wet cooling adds $1.5M/MW capex and regulatory exposure',
    severity: 'medium',
    category: 'cooling',
    region: 'qatar',
    affected_archetypes: ALL_ARCHETYPES,
    affected_regions: ['qatar'],
    explanation:
      'WRI Aqueduct + KAHRAMAA (datapoint: qatar_water_stress_index) places Qatar at 4.7/5 on ' +
      'the global water stress index. Traditional evaporative cooling at 50 MW draws ~70,000 m³/yr ' +
      'of potable water — KAHRAMAA is tightening industrial allocation. T&T MENA guidance ' +
      '(datapoint: tt_cooling_mena_2024) puts the cooling capex premium at $1.5M/MW for ' +
      'adiabatic + DLC over standard wet-tower baseline.',
    implication:
      'Wet-cooling designs will not clear KAHRAMAA environmental review for new DC permits ' +
      'post-2025. Adiabatic + DLC is the only compliant path. PUE target: 1.4–1.5 air, ' +
      '1.2 liquid. Budget $750K/MW liquid retrofit premium (datapoint: tt_liquid_premium) ' +
      'for GPU-dense halls on top of base cooling capex.',
    confidence: 'high',
    freshness: '2024-09-01',
    recommended_action:
      'Default all Qatar DC designs to closed-loop adiabatic + DLC hybrid from day one. ' +
      'Budget $1.5M/MW cooling premium in base capex. Do not include water-cooled chiller plant.',
    impact_score: 7,
    timeline_horizon: 'now',
    mitigation_hint:
      'Specify a KAHRAMAA water-use budget in the permit application upfront — this de-risks ' +
      'the environmental review and signals operator maturity to the authority.',
  },

  {
    id: 'ksa_humain_compute_demand',
    title: 'Humain (KSA) targeting 1,000 MW by 2030 with $100B PIF capital — GCC sovereign benchmark',
    severity: 'high',
    category: 'demand',
    region: 'saudi_arabia',
    affected_archetypes: ['sovereign_ai', 'branded_jv', 'powered_shell'],
    affected_regions: ['saudi_arabia', 'gcc'],
    explanation:
      'Humain (PIF-backed KSA sovereign AI vehicle) launched with $100B initial capital ' +
      '(datapoint: humain_ksa_2024) and targets 1,000 MW sovereign AI compute by 2030 ' +
      '(datapoint: ksa_humain_ambition). JLL Q4 2024 records 1,400 MW of announced KSA ' +
      'DC pipeline (datapoint: ksa_demand_pipeline). KSA industrial electricity at $55/MWh ' +
      '(datapoint: ksa_sec_tariff) is competitive vs global benchmarks.',
    implication:
      'A Hearst branded-JV positioned as Humain infrastructure partner — comparable to the ' +
      'G42-Microsoft model in UAE — could anchor a $1–3B asset with a 15-year sovereign offtake. ' +
      'The Hyperion JV precedent ($27B, 80% Brookfield / Meta anchor) confirms the structure ' +
      'is capital-markets executable.',
    confidence: 'medium',
    freshness: '2024-09-01',
    recommended_action:
      'Initiate sovereign alignment conversations with Humain/SDAIA via NEOM or PIF intro ' +
      'channels. Prepare a branded-JV term sheet with NVIDIA-anchored GPU infrastructure ' +
      'and 15-year leaseback optionality.',
    impact_score: 7,
    timeline_horizon: '6-12mo',
    mitigation_hint:
      'Position as infrastructure operator, not compute provider — KSA sovereign sensitivity ' +
      'around foreign control of AI compute means operator/manage-only structures clear ' +
      'regulatory review faster than equity-heavy JVs.',
  },

  {
    id: 'uae_g42_microsoft_momentum',
    title: 'G42-Microsoft $1.5B UAE deal: sovereign + hyperscaler template is proven and replicable',
    severity: 'medium',
    category: 'partnership',
    region: 'uae',
    affected_archetypes: ['sovereign_ai', 'branded_jv'],
    affected_regions: ['uae', 'qatar', 'gcc'],
    explanation:
      'The April 2024 G42-Microsoft announcement (datapoints: g42_microsoft_2024, ' +
      'khazna_microsoft_partnership) locked $1.5B of hyperscaler capital into UAE sovereign ' +
      'AI infrastructure. Khazna committed to 1,000 MW (datapoint: khazna_uae_mw_committed). ' +
      'UAE DEWA tariff at $50/MWh (datapoint: uae_dewa_tariff); PUE targets 1.55 air / 1.25 liquid.',
    implication:
      'The sovereign-entity + global-hyperscaler + neutral-operator structure is live and ' +
      'capital-markets proven. Qatar replication via QFZA (100% foreign ownership, zero corporate ' +
      'tax, 6-month permit) closes a 2025 window: first-mover advantage in Qatar narrows monthly ' +
      'as UAE and KSA soak up hyperscaler pipeline commitments.',
    confidence: 'high',
    freshness: '2024-04-15',
    recommended_action:
      'Use G42-Microsoft term sheet as negotiation reference. Position Hearst as the neutral ' +
      'operator layer (manage-only or white-label) to bypass sovereign compute-control sensitivity ' +
      'while capturing management fee + equity upside.',
    impact_score: 6,
    timeline_horizon: '6-12mo',
    mitigation_hint:
      'Engage QFZA free-zone authority before approaching hyperscalers — having the entity ' +
      'structure and tax wrapper confirmed reduces hyperscaler legal review from 6 months to 6 weeks.',
  },

  // ─── 4. CAPITAL / FINANCIAL ───────────────────────────────────────────────

  {
    id: 'brookfield_qia_partnership_unlock',
    title: 'QIA-Brookfield $20B AI infra partnership — lowest-friction capital path for Qatar assets',
    severity: 'high',
    category: 'capital_availability',
    region: 'qatar',
    affected_archetypes: ['powered_shell', 'branded_jv', 'sale_leaseback', 'sovereign_ai'],
    affected_regions: ['qatar', 'gcc'],
    explanation:
      'QIA and Brookfield announced a $20B AI infrastructure partnership in May 2024 ' +
      '(datapoint: qia_brookfield_2024). Brookfield manages $1T AUM (datapoint: brookfield_aum_2024) ' +
      'and executed the $27B Hyperion JV with Meta/Blue Owl (datapoint: brookfield_hyperion_jv_2025). ' +
      'Capital is explicitly designated for AI DC deployment and is actively seeking GCC vehicles.',
    implication:
      'A Qatar powered-shell or JV with a signed hyperscaler or sovereign anchor is immediately ' +
      'financeable via the QIA-Brookfield vehicle — likely at 60–65% LTV, 5.5–7% exit cap rate ' +
      '(comp: datapoint dlr_exit_cap_rate). This eliminates 6–12 months of capital-raise friction ' +
      'vs approaching general infra funds.',
    confidence: 'high',
    freshness: '2024-05-01',
    recommended_action:
      'Prepare a data room with QFZA entity structure, KAHRAMAA utility MOU, and anchor-tenant LOI. ' +
      'Target Brookfield infrastructure team directly — they need Qatar deployment assets, ' +
      'not the other way around.',
    impact_score: 9,
    timeline_horizon: '3-6mo',
    mitigation_hint:
      'Structure the asset as a plain-vanilla NNN powered-shell at first pass — Brookfield ' +
      'will re-underwrite complexity; reducing deal structure friction accelerates IC approval ' +
      'by 2–3 months.',
  },

  {
    id: 'coreweave_concentration_risk_warning',
    title: 'CoreWeave S-1: 62% revenue in 2 customers, 4.5x net debt/EBITDA — neocloud stress-test',
    severity: 'medium',
    category: 'credit_risk',
    region: 'global',
    affected_archetypes: ['neocloud_gpu', 'white_label'],
    affected_regions: ['us', 'europe', 'gcc'],
    explanation:
      'CoreWeave FY2024 S-1 (datapoints: crwv_customer_concentration, crwv_leverage) shows ' +
      '62% revenue concentration in two customers, 4.5x net debt/EBITDA, and capex/revenue ' +
      'ratio of 3.2x (datapoint: crwv_capex_intensity). Contract WALT is 6 years ' +
      '(datapoint: crwv_contract_term) — the only structural buffer against customer loss.',
    implication:
      'A single large GPU tenant departing a CoreWeave-style neocloud triggers a debt-service ' +
      'crisis within 6–9 months. The model is not replicable without an anchor hyperscaler ' +
      'pre-commitment. For a GCC neocloud at $500M+ capex, a 35% single-tenant cap is the ' +
      'minimum safe covenant.',
    confidence: 'high',
    freshness: '2025-04-30',
    recommended_action:
      'For neocloud or white-label structures, require minimum 3 independent anchor customers ' +
      'before financial close. Cap single-customer revenue at 35%. Benchmark contract WALT ' +
      'against CoreWeave 6-year standard in lender covenants.',
    impact_score: 6,
    timeline_horizon: '6-12mo',
    mitigation_hint:
      'Build a WALT-weighted revenue schedule into the IM from day one — lenders will ' +
      'require it; presenting it proactively shortens credit committee review by 4–6 weeks.',
  },

  // ─── 5. REGULATORY / PERMITTING ───────────────────────────────────────────

  {
    id: 'eu_permit_compression',
    title: 'EU DC permits at 24-month average — Qatar QFZA 6-month fast-track is an 18-month advantage',
    severity: 'medium',
    category: 'regulatory',
    region: 'europe',
    affected_archetypes: ['powered_shell', 'branded_jv', 'hyperscaler_self_build'],
    affected_regions: ['europe', 'qatar'],
    explanation:
      'CBRE EU data (datapoint: eu_permit_timeline) records 24-month average permitting in ' +
      'Europe. Netherlands, Ireland, and Frankfurt are adding energy-use and noise regulations ' +
      'that further extend timelines. Qatar QFZA free-zone fast-track (datapoint: ' +
      'mena_permit_timeline_free_zone) delivers in 6 months with 100% foreign ownership and ' +
      'zero corporate tax (datapoint: qfza_tax_regime).',
    implication:
      'A hyperscaler targeting 2026 delivery cannot achieve it via EU build. Qatar is the only ' +
      'viable option: 6-month permit + 22-month transformer order = 28 months total, vs ' +
      '24-month EU permit alone before construction begins.',
    confidence: 'high',
    freshness: '2024-09-01',
    recommended_action:
      'Lead hyperscaler conversations with a side-by-side time-to-power comparison: Qatar ' +
      '28 months total vs EU 48+ months. Use QFZA permit speed as the headline differentiator ' +
      'in the hyperscaler procurement deck.',
    impact_score: 6,
    timeline_horizon: '6-12mo',
    mitigation_hint:
      'Pre-position QFZA free-zone entity before engaging hyperscalers — having a live QFZA ' +
      'entity number in the deck shifts the conversation from "feasibility" to "timeline".',
  },

  // ─── 6. FORWARD-LOOKING / MACRO ───────────────────────────────────────────

  {
    id: 'power_transformer_easing_2026',
    title: 'Transformer lead times easing to ~14 months by late 2026 — order now, not later',
    severity: 'low',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ALL_ARCHETYPES,
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'europe', 'us'],
    explanation:
      'The datapoint note on transformer_lead_time_2024 flags easing from 2026 onwards as ' +
      'Siemens, Schneider, and Hitachi Energy expand production in Mexico, India, and Central ' +
      'Europe. Lead times are projected to drop from 22 months toward 14–16 months by late 2026. ' +
      'Equipment prices are expected to hold or rise as AI-driven demand remains elevated.',
    implication:
      'Waiting for easing saves 0–2 months on lead time but risks a 10–15% equipment price ' +
      'increase and loss of the 2026–2027 energisation window for projects targeting that date. ' +
      'First-mover advantage on transformer procurement is a tangible schedule delta.',
    confidence: 'medium',
    freshness: '2024-12-01',
    recommended_action:
      'Pre-order on site-readiness LoI. Do not wait for the 2026 easing — the schedule benefit ' +
      'is marginal and the price risk is real.',
    impact_score: 4,
    timeline_horizon: '12-24mo',
    mitigation_hint:
      'Negotiate a contract clause allowing spec revision within 90 days of order — protects ' +
      'against design changes without losing the manufacturing slot.',
  },

  {
    id: 'qatar_grid_connection_timeline',
    title: 'KAHRAMAA 50 MW grid connection: 24-month process — must run in parallel, not series',
    severity: 'high',
    category: 'utility_infrastructure',
    region: 'qatar',
    affected_archetypes: ['powered_shell', 'branded_jv', 'sovereign_ai', 'hyperscaler_self_build'],
    affected_regions: ['qatar'],
    explanation:
      'KAHRAMAA capacity planning briefings (datapoint: qatar_grid_approval_timeline) put a ' +
      'new 50 MW grid connection at 24 months end-to-end. Grid headroom exists — 8,000 MW ' +
      'available (datapoint: kahramaa_grid_capacity) — but the regulatory process timeline is ' +
      'fixed. Qatar industrial tariff at $42/MWh (datapoint: kahramaa_tariff_industrial) is the ' +
      'lowest in GCC vs UAE $50 and KSA $55.',
    implication:
      'Sequencing KAHRAMAA application after QFZA permit adds 24 months to the critical path — ' +
      'a developer error that is responsible for the majority of Qatar DC delays. ' +
      'Parallel processing (KAHRAMAA + QFZA simultaneously) delivers both approvals by mid-2027 ' +
      'for a Q3 2025 submission. Serial sequencing slips energisation to 2029.',
    confidence: 'high',
    freshness: '2024-09-01',
    recommended_action:
      'Submit KAHRAMAA grid capacity application on the same day as QFZA permit filing. ' +
      'Book a KAHRAMAA pre-application meeting before site selection to confirm substation ' +
      'headroom at candidate sites.',
    impact_score: 9,
    timeline_horizon: 'now',
    mitigation_hint:
      'Commission a KAHRAMAA substation proximity study before site short-listing — a site ' +
      '500m from a headroom-rich substation can reduce grid connection cost by $3–5M and ' +
      'timeline by 4–6 months.',
  },

  {
    id: 'wholesale_rent_growth_momentum',
    title: 'DC wholesale rents +12% YoY, global vacancy at 3% — favourable pricing for new assets',
    severity: 'high',
    category: 'commercial_absorption',
    region: 'global',
    affected_archetypes: ['powered_shell', 'sale_leaseback', 'branded_jv'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia', 'us', 'europe'],
    explanation:
      'CBRE Global Data Center Trends H1 2025 (datapoint: cbre_global_dc_trends_h1_2025) records ' +
      '12% YoY wholesale rent growth and global vacancy at 3%. Average hyperscale lease term is ' +
      '14 years (datapoint: hyperscale_lease_term_avg_2024). Construction cost inflation at 7% ' +
      'YoY (datapoint: cbre_construction_inflation) is more than offset by rent growth in supply-' +
      'constrained markets.',
    implication:
      'Qatar powered-shell NNN rents of $7–9M/MW/yr (DLR comp, datapoint: dlr_powered_shell_annual) ' +
      'are defensible and likely to grow. An asset at $9.4M/MW total capex (T&T MENA: shell ' +
      '$4.4M + MEP $3.8M + substation $1.2M) leased at $8M/MW/yr NNN achieves ~85% ' +
      'yield-on-cost before financing.',
    confidence: 'high',
    freshness: '2025-04-01',
    recommended_action:
      'Anchor financial model on $7.5M/MW/yr NNN (conservative floor). Use CBRE 12% rent ' +
      'growth as evidence in investor materials. Exit underwrite at 6% cap rate (DLR comp).',
    impact_score: 8,
    timeline_horizon: '6-12mo',
    mitigation_hint:
      'Build 3% annual rent escalation into lease heads of terms — at 12% market growth, ' +
      'a static-rent structure leaves $1.5–2M/MW on the table over a 10-year hold.',
  },
];

// ─── Internal helpers ──────────────────────────────────────────────────────────

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

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes a contextual impact score (1..10) for a signal, weighted by:
 *   - base impact_score on the signal
 *   - severity rank (critical=4, high=3, medium=2, low=1)
 *   - freshness decay (1.0 → 0.5 depending on source age)
 *   - region match bonus (+1 if signal's affected_regions includes context region)
 *   - archetype match bonus (+1 if signal's affected_archetypes includes context archetype)
 *
 * @param {object} signal                    — a signal object from INFRA_SIGNALS
 * @param {object} [ctx]
 * @param {string} [ctx.region]              — target region (e.g. 'qatar')
 * @param {string} [ctx.archetype_id]        — canonical archetype id
 * @returns {number}  score clamped to 1..10
 */
function computeImpactScore(signal, { region, archetype_id } = {}) {
  const base = signal.impact_score ?? 5;
  const sevFactor = severityRank(signal.severity) / 4; // 0.25..1.0
  const freshFactor = freshnessFactor(signal.freshness);

  // Region bonus: +1 if the context region is explicitly listed in affected_regions
  const regionBonus =
    region && signal.affected_regions && signal.affected_regions.includes(region) ? 1 : 0;

  // Archetype bonus: +1 if archetype is in affected_archetypes (and list is non-empty)
  const archetypeBonus =
    archetype_id &&
    signal.affected_archetypes &&
    signal.affected_archetypes.length > 0 &&
    signal.affected_archetypes.includes(archetype_id)
      ? 1
      : 0;

  const raw = base * sevFactor * freshFactor + regionBonus + archetypeBonus;
  return Math.min(10, Math.max(1, Math.round(raw * 10) / 10));
}

/**
 * Returns signals sorted descending by computed impact_score for the given context.
 *
 * @param {Array<object>} signals            — array of signal objects
 * @param {object} [ctx]
 * @param {string} [ctx.region]
 * @param {string} [ctx.archetype_id]
 * @returns {Array<object>}  signals with computed impact_score attached, sorted desc
 */
function rankSignalsByImpact(signals, ctx = {}) {
  return signals
    .map(s => ({ ...s, impact_score: computeImpactScore(s, ctx) }))
    .sort((a, b) => b.impact_score - a.impact_score);
}

/**
 * Filters and sorts infrastructure signals by region, archetype, and minimum severity.
 * Returns signals with impact_score computed for the given context, sorted desc by impact_score.
 *
 * @param {object}  [opts]
 * @param {string}  [opts.region='qatar']           — target region
 * @param {string|null} [opts.archetype_id=null]    — canonical archetype id; null = no filter
 * @param {'low'|'medium'|'high'|'critical'} [opts.min_severity='low'] — minimum threshold
 * @returns {Array<object>}  signals sorted by impact_score descending
 */
export function getInfrastructureSignals({
  region = 'qatar',
  archetype_id = null,
  min_severity = 'low',
} = {}) {
  const minRank = severityRank(min_severity);

  const filtered = INFRA_SIGNALS.filter(s => {
    if (!regionMatches(s.region, region)) return false;
    if (severityRank(s.severity) < minRank) return false;
    if (archetype_id !== null) {
      if (s.affected_archetypes.length > 0 && !s.affected_archetypes.includes(archetype_id)) {
        return false;
      }
    }
    return true;
  });

  return rankSignalsByImpact(filtered, { region, archetype_id: archetype_id ?? undefined });
}
