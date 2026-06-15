// lib/oracle-intelligence/comparables.js
//
// Sprint 2 — Comparable Intelligence.
// Pourquoi Equinix ≠ CoreWeave ≠ Crusoe ≠ G42 — différences structurelles
// qui changent l'analyse financière, opérationnelle et stratégique.
//
// Chaque entrée explicite WHY les business models divergent. C'est ça qui
// transforme le raisonnement de "comparer des chiffres" à "comparer des
// thèses d'investissement".

/**
 * COMPARABLE_PROFILES — keyed by entity_id.
 * Each profile maps the 9 dimensions to short, opinionated explanations.
 * The strategic-memo endpoint feeds the relevant profiles into the LLM
 * so the memo's Market Benchmarking section is structurally honest about
 * WHY two operators with similar headline metrics are not interchangeable.
 */
export const COMPARABLE_PROFILES = {
  equinix: {
    monetization: 'Per-cabinet MRR + interconnection fees + xScale long-NNN. The interconnect layer (470k+ cross-connects) is the structural margin lever, not the colo cabinet.',
    utilization: 'Steady-state ~80-85% occupancy at IBX maturity; xScale is BTS to hyperscaler so ~100% from day-one of lease.',
    interconnection: 'CORE moat — IBX network effect compounds; non-replicable in greenfield markets without 10+ yr buildout.',
    gpu_economics: 'Indirect — Equinix hosts GPU clouds (Lambda, others) but is not a GPU owner. Pricing tracks rack-cap not GPU-hour.',
    customer_concentration: 'Highly diversified (>10000 customers). Top 10 < 15% of MRR.',
    energy_positioning: 'Grid-dependent globally; sustainability pledges drive renewable contracting.',
    deployment_philosophy: 'Slow + dense brownfield additions in existing IBX. xScale = build-to-suit hyperscale outside the IBX.',
    sovereign_alignment: 'Commercial-first. JV pattern in MENA (MC1 Oman Omantel) when government anchor required.',
    commercialization: 'Direct sales + channel partners. Anchor tenant logic stronger in xScale than IBX.',
  },
  digital_realty: {
    monetization: 'Wholesale long-NNN lease + powered shell + Blackstone JV vehicles. Lower MRR/sqft than Equinix but higher absolute scale.',
    utilization: '80-90% steady-state; hyperscale anchors near 100% from lease commencement.',
    interconnection: 'PlatformDIGITAL fabric improving but still secondary to Equinix on cross-connect density.',
    gpu_economics: 'Indirect via tenants. AI demand drives anchor leases, not direct GPU revenue.',
    customer_concentration: 'Top 5 customers ~30-40% of revenue.',
    energy_positioning: 'Grid + bilateral renewable PPAs (Brookfield-backed scale).',
    deployment_philosophy: 'BTS hyperscale + powered shell at scale. Brookfield Hyperion = template.',
    sovereign_alignment: 'Commercial; Brookfield-affiliated, opens government channels (QIA $20B AI partnership 2024).',
    commercialization: 'Anchor-tenant LOI-driven build-out; Meta Hyperion JV ($27B Oct 2025) is the new reference.',
  },
  ntt: {
    monetization: 'Wholesale + managed services bundle. Higher service revenue per MW than US peers.',
    utilization: 'Stabilized ~80%; integrated managed ops smooths ramp.',
    interconnection: 'Strong in APAC + EU; weaker in MENA (no direct presence but rumored Khazna stake).',
    gpu_economics: 'Indirect; AI customer wins through DGX co-locations.',
    customer_concentration: 'Diversified APAC, more concentrated EU.',
    energy_positioning: 'Japan parent grants access to advanced power infra + renewable PPA experience.',
    deployment_philosophy: 'Global wholesale playbook with regional autonomy.',
    sovereign_alignment: 'Quasi-government (NTT 35%+ Japanese govt) — credible partner for government workloads.',
    commercialization: 'Direct + system-integrator channel.',
  },
  coreweave: {
    monetization: '$/GPU-hour on-demand + long-term reserved contracts. Microsoft = ~50%+ of revenue. Revenue ≈ utilization × $/hr × installed GPUs.',
    utilization: 'Post-ramp ~75-80%. Underwriting hinges on this number — if customer attrition spikes, utilization is the first metric to compress.',
    interconnection: 'Builds in CoLo (Core Scientific, others) — leverages existing fiber. NOT an interconnection moat.',
    gpu_economics: 'OWNS the GPU fleet. Depreciation = 4-yr useful life (per S-1). Cap structure highly debt-funded against GPU collateral.',
    customer_concentration: 'CRITICAL RISK — top 2 customers >60% of revenue (FY2024). Microsoft exposure dominates.',
    energy_positioning: 'Power-arbitrage : co-locates in low-$/MWh markets (Texas, etc.).',
    deployment_philosophy: 'Fast deploys via colo partners; vertical scale-up of GPU fleet > horizontal site count.',
    sovereign_alignment: 'Commercial; could become a government vendor but currently US-domestic.',
    commercialization: 'Reserved capacity contracts (multi-yr take-or-pay) + spot on-demand. Customer credit quality is the real risk.',
  },
  crusoe: {
    monetization: 'GPU cloud + asset-level financing on stranded-energy DCs. Energy COGS is the structural moat.',
    utilization: 'High utilization is critical given GPU CapEx + debt. Long-term Oracle deal anchors ~80%.',
    interconnection: 'Builds where stranded energy exists — interconnection is a constraint, not a moat.',
    gpu_economics: 'Owns GPUs; energy arbitrage compresses opex 30-50% vs grid-bought.',
    customer_concentration: 'Oracle anchor = single-customer concentration risk on flagship campus.',
    energy_positioning: 'STRUCTURAL ADVANTAGE — flared gas + stranded renewables. Cheapest marginal MWh in fleet.',
    deployment_philosophy: 'Co-located with energy source; phased capacity additions.',
    sovereign_alignment: 'Commercial.',
    commercialization: 'Strategic anchor deals (Oracle $3.4B) + spot capacity.',
  },
  lambda: {
    monetization: 'On-demand $/GPU-hour + reserved 1-3 yr discounts. Most transparent pricing in the market.',
    utilization: 'Underwriting more variable than CoreWeave (broader long-tail customer base).',
    interconnection: 'CoLo-hosted; no interconnection moat.',
    gpu_economics: 'Owns GPUs; depreciation similar to CoreWeave.',
    customer_concentration: 'More diversified than CoreWeave (developer + startup + enterprise mix).',
    energy_positioning: 'Grid-tied at colo partners.',
    deployment_philosophy: 'Developer-first product + transparent pricing; smaller scale than CoreWeave.',
    sovereign_alignment: 'Commercial.',
    commercialization: 'Self-serve + reserved; lower friction.',
  },
  g42: {
    monetization: 'Government compute + Microsoft commercial channel ($1.5B 2024) + Stargate UAE. Revenue is dual-track : government budget + commercial leases.',
    utilization: 'Government workloads underwrite occupancy; less market-risk than commercial GPU cloud.',
    interconnection: 'UAE national fabric (Etisalat + du) — strong but bounded by geography.',
    gpu_economics: 'Direct GPU procurement (NVIDIA + Cerebras) but inside a government compute envelope.',
    customer_concentration: 'Effectively monopsonistic on government side (UAE Govt + Microsoft); concentrated by design.',
    energy_positioning: 'UAE grid (Barakah nuclear + DEWA + EWEC renewables) is among the cheapest + cleanest in the GCC.',
    deployment_philosophy: 'Government-first, with hyperscaler offtake on top. Khazna is the build vehicle.',
    sovereign_alignment: 'GOVERNMENT — anchored in UAE national strategy + AI Strategy 2031.',
    commercialization: 'Government procurement + Microsoft Azure channel + Stargate-class partnerships.',
  },
  neom: {
    monetization: 'PIF-funded; commercial monetization deferred to anchor tenants (Helios + Oxagon clusters).',
    utilization: 'Pre-revenue; underwriting is greenfield optionality + government value.',
    interconnection: 'Greenfield — must build subsea + terrestrial fiber from scratch.',
    gpu_economics: 'TBD; depends on anchor tenant + government capex allocation.',
    customer_concentration: 'Single government sponsor (PIF / KSA).',
    energy_positioning: 'Green H2 + solar baseload — structurally low-cost long-term, but supply chain unproven at scale.',
    deployment_philosophy: 'Greenfield mega-project; long-build, long-payback.',
    sovereign_alignment: 'GOVERNMENT — flagship of Vision 2030.',
    commercialization: 'Anchor-tenant-led; PIF will likely subsidize early commercialization.',
  },
  khazna: {
    monetization: 'Wholesale + government + hyperscaler anchor (Microsoft via G42 channel).',
    utilization: '~80% steady-state on hyperscale leases; government anchor backstops.',
    interconnection: 'UAE national fabric strong; subsea convergence at Khor Fakkan.',
    gpu_economics: 'Indirect — hosts customer-owned GPU clusters.',
    customer_concentration: 'High — G42 + Microsoft dominate.',
    energy_positioning: 'DEWA + EWEC grid; among the lowest $/MWh in GCC.',
    deployment_philosophy: 'Aggressive expansion 2024-2026; National Champion playbook.',
    sovereign_alignment: 'GOVERNMENT — anchored in G42 / Mubadala.',
    commercialization: 'Government + hyperscaler dual track.',
  },
  brookfield: {
    monetization: 'Asset-level cash yield + appreciation + carried interest. Hyperion JV (80% Brookfield, 20% Meta) defines a new mega-vehicle template.',
    utilization: 'N/A directly; tracks underlying asset occupancy. Hyperscale anchors target 100% from COD.',
    interconnection: 'Through portfolio companies (Data4, Compass).',
    gpu_economics: 'Indirect — underwrites the asset, not the GPUs.',
    customer_concentration: 'Vehicle-level diversification across operators + governments.',
    energy_positioning: 'Asset-level varies. Brookfield Renewables provides PPA optionality.',
    deployment_philosophy: 'Capital allocator; partners with operators + governments. QIA $20B AI = new government template.',
    sovereign_alignment: 'Commercial but heavily government-channelized (QIA, ADIA, GIC partnerships).',
    commercialization: 'Channel through operators + governments; deal-level structuring.',
  },
};
