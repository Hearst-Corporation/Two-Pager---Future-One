/**
 * oracle-explainability.js
 * ORACLE Sprint 3 — Beginner Explainability
 *
 * Translates financial, infrastructure, and AI-datacenter terminology
 * into plain language for 4 distinct audiences.
 */

export const SUPPORTED_AUDIENCES = ['beginner', 'investor', 'minister', 'operator'];

// ---------------------------------------------------------------------------
// METRICS CATALOG
// Each entry: { short, body, why_it_matters } × 4 audiences
// ---------------------------------------------------------------------------

const METRICS = {

  IRR: {
    beginner: {
      short: 'How much your investment grows per year, after counting time',
      body: 'Imagine planting a money tree. IRR tells you the average yearly growth rate of that tree over its whole life. A 15% IRR means your investment effectively doubles roughly every 5 years. The higher the number, the faster your money works for you.',
      why_it_matters: 'Lets you compare any investment to a simple bank account. If the bank offers 4% and this project offers 18%, you instantly understand where your money works harder.',
    },
    investor: {
      short: 'Internal rate of return — annualized yield that makes the project NPV equal zero',
      body: 'IRR is the discount rate r that satisfies Σ CFt / (1+r)^t = 0. For AI-datacenter development, levered IRR of 15–22% is market consensus. Unlevered IRR typically runs 10–14% for institutional-quality assets. Model sensitivity at ±200 bps to capture rate uncertainty.',
      why_it_matters: 'Primary hurdle metric; benchmarks project yield against fund hurdle rate (typically 10–12% for infra) and competing opportunities in the portfolio.',
    },
    minister: {
      short: 'Annualized return on public capital deployed; benchmark against alternative national investments',
      body: 'IRR expresses, as a single percentage, the efficiency of public and private capital over the project lifecycle. A sovereign co-investment at 14% IRR outperforms most infrastructure bonds and many national public-works projects. It enables apples-to-apples comparison across the national development plan.',
      why_it_matters: 'Enables direct comparison against alternative national investments — roads, ports, energy grids — to prioritize capital allocation and justify project selection to parliament.',
    },
    operator: {
      short: 'Levered IRR post fees; benchmark vs fund hurdle (typically 10–12% infra)',
      body: 'Compute as the discount rate r in: Σ CFt / (1+r)^t = 0. Use post-debt, post-fee cash flows. Typical AI-datacenter development IRR: 18–25% levered, 12–15% unlevered. Track IRR sensitivity to occupancy ramp and CAPEX/MW — these are the two most volatile inputs.',
      why_it_matters: 'Drives go/no-go on capex phasing. If construction cost overrun exceeds 8%, IRR drops below hurdle — model sensitivity before each phase gate and report at every investment committee.',
    },
  },

  MOIC: {
    beginner: {
      short: 'How many times you get back what you put in',
      body: 'If you invest $1 and get back $3, your MOIC is 3×. Simple. No time calculation, no percentages — just a plain multiple. A 2.5× MOIC means you more than doubled your money over the life of the investment.',
      why_it_matters: 'Easiest way to feel whether a deal made money. Unlike IRR, it ignores how long it took — so use it alongside IRR for the full picture.',
    },
    investor: {
      short: 'Multiple on invested capital — total return multiple, gross and net',
      body: 'MOIC = total distributions / invested equity. Gross MOIC is pre-fee; net MOIC is post carry and management fees — report both. Infrastructure deals typically target 1.8–2.5× gross over a 7–10 year hold. AI-datacenter development can reach 3.0–4.0× gross given current market multiples.',
      why_it_matters: 'Captures absolute value creation irrespective of timing. High IRR with low MOIC signals fast payback on small capital; high MOIC with moderate IRR signals long-duration compounding — different risk profiles for different LP mandates.',
    },
    minister: {
      short: 'Total value returned per unit of national capital invested',
      body: 'For a sovereign co-investment of QAR 500M, a 2.5× MOIC returns QAR 1.25B over the project life — gross. This metric communicates economic return to non-financial stakeholders clearly and without ambiguity.',
      why_it_matters: 'Useful in parliamentary or ministerial briefings where annualized percentages are abstract; a concrete QAR multiple is immediately legible to a broad audience.',
    },
    operator: {
      short: 'Gross vs net MOIC; track both to isolate fee drag across the fund lifecycle',
      body: 'Gross MOIC ignores carry and fees — use it to assess project-level economics in isolation. Net MOIC = LP return after all fees; target ≥ 2.0× net for institutional-quality infra. The delta between gross and net flags fee structure efficiency and carry waterfall design.',
      why_it_matters: 'If gross MOIC is 3.0× but net is 1.8×, management fee and carry structure needs renegotiation before fund close — 1.2× of MOIC destruction is a significant GP/LP alignment issue.',
    },
  },

  DSCR: {
    beginner: {
      short: 'Can the project pay its loans from its own income?',
      body: 'DSCR (Debt Service Coverage Ratio) answers one question: for every $1 you owe the bank this year, how many dollars does the project actually earn? A DSCR of 1.4× means you earn $1.40 for every $1 you owe — comfortable margin. A DSCR below 1.0× means the project cannot pay its own debts.',
      why_it_matters: 'Banks will not lend if DSCR drops below ~1.2×. It is the single most watched number by project finance lenders and determines whether construction financing is available.',
    },
    investor: {
      short: 'EBITDA / total debt service; primary lender covenant metric',
      body: 'DSCR = Net Operating Income / (Principal + Interest). Project finance lenders typically require minimum DSCR of 1.20–1.35× as a covenant. AI-datacenter projects with hyperscale anchor tenants often achieve 1.5–2.0× at stabilization. Include capex reserves in debt service denominator for full DSCR.',
      why_it_matters: 'Controls leverage capacity and refinancing risk. DSCR covenant breach triggers cash sweep or loan acceleration — model downside DSCR at 80% occupancy to confirm covenant safety margin.',
    },
    minister: {
      short: 'Measure of project financial self-sufficiency — no government support needed for debt',
      body: 'A DSCR above 1.3× confirms the infrastructure generates sufficient cash to service its debt without requiring government intervention. This de-risks sovereign guarantee exposure and confirms the investment is commercially viable on its own terms.',
      why_it_matters: 'Key criterion for approving government-backed project financing; ensures public funds are not drawn upon for routine debt repayment — protecting the national balance sheet.',
    },
    operator: {
      short: 'NOI / (P+I); model monthly, report quarterly against covenant',
      body: 'Track DSCR at facility level with 12-month trailing NOI. Separate bare DSCR (P+I only) from full DSCR (P+I + reserves). For DSCR compression, primary lever is OPEX reduction; secondary is revenue renegotiation. Keep 15% buffer above minimum covenant at all times.',
      why_it_matters: 'Lender reporting covenant; breach window is typically 30 days before cure period triggers. Flag any downward trend in DSCR trajectory to lender proactively — surprises trigger punitive cure conditions.',
    },
  },

  NPV: {
    beginner: {
      short: "All the money this project will ever make, converted to what it's worth today",
      body: "Money in 10 years is worth less than money today — you can't invest future money now, and prices rise over time. NPV converts all future earnings into today's equivalent, then subtracts what you spent. Positive NPV = the project creates real value beyond your best alternative.",
      why_it_matters: "If NPV is negative, you would be better off putting the money in a savings account. Positive NPV means this project beats your best alternative use of capital.",
    },
    investor: {
      short: 'Present value of all future cash flows at hurdle rate, minus initial investment',
      body: 'NPV = Σ CFt / (1+r)^t − C0 where r is WACC or hurdle rate. For AI-datacenter projects, a positive NPV at 12% discount rate confirms value creation above cost of capital. Run three scenarios: base, upside (+20% revenue), downside (−20% occupancy). NPV floor in stress scenario sizes required equity buffer.',
      why_it_matters: 'Absolute value creation metric — IRR tells you rate, NPV tells you quantum. A $200M NPV project creates more total wealth than a $50M NPV project at the same IRR, even though both beat hurdle.',
    },
    minister: {
      short: 'Net economic value created for Qatar today, in current money',
      body: "NPV translates a 20-year infrastructure investment into a single present-value figure. A project with NPV of QAR 800M at a 10% social discount rate means this investment creates QAR 800M in economic value in today's terms — directly comparable to other public expenditure lines.",
      why_it_matters: 'Justifies capital allocation in national development plans by expressing long-term returns in current budget terms. Enables rigorous comparison across all national infrastructure priorities.',
    },
    operator: {
      short: 'Σ DCF − capex; sensitivity-test discount rate ±2% and revenue ±20%',
      body: 'Use project-level WACC (blended cost of equity and senior debt). Run three scenarios: base, upside, downside. NPV floor in stress scenario determines minimum equity buffer required at financial close. Recalculate at each major phase gate as assumptions update.',
      why_it_matters: 'Determines minimum equity check size needed to keep NPV positive under stress — directly sizes capital raise. NPV erosion below zero in stress scenario requires either lower capex commitment or higher pre-committed revenue.',
    },
  },

  payback: {
    beginner: {
      short: 'How many years before you get your money back',
      body: "Payback is the simplest investment clock: if you invest $100M and the project earns $20M a year, payback is 5 years. After that, every dollar earned is pure profit. Faster payback generally means less risk — the sooner you recover your money, the less time things can go wrong.",
      why_it_matters: 'Fast payback reduces exposure to technology changes and market shifts. AI hardware generations run 5–7 years — payback inside that window means you recover capital before equipment becomes obsolete.',
    },
    investor: {
      short: 'Years to recover invested capital; simple and discounted versions both relevant',
      body: 'Simple payback ignores time value of money. Discounted payback applies the hurdle rate — more conservative. AI-datacenter projects typically hit simple payback in 5–7 years, discounted payback in 7–9 years depending on leverage. Anchor leases accelerate payback significantly.',
      why_it_matters: 'Risk proxy: shorter payback reduces exposure to GPU technology obsolescence (cycles run 5–7 years). Critical for evaluating refinancing risk at year 5 — project should have recovered a meaningful portion of equity.',
    },
    minister: {
      short: 'Years until the national investment becomes self-funding',
      body: 'For a QAR 1B national AI infrastructure investment generating QAR 150M annually in direct revenues, payback is approximately 7 years — within a single government planning cycle. Adding fiscal multiplier effects (tax revenue, tech employment, digital GDP) shortens effective national payback further.',
      why_it_matters: 'Provides a concrete timeline for parliamentary accountability: "This investment pays for itself by 2032" is politically legible and auditable at the end of the planning period.',
    },
    operator: {
      short: 'Calculate simple and discounted payback per revenue stream; flag if > GPU refresh cycle',
      body: 'Calculate payback separately for each revenue stream (colocation, cloud, managed services, sovereign). If payback on GPU-heavy revenue exceeds GPU depreciation cycle (5–7 years), re-model with hardware refresh capex included — this is a common modelling oversight that understates true payback.',
      why_it_matters: 'Hardware refresh capex mid-cycle can reset payback clock by 2–3 years. Always model two scenarios: refresh vs. asset write-down and replace. Present both to investment committee.',
    },
  },

  EBITDA_margin: {
    beginner: {
      short: 'What percentage of revenue is actual operating profit',
      body: "If a datacenter earns $100M and spends $40M running it — power, staff, maintenance — its EBITDA margin is 60%. Think of it as operational efficiency: what percentage of every dollar earned flows through as profit after day-to-day costs.",
      why_it_matters: "Tells you how well the business is managed. A 50% margin means half of every dollar earned becomes profit. Below 30% and the business is struggling to cover costs. Margin expansion over time signals improving operations.",
    },
    investor: {
      short: 'EBITDA / Revenue; primary proxy for operating quality and valuation driver',
      body: 'Stabilized AI-datacenter EBITDA margins: colocation 45–55%, hyperscale BTS 55–65%, GPU cloud 35–50% (higher revenue variance). Margin expansion from year 1 to stabilization signals operational scaling. At exit, each 1% margin improvement at $200M revenue = $2M EBITDA = ~$20M enterprise value at 10× multiple.',
      why_it_matters: 'Determines terminal value in DCF and entry/exit multiple in comparables. EBITDA margin is the single most important lever on exit proceeds — invest in operational efficiency programs from year 1.',
    },
    minister: {
      short: 'Share of revenue retained as operating surplus for reinvestment or dividend',
      body: "An EBITDA margin of 55% on Qatar's national AI infrastructure means QAR 550M of every QAR 1B in annual revenue is retained as operational surplus — available for debt service, national reinvestment, or dividend to the sovereign fund.",
      why_it_matters: 'Demonstrates long-term fiscal sustainability of the infrastructure without ongoing subsidy — critical for budget neutrality commitments to the Ministry of Finance.',
    },
    operator: {
      short: 'EBITDA / Revenue; decompose by cost driver; target > 50% stabilized',
      body: 'Decompose margin by cost driver: power 35–45% of OPEX, staff 15–20%, maintenance 10–15%, SG&A 5–10%. Power purchase agreement (PPA) structure is the single largest margin lever — every $0.01/kWh difference moves EBITDA margin by ~2% at 100MW IT load.',
      why_it_matters: 'PUE improvement from 1.5 to 1.3 reduces power OPEX by 13% and flows directly to EBITDA margin. Model PUE improvement roadmap as a 3–5 year margin expansion story in investor reporting.',
    },
  },

  CAPEX_per_MW: {
    beginner: {
      short: 'How much it costs to build each unit of computing power',
      body: "Megawatt (MW) is how power capacity is measured in datacenters. CAPEX/MW is like a price per square meter for computing: it tells you if the construction cost is competitive globally. A figure of $9M/MW means you spend $9M for every megawatt of computing capacity built.",
      why_it_matters: 'Lets you compare construction proposals objectively — if one builder quotes $8M/MW and another $14M/MW, you can ask why and get a real answer grounded in market benchmarks.',
    },
    investor: {
      short: 'Total capex / IT power capacity in MW; primary construction benchmark',
      body: 'Market benchmarks (2025): hyperscale shell $4–6M/MW, AI-ready (400V, liquid cooling ready) $7–10M/MW, fully fitted AI cluster $12–18M/MW. Qatar premium vs. US: +15–25% due to logistics and climate cooling requirements. Benchmark against regional comparables (UAE, Saudi Arabia).',
      why_it_matters: 'Primary construction cost benchmark for equity sizing and debt sizing. Exceeding market CAPEX/MW by more than 20% without clear justification is a red flag in due diligence that requires explicit explanation.',
    },
    minister: {
      short: 'Construction cost efficiency per unit of national AI capacity',
      body: "A CAPEX/MW of $9M means Qatar pays QAR 32M for each megawatt of sovereign AI capacity. At 100MW, that is QAR 3.2B total — comparable to a mid-size infrastructure project. Comparing this figure to international benchmarks confirms whether Qatar's procurement is competitive.",
      why_it_matters: "Calibrates national investment sizing against the capacity acquired. Enables comparison with international AI-datacenter tenders to confirm Qatar's program is value-for-money.",
    },
    operator: {
      short: 'Total project capex / IT-ready MW; track weekly by phase against budget',
      body: 'Break down CAPEX/MW: civil+structure 30%, MEP 35%, IT infrastructure 20%, fit-out 15%. The AI-ready premium comes from 400V power distribution, reinforced floor load (≥ 15 kN/m²), and liquid cooling distribution units (CDUs). Cost overruns in MEP phase are most common.',
      why_it_matters: 'MEP overruns directly inflate CAPEX/MW and compress IRR. Weekly earned-value tracking against budget is mandatory from month 3 of construction — do not wait for monthly reports to discover variance.',
    },
  },

  OPEX: {
    beginner: {
      short: 'The ongoing annual cost to keep the datacenter running',
      body: "OPEX is operating expenditure — the recurring annual bills: electricity, staff salaries, maintenance contracts, cooling water, insurance. Unlike building costs (paid once), OPEX recurs every year for the life of the facility.",
      why_it_matters: "Even a perfectly built datacenter fails financially if OPEX eats all revenue. Power alone can be 40–50% of revenue. Controlling OPEX is the difference between a profitable facility and a money pit.",
    },
    investor: {
      short: 'Annual operating costs; power dominates at 40–50% of total OPEX',
      body: 'Typical OPEX breakdown: power 40–50%, staffing 15–20%, maintenance 12–18%, network/bandwidth 8–12%, insurance/admin 5–8%. Power cost is the critical variable: $0.04/kWh vs $0.07/kWh changes EBITDA margin by approximately 8% at typical PUE.',
      why_it_matters: 'Power purchase agreement (PPA) structure and PUE are the two biggest OPEX levers. Long-term fixed-price PPA at below-market rate is a significant, durable competitive moat — prioritize in deal structuring.',
    },
    minister: {
      short: 'Annual running costs of national digital infrastructure',
      body: "For a 100MW AI campus, annual OPEX is typically $60–90M — primarily electricity. Securing renewable energy at below-market rates through a government PPA reduces this cost and improves Qatar's AI infrastructure competitive pricing for international tenants.",
      why_it_matters: "Stable OPEX enables predictable long-term pricing for tenants. Hyperscalers require 10+ year cost visibility in their infrastructure planning — Qatar's energy advantage is a strategic differentiator.",
    },
    operator: {
      short: 'Annual cash costs; track power separately from non-power OPEX; model inflation on all lines',
      body: "Track power OPEX separately with actual kWh × tariff model updated monthly. Non-power OPEX should be inflation-linked in financial model. Staffing scales at approximately 1 FTE per 2–3 MW at operational maturity — higher in ramp phase. PPA renegotiation risk is the highest single OPEX exposure.",
      why_it_matters: 'Power tariff spikes (grid fees, seasonal peaks) are the only OPEX variable that can increase without operational warning. Hedge with long-term PPA or on-site generation wherever contractually and economically viable.',
    },
  },

  exit_multiple: {
    beginner: {
      short: "What you sell the business for, compared to its yearly earnings",
      body: "Exit multiple is the selling price divided by annual earnings (EBITDA). If a datacenter earns $50M a year and sells for $750M, the exit multiple is 15×. It is like selling a house for 15 times its annual rental income. Higher multiples mean the market values the business more highly.",
      why_it_matters: "Exit multiple is how investors ultimately make their money. Technology infrastructure has commanded high exit multiples historically, but compression is a real risk — model conservatively.",
    },
    investor: {
      short: 'Enterprise value at exit / EBITDA; the single most sensitive IRR variable',
      body: 'AI-datacenter exit multiples (2024–2025): stabilized assets trade at 22–35× EBITDA. Development projects underwritten at 20–25× exit. Hyperscale-anchored assets command premium vs. multi-tenant. Key driver: WAULT (weighted average unexpired lease term). Stress-test at 18× to validate IRR floor.',
      why_it_matters: 'Terminal value typically represents 40–60% of total project IRR. Exit multiple compression from 25× to 18× reduces IRR by 4–6 percentage points — the most sensitive single variable. Model quarterly.',
    },
    minister: {
      short: 'National asset valuation at maturity relative to annual earnings',
      body: "A sovereign fund retaining a 30% stake in a 100MW AI campus generating $100M EBITDA at a 25× exit multiple holds an asset worth $750M — 2.5× the QAR 1B initial investment. Exit multiples in AI infrastructure are structurally elevated due to structural hyperscale demand growth.",
      why_it_matters: "Demonstrates that early-stage national investment in AI infrastructure creates long-term balance sheet wealth for the sovereign fund — not merely annual cash flow. Critical for Qatar's intergenerational wealth transfer narrative.",
    },
    operator: {
      short: 'EV/EBITDA at exit; maximize by structuring long WAULT anchor leases from day 1',
      body: 'Exit multiple is primarily driven by WAULT. Every year of WAULT above 5 adds approximately 1–2× to exit multiple. Hyperscale tenants with 10-year leases command 28–35× vs. 20–22× for shorter-dated assets. Lease structuring in year 1 directly determines exit multiple in year 7.',
      why_it_matters: 'Prioritize long-term anchor leases over short-term revenue premium. A 10% rent discount to secure a 15-year hyperscale lease improves exit multiple by 5–8× — generating far more total return than the forgone rent.',
    },
  },

  PUE: {
    beginner: {
      short: 'How much extra energy is wasted on cooling vs. useful computing',
      body: 'PUE stands for Power Usage Effectiveness. A perfect score of 1.0 means every watt goes to computing. A PUE of 1.4 means for every 1 watt of computing, you waste 0.4 extra watts on cooling, lighting, and building systems. Lower PUE = more efficient = lower electricity bills.',
      why_it_matters: "Energy is the biggest running cost. A datacenter with PUE 1.2 uses 25% less electricity than one at 1.6 — millions of dollars saved annually. Qatar's hot climate makes PUE control especially critical.",
    },
    investor: {
      short: 'Total facility power / IT equipment power; critical OPEX and sustainability metric',
      body: 'Best-in-class hyperscale: PUE 1.10–1.20. AI-optimized liquid-cooled: 1.15–1.25. Legacy air-cooled: 1.4–1.6. Qatar ambient temperature raises baseline PUE vs. Nordic sites — liquid cooling is the primary mitigation. At 100MW IT load and $0.05/kWh, PUE 1.2 vs 1.5 = $13M/year OPEX delta.',
      why_it_matters: 'PUE directly multiplies power cost and carbon footprint. A 0.1 PUE improvement is one of the highest-return operational investments available — model it as a multi-year improvement program with explicit capital investment.',
    },
    minister: {
      short: 'Ratio of total energy consumed to useful computing energy — lower is better',
      body: "Qatar's hot climate means uncooled datacenters waste 40–60% of energy on cooling (PUE 1.4–1.6). A modern liquid-cooled national AI campus achieves PUE 1.2–1.3 — comparable to European standards. This directly reduces the carbon footprint of national AI infrastructure.",
      why_it_matters: "Lower PUE reduces the energy intensity and carbon footprint of national AI infrastructure — directly supporting Qatar's National Vision 2030 sustainability commitments and international climate pledges.",
    },
    operator: {
      short: 'Track PUE hourly per hall; target < 1.3 with liquid cooling in Qatar climate',
      body: 'Measure PUE at facility level and per hall. Qatar seasonal variation without liquid cooling: PUE 1.25–1.30 winter, 1.35–1.45 summer. CDU deployment per rack row brings summer PUE to 1.20–1.25. Every 0.1 PUE improvement at 100MW IT load = 10MW cooling savings = ~$4M/year OPEX reduction.',
      why_it_matters: 'PUE improvement also enables higher rack density without expanding cooling plant. Establish PUE improvement roadmap with annual targets — report against it in investor and government quarterly reports.',
    },
  },

  rack_density: {
    beginner: {
      short: 'How much computing power fits in one server cabinet',
      body: 'A rack is the tall metal cabinet that holds servers. Rack density measures how much computing power (in kilowatts) fits in one cabinet. Standard servers: 5–10 kW per rack. Modern AI chips like NVIDIA H100s: 30–100+ kW per rack. More powerful AI chips need denser, hotter racks that require specialized cooling.',
      why_it_matters: "High-density AI racks cannot be cooled with regular air conditioning — they need liquid cooling. A datacenter not designed for high density cannot host the latest AI chips, limiting which customers it can attract.",
    },
    investor: {
      short: 'Average kW per rack; determines cooling specification and revenue per sqm',
      body: 'Standard colocation: 5–15 kW/rack. AI inference: 20–40 kW/rack. AI training (H100/B200): 40–100+ kW/rack. High-density deployments require rear-door heat exchangers, CDUs, or direct liquid cooling — capex uplift of $50–150K per rack row. Revenue scales: higher density commands premium rates per kW.',
      why_it_matters: 'Rack density drives both revenue per sqm and cooling capex requirement. Underbuilding cooling for AI density is the most common design error — retrofitting costs $3–5M per MW and delays customer move-in by 6–12 months.',
    },
    minister: {
      short: 'AI computing intensity per square meter of floor space',
      body: 'AI datacenters require 5–10× the power density of traditional datacenters per square meter. Designing for 100 kW/rack today future-proofs Qatar\'s AI campus for the next generation of AI chips — protecting the long-term value of the national investment and avoiding premature obsolescence.',
      why_it_matters: "High-density design from day one means Qatar's national AI campus can host any AI hardware that exists today or will exist over the next decade — without costly infrastructure upgrades.",
    },
    operator: {
      short: 'Average and peak kW/rack by hall; size CDU at 120% of peak; 15 kN/m² floor load minimum',
      body: 'Design for 40 kW/rack average with 80 kW burst capacity. Liquid cooling (CDU per row) is mandatory above 20 kW/rack average. Floor load: ≥ 15 kN/m² for high-density GPU racks. Power whips: 3-phase 60A minimum per rack at 30 kW+. Undersize any of these and tenant deployment is blocked at handover.',
      why_it_matters: 'Undersized CDU capacity causes GPU thermal throttling within 2 minutes of peak load and potential hardware damage within 10 minutes — immediate SLA breach. Oversize cooling by 20% minimum as operational insurance.',
    },
  },

  occupancy_ramp: {
    beginner: {
      short: 'How quickly the datacenter fills up with paying customers',
      body: "Occupancy ramp is the timeline from opening day to full capacity. A datacenter doesn't fill up overnight — it typically takes 2–4 years to reach full occupancy. How fast it fills determines when cash flow starts and when investors get their money back.",
      why_it_matters: "Slow ramp means slower payback. Pre-signing anchor tenants before opening dramatically speeds up ramp and reduces risk. The difference between 30% and 70% occupancy in year 1 is often the difference between financial viability and distress.",
    },
    investor: {
      short: 'Occupancy by year; primary driver of early revenue ramp and DSCR safety',
      body: 'Model conservatively: Year 1 30–40%, Year 2 55–65%, Year 3 75–85%, stabilized 90–95%. Anchor hyperscale lease (20–40% of capacity pre-committed) dramatically de-risks ramp. Aggressive ramp assumptions are the single most common financial model error in datacenter development.',
      why_it_matters: 'Occupancy in years 1–3 determines whether DSCR stays above lender covenant minimum. Stress-test occupancy at 70% of base case to validate debt service coverage — this is standard lender requirement at financial close.',
    },
    minister: {
      short: 'Rate at which national AI capacity is put to active economic use',
      body: "A phased 100MW national AI campus reaching 90% occupancy by year 3 means 90MW of AI computing capacity is generating economic activity — training models, running cloud services, hosting sovereign workloads — within Qatar's digital economy.",
      why_it_matters: 'Occupancy ramp translates from infrastructure investment to active digital economy participation. Faster ramp requires pre-commitment from anchor tenants — a policy lever available through government-directed procurement and sovereign workload prioritization.',
    },
    operator: {
      short: 'Track MW committed (LOI) vs contracted (signed) vs live (energized, billing) weekly',
      body: 'Revenue recognition starts at energization — not at lease signing. Typical gap between signed lease and live for GPU deployments: 6–9 months (customer hardware lead time). Build 3-month buffer in cash flow model between lease signing and revenue recognition. Report pipeline-to-live conversion rate monthly.',
      why_it_matters: 'Pipeline-to-live conversion rate governs revenue forecasting accuracy. A 6-month gap between contracted and energized occupancy is the most common source of cash flow shortfall vs. financial model.',
    },
  },

  utilization: {
    beginner: {
      short: 'How much of the computing power is actually being used',
      body: "Utilization measures whether the computing resources inside the datacenter are being used productively. 100% utilization means every GPU is working. 50% means half are idle, earning nothing. Low utilization means paying for expensive hardware that isn't generating revenue.",
      why_it_matters: "High utilization = efficient use of expensive hardware. GPU cloud operators target 70–85% utilization to balance revenue with maintenance windows and customer burst capacity.",
    },
    investor: {
      short: 'GPU/compute utilization rate; key revenue efficiency metric in cloud operations',
      body: 'Distinguish occupancy (space/power sold) from utilization (compute actually consumed). In GPU-as-a-service model, target 70–80% utilization at scale. Below 60% sustained = revenue shortfall vs. capacity cost. In colocation model, utilization is the customer\'s responsibility — only occupancy matters to the developer.',
      why_it_matters: 'In GPU cloud, 10% utilization improvement on 1,000 H100 GPUs at $2.50/hour = $2.2M/year additional revenue. Utilization tracking enables proactive customer success intervention before lease non-renewal.',
    },
    minister: {
      short: 'Productive use rate of national computing capacity',
      body: "An 80% utilization rate on Qatar's national AI infrastructure means 80% of computing capacity is actively processing AI workloads — training sovereign models, running public sector AI services, hosting commercial tenants — rather than sitting idle.",
      why_it_matters: 'Utilization is the operational KPI demonstrating that national AI infrastructure investment is translating into active digital economic activity, not stranded capacity. Report in annual digital economy progress reviews.',
    },
    operator: {
      short: 'GPU utilization hourly via DCGM; target 70–85% sustained; alert below 55%',
      body: 'Monitor via NVIDIA DCGM or equivalent. Track both utilization percentage and power state (P0 vs P8) — GPU at 100% power but 40% compute utilization indicates memory-bound workloads needing optimization. Maximum scheduled maintenance downtime: 15% capacity offline per weekly rotation.',
      why_it_matters: 'Utilization below 60% for more than 2 weeks triggers customer health check — churn risk indicator. Above 90% sustained triggers hardware acquisition alert given 3–6 month GPU lead times. Both thresholds need automated alerting.',
    },
  },

  tier_iii: {
    beginner: {
      short: 'Industry standard for reliability — backup systems mean maintenance never causes downtime',
      body: 'Tier III is the global standard for "serious" datacenters. It means the facility has backup power, backup cooling, and backup network for every system, so that maintenance can be performed without ever turning anything off. If one system fails, a backup takes over automatically.',
      why_it_matters: 'Tier III means less than 1.6 hours downtime per year (99.982% uptime). Most enterprise and cloud customers require at least Tier III — without it, major tenants will not sign.',
    },
    investor: {
      short: 'Concurrently maintainable; N+1 redundancy; 99.982% uptime; minimum for hyperscale',
      body: 'Tier III (Uptime Institute): all components have N+1 redundant capacity, single path for power and cooling (no single point of failure), allows any planned maintenance without service interruption. Maximum 1.6 hours downtime/year. Tier III certification requires 18–24 month Uptime Institute audit process.',
      why_it_matters: 'Tier III is the minimum for hyperscale and institutional enterprise leases. Without it, the facility cannot compete for premium tenants. Tier IV (fault tolerant, 26 minutes/year) commands 10–15% rent premium but doubles MEP capex — evaluate per zone.',
    },
    minister: {
      short: 'International standard for continuous-operation national infrastructure',
      body: "Tier III certification means Qatar's AI infrastructure meets the global benchmark for mission-critical reliability — the same standard used by AWS, Azure, and Google in Europe and the US. It validates the facility as suitable for international hyperscale tenants and national government workloads.",
      why_it_matters: "Tier III certification is a prerequisite for attracting major international cloud companies. Without it, Qatar cannot credibly compete for hyperscale anchor tenants in the global data center market.",
    },
    operator: {
      short: 'N+1 redundancy, concurrent maintainability, dual-path power distribution — verify in SLD',
      body: 'Tier III requires: dual utility feeds, N+1 UPS (2N preferred for AI load), N+1 generators, N+1 cooling path, concurrent maintainability for all systems. Design review must confirm zero single points of failure in the single line diagram (SLD). Third-party Uptime Institute certification: 18–24 month process.',
      why_it_matters: 'Tier III certification is customer-facing SLA evidence. Taking both UPS paths offline simultaneously — even briefly during commissioning — voids certification and may trigger immediate SLA penalties with any active tenant.',
    },
  },

  tier_iv: {
    beginner: {
      short: 'The gold standard — even equipment failures do not cause any downtime',
      body: 'Tier IV is the absolute top of datacenter reliability. The building can survive any single failure — whether a power cut, equipment fire, or cooling breakdown — without any service interruption, ever. Completely fault-tolerant with fully redundant active systems.',
      why_it_matters: 'Tier IV is required for the most critical applications: national security systems, defense AI, financial trading, and sovereign government AI where even minutes of downtime are unacceptable.',
    },
    investor: {
      short: 'Fault tolerant; 99.9995% uptime; 2N+1 redundancy; dual active power and cooling paths',
      body: 'Tier IV: 2N or 2N+1 redundancy on every system, two simultaneous active power and cooling paths carrying full load. Maximum 26 minutes downtime per year. Capex premium vs. Tier III: 25–40%. Warranted for sovereign, defense, and financial workloads — avoid over-specifying for standard commercial AI.',
      why_it_matters: 'Tier IV capex premium must be justified by revenue premium or contractual mandate. Over-specifying Tier IV for standard AI workloads inflates CAPEX/MW by 25–40% with no corresponding revenue uplift.',
    },
    minister: {
      short: 'Highest international standard — zero planned or unplanned downtime for sovereign systems',
      body: "Tier IV means Qatar's sovereign AI infrastructure continues operating through any single failure — power outage, equipment fault, maintenance. It is the appropriate standard for defense AI workloads, classified government data, and mission-critical national digital services.",
      why_it_matters: "Selecting Tier IV for sovereign AI systems is a national security decision — it ensures continuity of critical government AI operations under any circumstances, including infrastructure emergencies.",
    },
    operator: {
      short: '2N+1 everything; dual active paths carrying full load simultaneously; zero SPOFs tolerated',
      body: 'Tier IV requires two independent active power paths delivering full IT load simultaneously (active-active, not hot-standby). All maintenance performed without interrupting either path. Requires dedicated generator building, dual switchgear rooms, dual UPS rooms, dual cooling plants. Certification requires 2+ year audit history.',
      why_it_matters: 'Any deviation from dual active paths — even momentarily during commissioning testing — fails Tier IV. Design, commissioning, and ongoing operations must be managed by Uptime Institute-certified engineers with documented Tier IV experience.',
    },
  },

  redundancy: {
    beginner: {
      short: 'Having a backup for every critical system so one failure never causes a blackout',
      body: "Redundancy means having a spare for every important system. Like having a backup generator at home — if the grid fails, you keep the lights on. Datacenters have backup power (UPS + generators), backup cooling (extra chillers), and backup internet connections.",
      why_it_matters: "Without redundancy, one broken transformer or one failed chiller causes a full datacenter outage — losing customer data and triggering millions in SLA penalties. Redundancy is the engineering foundation of reliability.",
    },
    investor: {
      short: 'Backup system capacity tier; N+1 = one spare, 2N = full duplicate, 2N+1 = duplicate plus spare',
      body: 'N+1: one extra unit per system beyond minimum operational requirement (e.g., 3 chillers where 2 suffice — 1 spare). 2N: complete duplicate of every system. 2N+1: duplicate plus one additional. Higher redundancy = higher capex + higher Uptime Institute tier. Specify redundancy level per system in term sheet.',
      why_it_matters: 'Redundancy level is the primary driver of MEP capex variance between Tier III and Tier IV. Under-specifying redundancy to save capex risks downtime events that terminate anchor leases — a catastrophic IRR outcome.',
    },
    minister: {
      short: 'Engineering resilience through backup systems for every critical component',
      body: "National AI infrastructure must have redundant systems for power, cooling, and connectivity. This means if any single component fails — a transformer, a chiller, a network router — operations continue uninterrupted, protecting sovereign data, public services, and commercial tenants simultaneously.",
      why_it_matters: "Redundancy is the engineering foundation of digital sovereignty — ensuring Qatar's critical digital services cannot be interrupted by single points of failure in any part of the infrastructure.",
    },
    operator: {
      short: 'Redundancy matrix by system; test all failover annually; document SLA implications of each tier',
      body: 'Redundancy matrix: UPS (2N for AI load), generators (N+1 minimum, 2N for Tier IV), chillers (N+1), PDUs (2N), network (dual diverse carriers with BGP). Annual failover testing is mandatory for Uptime Institute certification maintenance. Document RTO/RPO for each system in operations runbook.',
      why_it_matters: 'Untested redundancy is theoretical redundancy. Annual failover testing is the only way to confirm backup systems actually work under load — and the only way to maintain Uptime Institute Tier certification.',
    },
  },

  liquid_cooling: {
    beginner: {
      short: 'Cooling AI chips with water pipes instead of air fans',
      body: "Instead of blowing cold air over hot servers like a giant fan, liquid cooling runs chilled water through pipes right next to the chips. Water carries heat away 4,000× more efficiently than air — essential for the extremely hot AI chips like NVIDIA H100s that generate as much heat as a home oven.",
      why_it_matters: "AI chips generate 5–10× more heat than regular servers. Without liquid cooling, AI datacenters either overheat or waste enormous energy on massive air conditioning — neither is viable at scale.",
    },
    investor: {
      short: 'CDU or direct liquid cooling; mandatory for AI above 30 kW/rack; 0.10–0.20 PUE improvement',
      body: 'Three approaches: rear-door heat exchangers (RDHx, passive, $8–15K/rack), Cooling Distribution Units (CDU, active, $25–50K per rack row), and full immersion ($60–120K/rack). CDU is the standard for GPU clusters. Liquid cooling reduces PUE by 0.10–0.20 vs. air cooling — direct OPEX saving.',
      why_it_matters: 'Without liquid cooling, AI racks above 30 kW cannot be safely deployed. Retrofitting air-cooled halls for liquid cooling costs $3–5M per MW — plan for it at design stage to avoid the retrofit cost.',
    },
    minister: {
      short: 'Water-based cooling that enables high-performance AI hardware in Qatar\'s hot climate',
      body: "Liquid cooling is not optional for AI infrastructure — the latest NVIDIA and AMD AI chips require it. Qatar's hot climate makes efficient cooling even more critical than in Europe or North America. Purpose-built liquid-cooled facilities achieve 30–40% lower energy consumption than air-cooled equivalents.",
      why_it_matters: "Liquid cooling is the enabling technology for world-class AI computing in Qatar's climate. It directly reduces energy intensity, carbon footprint, and operating costs — supporting both national competitiveness and sustainability goals.",
    },
    operator: {
      short: 'CDU per 2 rack rows; monitor supply/return delta T hourly; target delta T 20–25°C',
      body: 'CDU sizing: 1 CDU per 2 rows for 40 kW/rack average. Primary water loop: 18–22°C supply, 40–45°C return. Secondary loop to chiller plant. Monitor delta T continuously — narrowing delta T indicates fouling or flow restriction. Glycol concentration check quarterly.',
      why_it_matters: 'CDU failure at 40 kW/rack density causes GPU thermal throttle within 2 minutes and potential hardware damage within 10 minutes. CDU N+1 redundancy per zone is mandatory — a single CDU failure cannot be allowed to impact tenant SLA.',
    },
  },

  air_cooling: {
    beginner: {
      short: 'Traditional cooling using cold air blown through server rooms',
      body: "Air cooling is the original way to cool datacenters — large air conditioning units cool the room, and fans push cold air over servers. It is proven, simple, and well understood. However, it becomes increasingly inefficient above a certain computing density.",
      why_it_matters: "Air cooling works well up to about 20 kW per rack. Modern AI workloads push far beyond that limit. A datacenter designed only for air cooling cannot host the latest AI chips without massive energy waste.",
    },
    investor: {
      short: 'CRAC/CRAH-based; viable to 20 kW/rack; PUE 1.4–1.6 in hot climates; AI-limited',
      body: 'Computer Room Air Conditioners (CRAC) and Air Handlers (CRAH) are standard in pre-AI facilities. PUE baseline 1.4–1.6 in Qatar climate. Adequate for standard enterprise colocation but insufficient for AI GPU clusters above 20 kW/rack. Retrofit to liquid cooling: $3–5M/MW.',
      why_it_matters: 'Facilities designed only for air cooling cannot serve the AI market — the highest-margin segment. Avoid developing or acquiring air-cooling-only facilities for an AI-focused investment strategy.',
    },
    minister: {
      short: 'Traditional cooling technology — adequate for standard computing, not for AI',
      body: "Legacy datacenters globally use air cooling — it is proven and widely understood. However, for the AI chips needed to attract hyperscale tenants and host sovereign AI workloads, air cooling alone is insufficient. Modern AI campuses must be designed for liquid cooling from day one.",
      why_it_matters: "Building Qatar's AI infrastructure with only air cooling would make it obsolete before completion. Purpose-built liquid cooling design is a strategic requirement, not an optional upgrade.",
    },
    operator: {
      short: 'CRAC/CRAH; adequate below 15 kW/rack average with hot aisle/cold aisle containment',
      body: 'Hot aisle/cold aisle containment is mandatory for air cooling efficiency. Target CRAC supply temperature 18–20°C. Above 15 kW/rack average, hot spots develop even with containment. Use CFD (Computational Fluid Dynamics) modelling before deploying high-density rows in air-cooled halls.',
      why_it_matters: 'Air cooling is viable for edge, CDN, and standard enterprise workloads. Never attempt to run 40+ kW GPU racks in air-cooled halls — results in immediate thermal throttling, hardware damage, and SLA breach.',
    },
  },

  hybrid_cooling: {
    beginner: {
      short: 'Using both air and liquid cooling in the same building — each where it fits best',
      body: 'Hybrid cooling mixes traditional air cooling for standard servers with liquid cooling for hot AI racks. One building serves multiple types of customers: standard enterprise in air-cooled zones, AI and GPU clusters in liquid-cooled zones.',
      why_it_matters: 'Hybrid is often the most cost-effective design — liquid cooling only where you need it, air cooling where it suffices. Avoids over-investing in expensive liquid infrastructure for zones that will never run AI workloads.',
    },
    investor: {
      short: 'Tiered cooling by zone; air for < 20 kW/rack, liquid for > 20 kW/rack; broadest addressable market',
      body: 'Hybrid cooling separates the facility into zones: standard colocation (air, 10–20 kW/rack) and AI zones (liquid, 30–100+ kW/rack). Allows serving both traditional enterprise and AI workloads in one facility. Capex optimization: avoid over-specifying liquid cooling for lower-density zones.',
      why_it_matters: 'Hybrid approach maximizes revenue per sqm by serving the broadest customer base and the widest range of workloads. Pure liquid-cooled facilities command premium pricing but serve a smaller total addressable market.',
    },
    minister: {
      short: 'Flexible cooling infrastructure serving all of Qatar\'s digital economy needs',
      body: "A hybrid-cooled national AI campus serves both: high-performance AI clusters for research, defense, and hyperscalers (liquid-cooled zones) and standard government and enterprise workloads (air-cooled zones). One facility, comprehensive national digital economy coverage.",
      why_it_matters: "Hybrid design enables the national AI campus to serve Qatar's immediate government digitization needs while being fully AI-ready for hyperscale tenants — maximizing the strategic utility of the investment from day one.",
    },
    operator: {
      short: 'Zone-by-zone cooling design; hydraulic isolation between liquid and air zones is mandatory',
      body: 'Design liquid and air zones with separate mechanical systems — do not share chiller plant between zones (contamination and pressure imbalance risk). Pre-install pipe sleeves and floor cutouts in all zones to enable future liquid conversion at marginal cost. Document zone boundaries in DCIM.',
      why_it_matters: 'Zone isolation prevents a liquid system fault from impacting air-cooled areas. Pre-installed pipe infrastructure reduces future liquid conversion cost from $5M/MW to $2M/MW — a valuable design option for future growth.',
    },
  },

  powered_shell: {
    beginner: {
      short: 'A ready-to-go building with power and cooling — but customers install their own computers',
      body: "A powered shell is like buying an empty restaurant space with electricity, gas, and plumbing installed — but no kitchen equipment. For datacenters, it means the building has power, cooling infrastructure, and physical security, but the customer installs their own servers.",
      why_it_matters: "Hyperscale companies (Google, Microsoft, Amazon) prefer powered shells because they want to design and install their own custom IT equipment. It's faster, gives them control, and aligns with their global procurement model.",
    },
    investor: {
      short: 'Shell-and-core facility; developer delivers power/cooling infrastructure; tenant delivers IT',
      body: 'Powered shell: developer delivers building with power distribution, cooling plant, and physical security. Tenant installs IT gear, network, and internal fit-out. Developer capex: $4–8M/MW vs $10–18M/MW for fully fitted. Hyperscale preferred model — enables custom IT design. Lower capex improves IRR; lower per-MW revenue than managed colocation.',
      why_it_matters: 'Powered shell reduces developer capex by 40–50% and transfers IT obsolescence risk entirely to the hyperscale tenant — who upgrades their own hardware on their own schedule. Strong strategic position for Qatar as first national developer.',
    },
    minister: {
      short: 'AI-ready building infrastructure that hyperscalers can move into on their own terms',
      body: "Leading cloud providers globally prefer powered shell facilities because they install their own proprietary hardware and control their own IT environment. Qatar offering powered shells signals to hyperscalers that Qatar understands and accommodates their global operational model — essential for attracting AWS, Azure, or Google Cloud.",
      why_it_matters: "Powered shell is the standard procurement model for every major hyperscaler globally. Without offering this option, Qatar cannot realistically compete for hyperscale datacenter anchor tenants at the national AI campus.",
    },
    operator: {
      short: 'Developer scope ends at power and cooling delivery point; IT scope is entirely tenant\'s',
      body: 'Define handover boundary precisely in the lease: developer delivers IT distribution board, CDU primary connections, CRAC/CRAH units installed, blank cable trays. Tenant takes responsibility from IT distribution board. Demarcation must be explicit in lease and as-built drawings at handover.',
      why_it_matters: 'Ambiguous handover boundary generates fit-out disputes and move-in delays — directly impacting revenue recognition. Legal review of handover scope at lease drafting stage is the single most important risk mitigation in powered shell leasing.',
    },
  },

  NNN_lease: {
    beginner: {
      short: 'A rent contract where the tenant pays all costs on top of rent — landlord just collects',
      body: "NNN (Triple Net) lease means the tenant pays rent plus all property costs: taxes, insurance, and maintenance. As the building owner, your income is nearly pure cash flow — you are not managing repairs or unexpected bills. It is the most predictable lease structure for property investors.",
      why_it_matters: "NNN leases give investors stable, predictable income for 10–20 years. Hyperscale companies sign NNN leases for datacenters globally — it is the standard structure in infrastructure investing.",
    },
    investor: {
      short: 'Triple net; tenant pays taxes, insurance, maintenance; landlord receives stable net income',
      body: 'NNN lease passes property taxes, building insurance, and structural maintenance to tenant. Landlord receives stable, predictable net cash flow. Standard for hyperscale datacenter leases. Terms: 10–20 years with 3–5 year options. CPI rent escalators (1–3% annually) or fixed 2–3% annual step-ups.',
      why_it_matters: 'NNN structure significantly de-risks landlord cash flows — no OPEX surprises, no maintenance liability, predictable income for the full lease term. Combined with long WAULT, produces bond-like cash flows valued at premium multiples by infrastructure investors.',
    },
    minister: {
      short: 'Long-term contract structure where international companies bear all operating costs',
      body: "A triple net lease with a hyperscaler means Qatar's national infrastructure entity receives guaranteed, predictable rent for 10–20 years while the tenant manages all facility operations independently. This minimizes national operational burden and ensures stable sovereign revenue with no hidden costs.",
      why_it_matters: "NNN lease structure converts national AI infrastructure into a stable long-term revenue asset — analogous to a toll road — requiring minimal ongoing public sector management or budget exposure.",
    },
    operator: {
      short: 'Tenant scope: taxes, insurance, M&E maintenance; landlord scope: structural shell only',
      body: 'Clearly define NNN scope in lease: tenant responsible for all M&E maintenance, annual HVAC service, fire system certification, cleaning, and building insurance. Landlord responsible for structural envelope and roof integrity. Annual reconciliation of estimated vs. actual NNN charges. Legal review of scope definition is critical.',
      why_it_matters: 'Poorly defined NNN boundaries generate recurring disputes and withheld rent payments. Legal review of NNN scope at lease drafting stage is the most important single risk mitigation in lease structuring — do not skip it.',
    },
  },

  BTS: {
    beginner: {
      short: 'Build-to-suit — a facility designed and built specifically for one customer',
      body: "BTS means the developer builds a facility to one tenant's exact specifications — then leases it back long-term. The tenant gets exactly what they need; the developer gets a guaranteed long-term lease before breaking ground.",
      why_it_matters: "BTS is how the world's biggest tech companies (Meta, Google, Amazon) build datacenters globally. It reduces both parties' risk: tenant gets custom infrastructure, developer gets guaranteed income from day one.",
    },
    investor: {
      short: 'Custom facility built against pre-signed long-term lease; eliminates speculative risk',
      body: 'BTS: developer designs and builds to tenant specification, against a 15–25 year NNN lease signed before construction start. Eliminates speculative vacancy risk entirely. Financing secured against lease at financial close. Common BTS tenants: hyperscalers, defense, national cloud operators. Change order risk is the primary construction risk.',
      why_it_matters: 'BTS transactions command 5–8% lower yield (higher value) than speculative development because of pre-committed income stream. Customization risk during construction must be managed with a rigorous change control process.',
    },
    minister: {
      short: 'Purpose-built national AI infrastructure incorporating sovereign specifications from day one',
      body: "A BTS agreement with a hyperscaler means Qatar defines the specifications — power density, redundancy, security requirements, data sovereignty zones, Qatari staffing requirements — and the partner builds accordingly. Qatar gets exactly the AI infrastructure it needs, not a generic commercial product.",
      why_it_matters: "BTS is the mechanism through which Qatar can embed sovereignty requirements into hyperscale infrastructure from the design stage — data localization, security clearances, Qatari employment minimums — not as afterthoughts.",
    },
    operator: {
      short: 'Tenant specs drive design; freeze at RIBA Stage 2; change control is mandatory from day 1',
      body: 'BTS projects must freeze tenant technical specifications by RIBA Stage 2 (or equivalent). Late spec changes are the primary cause of BTS cost overruns and schedule delays. Establish formal change control process with explicit cost and schedule impact assessment for every tenant-initiated change after design freeze.',
      why_it_matters: 'A hyperscale BTS with late spec changes is the highest-risk datacenter development scenario. Contractual change lock-in with financial penalties for late changes is the only effective protection for both developer margin and tenant delivery schedule.',
    },
  },

  hyperscale_lease: {
    beginner: {
      short: "A long-term deal with one of the world's biggest tech companies for massive computing space",
      body: "Hyperscale companies (Amazon, Google, Microsoft, Meta) need enormous amounts of computing space. A hyperscale lease is a huge, long-term agreement — typically 10–20 years — for 20+ megawatts of capacity. Getting one such tenant effectively fills a large datacenter and guarantees income for a decade.",
      why_it_matters: "One hyperscale lease can anchor an entire datacenter project, providing the stable income needed to secure construction financing and de-risk the development for all other investors.",
    },
    investor: {
      short: '≥ 20MW single tenant; 10–20 year NNN; A-rated credit; 15–20% yield compression vs. multi-tenant',
      body: 'Hyperscale lease: ≥ 20MW, 10–20 year NNN, typically A-rated credit (AWS, Azure, GCP, Meta). Terms include power and connectivity minimums, security specifications, and SLA uptime requirements. Hyperscale leases command 15–20% yield compression (higher value) vs. multi-tenant because of superior income security.',
      why_it_matters: 'A hyperscale anchor lease is the single most value-creating event in datacenter development — reduces development risk, enables debt financing at tighter spreads, accelerates occupancy ramp, and drives exit multiple premium.',
    },
    minister: {
      short: "Long-term commitment from a global cloud giant to host in Qatar",
      body: "A hyperscale lease from Amazon AWS or Microsoft Azure represents a 10–20 year commitment to Qatar's digital infrastructure, guaranteed annual revenue of $30–80M+, and global validation of Qatar as a Tier 1 AI hub. It is the clearest signal that the national AI strategy is succeeding.",
      why_it_matters: "One hyperscale anchor lease catalyzes the entire digital economy: it attracts secondary tenants, validates the facility for sovereign workloads, generates tax revenue, and places Qatar on the global technology map.",
    },
    operator: {
      short: '≥ 20MW single tenant; 6–18 month sales cycle; assign dedicated technical account manager from engagement',
      body: 'Hyperscale lease negotiation: 6–18 months from first engagement to signed heads of terms. Tenant conducts technical due diligence (power systems, cooling, connectivity, physical security), security audit, and full legal review. Assign dedicated relationship manager and technical account manager for each hyperscaler engagement.',
      why_it_matters: 'Hyperscale lease negotiation requires full-time senior technical and legal resources for 6+ months. Underestimating this requirement delays close — and risks losing the tenant to a competing facility in a neighboring market.',
    },
  },

  GPU_hour_price: {
    beginner: {
      short: 'How much customers pay to rent one AI chip for one hour',
      body: "GPU hour price is the cloud rate for renting an NVIDIA AI chip for one hour — like renting a very powerful computer by the hour. In 2025, renting a top AI chip costs $2–5 per hour. Multiply that by thousands of chips running continuously, and you see why AI infrastructure is a major business.",
      why_it_matters: 'GPU pricing directly determines how much revenue an AI datacenter earns from its hardware. Understanding this number helps you assess how profitable the cloud computing side of the business can be.',
    },
    investor: {
      short: 'Spot and reserved price per H100/B200 GPU-hour; primary revenue driver in GPU cloud model',
      body: 'H100 GPU-hour pricing (2025): spot $1.80–2.50, 1-year reserved $2.00–2.80, 3-year reserved $1.40–1.80. B200/GB200 launch premium: $3.50–5.00 spot. Revenue model: 1,000 GPUs × $2.50/hr × 70% utilization × 8,760 hrs = $15.3M/year gross per thousand GPUs.',
      why_it_matters: 'GPU pricing is commoditizing — model 15% annual price decay as supply increases. 20% price compression reduces GPU cloud revenue by 20% — the most volatile revenue line. Stress-test IRR at $1.50/H100-hour by year 3.',
    },
    minister: {
      short: "Qatar's competitive price for sovereign AI computing capacity",
      body: "Qatar can offer GPU computing at $2–3/hour — competitive with US and European cloud providers. A national AI cloud charging government ministries and GCC enterprises at market rates generates $15–30M per 1,000 GPUs annually, creating a commercially self-funding national AI compute resource.",
      why_it_matters: "Commercially pricing sovereign AI computing creates national digital revenue while reducing GCC dependence on foreign cloud providers — a strategic advantage for Qatar's regional digital leadership aspirations.",
    },
    operator: {
      short: 'Price by GPU type and reservation length; benchmark weekly vs. CoreWeave, Lambda, vast.ai',
      body: 'Price tiers: on-demand (highest), 1-year commit (−20%), 3-year commit (−40%), spot (−60%, interruptible). Monitor competitor pricing weekly — CoreWeave, Lambda Labs, vast.ai, Massed Compute. Key differentiators: GPU type (H100 vs A100 vs H200), interconnect (InfiniBand vs Ethernet), storage tier.',
      why_it_matters: 'GPU cloud is a commoditizing market — weekly pricing benchmarking prevents both overpricing (customer loss) and underpricing (margin destruction). Automated pricing adjustment tracking is standard in mature GPU cloud operations.',
    },
  },

  allocation_risk: {
    beginner: {
      short: "The risk that you can't buy the AI chips you need, even if you have the money",
      body: "AI chips (GPUs) are in extremely tight supply globally. Allocation risk means that even with full budget approved, you might not be able to buy enough NVIDIA chips to fill your datacenter on schedule. Think of it like having money to build a restaurant but being unable to buy any kitchen equipment.",
      why_it_matters: "Without allocated GPUs, an AI datacenter is just an expensive empty building. Securing GPU allocation is as strategically important as securing land and building permits — and must be pursued simultaneously.",
    },
    investor: {
      short: 'GPU supply constraint risk; mitigate with NVIDIA MPA; never sign SLAs without confirmed delivery',
      body: 'NVIDIA H100/H200/B200 allocation is demand-constrained (18–24 month lead times in 2024–2025). Risk: committing capacity to customers without confirmed hardware delivery schedule. Mitigation: master purchase agreements (MPAs) with NVIDIA CSP program, or hardware-agnostic contractual terms with delivery-condition precedents.',
      why_it_matters: 'Allocation risk can delay revenue by 12–18 months and trigger contractual penalties with pre-committed tenants. Hardware commitment timeline and customer commitment timeline must be synchronized at deal close.',
    },
    minister: {
      short: 'Strategic risk that global chip shortages delay national AI infrastructure deployment',
      body: "NVIDIA's AI chips — the hardware that powers global AI — are severely supply-constrained globally. Qatar must secure hardware allocation through direct government-to-company partnerships or strategic sovereign agreements with NVIDIA to guarantee timely delivery for national AI infrastructure.",
      why_it_matters: "Without priority hardware allocation, Qatar's AI infrastructure timeline slips by 12–24 months regardless of construction progress. Diplomatic and commercial GPU allocation is a strategic national priority requiring ministerial engagement.",
    },
    operator: {
      short: 'Track GPU PO and ship dates weekly; 15% buffer minimum; no SLAs without confirmed delivery',
      body: 'GPU allocation risk management: never sign capacity SLAs with customers without confirmed GPU delivery dates from NVIDIA. Maintain 10–15% hardware buffer above contracted capacity to absorb DOA rates (2–5% for new GPU models). Escalation path: NVIDIA Strategic Account Manager → VP Sales → CSP Program Director.',
      why_it_matters: 'Signing SLAs without hardware delivery certainty is the single most common operational error in GPU cloud startups — results in SLA breach, customer loss, and potential litigation. No exceptions.',
    },
  },

  transformer_lead_time: {
    beginner: {
      short: 'The 18–36 months needed to receive the giant electrical transformer that powers the building',
      body: "A transformer converts high-voltage electricity from the national grid to usable power for the datacenter. These are enormous, custom-built pieces of equipment made to order. In 2025, delivery takes 18–36 months from major manufacturers. If you forget to order one early, your entire project waits.",
      why_it_matters: "Transformer lead time is the most common reason datacenter projects are delayed. You must order before final permits are in hand — that is how long the lead time is.",
    },
    investor: {
      short: '18–36 month procurement; critical path item that must be ordered at financial close',
      body: 'Large power transformers (10–100 MVA) have 18–36 month lead times from ABB, Siemens, and Hitachi due to global constrained manufacturing capacity driven by energy transition demand. Transformers must be ordered at project inception — typically before planning approval — to hit target energization dates. Unit cost: $500K–$3M.',
      why_it_matters: 'Transformer lead time is the most common critical path delay in datacenter development. Missing the order window by 3 months delays the project by 3 months with no recovery option. Budget and order at financial close.',
    },
    minister: {
      short: 'Critical 18–36 month procurement constraint requiring early budget authorization',
      body: "The electrical transformers needed to power a large AI datacenter take 18–36 months to manufacture globally — a constraint driven by worldwide demand for energy infrastructure. Qatar's national AI campus transformer orders must be placed at project approval, not at construction completion.",
      why_it_matters: 'Transformer lead time is a policy constraint: without enabling early procurement expenditure before full planning approval, transformer delays will push the AI infrastructure timeline by 1–2 years regardless of construction pace.',
    },
    operator: {
      short: 'Order at FID; 18–36 months for 33/11kV units; include FAT inspection and storage yard in schedule',
      body: 'Procurement sequence: specify rating at RIBA Stage 2, issue ITT at Stage 3, place order at FID. Preferred vendors for GCC: ABB, Siemens, Hitachi, TBEA. Include factory acceptance test (FAT) at 60% completion. Delivery requires weatherproof transformer storage yard on site from month 18.',
      why_it_matters: "Transformer delivery failure is unrecoverable on the critical path. If ordered late, only options are: delay energization (revenue loss) or pay 30–50% spot premium for emergency expedited manufacturing — neither is acceptable.",
    },
  },

  grid_approval: {
    beginner: {
      short: "Government permission to connect the datacenter to Qatar's electricity grid",
      body: "Before a datacenter can operate, it needs formal permission from the national electricity authority to connect and draw power. In Qatar, this means working with Kahramaa. Getting approval takes 12–24 months and requires detailed engineering studies proving the connection will not destabilize the grid.",
      why_it_matters: "Without grid approval, the datacenter has no power — it cannot open, regardless of construction completion. This is a hard regulatory dependency that must be pursued in parallel with building work.",
    },
    investor: {
      short: 'Kahramaa regulatory permit; 12–24 months; run in parallel with design and transformer procurement',
      body: 'Grid connection approval in Qatar: load study submission, protection relay coordination, grid impact assessment, and formal connection agreement with Kahramaa. Large loads (> 10 MVA) require approval at senior Kahramaa authority level. Must be initiated at project inception to align with energization milestone.',
      why_it_matters: 'Grid approval delay is a binary risk — no grid connection, no operation. Initiate the Kahramaa application process at project inception. Track on critical path alongside transformer procurement as the two most common energization blockers.',
    },
    minister: {
      short: 'National authorization for large AI campus grid connection — requires ministerial coordination',
      body: "Kahramaa grid approval for a large AI campus (100–400MW) requires senior-level coordination across Kahramaa, the Ministry of Energy, and potentially transmission infrastructure investment to support the load. This is not a routine grid connection application.",
      why_it_matters: "Ministerial coordination with Kahramaa leadership is essential to secure timely grid approval for national AI infrastructure. Without it, the AI campus timeline slips regardless of construction progress.",
    },
    operator: {
      short: 'Kahramaa connection agreement; submit load flow study at RIBA Stage 2; assign dedicated utility liaison',
      body: 'Grid approval steps: pre-application meeting, formal load study submission (load flow, short circuit analysis, harmonic study), protection relay setting agreement, formal connection agreement. Qatar timeline: 12–18 months minimum. Assign dedicated utility liaison from day 1 — Kahramaa relationships are relationship-driven.',
      why_it_matters: 'Grid application submitted late is the second most common energization delay after transformer procurement. Submit before planning application is complete — the two processes must run in parallel.',
    },
  },

  water_permit: {
    beginner: {
      short: "Government permission to use water for cooling — liquid cooling minimizes this requirement",
      body: "Large datacenters can use water to cool their equipment through evaporative cooling towers — like giant industrial air conditioners that consume water. In Qatar, water is scarce. A water permit is formal government authorization to use specific quantities of water for cooling purposes.",
      why_it_matters: "Without a water permit, a datacenter cannot use cooling towers — forcing more expensive cooling alternatives. Choosing liquid cooling technology dramatically reduces water consumption and simplifies the permitting process.",
    },
    investor: {
      short: 'ASHGHAL water abstraction permit; closed-loop liquid cooling dramatically reduces exposure',
      body: 'Water permits for cooling in Qatar are governed by ASHGHAL (Public Works Authority). Evaporative cooling towers at 100MW: 500–2,000 cubic meters/day consumption. Qatar water scarcity means permits are constrained. Closed-loop liquid cooling (CDU): water consumption near zero — essentially eliminates water permit risk.',
      why_it_matters: 'Water permit constraints in Qatar are a structural design argument for liquid cooling — reduces water dependency to near zero, eliminates permit risk, and aligns with Qatar\'s national water sustainability objectives.',
    },
    minister: {
      short: 'National water allocation authorization — liquid cooling minimizes consumption',
      body: "Qatar's desalinated water supply is a strategic national resource. Traditional datacenter cooling towers can consume millions of liters daily. Government water allocation policy for AI infrastructure — and the cooling technology mandated — shapes both facility economics and national water sustainability.",
      why_it_matters: "Water allocation policy for AI infrastructure requires coordination between ASHGHAL, Ministry of Municipality, and the national AI agency. Mandating liquid cooling technology in facility standards eliminates this policy dependency entirely.",
    },
    operator: {
      short: 'ASHGHAL permit for cooling water; submit with planning application; liquid cooling avoids this entirely',
      body: 'Water permit application to ASHGHAL: include consumption calculation, water recycling plan, discharge quality specification (for blowdown), and ESIA water section. Timeline: 6–12 months. Closed-loop CDU liquid cooling system: water consumption effectively zero — no water permit required for cooling. Design decision with major regulatory implications.',
      why_it_matters: 'Water permit refusal for cooling towers in water-constrained areas of Qatar is a real risk. Designing for liquid cooling eliminates this dependency entirely — the most efficient risk mitigation available at the design stage.',
    },
  },

  sovereign_cloud: {
    beginner: {
      short: "Cloud computing owned and run by Qatar's government — data never leaves national control",
      body: "A sovereign cloud means a country's data stays inside its borders, under its own laws, controlled by its own government. Unlike renting computing power from Amazon AWS (a US company), sovereign cloud means Qatar owns and operates the infrastructure. No foreign company or government has access.",
      why_it_matters: "National security, government data privacy, and digital independence all depend on sovereign cloud. Countries without it rely entirely on foreign companies for critical digital infrastructure — a significant strategic vulnerability.",
    },
    investor: {
      short: 'Government-controlled cloud infrastructure; 20–40% revenue premium from public sector tenants',
      body: 'Sovereign cloud: cloud infrastructure physically in country, operated under national law, with contractual data sovereignty guarantees. Revenue premium: government workloads pay 20–40% above commercial rates. Anchor tenant model: national government as anchor, GCC public sector as secondary market. Long-term contracts (5–15 years) with inflation escalators.',
      why_it_matters: 'Sovereign cloud positioning unlocks public sector procurement budgets — guaranteed long-term contracts, non-price-sensitive buyers — inaccessible to foreign hyperscalers. Durable structural competitive advantage in the GCC market.',
    },
    minister: {
      short: "Qatar's independent, nationally controlled digital infrastructure — sovereignty in practice",
      body: "Sovereign cloud ensures that Qatar's government data — citizen records, defense systems, economic databases, AI model outputs — is stored and processed under Qatari law, on Qatari infrastructure, accessible only to Qatari-authorized personnel. Digital sovereignty is as real as territorial sovereignty.",
      why_it_matters: "Qatar's Vision 2030 digital transformation, government AI services, and national security systems cannot be built on infrastructure controlled by foreign governments or foreign companies. Sovereign cloud is the prerequisite for digital national independence.",
    },
    operator: {
      short: 'Physical isolation; Qatari citizen-only staff for classified zones; HSM under national key authority; NIAS compliant',
      body: 'Sovereign cloud technical requirements: physical isolation (dedicated halls or cages), Qatari-citizen-only operations staff for classified zones, encryption key management under national authority (on-site HSM), network isolation (no cross-border routing), and compliance with Qatar National Information Assurance Standard (NIAS). Annual government audit.',
      why_it_matters: 'Non-compliance with sovereign cloud requirements triggers immediate contract termination and potential national security review. Sovereign zone operations must be under a cleared Security Officer authority from day one of operations.',
    },
  },

  sovereign_AI: {
    beginner: {
      short: "AI systems built, trained, and controlled by Qatar itself — in Arabic, for Qatar",
      body: "Sovereign AI means a nation develops its own artificial intelligence models and systems — in its own language, on its own data, under its own control. Instead of relying on OpenAI or Google, Qatar would have its own AI that understands Arabic, knows Qatari and Gulf context, and is controlled entirely by Qatar.",
      why_it_matters: "AI is increasingly the technology that runs economies, governments, and militaries. A country without sovereign AI depends on foreign AI systems that may not serve its interests, may not speak its language, and may be unavailable in a crisis.",
    },
    investor: {
      short: 'National AI capability (models + compute + talent); premium GCC public sector revenue',
      body: 'Sovereign AI investment thesis: governments paying premium to develop national foundation models (Arabic LLMs, government-domain models), sovereign compute infrastructure, and national AI talent pipelines. Revenue: government contracts, regional SaaS, API licensing across GCC. Growing explicit budget line in every Gulf state — QIA, PIF, Mubadala all have sovereign AI mandates.',
      why_it_matters: 'Sovereign AI is a structural tailwind for Gulf AI infrastructure — governments are non-price-sensitive buyers of nationally controlled AI compute and services. First-mover advantage in Qatar creates durable competitive position in the GCC sovereign AI market.',
    },
    minister: {
      short: "Qatar's strategic AI independence — Arabic-first, nationally owned, sovereign in every dimension",
      body: "Sovereign AI means Qatar develops foundation AI models trained on Arabic language, Islamic context, Gulf culture, and Qatari-specific data — controlled entirely by Qatar. This cannot be outsourced to OpenAI or any foreign company. It requires national infrastructure, national data governance, national talent, and persistent national commitment.",
      why_it_matters: "Qatar's digital diplomacy, public services, defense applications, and economic competitiveness in the AI era all depend on having sovereign AI capability. Countries that don't develop it now will be permanently dependent on foreign AI providers with no path to independence.",
    },
    operator: {
      short: 'Isolated GPU cluster; national model registry; Qatari-only access to training data; NIAS compliance',
      body: 'Sovereign AI infrastructure: GPU cluster physically isolated from commercial zones, national model registry (versioned, auditable, immutable), training data stored in Qatar under data residency law, inference endpoints via national API gateway only. Minimum GPU footprint for foundation model training: 512–4,096 H100 equivalents.',
      why_it_matters: 'Sovereign AI operations require strict separation of duties — infrastructure operator never has access to model weights or training data. Only compute infrastructure access is granted. This boundary must be enforced contractually and technically from day one.',
    },
  },

};

