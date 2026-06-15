// lib/oracle-intelligence/entities.js
//
// Sprint 2 — Registry of entities referenced across the intelligence layer.
// Each entity carries enough metadata to drive comparable reasoning :
// commercial_model, sovereign_alignment, strategic_notes.
//
// Source of truth — never duplicate this elsewhere.

const ENTITIES = [
  // ── Datacenter operators ──────────────────────────────────────────
  {
    id: 'equinix', name: 'Equinix, Inc.', category: 'datacenter_operator',
    ticker: 'EQIX', headquarters: 'US',
    commercial_model: ['retail_colo', 'wholesale_colo', 'xscale_hyperscale_bts'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: 'Interconnection density — 470k+ cross-connects across 260+ IBX',
      monetization: 'Per-cabinet MRR + interconnection fees; xScale BTS for hyperscalers',
      cooling: 'Air-cooled legacy; liquid retrofits underway 2024-2026',
      mena_exposure: 'No direct IBX; MC1 Oman JV with Omantel',
    },
  },
  {
    id: 'digital_realty', name: 'Digital Realty Trust', category: 'datacenter_operator',
    ticker: 'DLR', headquarters: 'US',
    commercial_model: ['wholesale_colo', 'hyperscale_lease', 'powered_shell'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: 'PlatformDIGITAL global wholesale footprint; Brookfield 80% Hyperion JV with Meta',
      monetization: 'Long-NNN with hyperscaler anchor tenants; Blackstone JV monetization',
      mena_exposure: 'No direct presence',
    },
  },
  {
    id: 'ntt', name: 'NTT Global Data Centers', category: 'datacenter_operator',
    ticker: 'NTT (private subsidiary)', headquarters: 'Japan',
    commercial_model: ['retail_colo', 'wholesale_colo', 'hyperscale_lease'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: 'Largest non-US wholesale platform; deep MENA + APAC footprint',
      monetization: 'Wholesale + integrated managed services',
      mena_exposure: 'Yes — UAE Khazna minority stake (rumored), India scale',
    },
  },
  {
    id: 'vantage', name: 'Vantage Data Centers', category: 'datacenter_operator',
    ticker: 'private (DigitalBridge majority)', headquarters: 'US',
    commercial_model: ['wholesale_colo', 'hyperscale_lease'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: 'Hyperscale-focused, fast-build playbook',
      monetization: 'Long-term hyperscale leases; DigitalBridge financing structure',
    },
  },
  {
    id: 'cyrusone', name: 'CyrusOne', category: 'datacenter_operator',
    ticker: 'private (KKR + GIP)', headquarters: 'US',
    commercial_model: ['wholesale_colo', 'hyperscale_lease'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Texas / Northern Virginia density; KKR + GIP private', monetization: 'Hyperscale leases' },
  },
  {
    id: 'qts', name: 'QTS Realty Trust', category: 'datacenter_operator',
    ticker: 'private (Blackstone)', headquarters: 'US',
    commercial_model: ['wholesale_colo', 'hyperscale_lease'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Blackstone $10B+ private vehicle, large pipeline', monetization: 'Hyperscale + federal' },
  },
  {
    id: 'switch', name: 'Switch, Inc.', category: 'datacenter_operator',
    ticker: 'private (DigitalBridge)', headquarters: 'US',
    commercial_model: ['retail_colo', 'wholesale_colo'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Tier IV ratings; sustainability-first branding', monetization: 'Enterprise + select hyperscale' },
  },
  {
    id: 'data4', name: 'Data4 Group', category: 'datacenter_operator',
    ticker: 'private (Brookfield)', headquarters: 'France',
    commercial_model: ['wholesale_colo', 'hyperscale_lease'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'EU government-cloud aligned; Brookfield-owned', monetization: 'Hyperscale + EU government workload' },
  },
  {
    id: 'khazna', name: 'Khazna Data Centers', category: 'datacenter_operator',
    ticker: 'private (G42 + Mubadala)', headquarters: 'UAE',
    commercial_model: ['wholesale_colo', 'hyperscale_lease'],
    sovereign_alignment: 'mixed',
    strategic_notes: { moat: 'UAE national champion; G42 / Microsoft-aligned compute', monetization: 'UAE government + hyperscale' },
  },

  // ── AI-native infrastructure ──────────────────────────────────────
  {
    id: 'coreweave', name: 'CoreWeave', category: 'ai_native_infra',
    ticker: 'CRWV (IPO 2025)', headquarters: 'US',
    commercial_model: ['gpu_cloud', 'ai_training_cluster'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: 'NVIDIA-aligned GPU allocation + long-term contracts (Microsoft, others)',
      monetization: 'GPU-hour pricing + reserved capacity contracts',
      gpu_economics: 'H100/H200/GB200 fleet; depreciation 4yr useful life',
      customer_concentration: 'HIGH — top 2 customers >60% of revenue (2024)',
    },
  },
  {
    id: 'crusoe', name: 'Crusoe Energy Systems', category: 'ai_native_infra',
    ticker: 'private', headquarters: 'US',
    commercial_model: ['gpu_cloud', 'ai_training_cluster'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: 'Stranded-energy datacenter strategy (flared gas); 1.2 GW+ pipeline',
      monetization: 'GPU cloud + asset-level financing',
      energy: 'Co-located with stranded power sources, lowest marginal energy cost',
    },
  },
  {
    id: 'lambda', name: 'Lambda Labs', category: 'ai_native_infra',
    ticker: 'private', headquarters: 'US',
    commercial_model: ['gpu_cloud', 'gpu_on_demand'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Developer-first GPU cloud; on-demand H100/H200 catalog with transparent pricing', monetization: '$/GPU-hour' },
  },
  {
    id: 'nebius', name: 'Nebius Group', category: 'ai_native_infra',
    ticker: 'NBIS', headquarters: 'Netherlands (post-Yandex spin)',
    commercial_model: ['gpu_cloud', 'ai_training_cluster'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'EU government GPU cloud; Finland + Israel campus', monetization: '$/GPU-hour + reserved' },
  },
  {
    id: 'tensorwave', name: 'TensorWave', category: 'ai_native_infra',
    ticker: 'private', headquarters: 'US',
    commercial_model: ['gpu_cloud'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'AMD MI300X-first GPU cloud (non-NVIDIA bet)', monetization: '$/GPU-hour' },
  },
  {
    id: 'together_ai', name: 'Together AI', category: 'ai_native_infra',
    ticker: 'private', headquarters: 'US',
    commercial_model: ['gpu_cloud', 'inference_as_service'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Inference-optimized infra + open-model hosting', monetization: 'Token + GPU-hour hybrid' },
  },
  {
    id: 'fluidstack', name: 'Fluidstack', category: 'ai_native_infra',
    ticker: 'private', headquarters: 'UK',
    commercial_model: ['gpu_cloud'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Pan-region GPU aggregator; Andromeda 1 supercluster ref.', monetization: '$/GPU-hour + reserved' },
  },

  // ── Government / regional infrastructure ───────────────────────────
  {
    id: 'g42', name: 'G42', category: 'sovereign_regional',
    ticker: 'private (UAE)', headquarters: 'UAE',
    commercial_model: ['sovereign_ai', 'hyperscale_lease'],
    sovereign_alignment: 'sovereign',
    strategic_notes: {
      moat: 'UAE national AI champion; Microsoft $1.5B (2024); Cerebras + NVIDIA aligned',
      monetization: 'Government compute + Microsoft commercial channel',
      strategic_compute: 'Stargate UAE participation; Falcon LLM via TII',
    },
  },
  {
    id: 'neom', name: 'NEOM / Oxagon', category: 'sovereign_regional',
    ticker: 'government (PIF)', headquarters: 'KSA',
    commercial_model: ['sovereign_ai', 'industrial_compute'],
    sovereign_alignment: 'sovereign',
    strategic_notes: {
      moat: 'PIF-backed greenfield industrial city; Helios green hydrogen + Oxagon DC campus',
      monetization: 'Government + industrial anchor tenants',
      energy: 'Renewable-anchored (solar + green H2)',
    },
  },
  {
    id: 'humain_ksa', name: 'Humain (KSA government AI)', category: 'sovereign_regional',
    ticker: 'government (PIF subsidiary)', headquarters: 'KSA',
    commercial_model: ['sovereign_ai'],
    sovereign_alignment: 'sovereign',
    strategic_notes: { moat: 'Saudi national AI venture launched 2024; NSDA-aligned', monetization: 'Government compute + commercial channel TBD' },
  },
  {
    id: 'qia', name: 'Qatar Investment Authority', category: 'sovereign_regional',
    ticker: 'government (Qatar SWF)', headquarters: 'Qatar',
    commercial_model: ['infrastructure_capital'],
    sovereign_alignment: 'sovereign',
    strategic_notes: { moat: 'SWF capital; Brookfield $20B AI partnership (2024)', monetization: 'LP-style returns' },
  },
  {
    id: 'qfza', name: 'Qatar Free Zones Authority', category: 'sovereign_regional',
    ticker: 'government (Qatar)', headquarters: 'Qatar',
    commercial_model: ['free_zone_operator'],
    sovereign_alignment: 'sovereign',
    strategic_notes: { moat: 'Tax-exempt zones with 100% foreign ownership; Ras Bufontas + Umm Alhoul', monetization: 'Land lease + ecosystem fees' },
  },
  {
    id: 'kahramaa', name: 'KAHRAMAA (Qatar General Electricity & Water)', category: 'sovereign_regional',
    ticker: 'government (Qatar)', headquarters: 'Qatar',
    commercial_model: ['utility'],
    sovereign_alignment: 'sovereign',
    strategic_notes: { moat: 'Qatar grid + water monopoly; gas-backed baseload + growing solar', monetization: 'Tariffs (industrial ~$30-45/MWh historic)' },
  },
  {
    id: 'sdaia_nsda', name: 'SDAIA / NSDA (KSA Data & AI Authority)', category: 'sovereign_regional',
    ticker: 'government (KSA)', headquarters: 'KSA',
    commercial_model: ['policy_strategy'],
    sovereign_alignment: 'sovereign',
    strategic_notes: { moat: 'Saudi National Strategy for Data & AI published 2020; coordinates Humain + PIF + ministries', monetization: 'Policy framework' },
  },

  // ── Infrastructure economics actors ───────────────────────────────
  {
    id: 'brookfield', name: 'Brookfield Asset Management', category: 'infra_economics',
    ticker: 'BAM / BIP', headquarters: 'Canada',
    commercial_model: ['infra_pe', 'infra_fund'],
    sovereign_alignment: 'commercial',
    strategic_notes: {
      moat: '$1T AUM; data centers via Compass + Data4 + Hyperion JV (Meta) + QIA $20B AI partnership',
      monetization: 'Asset-level cash yield + capital appreciation + carried interest',
    },
  },
  {
    id: 'blackstone', name: 'Blackstone Real Estate', category: 'infra_economics',
    ticker: 'BX', headquarters: 'US',
    commercial_model: ['real_estate_pe'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'QTS $10B+ private vehicle; AI-focused datacenter strategy', monetization: 'Asset appreciation + cash yield' },
  },
  {
    id: 'gip', name: 'Global Infrastructure Partners (BlackRock)', category: 'infra_economics',
    ticker: 'private (BlackRock)', headquarters: 'US',
    commercial_model: ['infra_pe'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'CyrusOne co-investment; BlackRock acquisition 2024', monetization: 'Asset cash yield' },
  },
  {
    id: 'cbre', name: 'CBRE Group', category: 'infra_economics',
    ticker: 'CBRE', headquarters: 'US',
    commercial_model: ['advisory'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Largest CRE advisory; semi-annual Global Data Center Trends report', monetization: 'Advisory + leasing fees' },
  },
  {
    id: 'jll', name: 'JLL', category: 'infra_economics',
    ticker: 'JLL', headquarters: 'US',
    commercial_model: ['advisory'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'EMEA-strong advisory; quarterly DC market reports', monetization: 'Advisory + leasing fees' },
  },
  {
    id: 'tt_consult', name: 'Turner & Townsend', category: 'infra_economics',
    ticker: 'private (KKR minority)', headquarters: 'UK',
    commercial_model: ['cost_consultancy'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'MENA + global construction cost benchmarking; annual DC cost guide', monetization: 'Project advisory' },
  },

  // ── Hardware vendors (referenced for prices/lead times) ───────────
  {
    id: 'nvidia', name: 'NVIDIA Corp.', category: 'hardware_vendor',
    ticker: 'NVDA', headquarters: 'US',
    commercial_model: ['gpu_vendor', 'system_vendor', 'cloud'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'GPU monopoly (95%+ training share); CUDA + NVLink + GB200 NVL72', monetization: 'GPU sales + DGX Cloud + ecosystem' },
  },
  {
    id: 'amd', name: 'AMD', category: 'hardware_vendor',
    ticker: 'AMD', headquarters: 'US',
    commercial_model: ['gpu_vendor', 'cpu_vendor'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Instinct MI300X/MI325X; emerging NVIDIA challenger', monetization: 'GPU + CPU sales' },
  },
  {
    id: 'vertiv', name: 'Vertiv Holdings', category: 'hardware_vendor',
    ticker: 'VRT', headquarters: 'US',
    commercial_model: ['cooling_vendor', 'power_vendor'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Liquid-cooling CDU leader; #1 share global', monetization: 'Equipment + service' },
  },
  {
    id: 'schneider', name: 'Schneider Electric', category: 'hardware_vendor',
    ticker: 'SU.PA', headquarters: 'France',
    commercial_model: ['power_vendor', 'cooling_vendor'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Power + cooling integrated; EcoStruxure platform', monetization: 'Equipment + service' },
  },

  // ── Hyperscalers (anchor tenants) ─────────────────────────────────
  {
    id: 'aws', name: 'Amazon Web Services', category: 'hyperscaler',
    ticker: 'AMZN', headquarters: 'US',
    commercial_model: ['hyperscale_anchor'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Largest cloud; ~30% global IaaS share', monetization: 'Compute + storage + AI services' },
  },
  {
    id: 'microsoft', name: 'Microsoft Azure', category: 'hyperscaler',
    ticker: 'MSFT', headquarters: 'US',
    commercial_model: ['hyperscale_anchor', 'ai_partnerships'],
    sovereign_alignment: 'mixed',
    strategic_notes: { moat: 'OpenAI exclusive infra partner; G42 $1.5B (2024)', monetization: 'Azure compute + AI services' },
  },
  {
    id: 'google', name: 'Google Cloud', category: 'hyperscaler',
    ticker: 'GOOGL', headquarters: 'US',
    commercial_model: ['hyperscale_anchor'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'TPU custom silicon; Gemini integrated infra', monetization: 'Compute + AI services' },
  },
  {
    id: 'meta', name: 'Meta Platforms', category: 'hyperscaler',
    ticker: 'META', headquarters: 'US',
    commercial_model: ['hyperscale_self_build', 'lease_anchor'],
    sovereign_alignment: 'commercial',
    strategic_notes: { moat: 'Llama open-weight family; massive self-build pipeline + Brookfield Hyperion $27B JV (2025)', monetization: 'Internal AI workload' },
  },
];

export const ENTITY_BY_ID = Object.fromEntries(ENTITIES.map(e => [e.id, e]));
