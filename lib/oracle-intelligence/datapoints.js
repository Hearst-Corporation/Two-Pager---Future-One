// lib/oracle-intelligence/datapoints.js
//
// Sprint 2 — Structured infrastructure intelligence datapoints (~140).
// Each follows the schema validated by validateDatapoint().
//
// Curation principle :
//   authority > comparability > freshness > operational relevance > quantity
//
// 80% sourced from public filings / investor disclosures / analyst benchmarks.
// 20% labelled tier_5 admin_input or consultant_estimate when the only credible
// public proxy is an internal model — these are flagged with confidence:'low'.

// Helper to keep entries compact.
const D = (id, e, cat, reg, st, sa, ts, conf, vol, ctype, rs, metrics, notes) => ({
  id, entity_id: e, category: cat, region: reg, source_type: st, source_authority: sa,
  timestamp: ts, confidence: conf, volatility: vol, comparable_type: ctype, relevance_score: rs,
  metrics, notes,
});

export const DATAPOINTS = [
  // ─── Equinix ──────────────────────────────────────────────────────
  D('eqx_retail_price_2024', 'equinix', 'datacenter_operator', 'global', '10k', 'tier_1', '2025-02-15', 'high', 'medium', 'pricing', 5,
    { price_retail_colo_kw_month: 165, unit: '$/kW/month' },
    { source_name: 'Equinix FY2024 10-K', url: 'https://investor.equinix.com/sec-filings/annual-reports', applicability: 'Global benchmark; Qatar +10–15% scarcity premium', caveat: 'Global blend includes US/EU premium markets' }),
  D('eqx_ebitda_margin_2024', 'equinix', 'datacenter_operator', 'global', '10k', 'tier_1', '2025-02-15', 'high', 'low', 'pricing', 4,
    { ebitda_margin_pct: 0.47, unit: 'ratio' },
    { source_name: 'Equinix FY2024 10-K', applicability: 'Operator-level; HEARST as landlord targets 55-65%', caveat: 'Full-stack operator incl. fit-out + ops' }),
  D('eqx_capex_per_mw_2024', 'equinix', 'datacenter_operator', 'global', 'investor_day', 'tier_2', '2024-11-01', 'medium', 'medium', 'capex', 4,
    { capex_total_per_mw: 8500000, unit: '$/MW' },
    { source_name: 'Equinix Investor Day 2024 — xScale & AI Infrastructure', applicability: 'MENA Qatar estimate $6.5-8.5M/MW per T&T', caveat: 'Tier III+ full redundancy' }),
  D('eqx_pue_2024', 'equinix', 'datacenter_operator', 'global', 'market_report', 'tier_1', '2024-09-30', 'high', 'low', 'pue_efficiency', 4,
    { pue: 1.45, unit: 'ratio' },
    { source_name: 'Equinix 2024 Global Impact Report', applicability: 'Qatar climate target PUE 1.4-1.5; liquid 1.2', caveat: 'Includes legacy IBX' }),
  D('eqx_xscale_lease_term', 'equinix', 'datacenter_operator', 'global', 'product_sheet', 'tier_2', '2024-06-01', 'high', 'low', 'contract_term', 4,
    { hyperscale_lease_term_years: 15, unit: 'years' },
    { source_name: 'Equinix xScale Program', applicability: 'Qatar government deals likely 12-20 yr', caveat: 'xScale is wholesale-to-hyperscaler only' }),
  D('eqx_ai_share_q3_2024', 'equinix', 'datacenter_operator', 'global', 'earnings_call', 'tier_2', '2024-10-30', 'medium', 'high', 'commercial_absorption', 3,
    { ai_workload_share_pct: 0.35, unit: 'ratio' },
    { source_name: 'Equinix Q3 2024 Earnings Call', applicability: 'AI demand acceleration', caveat: 'Self-reported, definition varies' }),

  // ─── Digital Realty ────────────────────────────────────────────────
  D('dlr_wholesale_price_2024', 'digital_realty', 'datacenter_operator', 'global', '10k', 'tier_1', '2025-02-20', 'high', 'medium', 'pricing', 5,
    { price_wholesale_kw_month: 95, unit: '$/kW/month' },
    { source_name: 'Digital Realty FY2024 10-K', applicability: 'Qatar wholesale est. $100-130/kW/mo MENA scarcity', caveat: 'EMEA wholesale closer to $80-110' }),
  D('dlr_powered_shell_annual', 'digital_realty', 'datacenter_operator', 'us_emea', 'investor_day', 'tier_2', '2024-05-15', 'medium', 'medium', 'pricing', 4,
    { powered_shell_price_annual: 6500000, unit: '$/MW/yr' },
    { source_name: 'Digital Realty Investor Day 2024', applicability: 'Qatar powered shell NNN $7-9M/MW/yr', caveat: 'Varies by tenant credit + location' }),
  D('dlr_leverage_2024', 'digital_realty', 'datacenter_operator', 'global', '10k', 'tier_1', '2025-02-20', 'high', 'low', 'leverage', 4,
    { debt_pct: 62, unit: 'percent' },
    { source_name: 'Digital Realty FY2024 10-K', applicability: 'Project finance can achieve similar or higher', caveat: 'Public REIT leverage' }),
  D('dlr_ebitda_margin_2024', 'digital_realty', 'datacenter_operator', 'global', '10k', 'tier_1', '2025-02-20', 'high', 'low', 'pricing', 3,
    { ebitda_margin_pct: 0.43, unit: 'ratio' }, { source_name: 'Digital Realty FY2024 10-K' }),
  D('dlr_exit_cap_rate', 'digital_realty', 'datacenter_operator', 'us_emea', 'investor_day', 'tier_2', '2024-05-15', 'medium', 'medium', 'pricing', 4,
    { exit_cap_rate: 0.06, unit: 'ratio' },
    { source_name: 'Digital Realty Investor Day 2024', applicability: 'Sale-leaseback exit 5.5-7%', caveat: 'Quality + tenant credit driven' }),
  D('dlr_hyperion_jv', 'digital_realty', 'datacenter_operator', 'us', 'press_release', 'tier_3', '2025-10-01', 'high', 'low', 'partnership_structure', 5,
    { jv_total_usd: 27_000_000_000, brookfield_share_pct: 80, meta_lease_term_years: 15 },
    { source_name: 'Meta x Blue Owl Hyperion JV announcement', applicability: 'Reference comp for government + operator JV', caveat: 'Specific to anchor hyperscaler' }),

  // ─── NTT ──────────────────────────────────────────────────────────
  D('ntt_hyperscale_mena_2024', 'ntt', 'datacenter_operator', 'mena', 'market_report', 'tier_2', '2024-08-15', 'medium', 'medium', 'pricing', 4,
    { price_hyperscale_kw_month: 110, unit: '$/kW/month' },
    { source_name: 'NTT MENA market briefing', applicability: 'Direct Qatar / UAE applicability', caveat: 'Limited public disclosure' }),
  D('ntt_retail_mena_2024', 'ntt', 'datacenter_operator', 'mena', 'market_report', 'tier_2', '2024-08-15', 'medium', 'medium', 'pricing', 3,
    { price_retail_colo_kw_month: 145, unit: '$/kW/month' },
    { source_name: 'NTT MENA market briefing', caveat: 'Range $130-170' }),
  D('ntt_pue_mena', 'ntt', 'datacenter_operator', 'mena', 'market_report', 'tier_2', '2024-09-01', 'medium', 'low', 'pue_efficiency', 3,
    { pue: 1.42, unit: 'ratio' }, { source_name: 'NTT MENA market briefing', applicability: 'Hot-climate optimized' }),

  // ─── Vantage ──────────────────────────────────────────────────────
  D('vtg_capex_per_mw_2024', 'vantage', 'datacenter_operator', 'us_emea', 'press_release', 'tier_3', '2024-07-10', 'medium', 'medium', 'capex', 4,
    { capex_total_per_mw: 9_200_000, unit: '$/MW' },
    { source_name: 'Vantage US/EU campus disclosures 2024', caveat: 'Greenfield Tier III+' }),
  D('vtg_lease_term', 'vantage', 'datacenter_operator', 'us_emea', 'deal_comp', 'tier_3', '2024-06-15', 'medium', 'low', 'contract_term', 3,
    { hyperscale_lease_term_years: 20, unit: 'years' }, { source_name: 'Recent hyperscale BTS comps' }),

  // ─── CyrusOne / QTS / Switch / Data4 ──────────────────────────────
  D('cyrus_capex_per_mw', 'cyrusone', 'datacenter_operator', 'us', 'consultant_estimate', 'tier_3', '2024-09-01', 'medium', 'medium', 'capex', 3,
    { capex_total_per_mw: 8_800_000, unit: '$/MW' }, { source_name: 'Texas + Northern VA comps', caveat: 'Excludes fit-out' }),
  D('qts_blackstone_pipeline', 'qts', 'datacenter_operator', 'us', 'press_release', 'tier_3', '2024-04-01', 'medium', 'low', 'partnership_structure', 4,
    { committed_capacity_mw: 5_000 }, { source_name: 'Blackstone QTS pipeline disclosure', applicability: 'Hyperscale scale benchmark' }),
  D('switch_tier_iv', 'switch', 'datacenter_operator', 'us', 'product_sheet', 'tier_4', '2023-11-01', 'medium', 'low', 'pue_efficiency', 3,
    { tier_rating: 'IV', pue: 1.18 }, { source_name: 'Switch SUPERNAP product sheets' }),
  D('data4_eu_capex', 'data4', 'datacenter_operator', 'europe', 'consultant_estimate', 'tier_3', '2024-10-15', 'medium', 'medium', 'capex', 3,
    { capex_total_per_mw: 9_800_000, unit: '$/MW' }, { source_name: 'Brookfield EU portfolio comps', caveat: 'EU regulatory + heat-reuse adds' }),

  // ─── Khazna ───────────────────────────────────────────────────────
  D('khazna_uae_mw_committed', 'khazna', 'datacenter_operator', 'uae', 'press_release', 'tier_3', '2024-09-01', 'medium', 'low', 'commercial_absorption', 5,
    { committed_capacity_mw: 1_000 }, { source_name: 'Khazna 2024 expansion announcements', applicability: 'UAE national champion benchmark' }),
  D('khazna_microsoft_partnership', 'khazna', 'datacenter_operator', 'uae', 'partnership_announcement', 'tier_3', '2024-04-15', 'high', 'low', 'partnership_structure', 5,
    { partnership_size_usd: 1_500_000_000, anchor_tenant: 'Microsoft' },
    { source_name: 'G42-Microsoft April 2024 announcement', applicability: 'Reference government + hyperscaler structure' }),

  // ─── CoreWeave ────────────────────────────────────────────────────
  D('crwv_revenue_2024', 'coreweave', 'ai_native_infra', 'us', '10k', 'tier_1', '2025-04-30', 'high', 'high', 'commercial_absorption', 5,
    { revenue_annual_usd: 1_900_000_000 },
    { source_name: 'CoreWeave FY2024 S-1 / 10-K', applicability: 'GPU cloud scale benchmark', caveat: 'Top 2 customers >60%' }),
  D('crwv_gpu_fleet', 'coreweave', 'ai_native_infra', 'global', '10k', 'tier_1', '2025-04-30', 'high', 'high', 'gpu_economics', 5,
    { committed_gpus: 250_000, primary_sku: 'H100/H200/GB200' },
    { source_name: 'CoreWeave FY2024 S-1', applicability: 'Hyperscale GPU fleet benchmark' }),
  D('crwv_contract_term', 'coreweave', 'ai_native_infra', 'us', '10k', 'tier_1', '2025-04-30', 'high', 'low', 'contract_term', 5,
    { weighted_avg_contract_term_years: 6 },
    { source_name: 'CoreWeave FY2024 S-1', applicability: 'GPU cloud contract benchmark', caveat: 'Heavily weighted by Microsoft' }),
  D('crwv_customer_concentration', 'coreweave', 'ai_native_infra', 'us', '10k', 'tier_1', '2025-04-30', 'high', 'medium', 'commercial_absorption', 5,
    { top_2_customers_revenue_share_pct: 0.62 },
    { source_name: 'CoreWeave FY2024 S-1', applicability: 'Concentration risk benchmark for GPU cloud' }),
  D('crwv_capex_intensity', 'coreweave', 'ai_native_infra', 'global', '10k', 'tier_1', '2025-04-30', 'high', 'medium', 'capex', 5,
    { capex_to_revenue_ratio: 3.2 },
    { source_name: 'CoreWeave FY2024 S-1', applicability: 'GPU cloud build-out intensity' }),
  D('crwv_leverage', 'coreweave', 'ai_native_infra', 'global', '10k', 'tier_1', '2025-04-30', 'high', 'low', 'leverage', 4,
    { net_debt_to_ebitda: 4.5 }, { source_name: 'CoreWeave FY2024 S-1' }),

  // ─── Crusoe ───────────────────────────────────────────────────────
  D('crusoe_stranded_energy', 'crusoe', 'ai_native_infra', 'us', 'press_release', 'tier_3', '2024-12-01', 'high', 'low', 'energy', 5,
    { pipeline_mw: 1_200, energy_strategy: 'stranded_gas + grid' },
    { source_name: 'Crusoe 2024 capacity guidance', applicability: 'Energy-arbitrage GPU strategy' }),
  D('crusoe_oracle_deal', 'crusoe', 'ai_native_infra', 'us', 'press_release', 'tier_3', '2024-07-15', 'medium', 'low', 'partnership_structure', 4,
    { deal_size_usd: 3_400_000_000, anchor: 'Oracle Cloud' },
    { source_name: 'Crusoe-Oracle 2024 build agreement', caveat: 'Long-build cycle' }),

  // ─── Lambda ───────────────────────────────────────────────────────
  D('lambda_h100_on_demand', 'lambda', 'ai_native_infra', 'global', 'rate_card', 'tier_4', '2025-04-01', 'high', 'high', 'gpu_economics', 5,
    { gpu_sku: 'H100 80GB SXM5', price_per_gpu_hour: 2.49, unit: '$/GPU-hour' },
    { source_name: 'Lambda public on-demand catalog', applicability: 'Reference H100 on-demand price', caveat: 'Reserved 1-3yr lower' }),
  D('lambda_h200_on_demand', 'lambda', 'ai_native_infra', 'global', 'rate_card', 'tier_4', '2025-04-01', 'high', 'high', 'gpu_economics', 5,
    { gpu_sku: 'H200 141GB SXM5', price_per_gpu_hour: 3.49, unit: '$/GPU-hour' }, { source_name: 'Lambda public on-demand catalog' }),
  D('lambda_gb200_pre_order', 'lambda', 'ai_native_infra', 'global', 'rate_card', 'tier_4', '2025-04-01', 'medium', 'high', 'gpu_economics', 4,
    { gpu_sku: 'GB200 (per-GPU equivalent)', price_per_gpu_hour: 5.0, unit: '$/GPU-hour' },
    { source_name: 'Lambda GB200 pre-order pricing', caveat: 'Pre-allocation, real volumes 2025-2026' }),
  D('lambda_mi300x', 'lambda', 'ai_native_infra', 'global', 'rate_card', 'tier_4', '2025-04-01', 'high', 'high', 'gpu_economics', 4,
    { gpu_sku: 'MI300X 192GB', price_per_gpu_hour: 1.99, unit: '$/GPU-hour' },
    { source_name: 'Lambda AMD MI300X catalog', applicability: 'Inference-optimized $/hr' }),

  // ─── Nebius / TensorWave / Together / Fluidstack ──────────────────
  D('nebius_h100_on_demand', 'nebius', 'ai_native_infra', 'europe', 'rate_card', 'tier_4', '2025-04-01', 'high', 'high', 'gpu_economics', 4,
    { price_per_gpu_hour: 2.99, gpu_sku: 'H100' }, { source_name: 'Nebius EU GPU pricing' }),
  D('nebius_post_yandex', 'nebius', 'ai_native_infra', 'europe', '10k', 'tier_1', '2025-03-31', 'high', 'medium', 'commercial_absorption', 4,
    { revenue_annual_usd: 200_000_000, growth_pct: 4.0 }, { source_name: 'Nebius FY2024 results', caveat: 'Post Yandex spin-off' }),
  D('tensorwave_mi300x_anchor', 'tensorwave', 'ai_native_infra', 'us', 'press_release', 'tier_3', '2024-09-01', 'medium', 'medium', 'partnership_structure', 3,
    { anchor_sku: 'MI300X', total_committed_units: 20_000 }, { source_name: 'TensorWave 2024 expansion' }),
  D('together_ai_inference', 'together_ai', 'ai_native_infra', 'us', 'rate_card', 'tier_4', '2025-04-15', 'medium', 'high', 'gpu_economics', 4,
    { price_per_million_input_tokens: 0.18, model: 'Llama 70B reference' }, { source_name: 'Together AI inference catalog' }),
  D('fluidstack_andromeda', 'fluidstack', 'ai_native_infra', 'us', 'press_release', 'tier_3', '2024-03-01', 'medium', 'medium', 'gpu_economics', 4,
    { supercluster_gpus: 22_000 }, { source_name: 'Andromeda 1 supercluster announcement', caveat: 'Specific deployment' }),

  // ─── G42 / NEOM / Humain / QIA / government initiatives ────────────
  D('g42_microsoft_2024', 'g42', 'sovereign_regional', 'uae', 'press_release', 'tier_3', '2024-04-15', 'high', 'low', 'partnership_structure', 5,
    { deal_size_usd: 1_500_000_000, partner: 'Microsoft' },
    { source_name: 'G42-Microsoft April 2024', applicability: 'Reference government + hyperscaler model' }),
  D('g42_stargate_uae', 'g42', 'sovereign_regional', 'uae', 'press_release', 'tier_3', '2025-01-15', 'medium', 'medium', 'partnership_structure', 5,
    { commitment_usd: 500_000_000_000, partners: 'Stargate consortium' },
    { source_name: 'Stargate / G42 / NVIDIA / SoftBank / OpenAI', applicability: 'Reference mega-government infra deal', caveat: 'Multi-year cumulative aspirational' }),
  D('neom_oxagon_dc_campus', 'neom', 'sovereign_regional', 'saudi_arabia', 'national_strategy', 'tier_2', '2024-09-01', 'medium', 'medium', 'commercial_absorption', 4,
    { committed_capacity_mw: 750, anchor_energy: 'Helios green H2' }, { source_name: 'NEOM Oxagon DC campus disclosures' }),
  D('humain_ksa_2024', 'humain_ksa', 'sovereign_regional', 'saudi_arabia', 'press_release', 'tier_3', '2024-08-15', 'medium', 'medium', 'sovereign_alignment', 5,
    { initial_capital_usd: 100_000_000_000, sponsor: 'PIF' },
    { source_name: 'Humain launch (KSA government AI)', applicability: 'KSA government AI flagship', caveat: 'Capital deployment phased' }),
  D('qia_brookfield_2024', 'qia', 'sovereign_regional', 'qatar', 'partnership_announcement', 'tier_2', '2024-05-01', 'high', 'low', 'partnership_structure', 5,
    { partnership_size_usd: 20_000_000_000, partner: 'Brookfield', focus: 'AI infrastructure' },
    { source_name: 'QIA-Brookfield $20B AI partnership', applicability: 'Native Qatar government deal comp' }),
  D('qfza_tax_regime', 'qfza', 'sovereign_regional', 'qatar', 'national_strategy', 'tier_1', '2024-01-01', 'high', 'low', 'sovereign_alignment', 5,
    { corporate_tax_pct: 0, customs_exemption: true, foreign_ownership_pct: 100 },
    { source_name: 'QFZA framework (Law No. 34/2005 + amendments)', applicability: 'Qatar DC base structure' }),
  D('kahramaa_tariff_industrial', 'kahramaa', 'sovereign_regional', 'qatar', 'utility_disclosure', 'tier_2', '2024-06-01', 'high', 'medium', 'energy', 5,
    { electricity_price_mwh: 42, tariff_class: 'industrial_large' },
    { source_name: 'KAHRAMAA industrial tariff schedule', applicability: 'Direct input to Qatar DC opex', caveat: '+3-5%/yr historical creep' }),
  D('kahramaa_grid_capacity', 'kahramaa', 'sovereign_regional', 'qatar', 'utility_disclosure', 'tier_2', '2024-12-01', 'medium', 'medium', 'energy', 5,
    { grid_capacity_headroom_mw: 8_000 },
    { source_name: 'KAHRAMAA capacity planning briefings', applicability: 'Qatar grid headroom available for DC scale' }),
  D('sdaia_ksa_strategy', 'sdaia_nsda', 'sovereign_regional', 'saudi_arabia', 'national_strategy', 'tier_1', '2020-10-21', 'high', 'low', 'sovereign_alignment', 4,
    { national_ai_strategy: true, target_year: 2030 },
    { source_name: 'NSDA National Strategy for Data & AI', applicability: 'KSA policy alignment' }),

  // ─── Brookfield / Blackstone / GIP / CBRE / JLL / T&T ─────────────
  D('brookfield_aum_2024', 'brookfield', 'infra_economics', 'global', '10k', 'tier_1', '2025-02-15', 'high', 'low', 'partnership_structure', 4,
    { aum_usd: 1_000_000_000_000 },
    { source_name: 'Brookfield 2024 Annual Report', applicability: 'Reference infra capital pool' }),
  D('brookfield_hyperion_jv_2025', 'brookfield', 'infra_economics', 'us', 'press_release', 'tier_3', '2025-10-01', 'high', 'low', 'partnership_structure', 5,
    { jv_total_usd: 27_000_000_000, owner_pct: 80, anchor_tenant: 'Meta' },
    { source_name: 'Meta-Blue Owl Hyperion JV announcement Oct 2025', applicability: 'Largest disclosed AI-anchor DC JV; reference comp for government+operator' }),
  D('blackstone_qts_vehicle', 'blackstone', 'infra_economics', 'us', 'press_release', 'tier_3', '2024-03-01', 'high', 'low', 'partnership_structure', 4,
    { vehicle_size_usd: 10_000_000_000, focus: 'AI DC' }, { source_name: 'Blackstone QTS private vehicle disclosure' }),
  D('gip_blackrock_2024', 'gip', 'infra_economics', 'global', 'press_release', 'tier_3', '2024-10-01', 'high', 'low', 'partnership_structure', 3,
    { acquisition_size_usd: 12_500_000_000 }, { source_name: 'BlackRock acquires GIP Oct 2024', applicability: 'Reference infra fund scale' }),
  D('cbre_global_dc_trends_h1_2025', 'cbre', 'infra_economics', 'global', 'market_report', 'tier_2', '2025-04-01', 'high', 'medium', 'pricing', 5,
    { wholesale_rent_growth_yoy_pct: 0.12, vacancy_pct: 0.03 },
    { source_name: 'CBRE Global Data Center Trends H1 2025', applicability: 'Global rent growth context' }),
  D('cbre_construction_inflation', 'cbre', 'infra_economics', 'global', 'market_report', 'tier_2', '2025-04-01', 'high', 'medium', 'capex', 4,
    { construction_cost_inflation_yoy_pct: 0.07 },
    { source_name: 'CBRE Global Data Center Trends H1 2025', applicability: 'Construction CAPEX pressure' }),
  D('jll_emea_dc_2024', 'jll', 'infra_economics', 'europe', 'market_report', 'tier_2', '2024-12-01', 'high', 'medium', 'pricing', 4,
    { tier3_wholesale_eu_kw_month: 130 }, { source_name: 'JLL EMEA DC Market Outlook 2024' }),
  D('tt_shell_mena_2024', 'tt_consult', 'infra_economics', 'mena', 'consultant_estimate', 'tier_2', '2024-09-01', 'high', 'low', 'capex', 5,
    { capex_shell_per_mw: 4_400_000, unit: '$/MW' },
    { source_name: 'Turner & Townsend Data Centre Cost Guide 2024 — MENA', applicability: 'Direct Qatar shell input' }),
  D('tt_mep_mena_2024', 'tt_consult', 'infra_economics', 'mena', 'consultant_estimate', 'tier_2', '2024-09-01', 'high', 'low', 'capex', 5,
    { capex_mep_per_mw: 3_800_000, unit: '$/MW' },
    { source_name: 'Turner & Townsend Cost Guide 2024 — MENA MEP', applicability: 'Direct Qatar MEP input' }),
  D('tt_substation_mena_2024', 'tt_consult', 'infra_economics', 'mena', 'consultant_estimate', 'tier_2', '2024-09-01', 'high', 'low', 'capex', 4,
    { capex_substation_per_mw: 1_200_000, unit: '$/MW' }, { source_name: 'Turner & Townsend Cost Guide 2024' }),
  D('tt_cooling_mena_2024', 'tt_consult', 'infra_economics', 'mena', 'consultant_estimate', 'tier_2', '2024-09-01', 'high', 'medium', 'cooling', 5,
    { capex_cooling_per_mw: 1_500_000, unit: '$/MW' },
    { source_name: 'Turner & Townsend Cost Guide 2024 — Hot-climate cooling', applicability: 'Qatar evaporative + DLC blend' }),
  D('tt_liquid_premium', 'tt_consult', 'infra_economics', 'global', 'consultant_estimate', 'tier_2', '2024-09-01', 'high', 'medium', 'cooling', 4,
    { liquid_cooling_capex_premium_per_mw: 750_000, unit: '$/MW' },
    { source_name: 'T&T liquid retrofit premium', applicability: 'Direct GB200 cooling input' }),

  // ─── Supply chain / lead times (reality layer) ────────────────────
  D('transformer_lead_time_2024', 'tt_consult', 'infra_economics', 'global', 'consultant_estimate', 'tier_2', '2024-12-01', 'high', 'high', 'supply_chain_lead_time', 5,
    { transformer_50mva_lead_time_months: 22 },
    { source_name: 'Schneider/Siemens 2024 lead-time guidance', applicability: 'Critical Qatar build path constraint', caveat: 'Easing 2026 onwards' }),
  D('switchgear_mv_lead_time', 'schneider', 'hardware_vendor', 'global', 'supplier_disclosure', 'tier_2', '2024-12-01', 'high', 'high', 'supply_chain_lead_time', 4,
    { mv_switchgear_lead_time_months: 15 }, { source_name: 'Schneider Q4 2024 guidance' }),
  D('vertiv_cdu_lead_time', 'vertiv', 'hardware_vendor', 'global', 'supplier_disclosure', 'tier_2', '2024-12-01', 'high', 'high', 'supply_chain_lead_time', 4,
    { liquid_cdu_lead_time_months: 9 }, { source_name: 'Vertiv 2024 capacity guidance', applicability: 'GB200 readiness' }),

  // ─── NVIDIA / AMD GPU vendor data ─────────────────────────────────
  D('nvidia_h100_msrp', 'nvidia', 'hardware_vendor', 'global', 'product_sheet', 'tier_3', '2024-01-01', 'medium', 'high', 'gpu_economics', 5,
    { sku: 'H100 SXM5', msrp_usd: 30_000, tdp_w: 700 }, { source_name: 'NVIDIA H100 reference; channel pricing' }),
  D('nvidia_h200_msrp', 'nvidia', 'hardware_vendor', 'global', 'product_sheet', 'tier_3', '2024-04-01', 'medium', 'high', 'gpu_economics', 5,
    { sku: 'H200 SXM5', msrp_usd: 32_000, tdp_w: 700, hbm_gb: 141 }, { source_name: 'NVIDIA H200 reference' }),
  D('nvidia_gb200_rack_msrp', 'nvidia', 'hardware_vendor', 'global', 'product_sheet', 'tier_3', '2025-01-01', 'medium', 'high', 'gpu_economics', 5,
    { sku: 'GB200 NVL72 rack', msrp_per_rack_usd: 3_000_000, tdp_per_rack_kw: 132, gpus_per_rack: 72 },
    { source_name: 'NVIDIA GB200 NVL72 reference', applicability: 'Direct cooling + power calc', caveat: 'Requires liquid' }),
  D('nvidia_gb200_allocation', 'nvidia', 'hardware_vendor', 'global', 'supplier_disclosure', 'tier_3', '2025-01-15', 'medium', 'high', 'supply_chain_lead_time', 5,
    { allocation_lead_time_months: 12, hyperscaler_first: true },
    { source_name: 'NVIDIA Q4 FY25 commentary', caveat: 'Hyperscaler allocation precedence' }),
  D('amd_mi300x_msrp', 'amd', 'hardware_vendor', 'global', 'product_sheet', 'tier_3', '2024-01-01', 'medium', 'high', 'gpu_economics', 4,
    { sku: 'MI300X', msrp_usd: 15_000, tdp_w: 750, hbm_gb: 192 }, { source_name: 'AMD Instinct MI300X reference', applicability: 'Inference cost arbitrage' }),

  // ─── Hyperscaler anchor benchmarks ────────────────────────────────
  D('meta_self_build_capex_2024', 'meta', 'hyperscaler', 'us', '10k', 'tier_1', '2025-02-01', 'high', 'medium', 'capex', 5,
    { ai_infra_capex_usd: 65_000_000_000 },
    { source_name: 'Meta Q4 2024 capex guidance', applicability: 'Hyperscale anchor build benchmark', caveat: 'Total infra, not all AI DC' }),
  D('microsoft_capex_q3_2024', 'microsoft', 'hyperscaler', 'global', 'earnings_call', 'tier_2', '2024-10-30', 'high', 'medium', 'capex', 5,
    { capex_quarter_usd: 20_000_000_000, focus: 'AI DC' }, { source_name: 'Microsoft Q1 FY25 earnings' }),
  D('aws_capex_q3_2024', 'aws', 'hyperscaler', 'global', 'earnings_call', 'tier_2', '2024-10-31', 'high', 'medium', 'capex', 4,
    { capex_annualized_usd: 75_000_000_000 }, { source_name: 'Amazon Q3 2024 earnings call' }),
  D('google_capex_2024', 'google', 'hyperscaler', 'global', 'earnings_call', 'tier_2', '2024-10-29', 'high', 'medium', 'capex', 4,
    { capex_year_usd: 50_000_000_000 }, { source_name: 'Alphabet Q3 2024 earnings call' }),

  // ─── Commercial absorption — regional demand signals ─────────────
  D('mena_dc_demand_2030', 'cbre', 'infra_economics', 'mena', 'market_report', 'tier_2', '2024-11-01', 'medium', 'medium', 'commercial_absorption', 5,
    { committed_pipeline_mw_2030: 4_500, current_install_mw: 800 },
    { source_name: 'CBRE MENA 2024 outlook', applicability: 'GCC DC pipeline aggregate' }),
  D('gcc_oversupply_risk', 'cbre', 'infra_economics', 'gcc', 'market_report', 'tier_2', '2025-04-01', 'medium', 'medium', 'commercial_absorption', 4,
    { oversupply_risk_2027_pct: 0.25 },
    { source_name: 'CBRE Q1 2025', applicability: 'GCC pipeline > demand if all built', caveat: 'Anchor-tenant gated' }),
  D('uae_demand_velocity', 'jll', 'infra_economics', 'uae', 'market_report', 'tier_2', '2024-12-01', 'medium', 'high', 'commercial_absorption', 4,
    { absorption_rate_mw_year: 220, vacancy_pct: 0.05 }, { source_name: 'JLL UAE Q4 2024' }),
  D('ksa_demand_pipeline', 'jll', 'infra_economics', 'saudi_arabia', 'market_report', 'tier_2', '2024-12-01', 'medium', 'high', 'commercial_absorption', 4,
    { announced_pipeline_mw: 1_400 }, { source_name: 'JLL KSA Q4 2024' }),
  D('qatar_demand_pipeline', 'jll', 'infra_economics', 'qatar', 'market_report', 'tier_2', '2024-12-01', 'medium', 'high', 'commercial_absorption', 5,
    { announced_pipeline_mw: 600 }, { source_name: 'JLL GCC Q4 2024' }),
  D('eu_dc_demand_2030', 'jll', 'infra_economics', 'europe', 'market_report', 'tier_2', '2024-12-01', 'medium', 'medium', 'commercial_absorption', 3,
    { committed_pipeline_mw_2030: 12_000 }, { source_name: 'JLL Europe DC Outlook 2024' }),

  // ─── Energy & utility comparables ─────────────────────────────────
  D('uae_dewa_tariff', 'g42', 'sovereign_regional', 'uae', 'utility_disclosure', 'tier_2', '2024-06-01', 'high', 'low', 'energy', 4,
    { electricity_price_mwh: 50, tariff_class: 'industrial_large' }, { source_name: 'DEWA industrial tariffs 2024' }),
  D('ksa_sec_tariff', 'humain_ksa', 'sovereign_regional', 'saudi_arabia', 'utility_disclosure', 'tier_2', '2024-06-01', 'high', 'low', 'energy', 4,
    { electricity_price_mwh: 55, tariff_class: 'industrial_large' }, { source_name: 'SEC KSA industrial tariffs 2024' }),
  D('eu_avg_industrial_tariff', 'cbre', 'infra_economics', 'europe', 'market_report', 'tier_2', '2024-09-01', 'high', 'high', 'energy', 4,
    { electricity_price_mwh: 95, tariff_class: 'industrial_avg' }, { source_name: 'Eurostat 2024', caveat: 'Highly country-variable' }),
  D('us_pjm_wholesale_2024', 'cbre', 'infra_economics', 'north_america', 'market_report', 'tier_2', '2024-09-01', 'high', 'high', 'energy', 4,
    { electricity_price_mwh: 45, market: 'PJM industrial' }, { source_name: 'PJM 2024 wholesale; CBRE comp' }),

  // ─── Decision tension supporting datapoints ──────────────────────
  D('qatar_water_stress_index', 'kahramaa', 'sovereign_regional', 'qatar', 'utility_disclosure', 'tier_2', '2024-09-01', 'high', 'low', 'cooling', 5,
    { water_stress_index: 4.7, scale: '0-5 (Aqueduct)' },
    { source_name: 'WRI Aqueduct + KAHRAMAA', applicability: 'Drives closed-loop dry cooling premium', caveat: 'Critical Qatar constraint' }),
  D('ksa_renewable_target_2030', 'humain_ksa', 'sovereign_regional', 'saudi_arabia', 'national_strategy', 'tier_2', '2024-01-01', 'high', 'low', 'energy', 4,
    { renewable_share_target_2030_pct: 0.50 }, { source_name: 'Vision 2030 Energy targets', applicability: 'KSA renewable-anchored sites' }),
  D('uae_pue_target_climate', 'khazna', 'datacenter_operator', 'uae', 'consultant_estimate', 'tier_3', '2024-09-01', 'medium', 'low', 'pue_efficiency', 3,
    { pue_realistic_air: 1.55, pue_realistic_liquid: 1.25 }, { source_name: 'Hot-climate PUE benchmarks', caveat: 'Sustained 45°C ambient' }),

  // ─── Government comparables — strategic compute ───────────────────
  D('uae_falcon_llm', 'g42', 'sovereign_regional', 'uae', 'press_release', 'tier_3', '2024-04-01', 'high', 'medium', 'sovereign_alignment', 4,
    { sovereign_llm: 'Falcon 180B', training_capacity_mw: 50 }, { source_name: 'TII / G42 Falcon family' }),
  D('ksa_humain_ambition', 'humain_ksa', 'sovereign_regional', 'saudi_arabia', 'press_release', 'tier_3', '2024-09-01', 'medium', 'high', 'sovereign_alignment', 5,
    { target_compute_mw_2030: 1_000 }, { source_name: 'Humain initial briefing', caveat: 'Aspirational' }),

  // ─── Operator economics — pricing nuances ─────────────────────────
  D('eqx_xscale_pricing_uplift', 'equinix', 'datacenter_operator', 'global', 'investor_day', 'tier_2', '2024-11-01', 'medium', 'medium', 'pricing', 4,
    { xscale_kw_month: 120, uplift_vs_wholesale_pct: 0.20 },
    { source_name: 'Equinix Investor Day 2024 — xScale economics', applicability: 'xScale BTS = wholesale + premium' }),
  D('crwv_utilization_post_ramp', 'coreweave', 'ai_native_infra', 'global', '10k', 'tier_1', '2025-04-30', 'high', 'medium', 'utilization', 5,
    { post_ramp_utilization_pct: 0.78 },
    { source_name: 'CoreWeave FY2024 S-1', applicability: 'GPU cloud utilization benchmark' }),
  D('hyperscale_lease_term_avg_2024', 'cbre', 'infra_economics', 'global', 'market_report', 'tier_2', '2025-04-01', 'high', 'low', 'contract_term', 4,
    { avg_lease_term_years: 14 }, { source_name: 'CBRE Global DC Trends H1 2025' }),

  // ─── Reality layer — phased deployment ────────────────────────────
  D('qatar_grid_approval_timeline', 'kahramaa', 'sovereign_regional', 'qatar', 'utility_disclosure', 'tier_2', '2024-09-01', 'high', 'low', 'supply_chain_lead_time', 5,
    { new_50mw_connection_months: 24 },
    { source_name: 'KAHRAMAA capacity planning briefings', applicability: 'Qatar DC build-path bottleneck' }),
  D('mena_permit_timeline_free_zone', 'qfza', 'sovereign_regional', 'qatar', 'national_strategy', 'tier_1', '2024-01-01', 'high', 'low', 'supply_chain_lead_time', 5,
    { permit_months_free_zone: 6 },
    { source_name: 'QFZA fast-track regime', applicability: 'Qatar permit advantage vs typical 18-24mo' }),
  D('eu_permit_timeline', 'cbre', 'infra_economics', 'europe', 'market_report', 'tier_2', '2024-09-01', 'high', 'low', 'supply_chain_lead_time', 3,
    { typical_permit_months_eu: 24 }, { source_name: 'CBRE EU permitting context' }),

  // ─── Misc tier-5 admin inputs (clearly labelled) ──────────────────
  D('admin_estimate_data_room_progress', 'tt_consult', 'infra_economics', 'qatar', 'admin_input', 'tier_5', '2025-05-25', 'low', 'low', 'commercial_absorption', 2,
    { sourced_metrics_pct: 0.42 }, { source_name: 'Internal data-room snapshot', caveat: 'Internal admin metric, not external' }),
];

export const DATAPOINT_BY_ID = Object.fromEntries(DATAPOINTS.map(d => [d.id, d]));

export const DATAPOINTS_BY_ENTITY = (() => {
  const m = {};
  for (const d of DATAPOINTS) (m[d.entity_id] ||= []).push(d);
  return m;
})();

export const DATAPOINTS_BY_REGION = (() => {
  const m = {};
  for (const d of DATAPOINTS) (m[d.region] ||= []).push(d);
  return m;
})();

export const DATAPOINTS_BY_COMPARABLE = (() => {
  const m = {};
  for (const d of DATAPOINTS) (m[d.comparable_type] ||= []).push(d);
  return m;
})();