// ---------------------------------------------------------------------------
// TECHNICAL TERMS CATALOG (for simplifyTechnicalTerm)
// Each term: 1-line string per audience
// ---------------------------------------------------------------------------

const TERMS = {
  liquid_cooling: {
    beginner: 'Water pipes carry heat away from AI chips — far more efficient than blowing cold air over them.',
    investor: 'CDU/DLC-based direct liquid cooling; enables > 30 kW/rack AI deployments; prerequisite for H100/B200 clusters.',
    minister: "Water-based cooling technology that makes high-performance AI hardware viable in Qatar's climate.",
    operator: 'CDU primary/secondary loop; 18–22°C supply, 40–45°C return; mandatory above 30 kW/rack average.',
  },
  powered_shell: {
    beginner: 'A building with power and cooling ready — customers install their own computers inside.',
    investor: 'Shell-and-core facility; developer delivers power/cooling infrastructure; tenant fits IT — hyperscaler standard model.',
    minister: 'AI-ready building infrastructure that international cloud companies customize to their own specifications.',
    operator: 'Handover boundary at IT distribution board; IT infrastructure from that point is entirely tenant responsibility.',
  },
  NNN_lease: {
    beginner: 'A rent contract where the tenant pays all taxes, insurance, and maintenance on top of the rent.',
    investor: 'Triple-net lease: tenant bears property tax, insurance, and maintenance obligations; landlord receives stable net rent.',
    minister: 'Long-term contract structure where international companies bear all operating costs — landlord just collects rent.',
    operator: 'Tenant responsible for all M&E maintenance, insurance, and taxes; landlord retains structural envelope liability only.',
  },
  rack_density: {
    beginner: 'How much computing power fits in one server cabinet — AI racks need 5–10× more than regular ones.',
    investor: 'kW per rack; AI training requires 40–100+ kW/rack vs. 5–15 kW standard enterprise.',
    minister: 'AI computing intensity per cabinet — higher density means more AI capacity per square meter of floor space.',
    operator: 'Average and peak kW/rack by hall; size CDU at 120% of peak; floor load minimum 15 kN/m².',
  },
  PUE: {
    beginner: 'Efficiency score for datacenters — how much energy is wasted on cooling vs. actual computing. Lower is better.',
    investor: 'Power Usage Effectiveness: total facility power / IT power; best-in-class AI 1.10–1.25 liquid-cooled.',
    minister: 'Energy efficiency ratio; directly impacts carbon footprint, energy cost, and sustainability commitments.',
    operator: 'Monitor hourly by hall; target < 1.25 liquid-cooled; DCIM alert above 1.40 in winter.',
  },
  tier_iii: {
    beginner: 'Industry reliability standard — backup systems mean planned maintenance never causes downtime.',
    investor: 'Uptime Institute Tier III: N+1 redundancy, concurrent maintainability, 99.982% uptime, 1.6 hours downtime/year.',
    minister: 'International standard ensuring AI infrastructure can be maintained without interrupting tenant services.',
    operator: 'Concurrent maintainability confirmed in SLD; zero planned single points of failure; Uptime Institute certification required.',
  },
  tier_iv: {
    beginner: 'Highest reliability standard — the facility keeps running even if something breaks unexpectedly.',
    investor: 'Uptime Institute Tier IV: 2N+1 redundancy, fault tolerant, 99.9995% uptime, 26 minutes downtime/year.',
    minister: 'Highest international standard — zero planned or unplanned downtime, required for sovereign and defense AI.',
    operator: '2N+1 active-active power and cooling paths; all maintenance without interrupting either path; zero SPOFs.',
  },
  sovereign_cloud: {
    beginner: "Cloud computing owned and operated by Qatar's government — national data stays under national control.",
    investor: 'Government-controlled cloud infrastructure generating 20–40% revenue premium over commercial rates from public sector.',
    minister: "National digital sovereignty infrastructure — Qatar's data under Qatari law, operated by Qatari personnel.",
    operator: 'Physical isolation, Qatari-citizen staff, on-site HSM under national key authority, NIAS compliance, annual audit.',
  },
  sovereign_ai: {
    beginner: "AI built and controlled by Qatar — in Arabic, on Qatari data, owned by Qatar.",
    investor: 'National AI models + compute + talent; premium non-price-sensitive GCC public sector revenue.',
    minister: "Qatar's strategic AI independence — Arabic-first foundation models under full national sovereign control.",
    operator: 'Isolated GPU cluster, national model registry, Qatari-only data access, NIAS compliance from day one.',
  },
  // alias for camelCase input
  sovereign_AI: {
    beginner: "AI built and controlled by Qatar — in Arabic, on Qatari data, owned by Qatar.",
    investor: 'National AI models + compute + talent; premium non-price-sensitive GCC public sector revenue.',
    minister: "Qatar's strategic AI independence — Arabic-first foundation models under full national sovereign control.",
    operator: 'Isolated GPU cluster, national model registry, Qatari-only data access, NIAS compliance from day one.',
  },
  BTS: {
    beginner: 'Build-to-suit — designing and building a datacenter specifically for one customer before they move in.',
    investor: 'Custom development against pre-signed long-term tenant lease; eliminates speculative vacancy risk.',
    minister: "Purpose-built national AI infrastructure that embeds Qatar's sovereign specifications from the design stage.",
    operator: 'Tenant spec freeze at RIBA Stage 2; formal change control mandatory; cost and schedule impact assessed for every change.',
  },
  hyperscale_lease: {
    beginner: "A massive long-term rental deal with a global tech giant for 20+ megawatts of computing space.",
    investor: '≥ 20MW single-tenant NNN lease, 10–20 years; commands 15–20% yield compression vs. multi-tenant.',
    minister: "Long-term commitment from a global cloud provider to operate in Qatar — validating national AI ambitions.",
    operator: '6–18 month sales cycle; dedicated technical account manager; security audit and power review standard.',
  },
  N_plus_1: {
    beginner: 'Having one spare for every critical system — one fails, a backup takes over automatically.',
    investor: 'N+1 redundancy: one additional unit per system beyond operational minimum; Tier III standard.',
    minister: 'Engineering resilience ensuring every critical system has an immediate operational backup.',
    operator: 'Size all equipment for N active + 1 standby; test failover under load quarterly; document in ops runbook.',
  },
  air_cooling: {
    beginner: 'Traditional datacenter cooling using large air conditioning units — works for standard servers, not AI.',
    investor: 'CRAC/CRAH-based; viable to 20 kW/rack; PUE 1.4–1.6 in hot climates; insufficient for AI GPU clusters.',
    minister: 'Standard cooling technology for traditional computing — not suitable as the sole solution for modern AI infrastructure.',
    operator: 'CRAC/CRAH with hot/cold aisle containment; adequate below 15 kW/rack average; CFD modelling mandatory above 12 kW.',
  },
  transformer_lead_time: {
    beginner: 'The 18–36 months needed to receive the giant electrical component that powers the whole building.',
    investor: '18–36 month critical path procurement; must be ordered at financial close, not at construction completion.',
    minister: 'Key infrastructure constraint requiring early budget authorization — ordering cannot wait for construction milestones.',
    operator: 'Order 33/11kV transformer at FID; FAT at 60% completion; on critical path Gantt from project inception.',
  },
  grid_approval: {
    beginner: "Government permission to connect to Qatar's electricity grid — a 12–24 month regulatory process.",
    investor: 'Kahramaa regulatory permit; 12–24 months; must run in parallel with design and transformer procurement.',
    minister: 'Kahramaa grid connection authorization — requires senior coordination for large AI campus power loads.',
    operator: 'Load flow study to Kahramaa at RIBA Stage 2; dedicated utility liaison assigned from project inception.',
  },
  water_permit: {
    beginner: "Qatar government permission to use water for cooling — liquid cooling nearly eliminates this requirement.",
    investor: 'ASHGHAL water abstraction permit; closed-loop liquid cooling reduces water consumption to near zero and eliminates permit risk.',
    minister: 'National water authorization for cooling — mandating liquid cooling technology in AI facilities eliminates this dependency.',
    operator: 'ASHGHAL application with consumption calc, recycling plan, discharge spec, ESIA section; liquid CDU avoids requirement.',
  },
  redundancy: {
    beginner: 'Backup systems for power, cooling, and networking — so one failure never causes a complete outage.',
    investor: 'System redundancy tier (N+1, 2N, 2N+1); determines Uptime Institute rating and MEP capex uplift.',
    minister: 'Engineering resilience through backup systems — national digital infrastructure continues under any single failure.',
    operator: 'Redundancy matrix by system; annual failover testing under load; 2N UPS mandatory for AI deployments.',
  },
  allocation_risk: {
    beginner: "The risk you can't get enough AI chips to fill your datacenter, even with full budget.",
    investor: 'GPU supply constraint risk; mitigate with NVIDIA CSP MPA; never sign customer SLAs without confirmed hardware dates.',
    minister: 'Strategic risk that global AI chip shortages delay national AI infrastructure — government-level NVIDIA engagement required.',
    operator: 'Track GPU PO and ship dates weekly; 15% hardware buffer above contracted SLA capacity; no exceptions.',
  },
  CAPEX_per_MW: {
    beginner: 'Construction cost per unit of computing power — like price per square meter but for capacity.',
    investor: 'Total project capex / IT-ready MW; AI-ready benchmark $7–10M/MW; fully fitted AI cluster $12–18M/MW.',
    minister: "Construction cost efficiency per unit of AI capacity — confirms competitive value-for-money against global benchmarks.",
    operator: 'Decompose by cost category; MEP most volatile; weekly earned-value tracking mandatory from month 3.',
  },
  DSCR: {
    beginner: 'Can the project earn enough to pay its bank loans? DSCR above 1.2× means yes — comfortably.',
    investor: 'EBITDA / debt service; lender covenant minimum 1.20–1.35×; AI anchor leases achieve 1.5–2.0× stabilized.',
    minister: 'Measure of AI infrastructure financial self-sufficiency — no government support needed for debt service.',
    operator: 'NOI / (P+I) monthly; maintain 15% buffer above minimum covenant; alert immediately on downward trend.',
  },
  NPV: {
    beginner: "All the project's future earnings converted to today's value — positive means it's worth doing.",
    investor: 'Present value of project cash flows at hurdle rate minus capex; positive = value above cost of capital.',
    minister: 'Net economic value created for Qatar in current money — directly comparable across national investment priorities.',
    operator: 'Σ DCF − capex; stress-test ±2% discount rate, ±20% revenue; recalculate at each phase gate.',
  },
  exit_multiple: {
    beginner: 'Selling price divided by annual earnings — higher means the business is valued more highly by buyers.',
    investor: 'EV/EBITDA at exit; stabilized AI assets 22–35×; most sensitive single variable in IRR model.',
    minister: 'National asset value at maturity — demonstrates total wealth creation from AI infrastructure investment.',
    operator: 'Driven by WAULT; every year above 5 adds 1–2× to exit multiple — structure long leases from day one.',
  },
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Returns a structured explanation of a financial or infrastructure metric.
 * @param {string} metric
 * @param {'beginner'|'investor'|'minister'|'operator'} audience
 * @returns {{ short: string, body: string, why_it_matters: string }}
 */
export function explainMetric(metric, audience = 'beginner') {
  if (!SUPPORTED_AUDIENCES.includes(audience)) {
    throw new Error(`Unknown audience "${audience}". Supported: ${SUPPORTED_AUDIENCES.join(', ')}`);
  }

  const entry = METRICS[metric];
  if (!entry) {
    return {
      short: `${metric} — not yet in catalog.`,
      body: `No explanation available for "${metric}". Add it to the METRICS catalog in oracle-explainability.js.`,
      why_it_matters: 'N/A',
    };
  }

  return entry[audience];
}

/**
 * Returns a plain-language explanation of an investment recommendation.
 * @param {string|object} recommendation
 * @param {'beginner'|'investor'|'minister'|'operator'} audience
 * @returns {{ short_summary: string, why_this_recommendation: string, key_tradeoff: string, plain_action: string }}
 */
export function explainRecommendation(recommendation, audience = 'beginner') {
  if (!SUPPORTED_AUDIENCES.includes(audience)) {
    throw new Error(`Unknown audience "${audience}". Supported: ${SUPPORTED_AUDIENCES.join(', ')}`);
  }

  const recText = typeof recommendation === 'object'
    ? (recommendation.text || recommendation.recommendation || JSON.stringify(recommendation))
    : String(recommendation);

  const lower = recText.toLowerCase();

  if (lower.includes('tier iv') || lower.includes('tier 4') || lower.includes('upgrade to tier')) {
    return _tierUpgradeExplanation(recText, audience);
  }
  if (lower.includes('liquid cool') || lower.includes('deploy cdu') || lower.includes('cooling upgrade')) {
    return _liquidCoolingExplanation(recText, audience);
  }
  if (lower.includes('hyperscale') || lower.includes('anchor tenant') || lower.includes('pre-lease')) {
    return _hyperscaleLeaseExplanation(recText, audience);
  }
  if (lower.includes('gpu') && (lower.includes('order') || lower.includes('allocat') || lower.includes('procure'))) {
    return _gpuAllocationExplanation(recText, audience);
  }
  if (lower.includes('sovereign')) {
    return _sovereignExplanation(recText, audience);
  }
  if (lower.includes('irr') || lower.includes('return') || lower.includes('equity')) {
    return _financialOptimizationExplanation(recText, audience);
  }

  return _genericRecommendationExplanation(recText, audience);
}

/**
 * Returns a single-line plain-language definition of a technical term.
 * @param {string} term
 * @param {'beginner'|'investor'|'minister'|'operator'} audience
 * @returns {string}
 */
export function simplifyTechnicalTerm(term, audience = 'beginner') {
  if (!SUPPORTED_AUDIENCES.includes(audience)) {
    throw new Error(`Unknown audience "${audience}". Supported: ${SUPPORTED_AUDIENCES.join(', ')}`);
  }

  // Normalize: camelCase → snake_case first, then lowercase + collapse separators
  const snake = term.replace(/([a-z])([A-Z])/g, '$1_$2');
  const normalized = snake.toLowerCase().replace(/[\s\-\/]+/g, '_').replace(/[^a-z0-9_]/g, '');

  const entry = TERMS[normalized];
  if (entry) return entry[audience];

  // Fallback to METRICS short description
  const metricEntry = METRICS[normalized];
  if (metricEntry && metricEntry[audience]) {
    return metricEntry[audience].short;
  }

  return `${term} — not yet in catalog. Add to TERMS in oracle-explainability.js.`;
}

// ---------------------------------------------------------------------------
// PRIVATE HELPERS — recommendation explainers
// ---------------------------------------------------------------------------

function _tierUpgradeExplanation(rec, audience) {
  const explanations = {
    beginner: {
      short_summary: 'Upgrade the building to the highest reliability standard for government use.',
      why_this_recommendation: 'Tier IV means the facility survives any single equipment failure without going offline. Government and defense clients require this level of resilience for critical AI workloads.',
      key_tradeoff: 'Costs 25–40% more to build, but unlocks premium sovereign and defense contracts that pay significantly more over the long term.',
      plain_action: 'Approve Tier IV for sovereign and defense zones; use Tier III for commercial zones to control total construction cost.',
    },
    investor: {
      short_summary: 'Tier IV specification for sovereign zones; Tier III for commercial — maximize return per capex dollar.',
      why_this_recommendation: 'Tier IV unlocks sovereign and defense tenants (20–30% revenue premium, long WAULT) while 2N+1 redundancy maximizes exit multiple. Dual-zone design controls total MEP capex.',
      key_tradeoff: 'Tier IV MEP capex premium of 25–40% vs. Tier III; justified when sovereign/defense revenue exceeds 30% of total income and WAULT uplift improves exit multiple materially.',
      plain_action: 'Approve dual-zone design: Tier IV sovereign hall Phase 1, Tier III commercial halls Phases 2–3. Run IRR comparison before committing.',
    },
    minister: {
      short_summary: 'Build government AI infrastructure to the highest international standard.',
      why_this_recommendation: "Tier IV is the non-negotiable standard for national security AI, defense AI, and sovereign data systems. Qatar's credibility as a serious AI sovereign power requires Tier IV for all government-designated zones.",
      key_tradeoff: 'Higher construction cost for sovereign zones — justified as a national security investment, not purely a commercial one.',
      plain_action: 'Mandate Tier IV for sovereign and defense halls in the national AI campus — enshrine in technical specifications before tender.',
    },
    operator: {
      short_summary: 'Implement 2N+1 active-active power and cooling for sovereign zone; Tier III for commercial.',
      why_this_recommendation: 'Tier IV is contractually required for sovereign tenants. Government SLAs mandate fault-tolerant infrastructure — non-compliance triggers immediate contract termination.',
      key_tradeoff: 'Tier IV adds operational complexity and change management rigor — dual active paths require more demanding maintenance procedures.',
      plain_action: 'Design sovereign SLD for 2N+1 active-active; engage Uptime Institute at RIBA Stage 2; Tier IV-certified commissioning manager mandatory.',
    },
  };
  return explanations[audience];
}

function _liquidCoolingExplanation(rec, audience) {
  const explanations = {
    beginner: {
      short_summary: 'Install water-based cooling for the AI computer racks.',
      why_this_recommendation: 'The latest AI chips generate enormous heat that air conditioning cannot handle efficiently. Liquid cooling is like switching from a hand fan to industrial air conditioning — vastly more effective and far cheaper to run.',
      key_tradeoff: 'More expensive to install upfront, but saves millions in electricity bills annually and enables hosting the most powerful AI hardware.',
      plain_action: 'Approve liquid cooling for all AI halls before construction starts — retrofitting later costs 3× more and delays tenant move-in.',
    },
    investor: {
      short_summary: 'Deploy CDU liquid cooling for all AI halls (> 30 kW/rack); pre-install infrastructure for all zones.',
      why_this_recommendation: 'Liquid cooling reduces PUE by 0.10–0.20 (~$4–8M/year OPEX at 100MW), enables H100/B200/B300 cluster deployments, and expands total addressable market to the highest-value AI workloads.',
      key_tradeoff: 'CDU capex $25–50K per rack row — payback from OPEX savings alone in 3–5 years. Without it, the facility cannot compete for premium AI tenants.',
      plain_action: 'Approve CDU deployment for Phase 1 AI halls; pre-install pipe infrastructure in all zones for marginal cost at construction.',
    },
    minister: {
      short_summary: 'Mandate liquid cooling for national AI infrastructure — a technical and sustainability requirement.',
      why_this_recommendation: "Qatar's climate requires liquid cooling for competitive AI infrastructure. Without it, the national campus has higher energy costs, higher carbon footprint, and cannot attract leading hyperscale tenants.",
      key_tradeoff: 'Higher initial capex, offset by lower long-term energy costs and access to the full AI hardware market including next-generation chips.',
      plain_action: "Mandate liquid cooling in the national AI campus RFP — align with Qatar National Vision 2030 energy efficiency and sustainability commitments.",
    },
    operator: {
      short_summary: 'Deploy N+1 CDUs per zone; monitor supply/return delta T continuously; target delta T 20–25°C.',
      why_this_recommendation: 'CDU failure at high rack density causes thermal throttling within 2 minutes and hardware damage within 10 minutes — direct SLA breach and customer hardware loss liability.',
      key_tradeoff: 'N+1 CDU adds 20% cooling capex; essential insurance against single CDU failure in AI halls — no alternative mitigation exists.',
      plain_action: 'Procure N+1 CDUs per 2-row zone; install delta T sensors; configure DCIM alert at delta T < 15°C (fouling indicator); test failover monthly.',
    },
  };
  return explanations[audience];
}

function _hyperscaleLeaseExplanation(rec, audience) {
  const explanations = {
    beginner: {
      short_summary: 'Sign a long-term deal with a major tech company before construction finishes.',
      why_this_recommendation: "Having Amazon, Google, or Microsoft committed before the building opens means guaranteed income from day one — dramatically reducing the financial risk of the entire project.",
      key_tradeoff: 'A small early-bird discount to secure commitment is worth far more in financial certainty than the foregone rent.',
      plain_action: 'Engage hyperscale companies at project announcement stage — never wait for construction completion to start negotiations.',
    },
    investor: {
      short_summary: 'Secure hyperscale anchor pre-lease at or before financial close.',
      why_this_recommendation: 'Pre-committed hyperscale lease enables construction debt financing at tighter spreads, de-risks occupancy ramp, accelerates DSCR coverage, and directly improves exit multiple via WAULT increase.',
      key_tradeoff: 'Early-bird discount of 5–15% vs. stabilized market rate; offset by financing savings (150–200 bps) and IRR improvement from faster ramp.',
      plain_action: 'Execute LOI with at least one hyperscale tenant before construction financing drawdown; target 20–40% of Phase 1 capacity pre-committed.',
    },
    minister: {
      short_summary: 'Secure commitment from a global cloud provider before ground-breaking.',
      why_this_recommendation: "A hyperscale anchor commitment before construction is the clearest possible validation of Qatar's AI infrastructure strategy — and unlocks all other financing.",
      key_tradeoff: 'Agreeing early commercial terms is standard global practice and positions Qatar favorably in hyperscaler regional expansion planning.',
      plain_action: 'Initiate G2G technology partnership discussions with hyperscaler governments that include AI infrastructure anchor tenancy as a key deliverable.',
    },
    operator: {
      short_summary: 'Execute LOI at 50% design completion; begin technical due diligence process immediately.',
      why_this_recommendation: 'Hyperscalers require 6–18 months from first engagement to signed lease. Starting at LOI stage cuts total sales cycle significantly.',
      key_tradeoff: 'Technical due diligence requires significant internal resource — 6–12 months of dedicated design, legal, and security team commitment.',
      plain_action: 'Assign dedicated hyperscale relationship manager and technical account manager at project launch; initiate NVIDIA NPN/CSP partnership simultaneously.',
    },
  };
  return explanations[audience];
}

function _gpuAllocationExplanation(rec, audience) {
  const explanations = {
    beginner: {
      short_summary: 'Order the AI chips immediately — they take 18–24 months to arrive.',
      why_this_recommendation: "NVIDIA AI chips are the world's most in-demand technology. The waiting list is 18–24 months. Ordering today means chips arrive when the building opens. Ordering late means the building sits empty.",
      key_tradeoff: "Paying for chips before customers are signed is a risk — but having customers and no chips to serve them is far worse.",
      plain_action: 'Place the GPU purchase order with NVIDIA at project financial close — never wait for building completion.',
    },
    investor: {
      short_summary: 'Execute NVIDIA MPA at financial close; synchronize GPU delivery with facility energization.',
      why_this_recommendation: 'GPU delivery timeline (18–24 months) is the critical path to revenue in GPU cloud model. Misalignment between facility readiness and GPU delivery is the most common cause of delayed revenue in AI infrastructure projects.',
      key_tradeoff: '100% prepayment or large deposit required — capital tied up 18–24 months before revenue recognition. Model in working capital requirements at financial close.',
      plain_action: 'Include GPU procurement in capex schedule; engage NVIDIA Government Sales + CSP team for priority allocation; model delivery risk in financial model.',
    },
    minister: {
      short_summary: 'Secure national GPU allocation through a government-level partnership with NVIDIA.',
      why_this_recommendation: "Qatar cannot build national AI infrastructure without AI chips. Given global scarcity, a government-to-company partnership with NVIDIA — similar to what Saudi Arabia and UAE have achieved — is the most effective path to guaranteed allocation.",
      key_tradeoff: 'Government agreements may include commitments on AI talent development or export compliance — manageable requirements for access to strategic allocation.',
      plain_action: 'Initiate ministerial engagement with NVIDIA government relations as a national technology partnership, not a standard procurement.',
    },
    operator: {
      short_summary: 'Weekly GPU PO and ship date tracking; 15% buffer minimum; no SLAs signed without delivery certainty.',
      why_this_recommendation: 'Signing customer SLAs without confirmed GPU delivery dates is the most common operational error in GPU cloud — results in SLA breach, revenue clawback, and customer loss.',
      key_tradeoff: 'Maintaining 15% buffer stock ties up capital in idle hardware — acceptable insurance cost for SLA protection.',
      plain_action: 'GPU delivery tracking spreadsheet from week 1; weekly confirmed ship date review; customer SLA signing only after GPU ship confirmation — no exceptions.',
    },
  };
  return explanations[audience];
}

function _sovereignExplanation(rec, audience) {
  const explanations = {
    beginner: {
      short_summary: "Build computing infrastructure that Qatar owns and fully controls.",
      why_this_recommendation: "Qatar's most sensitive government data, national AI systems, and defense applications cannot run on foreign company servers. Qatar needs its own infrastructure under its own laws.",
      key_tradeoff: "More expensive than buying cloud from US companies. But permanent dependence on foreign infrastructure for Qatar's most strategic digital systems is an unacceptable national vulnerability.",
      plain_action: "Allocate a dedicated zone in the national AI campus for sovereign-only workloads — operated by Qatari personnel, physically separate from commercial zones.",
    },
    investor: {
      short_summary: 'Sovereign zone with premium government contract revenue — bond-like cash flows at price premium.',
      why_this_recommendation: "Sovereign zones generate 20–40% revenue premium over commercial rates from non-price-sensitive government buyers. Long-term government contracts with CPI escalation create highly durable cash flows.",
      key_tradeoff: 'Sovereign zone requires higher security capex ($1–2M/MW premium) — justified by revenue premium and political protection from competitive pressure.',
      plain_action: 'Include dedicated sovereign hall in Phase 1; structure government anchor lease with CPI escalation and 10-year minimum term.',
    },
    minister: {
      short_summary: "Establish Qatar's national AI sovereignty infrastructure — a strategic national imperative.",
      why_this_recommendation: "Qatar's Vision 2030 digital services, defense AI, national language models, and government data systems all require infrastructure Qatar owns and controls. This is non-delegable.",
      key_tradeoff: "Requires sustained national commitment. Continued dependence on foreign cloud providers permanently constrains Qatar's digital sovereignty — the long-term cost far exceeds the investment.",
      plain_action: "Establish a National AI Infrastructure Authority mandated to develop and operate sovereign AI compute, cloud, and model infrastructure for Qatar.",
    },
    operator: {
      short_summary: 'Physical isolation, national key management, Qatari-only staff — all from day one of operations.',
      why_this_recommendation: 'Sovereign cloud is operationally meaningless without genuine operational sovereignty. Foreign staff access or offshore encryption keys defeat the entire purpose of physical presence in Qatar.',
      key_tradeoff: 'Qatari-citizen staffing requirement limits talent pool — plan an 18-month training pipeline for sovereign operations staff before go-live.',
      plain_action: 'Design sovereign zone with dedicated access control, separate network fabric, on-site HSM, NIAS compliance checklist — all complete before first government workload arrives.',
    },
  };
  return explanations[audience];
}

function _financialOptimizationExplanation(rec, audience) {
  const explanations = {
    beginner: {
      short_summary: 'Improve how much money this investment returns per year.',
      why_this_recommendation: "The project's financial return (IRR) measures whether this is a good use of money. Improving it means making the investment work harder for every riyal committed.",
      key_tradeoff: 'Higher returns usually mean higher risk or longer commitment — the right balance depends on investor objectives.',
      plain_action: 'Review the three main levers: pre-committed revenue, construction cost control, and exit timing. Quantify each before deciding.',
    },
    investor: {
      short_summary: 'Optimize capital structure and revenue timing to maximize levered IRR.',
      why_this_recommendation: 'Levered IRR is the primary return metric. Key optimization levers: pre-committed anchor leases (de-risk ramp), senior debt sizing (increase leverage), OPEX efficiency (EBITDA margin), and exit timing (align with premium multiples).',
      key_tradeoff: 'Higher leverage improves IRR in base case but amplifies downside — model DSCR under 80% occupancy stress before increasing debt sizing.',
      plain_action: 'Re-model with: 40% pre-committed capacity, 60% LTV construction debt, PUE 1.25, exit at year 7 at 25× EBITDA. Compare IRR delta to base case.',
    },
    minister: {
      short_summary: "Maximize Qatar's return on national AI infrastructure investment.",
      why_this_recommendation: "Every percentage point of IRR improvement means more national wealth created per riyal of public capital invested — directly relevant to national capital allocation efficiency.",
      key_tradeoff: 'Pursuing maximum financial return may conflict with strategic objectives (sovereignty requirements, regional access pricing) — define the balance explicitly.',
      plain_action: 'Establish a dual-return framework: financial IRR target (≥ 15% levered) plus strategic return metrics (sovereign AI capacity, Qatari tech employment, digital GDP contribution).',
    },
    operator: {
      short_summary: 'Identify and execute the highest-impact operational levers on project IRR.',
      why_this_recommendation: "Operational decisions — occupancy ramp speed, PUE improvement, OPEX control — are directly within the operator's control and have measurable IRR impact.",
      key_tradeoff: 'PUE improvement and OPEX reduction require upfront capex and operational change — prioritize initiatives with < 3-year payback.',
      plain_action: 'Quarterly IRR sensitivity review: identify top 3 operational levers, model impact per lever, assign owner and deadline, track at investment committee.',
    },
  };
  return explanations[audience];
}

function _genericRecommendationExplanation(rec, audience) {
  const toneMap = {
    beginner: {
      short_summary: `Recommendation: ${rec.substring(0, 80)}${rec.length > 80 ? '...' : ''}`,
      why_this_recommendation: "This recommendation is designed to improve project performance, reduce risk, or increase the value of the investment.",
      key_tradeoff: "Every recommendation involves a tradeoff between cost, risk, and reward — ask your advisor to quantify the specific impact for this project.",
      plain_action: "Review with your project team, ask for a specific cost estimate and expected benefit, then decide.",
    },
    investor: {
      short_summary: `Action item: ${rec.substring(0, 100)}${rec.length > 100 ? '...' : ''}`,
      why_this_recommendation: "This recommendation targets a specific risk or opportunity in the project analysis — implementing it should improve IRR, DSCR, MOIC, or exit multiple.",
      key_tradeoff: "Quantify capex and resource requirement vs. projected impact on key metrics before approving.",
      plain_action: "Assign owner, set deadline, model financial impact, present at next investment committee.",
    },
    minister: {
      short_summary: `Strategic action: ${rec.substring(0, 100)}${rec.length > 100 ? '...' : ''}`,
      why_this_recommendation: "This recommendation addresses a strategic, regulatory, or financial dimension of Qatar's national AI infrastructure program.",
      key_tradeoff: "Understand policy, budget, and timeline implications before committing — request a full impact briefing.",
      plain_action: "Commission a technical assessment with clear budget, timeline, and policy implications before ministerial decision.",
    },
    operator: {
      short_summary: `Ops action: ${rec.substring(0, 100)}${rec.length > 100 ? '...' : ''}`,
      why_this_recommendation: "This recommendation addresses a technical, operational, or contractual issue identified in the facility or project analysis.",
      key_tradeoff: "Assess implementation risk, resource requirement, and schedule impact before execution.",
      plain_action: "Assign owner; create action plan with milestone dates and success metrics; report progress weekly.",
    },
  };
  return toneMap[audience];
}
