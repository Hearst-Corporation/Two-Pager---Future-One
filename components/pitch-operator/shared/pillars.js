/* ============================================================
   FUTUR ONE — OPERATOR DECK DATA
   ------------------------------------------------------------
   Audience : a Tier-1 operator we want to recruit.
   Posture  : present THE PROJECT, not the market.
              Never name competitors. The slot is open and ours
              to give. MISA = capital de-risk argument.

   3 pillars share the same 10-slide skeleton; only content
   changes per pillar (DC / Mining / Hub).
   ============================================================ */

export const OPERATOR_PILLARS = {
  datacenter: {
    id: 'datacenter',
    code: 'I',
    label: 'DATA CENTER',
    pillarShort: 'Data Center',
    coverImage: '/cover-facade.png',
    cover: {
      eyebrow: 'A CONFIDENTIAL OPERATOR PROPOSAL',
      title: 'OPERATE\nFUTUR ONE.',
      subtitle:
        'Tier IV sovereign hyperscale platform — Kingdom of Saudi Arabia.\nOne operator slot. Capital secured. Site secured. Ready to go.',
    },

    /* SLIDE 01 — VISION */
    vision: {
      eyebrow: 'THE VISION',
      title: 'AI is the new oil. KSA owns the energy stack.',
      bullets: [
        'Vision 2030 — 50% non-oil GDP target, AI as a sovereign priority',
        'Industrial power $0.04–0.06 / kWh, dispatchable, sovereign-controlled',
        'GCC AI compute demand projected 8–12 GW by 2032',
        'Sovereign data residency mandates from MCIT and SDAIA',
      ],
    },

    /* SLIDE 02 — THE PROJECT */
    project: {
      eyebrow: 'THE PROJECT',
      title: 'Futur One — a sovereign AI campus, not a colocation site.',
      body:
        'A purpose-built Tier IV hyperscale campus in the Kingdom of Saudi Arabia. Multi-phase, gigawatt-scale, AI-native from the first rack.',
      stats: [
        { v: '1 GW+', l: 'TARGET CAMPUS CAPACITY' },
        { v: 'TIER IV', l: 'CERTIFIED DESIGN' },
        { v: '< 1.25', l: 'TARGET PUE' },
        { v: '15 yrs', l: 'BUILD-OPERATE HORIZON' },
      ],
    },

    /* SLIDE 03 — THE SITE */
    site: {
      eyebrow: 'THE SITE',
      title: 'Power, fiber, and sovereign jurisdiction — already in place.',
      rows: [
        { tag: 'POWER', body: 'Dispatchable industrial-grade allocation, dual-feed, sovereign-controlled tariff.' },
        { tag: 'CONNECTIVITY', body: 'On-net to GCC subsea routes; latency to Frankfurt < 90 ms, to Singapore < 130 ms.' },
        { tag: 'JURISDICTION', body: 'Saudi sovereign land, KSA legal framework, MCIT licensing pathway pre-validated.' },
        { tag: 'CLIMATE STACK', body: 'Liquid-cooling-ready from day 1; designed for densities up to 100 kW/rack.' },
      ],
    },

    /* SLIDE 04 — THE SLOT IS REAL  (#1 priority improvement) */
    slotIsReal: {
      eyebrow: 'THIS IS NOT A PITCH — IT IS A LAUNCH',
      title: 'The train is leaving. We are choosing one operator.',
      proofs: [
        {
          tag: 'SITE',
          headline: 'Identified & secured',
          body: 'Land allocation under sovereign control. Site assessments completed.',
        },
        {
          tag: 'POWER',
          headline: 'Allocation in place',
          body: 'Dispatchable industrial-grade power agreement under sovereign tariff structure.',
        },
        {
          tag: 'CAPITAL',
          headline: 'MISA backing',
          body: 'Saudi Ministry of Investment cornerstone equity in advanced structuring.',
        },
        {
          tag: 'DEMAND',
          headline: 'Anchor identified',
          body: 'Sovereign anchor tenant identified — under NDA. 30%+ of Phase 1 capacity pre-committed.',
        },
      ],
    },

    /* SLIDE 05 — YOUR ROLE  (formerly "operator slot") */
    yourRole: {
      eyebrow: 'YOUR ROLE',
      title: 'We bring the platform. You operate it.',
      body:
        'We are not building a data center. We are assembling the conditions for one — and choosing the operator who will run it under their own brand, governance, and SLA.',
      youDo: [
        'Design, commission, and operate the platform under your brand',
        'Hold the customer relationship and the SLA',
        'Set the operational standard — Tier IV, AI-native, your reference architecture',
        'Earn the operator economics (operating fee + earn-in equity)',
      ],
    },

    /* SLIDE 06 — WHAT WE WILL NOT DO  (#2 priority improvement) */
    wontDo: {
      eyebrow: 'WHAT WE WILL NOT DO',
      title: 'We do not compete with the operator. Ever.',
      body: 'Operator concerns we have heard before — and our explicit answer.',
      lines: [
        { tag: 'WE WILL NOT', body: 'design, build, or operate the data-center platform. That is your domain.' },
        { tag: 'WE WILL NOT', body: 'compete with you for tenants on this campus. The customer relationship is yours.' },
        { tag: 'WE WILL NOT', body: 'put a second operator on the same site. The slot is exclusive.' },
        { tag: 'WE WILL NOT', body: 'dictate technology choices. Cooling, racks, network — your reference architecture.' },
        { tag: 'WE WILL NOT', body: 'interfere with operations. Joint governance on strategy, full operator autonomy on execution.' },
      ],
    },

    /* SLIDE 07 — CAPITAL */
    capital: {
      eyebrow: 'THE CAPITAL',
      title: 'The capex is secured. You do not raise it.',
      body:
        'Phase 1 fully covered by a sovereign-backed equity stack. Operator co-investment is welcome but not required to reach FID.',
      rows: [
        { l: 'PHASE 1 CAPEX', v: '$1.2–1.6 B' },
        { l: 'EQUITY ANCHOR', v: 'MISA cornerstone' },
        { l: 'OPERATOR EARN-IN', v: '5–15 %' },
        { l: 'OPERATOR FEE (typical)', v: '5–8 % EBITDA' },
        { l: 'CAPEX RISK ON OPERATOR', v: 'None on Phase 1' },
        { l: 'FID TARGET', v: 'Q4 — within 6 months' },
      ],
    },

    /* SLIDE 08 — RISK ALLOCATION  (#5 from list — fits naturally) */
    risk: {
      eyebrow: 'RISK ALLOCATION',
      title: 'Who carries what.',
      head: ['RISK', 'OPERATOR', 'FUTUR ONE', 'KSA / MISA'],
      rows: [
        ['Construction overrun',          '—',       '✓',        '—'],
        ['Power tariff & supply',         '—',       '—',        '✓'],
        ['Permitting & licensing',        '—',       '✓',        '✓'],
        ['Tenant default',                'shared',  'shared',   '—'],
        ['Operational SLA',               '✓',       '—',        '—'],
        ['Tech obsolescence',             '✓',       '—',        '—'],
        ['Regulatory & geopolitical',     '—',       '✓',        '✓'],
      ],
    },

    /* SLIDE 09 — THE 60-DAY PATH  (#3 priority improvement) */
    path: {
      eyebrow: 'THE 60-DAY PATH',
      title: 'From this deck to a signed MOU. Concrete. Chronometred.',
      milestones: [
        { day: 'DAY 0',  label: 'NDA',          body: 'Mutual NDA executed. Data room opens.' },
        { day: 'DAY 7',  label: 'SITE VISIT',   body: 'On-site walkthrough in KSA with site, power, and authority briefings.' },
        { day: 'DAY 21', label: 'LOI DRAFT',    body: 'Joint LOI drafting — scope, exclusivity, economics framework.' },
        { day: 'DAY 45', label: 'TERM SHEET',   body: 'Term sheet aligned and approved by both investment committees.' },
        { day: 'DAY 60', label: 'MOU SIGNED',   body: 'Binding MOU signed. Joint announcement window opens.' },
      ],
      ask: 'We are inviting one operator into a 60-day exclusive window. We are not running a process.',
    },
  },

  /* ============================================================ */
  /* MINING PILLAR                                                  */
  /* ============================================================ */
  mining: {
    id: 'mining',
    code: 'II',
    label: 'MINING',
    pillarShort: 'Mining & HPC',
    coverImage: '/supercomputer-wide.png',
    cover: {
      eyebrow: 'A CONFIDENTIAL OPERATOR PROPOSAL',
      title: 'OPERATE\nFUTUR ONE.',
      subtitle:
        'Industrial dual-use compute platform — KSA. Hash by night, HPC by day.\nOne operator slot. Power secured. Capital secured.',
    },

    vision: {
      eyebrow: 'THE VISION',
      title: 'The lowest-cost kilowatt on earth — turned into yield.',
      bullets: [
        'KSA industrial power among the lowest globally ($0.04–0.06 / kWh)',
        'Dual-use sites convert between hash and AI/HPC in under 60 seconds',
        'Sovereign optionality on Bitcoin reserves at strategic scale',
        'ESG-aligned with Vision 2030 — clean baseload integration available',
      ],
    },

    project: {
      eyebrow: 'THE PROJECT',
      title: 'Futur One Mining — a sovereign hash + HPC vehicle.',
      body:
        'A purpose-built dual-use industrial compute platform. Designed for hash by default, switchable to AI/HPC hosting on demand. Sovereign-grade governance, listed-grade reporting.',
      stats: [
        { v: '200 MW', l: 'PHASE 1 CAPACITY' },
        { v: 'DUAL-USE', l: 'HASH + HPC' },
        { v: '< 60 s', l: 'WORKLOAD SWITCH' },
        { v: '7 yrs', l: 'BUILD-OPERATE HORIZON' },
      ],
    },

    site: {
      eyebrow: 'THE SITE',
      title: 'Power, climate, and sovereign cover — operator-grade.',
      rows: [
        { tag: 'POWER', body: 'Sovereign-tariff industrial allocation. Dispatchable. No grid-imbalance risk.' },
        { tag: 'CLIMATE', body: 'Immersion-cooling-ready from day 1. Heat reuse pathways pre-engineered.' },
        { tag: 'JURISDICTION', body: 'KSA sovereign land. Mining and HPC operations under explicit national framework.' },
        { tag: 'CONNECTIVITY', body: 'Sufficient backhaul for HPC mode — GCC subsea on-net.' },
      ],
    },

    slotIsReal: {
      eyebrow: 'THIS IS NOT A PITCH — IT IS A LAUNCH',
      title: 'The train is leaving. We are choosing one operator.',
      proofs: [
        { tag: 'SITE', headline: 'Identified & secured', body: 'Sovereign-controlled land allocation. Environmental assessments cleared.' },
        { tag: 'POWER', headline: 'Allocation in place', body: 'Industrial-grade tariff agreement. Dispatchable, no curtailment risk.' },
        { tag: 'CAPITAL', headline: 'MISA backing', body: 'Saudi Ministry of Investment cornerstone equity in advanced structuring.' },
        { tag: 'OFF-TAKE', headline: 'Government-aligned', body: 'Sovereign appetite for both BTC accumulation and HPC off-take confirmed.' },
      ],
    },

    yourRole: {
      eyebrow: 'YOUR ROLE',
      title: 'We bring the platform. You run the fleet.',
      body:
        'We are not building a mining farm. We are assembling the conditions for one — and choosing the operator who will run hash and HPC under their own brand and operational standard.',
      youDo: [
        'Run the hash fleet and HPC orchestration under your brand',
        'Set the hardware standard — ASIC, immersion, GPU profiles',
        'Earn operator fee + earn-in equity + workload upside',
        'Sovereign-grade reporting via your existing listed-operator stack',
      ],
    },

    wontDo: {
      eyebrow: 'WHAT WE WILL NOT DO',
      title: 'We do not compete with the operator. Ever.',
      body: 'Operator concerns we have heard before — and our explicit answer.',
      lines: [
        { tag: 'WE WILL NOT', body: 'run the fleet. Hash, HPC, orchestration — your domain entirely.' },
        { tag: 'WE WILL NOT', body: 'dictate hardware vendor choices. ASIC, GPU, immersion — your reference standard.' },
        { tag: 'WE WILL NOT', body: 'put a second operator on the same MW envelope. The slot is exclusive.' },
        { tag: 'WE WILL NOT', body: 'force a workload mix. Hash / HPC ratio is set by your team, governed jointly.' },
        { tag: 'WE WILL NOT', body: 'interfere with daily ops. Strategic governance only — full operator autonomy on execution.' },
      ],
    },

    capital: {
      eyebrow: 'THE CAPITAL',
      title: 'The capex is secured. You do not raise it.',
      body:
        'Phase 1 fully covered by sovereign-backed equity. Operator co-investment is welcome but not required to reach FID.',
      rows: [
        { l: 'PHASE 1 CAPEX', v: '$400–600 M' },
        { l: 'EQUITY ANCHOR', v: 'MISA cornerstone' },
        { l: 'OPERATOR EARN-IN', v: '10–20 %' },
        { l: 'OPERATOR FEE (typical)', v: '6–10 % EBITDA' },
        { l: 'CAPEX RISK ON OPERATOR', v: 'None on Phase 1' },
        { l: 'FID TARGET', v: 'Q4 — within 6 months' },
      ],
    },

    risk: {
      eyebrow: 'RISK ALLOCATION',
      title: 'Who carries what.',
      head: ['RISK', 'OPERATOR', 'FUTUR ONE', 'KSA / MISA'],
      rows: [
        ['Construction overrun',          '—',       '✓',        '—'],
        ['Power tariff & supply',         '—',       '—',        '✓'],
        ['Permitting & licensing',        '—',       '✓',        '✓'],
        ['BTC price exposure',            'shared',  'shared',   '—'],
        ['HPC tenant default',            'shared',  'shared',   '—'],
        ['Hardware obsolescence',         '✓',       '—',        '—'],
        ['Regulatory & geopolitical',     '—',       '✓',        '✓'],
      ],
    },

    path: {
      eyebrow: 'THE 60-DAY PATH',
      title: 'From this deck to a signed MOU. Concrete. Chronometred.',
      milestones: [
        { day: 'DAY 0',  label: 'NDA',          body: 'Mutual NDA executed. Data room opens, including power and tariff term sheets.' },
        { day: 'DAY 7',  label: 'SITE VISIT',   body: 'On-site walkthrough in KSA — power, climate, and regulatory briefings.' },
        { day: 'DAY 21', label: 'LOI DRAFT',    body: 'Joint LOI drafting — scope, exclusivity, hash/HPC governance framework.' },
        { day: 'DAY 45', label: 'TERM SHEET',   body: 'Term sheet aligned and approved by both investment committees.' },
        { day: 'DAY 60', label: 'MOU SIGNED',   body: 'Binding MOU signed. Joint announcement window opens.' },
      ],
      ask: 'We are inviting one operator into a 60-day exclusive window. We are not running a process.',
    },
  },

  /* ============================================================ */
  /* HUB PILLAR                                                     */
  /* ============================================================ */
  hub: {
    id: 'hub',
    code: 'III',
    label: 'HUB',
    pillarShort: 'Hub · Interconnect & AI Cloud',
    coverImage: '/aerial-campus-2.png',
    cover: {
      eyebrow: 'A CONFIDENTIAL OPERATOR PROPOSAL',
      title: 'ANCHOR\nFUTUR ONE.',
      subtitle:
        'Sovereign interconnect & AI-cloud hub — KSA.\nOne anchor operator. Every cloud on-net. Capital secured.',
    },

    vision: {
      eyebrow: 'THE VISION',
      title: 'Compute is useless without connectivity. KSA needs the meeting point.',
      bullets: [
        'KSA cloud market projected $4–5 B by 2030 (PIF / SDAIA briefings)',
        'Sovereign data residency concentrates enterprise demand on local hubs',
        'Every Saudi enterprise needs every global cloud — on Saudi soil',
        'GPU capacity globally constrained — sovereign anchor relationships are leverage',
      ],
    },

    project: {
      eyebrow: 'THE PROJECT',
      title: 'Futur One Hub — a sovereign IBX-grade meeting point.',
      body:
        'A purpose-built interconnect and AI-cloud facility. Carrier-neutral, every hyperscaler on-net by default, AI-factory floor for high-density tenants. Tier IV-grade, KSA-jurisdiction.',
      stats: [
        { v: '50 MW', l: 'PHASE 1 INTERCONNECT' },
        { v: 'CARRIER', l: 'NEUTRAL BY DESIGN' },
        { v: 'TIER IV', l: 'GRADE FACILITY' },
        { v: '12 yrs', l: 'BUILD-OPERATE HORIZON' },
      ],
    },

    site: {
      eyebrow: 'THE SITE',
      title: 'Topology, fiber, sovereign cover — anchor-grade.',
      rows: [
        { tag: 'TOPOLOGY', body: 'Carrier-neutral by design. Direct on-net commitments from every regional carrier under structuring.' },
        { tag: 'FIBER', body: 'GCC subsea routes pre-routed; primary + diverse path to Frankfurt and Singapore.' },
        { tag: 'JURISDICTION', body: 'KSA sovereign land. CST and SDAIA pre-engaged. Data residency hard-wired.' },
        { tag: 'AI-FACTORY', body: 'High-density liquid-cooled floor for sovereign GPU tenants — densities up to 100 kW/rack.' },
      ],
    },

    slotIsReal: {
      eyebrow: 'THIS IS NOT A PITCH — IT IS A LAUNCH',
      title: 'The train is leaving. We are choosing one anchor.',
      proofs: [
        { tag: 'SITE', headline: 'Identified & secured', body: 'Sovereign-controlled land in the KSA tier-1 metro. Authority pre-engagement complete.' },
        { tag: 'CARRIERS', headline: 'On-net commitments', body: 'Every regional carrier engaged. Hyperscaler on-ramps under negotiation.' },
        { tag: 'CAPITAL', headline: 'MISA backing', body: 'Saudi Ministry of Investment cornerstone equity in advanced structuring.' },
        { tag: 'DEMAND', headline: 'Anchors identified', body: 'Saudi sovereign and enterprise tenants pre-engaged — 40%+ Phase-1 capacity pre-committed.' },
      ],
    },

    yourRole: {
      eyebrow: 'YOUR ROLE',
      title: 'We bring the platform. You anchor the meeting point.',
      body:
        'We are not building a colocation business. We are assembling the conditions for the sovereign meeting point of every cloud — and choosing the anchor operator who will hold the IBX standard.',
      youDo: [
        'Run the IBX under your brand and global standard',
        'Hold every customer relationship and every interconnect SLA',
        'Set the architecture — meet-me-rooms, on-ramps, cross-connect',
        'Earn the anchor economics (operating fee + earn-in equity + interconnect rent)',
      ],
    },

    wontDo: {
      eyebrow: 'WHAT WE WILL NOT DO',
      title: 'We do not compete with the anchor. Ever.',
      body: 'Anchor concerns we have heard before — and our explicit answer.',
      lines: [
        { tag: 'WE WILL NOT', body: 'design, build, or operate the IBX. That is your domain entirely.' },
        { tag: 'WE WILL NOT', body: 'open a second IBX in the same metro. The anchor slot is exclusive.' },
        { tag: 'WE WILL NOT', body: 'compete for tenants on your floor. The customer relationship is yours.' },
        { tag: 'WE WILL NOT', body: 'dictate carrier or hyperscaler choices. Your global standard, our local cover.' },
        { tag: 'WE WILL NOT', body: 'interfere with operations. Strategic governance only — full anchor autonomy on execution.' },
      ],
    },

    capital: {
      eyebrow: 'THE CAPITAL',
      title: 'The capex is secured. You do not raise it.',
      body:
        'Phase 1 fully covered by sovereign-backed equity. Anchor co-investment is welcome but not required to reach FID.',
      rows: [
        { l: 'PHASE 1 CAPEX', v: '$700 M – $1 B' },
        { l: 'EQUITY ANCHOR', v: 'MISA cornerstone' },
        { l: 'OPERATOR EARN-IN', v: '5–15 %' },
        { l: 'OPERATOR FEE (typical)', v: '6–9 % EBITDA' },
        { l: 'CAPEX RISK ON OPERATOR', v: 'None on Phase 1' },
        { l: 'FID TARGET', v: 'Q4 — within 6 months' },
      ],
    },

    risk: {
      eyebrow: 'RISK ALLOCATION',
      title: 'Who carries what.',
      head: ['RISK', 'OPERATOR', 'FUTUR ONE', 'KSA / MISA'],
      rows: [
        ['Construction overrun',          '—',       '✓',        '—'],
        ['Power & cooling',               '—',       '—',        '✓'],
        ['Permitting & licensing',        '—',       '✓',        '✓'],
        ['Tenant default',                'shared',  'shared',   '—'],
        ['Carrier on-net delivery',       'shared',  'shared',   '—'],
        ['Tech obsolescence',             '✓',       '—',        '—'],
        ['Regulatory & geopolitical',     '—',       '✓',        '✓'],
      ],
    },

    path: {
      eyebrow: 'THE 60-DAY PATH',
      title: 'From this deck to a signed MOU. Concrete. Chronometred.',
      milestones: [
        { day: 'DAY 0',  label: 'NDA',          body: 'Mutual NDA executed. Data room opens, including carrier engagement and authority briefings.' },
        { day: 'DAY 7',  label: 'SITE VISIT',   body: 'On-site walkthrough in KSA — site, fiber routes, regulatory briefing.' },
        { day: 'DAY 21', label: 'LOI DRAFT',    body: 'Joint LOI drafting — scope, exclusivity, anchor economics framework.' },
        { day: 'DAY 45', label: 'TERM SHEET',   body: 'Term sheet aligned and approved by both investment committees.' },
        { day: 'DAY 60', label: 'MOU SIGNED',   body: 'Binding MOU signed. Joint announcement window opens.' },
      ],
      ask: 'We are inviting one anchor into a 60-day exclusive window. We are not running a process.',
    },
  },
};
