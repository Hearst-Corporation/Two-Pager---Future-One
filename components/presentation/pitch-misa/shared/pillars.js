/* ============================================================
   FUTUR ONE × MISA — PILLAR DATA
   ------------------------------------------------------------
   Single source of truth for the 3 pillar decks
   (Data Center / Mining / Hub).

   Each pillar shares the same 10-slide skeleton; only the
   content here changes. Operators are positioned as
   "identified targets" — language is neutral, no signed-LOI
   claims. Numbers are qualitative ranges.
   ============================================================ */

export const PILLARS = {
  datacenter: {
    id: 'datacenter',
    code: 'I',
    label: 'DATA CENTER',
    accent: 'var(--color-accent-strong)',
    cover: {
      eyebrow: 'PILLAR I — HYPERSCALE INFRASTRUCTURE',
      title: 'THE\nDATA CENTER.',
      subtitle:
        'A Tier IV sovereign hyperscale platform for the Kingdom of Saudi Arabia.',
    },
    thesis: {
      eyebrow: 'WHY NOW',
      title: 'Compute is the new oil — and KSA owns the energy stack.',
      bullets: [
        'Vision 2030 targets 50% of Saudi GDP from non-oil sectors by 2030',
        'GCC AI compute demand projected 8–12 GW by 2032',
        'Sovereign data residency mandates from MCIT and SDAIA',
        'KSA energy cost advantage: $0.04–0.06 / kWh industrial',
      ],
    },
    operatorsHeader: {
      eyebrow: 'THE OPERATOR STACK',
      title: 'We do not build alone. We assemble Tier-1.',
      subtitle:
        'Three hyperscale operators identified for the Futur One platform — vetted on track record, AI-readiness, and sovereign-grade governance.',
    },
    operators: [
      {
        rank: 'LEAD',
        name: 'NTT GLOBAL DATA CENTERS',
        country: 'Japan · Global',
        role: 'HYPERSCALE PLATFORM',
        oneLiner:
          '1.5 GW operational across 20+ countries — the only Japanese-sovereign hyperscaler with full Middle East presence.',
        kpis: [
          { v: '1.5 GW', l: 'OPERATIONAL CAPACITY' },
          { v: '160+', l: 'DATA CENTERS' },
          { v: 'Tier IV', l: 'CERTIFIED DESIGN' },
          { v: '99.999%', l: 'TARGET UPTIME' },
        ],
        why: [
          'Proven sovereign-grade operations (Japan, India, UK, UAE)',
          'AI-ready liquid cooling roadmap, NVIDIA reference partner',
          'Long-term Capex partner profile — minority equity friendly',
        ],
      },
      {
        rank: '#2',
        name: 'EDGECONNEX',
        country: 'USA · EQT-backed',
        role: 'DESIGN-BUILD VELOCITY',
        oneLiner:
          'Hyperscale design-build specialist — sub-12-month campus delivery, 70+ markets globally.',
        kpis: [
          { v: '70+', l: 'MARKETS DELIVERED' },
          { v: '<12 mo', l: 'CAMPUS TO POWER-ON' },
          { v: 'PUE 1.2', l: 'LIQUID-COOLED' },
          { v: 'EQT', l: 'CAPITAL BACKING' },
        ],
        why: [
          'Fastest hyperscale execution profile in the industry',
          'Engineered for AI training workloads from day one',
          'Modular delivery — derisks Phase-1 commissioning',
        ],
      },
      {
        rank: '#3',
        name: 'COMPASS DATACENTERS',
        country: 'USA · Brookfield-backed',
        role: 'AI CAMPUS SPECIALIST',
        oneLiner:
          'Purpose-built AI campuses for Microsoft, Meta, Oracle — single-tenant gigawatt scale.',
        kpis: [
          { v: '5+ GW', l: 'PIPELINE' },
          { v: 'Single', l: 'TENANT MODEL' },
          { v: 'Brookfield', l: 'INFRA SPONSOR' },
          { v: '100%', l: 'AI-NATIVE DESIGN' },
        ],
        why: [
          'Single-tenant model aligns with sovereign anchor strategy',
          'Brookfield Infrastructure capital pedigree',
          'Largest AI campus pipeline in North America',
        ],
      },
    ],
    architecture: {
      eyebrow: 'INTEGRATION ARCHITECTURE',
      title: 'How the three combine on one campus.',
      lines: [
        { tag: 'NTT', body: 'Operating-company anchor — runs the platform, holds the SLA, owns the customer relationship.' },
        { tag: 'EDGECONNEX', body: 'Design-build delivery partner — Phase 1 (100 MW) commissioned in <14 months from break-ground.' },
        { tag: 'COMPASS', body: 'Phase 2+ expansion partner — gigawatt-scale single-tenant pads for hyperscale anchor tenants.' },
      ],
    },
    commercials: {
      eyebrow: 'COMMERCIAL ENVELOPE',
      title: 'Capex shape & investor profile.',
      rows: [
        { l: 'PHASE 1 CAPEX', v: '$1.2–1.6 B' },
        { l: 'PHASE 1 CAPACITY', v: '100 MW IT' },
        { l: 'TARGET PUE', v: '< 1.25' },
        { l: 'EBITDA YIELD (stabilized)', v: '14–17 %' },
        { l: 'EQUITY TICKET (MISA)', v: '$300–500 M' },
        { l: 'HORIZON', v: '15-yr build-operate' },
      ],
    },
    ask: {
      eyebrow: 'THE ASK',
      title: 'A sovereign anchor, not a passive LP.',
      ask: '$300–500 M cornerstone equity from MISA into Futur One DC HoldCo, alongside operator co-investment.',
      offer: 'Board seat, KSA jurisdiction, 30%+ Saudi workforce target, full data residency, off-take priority for Saudi public sector.',
    },
  },

  mining: {
    id: 'mining',
    code: 'II',
    label: 'MINING',
    accent: 'var(--color-accent-strong)',
    cover: {
      eyebrow: 'PILLAR II — DUAL-USE COMPUTE',
      title: 'THE\nMINING.',
      subtitle:
        'Industrial-scale dual-use compute: HPC by day, hash by night — monetizing every kilowatt.',
    },
    thesis: {
      eyebrow: 'WHY NOW',
      title: 'KSA energy + dual-use compute = the highest-yield hectare on earth.',
      bullets: [
        'KSA industrial power — among the lowest globally ($0.04–0.06 / kWh)',
        'Dual-use sites convert between Bitcoin hash and AI/HPC in <60 seconds',
        'Public mining operators now generating 30–45% of revenue from HPC/AI',
        'Sovereign hash provides strategic optionality on Bitcoin reserves',
      ],
    },
    operatorsHeader: {
      eyebrow: 'THE OPERATOR STACK',
      title: 'Listed, audited, sovereign-grade.',
      subtitle:
        'Three Nasdaq-listed mining operators identified — selected for scale, dual-use HPC pivot, and ESG-aligned governance compatible with KSA Vision 2030.',
    },
    operators: [
      {
        rank: 'LEAD',
        name: 'MARATHON DIGITAL — MARA',
        country: 'USA · Nasdaq: MARA',
        role: 'GLOBAL HASH LEADER',
        oneLiner:
          '50+ EH/s installed — the largest publicly listed Bitcoin miner globally, with active Abu Dhabi sovereign joint venture.',
        kpis: [
          { v: '50+ EH/s', l: 'GLOBAL HASHRATE' },
          { v: 'Nasdaq', l: 'LISTED · AUDITED' },
          { v: 'UAE JV', l: 'SOVEREIGN PRECEDENT' },
          { v: '$5B+', l: 'MARKET CAP' },
        ],
        why: [
          'Only operator with proven sovereign GCC partnership (Abu Dhabi)',
          'In-house immersion cooling and AI/HPC pilot infrastructure',
          'Listed governance gives MISA full transparency on operations',
        ],
      },
      {
        rank: '#2',
        name: 'TERAWULF — WULF',
        country: 'USA · Nasdaq: WULF',
        role: 'CLEAN-ENERGY HPC',
        oneLiner:
          '95% zero-carbon energy mix — nuclear and hydro — with active pivot to AI/HPC hosting.',
        kpis: [
          { v: '95%', l: 'ZERO-CARBON MIX' },
          { v: 'Nuclear', l: 'BASELOAD ANCHOR' },
          { v: 'AI/HPC', l: 'ACTIVE PIVOT' },
          { v: 'Nasdaq', l: 'LISTED · AUDITED' },
        ],
        why: [
          'ESG profile aligns with Vision 2030 sustainability targets',
          'Active conversion of mining sites to AI/HPC hosting',
          'Strong institutional shareholder base (Morgan Stanley, BlackRock)',
        ],
      },
      {
        rank: '#3',
        name: 'HUT 8 — HUT',
        country: 'Canada · Nasdaq: HUT',
        role: 'AI-NATIVE PIVOT',
        oneLiner:
          'Most successful mining-to-AI pivot to date — Coatue & Bitmain partnerships, full HPC stack operational.',
        kpis: [
          { v: 'Coatue', l: 'AI INVESTOR PARTNER' },
          { v: 'GPU-as-a-Service', l: 'LIVE REVENUE' },
          { v: '> 1 GW', l: 'TOTAL CAPACITY' },
          { v: 'Nasdaq', l: 'LISTED · AUDITED' },
        ],
        why: [
          'Proven dual-use revenue model already in production',
          'Tier-1 AI capital partners signal credibility',
          'Canadian governance pedigree — institutional comfort',
        ],
      },
    ],
    architecture: {
      eyebrow: 'INTEGRATION ARCHITECTURE',
      title: 'Dual-use orchestration on a single MW envelope.',
      lines: [
        { tag: 'MARA', body: 'Hash-fleet anchor — 200 MW immersion-cooled BTC capacity, automated curtailment, treasury optionality for KSA.' },
        { tag: 'TERAWULF', body: 'Clean-energy operator profile — runs the workload-orchestration layer between hash and HPC.' },
        { tag: 'HUT 8', body: 'AI/HPC commercial layer — GPU-as-a-Service contracts with regional and international anchors.' },
      ],
    },
    commercials: {
      eyebrow: 'COMMERCIAL ENVELOPE',
      title: 'Capex shape & investor profile.',
      rows: [
        { l: 'PHASE 1 CAPEX', v: '$400–600 M' },
        { l: 'PHASE 1 CAPACITY', v: '200 MW (dual-use)' },
        { l: 'PAYBACK (blended)', v: '3–4 yrs' },
        { l: 'BLENDED EBITDA MARGIN', v: '40–55 %' },
        { l: 'EQUITY TICKET (MISA)', v: '$120–180 M' },
        { l: 'HORIZON', v: '7-yr build-operate, refresh' },
      ],
    },
    ask: {
      eyebrow: 'THE ASK',
      title: 'A sovereign hash + HPC vehicle.',
      ask: '$120–180 M cornerstone equity from MISA into Futur One Mining HoldCo — anchor of a Saudi sovereign hash + HPC vehicle.',
      offer: 'Optional sovereign BTC accumulation, GPU off-take priority for Saudi national programs, ESG-grade reporting, listed-operator governance.',
    },
  },

  hub: {
    id: 'hub',
    code: 'III',
    label: 'HUB',
    accent: 'var(--color-accent-strong)',
    cover: {
      eyebrow: 'PILLAR III — INTERCONNECT & AI CLOUD',
      title: 'THE\nHUB.',
      subtitle:
        'The interconnect and AI-cloud layer — where every Saudi enterprise meets every global cloud, on Saudi soil.',
    },
    thesis: {
      eyebrow: 'WHY NOW',
      title: 'Compute is useless without connectivity. The Hub is the meeting point.',
      bullets: [
        'KSA cloud market projected $4–5 B by 2030 (PIF / SDAIA briefings)',
        'Sovereign data residency mandates concentrate enterprise demand on local hubs',
        'GPU-cloud capacity globally constrained — anchor relationships are leverage',
        'Interconnect operators capture rent on every cross-cloud, cross-border flow',
      ],
    },
    operatorsHeader: {
      eyebrow: 'THE OPERATOR STACK',
      title: 'The neutral meeting point of every cloud.',
      subtitle:
        'Three operators identified across interconnect, GPU-cloud and AI-factory hosting — the canonical stack for a sovereign Saudi hub.',
    },
    operators: [
      {
        rank: 'LEAD',
        name: 'EQUINIX',
        country: 'USA · Nasdaq: EQIX',
        role: 'INTERCONNECT BACKBONE',
        oneLiner:
          'The global standard of interconnect — 260+ IBX data centers, 10,000+ enterprises, every major cloud on-net.',
        kpis: [
          { v: '260+', l: 'IBX FACILITIES' },
          { v: '10,000+', l: 'ENTERPRISE TENANTS' },
          { v: '4 GW+', l: 'CONTRACTED POWER' },
          { v: 'Nasdaq', l: 'S&P 500 LISTED' },
        ],
        why: [
          'No serious sovereign hub exists without an Equinix-grade IBX',
          'AWS, Azure, Google, Oracle direct on-net by default',
          'Investment-grade balance sheet, REIT structure',
        ],
      },
      {
        rank: '#2',
        name: 'COREWEAVE',
        country: 'USA · NVIDIA-anchored',
        role: 'AI-CLOUD PARTNER',
        oneLiner:
          'NVIDIA Partner of the Year — the AI-cloud benchmark for hyperscale GPU provisioning.',
        kpis: [
          { v: '#1', l: 'NVIDIA PARTNER' },
          { v: 'H100/H200', l: 'AT SCALE' },
          { v: '$23B', l: 'IPO VALUATION' },
          { v: 'Microsoft', l: 'ANCHOR CUSTOMER' },
        ],
        why: [
          'Direct NVIDIA GPU allocation pipeline — the rarest commodity in AI',
          'Operates at the exact scale a sovereign hub requires',
          'Tier-1 anchor customers (Microsoft, OpenAI, Meta)',
        ],
      },
      {
        rank: '#3',
        name: 'ALIGNED DATA CENTERS',
        country: 'USA · Macquarie-backed',
        role: 'AI-FACTORY HOSTING',
        oneLiner:
          'Macquarie-backed AI-factory hosting — adaptive data center platform engineered for liquid-cooled GPU densities.',
        kpis: [
          { v: 'Macquarie', l: 'INFRASTRUCTURE SPONSOR' },
          { v: 'Liquid', l: 'COOLING NATIVE' },
          { v: '5+ GW', l: 'PIPELINE' },
          { v: 'AI-Factory', l: 'CERTIFIED' },
        ],
        why: [
          'Adaptive Data Center technology — densities up to 100 kW/rack',
          'Macquarie Asset Management capital pedigree',
          'AI-factory certified for the next NVIDIA generation',
        ],
      },
    ],
    architecture: {
      eyebrow: 'INTEGRATION ARCHITECTURE',
      title: 'The three layers of the hub.',
      lines: [
        { tag: 'EQUINIX', body: 'Interconnect floor — every cloud, every carrier, every enterprise meets here. The neutral meeting point.' },
        { tag: 'COREWEAVE', body: 'GPU-cloud floor — sovereign GPU capacity for Saudi enterprises and government workloads.' },
        { tag: 'ALIGNED', body: 'AI-factory floor — high-density liquid-cooled space for anchor AI tenants and national champions.' },
      ],
    },
    commercials: {
      eyebrow: 'COMMERCIAL ENVELOPE',
      title: 'Capex shape & investor profile.',
      rows: [
        { l: 'PHASE 1 CAPEX', v: '$700 M – $1 B' },
        { l: 'PHASE 1 CAPACITY', v: '50 MW interconnect-grade' },
        { l: 'BLENDED EBITDA MARGIN', v: '45–55 %' },
        { l: 'GPU-AS-A-SERVICE', v: '$1.5–2.5 / GPU-hr' },
        { l: 'EQUITY TICKET (MISA)', v: '$200–300 M' },
        { l: 'HORIZON', v: '12-yr build-operate' },
      ],
    },
    ask: {
      eyebrow: 'THE ASK',
      title: 'The sovereign meeting point of every cloud.',
      ask: '$200–300 M cornerstone equity from MISA into Futur One Hub HoldCo — alongside operator co-investment in the IBX-grade facility.',
      offer: 'KSA-jurisdiction interconnect, sovereign GPU off-take priority, every hyperscaler on-net, neutral governance, board seat for MISA.',
    },
  },
};
