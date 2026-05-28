// lib/oracle-intelligence/tensions.js
//
// Sprint 2 — Decision Tensions.
// Pas de recommandation sans tradeoff. Le système doit raisonner en tensions
// explicites, pas en "best practice".
//
// Chaque tension articule les 2 faces, les signaux qui penchent vers l'une
// ou l'autre, et les exemples concrets de qui a tranché dans quel sens.

export const DECISION_TENSIONS = [
  {
    id: 'speed_vs_resiliency',
    label: 'Speed-to-power vs operational resiliency',
    pole_a: { name: 'Speed-to-power', description: 'Minimum viable Tier II/III, MEP fit-out paced, 18-24mo COD' },
    pole_b: { name: 'Operational resiliency', description: 'Tier IV redundancy, N+N power, validated 99.995% uptime SLA, 30-36mo COD' },
    signals_pushing_a: [
      'Hyperscaler anchor with own ops + redundancy at workload layer',
      'GPU cloud customer (CoreWeave-style) — fungible across sites',
      'Sovereign demand outpacing supply — political pressure to deploy',
    ],
    signals_pushing_b: [
      'Financial services / sovereign workload requiring SLA',
      'Single-site concentration of customer compute',
      'Regulatory mandate (financial / health / classified)',
    ],
    real_world_examples: [
      'Crusoe : speed-first via stranded energy + Oracle anchor',
      'Equinix IBX : resiliency-first, decade-long brownfield additions',
    ],
  },
  {
    id: 'sovereign_vs_partnership',
    label: 'Sovereign control vs hyperscaler partnership dependence',
    pole_a: { name: 'Sovereign control', description: 'National-owned compute, domestic procurement, locally-controlled keys' },
    pole_b: { name: 'Hyperscaler partnership', description: 'Microsoft/AWS/Google anchor, accelerated time-to-value, hyperscaler talent + ecosystem' },
    signals_pushing_a: [
      'National security / classified workload',
      'Long-term compute autonomy thesis',
      'Capital availability without commercial monetization pressure',
    ],
    signals_pushing_b: [
      'Time-to-revenue priority',
      'Commercial workload demand',
      'Access to hyperscaler talent + tooling stack',
    ],
    real_world_examples: [
      'G42 + Microsoft $1.5B (2024) : pole B with sovereign envelope',
      'Falcon (TII / G42) : pole A on the AI model side',
      'Humain (KSA) : tilting pole A initially, likely pole B for execution',
    ],
  },
  {
    id: 'liquid_density_vs_complexity',
    label: 'Liquid cooling density vs operational complexity',
    pole_a: { name: 'High-density liquid (DLC / immersion)', description: '80-130 kW/rack, GB200-ready, lower PUE, capex premium ~$750k/MW' },
    pole_b: { name: 'Air-cooled simplicity', description: '15-30 kW/rack, mature ops, easier multi-tenant, slower density gains' },
    signals_pushing_a: [
      'AI training cluster with GB200 / Blackwell roadmap',
      'Water-stressed but liquid feasible via closed-loop dry',
      'Long-term commitment to high-density workload',
    ],
    signals_pushing_b: [
      'Mixed-workload colo (enterprise + AI)',
      'Limited operator experience with liquid',
      'No anchor tenant requiring >50 kW/rack',
    ],
    real_world_examples: [
      'NVIDIA GB200 NVL72 forces pole A (132 kW/rack)',
      'Equinix legacy IBX = pole B with selective retrofits',
    ],
  },
  {
    id: 'commercialization_speed_vs_occupancy_risk',
    label: 'Commercialization speed vs occupancy risk',
    pole_a: { name: 'Aggressive commercialization', description: 'Sign anchors pre-COD, multi-tenant pre-leasing, fast ramp' },
    pole_b: { name: 'Conservative absorption', description: 'Phased capacity, lease as customers materialize, lower oversupply risk' },
    signals_pushing_a: [
      'Strong anchor LOI in hand',
      'Regional demand >> supply',
      'Capital structure requires fast cash yield',
    ],
    signals_pushing_b: [
      'Regional pipeline showing oversupply risk (GCC 2027)',
      'Customer credit quality uncertain',
      'Pricing pressure / discount-driven leases',
    ],
    real_world_examples: [
      'Meta Hyperion JV : aggressive — pre-leased 100% to single anchor',
      'CoreWeave 2024 build-out : aggressive on Microsoft anchor',
      'Khazna : balanced — sovereign backstop reduces downside',
    ],
  },
  {
    id: 'compute_ownership_vs_capital_efficiency',
    label: 'Domestic compute ownership vs capital efficiency',
    pole_a: { name: 'Own the compute stack', description: 'GPU + DC + ops fully domestic; high upfront capex, full strategic control' },
    pole_b: { name: 'Lease from hyperscalers', description: 'Spin up via AWS/Azure/GCP, capex-light, faster revenue, dependency on foreign infra' },
    signals_pushing_a: [
      'Long-horizon strategic value (compute autonomy)',
      'Export-control exposure on foreign infra',
      'Domestic talent + ecosystem aspirations',
    ],
    signals_pushing_b: [
      'Capital efficiency priority',
      'Time-to-market for AI products',
      'No sovereign mandate',
    ],
    real_world_examples: [
      'G42 Stargate UAE = pole A',
      'Most regional commercial operators tilt B (lease + reseller channel)',
    ],
  },
  {
    id: 'gpu_capex_vs_obsolescence',
    label: 'GPU capex commitment vs obsolescence cycle',
    pole_a: { name: 'Commit GPU capex upfront', description: 'Buy/finance H100/H200/GB200 fleet, lock capacity, capture demand wave' },
    pole_b: { name: 'Defer + flex via partners', description: 'Lease GPU capacity, layered into hyperscaler or neocloud commitments, defer to next-gen Blackwell-Ultra' },
    signals_pushing_a: [
      'Anchor customer contract underwrites GPU payback',
      'Allocation-gated supply favors first-movers',
      'Sovereign mandate for domestic compute',
    ],
    signals_pushing_b: [
      'No anchor; speculative build risk',
      'Next-gen step-up imminent (Blackwell-Ultra 2026)',
      'GPU $/hr already compressing → payback elongating',
    ],
    real_world_examples: [
      'CoreWeave : pole A — committed allocation against Microsoft contract',
      'Enterprise AI early-stage : pole B — lease + flex',
    ],
  },
  {
    id: 'integration_vs_optionality',
    label: 'Vertical integration vs deployment optionality',
    pole_a: { name: 'Vertical integration', description: 'Operator + utility + sovereign + tenant in same vehicle (Khazna model)' },
    pole_b: { name: 'Multi-operator optionality', description: 'Open ecosystem across Equinix, NTT, Vantage, etc. — flexibility, no lock-in' },
    signals_pushing_a: [
      'Sovereign mandate for national champion',
      'Single-vehicle scale advantages',
      'Capital allocator with multi-year commitment',
    ],
    signals_pushing_b: [
      'Regional diversification thesis',
      'Customer demands multi-vendor',
      'Hedge against single-operator execution risk',
    ],
    real_world_examples: [
      'G42 / Khazna : pole A',
      'QIA + Brookfield + multi-operator portfolio : pole B',
    ],
  },
];

export const TENSION_BY_ID = Object.fromEntries(DECISION_TENSIONS.map(t => [t.id, t]));
