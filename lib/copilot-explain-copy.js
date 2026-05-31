// lib/copilot-explain-copy.js
//
// Static explain copy for every Simulator input field.
// No LLM. No fetch. Pure data.
//
// Structure: { [field_id]: { short, detail, unit?, range? } }

export const EXPLAIN_COPY = {

  // ── Input modes ─────────────────────────────────────────────────────────────

  mw_first: {
    short: 'Set MW first — ORACLE finds the required capital.',
    detail:
      'You decide how big the data center is (in megawatts of IT load). ORACLE calculates how much it will cost to build. Best starting point when you already have a land/power constraint.',
  },
  capital_first: {
    short: 'Set capital first — ORACLE finds the buildable MW.',
    detail:
      'You set the total investment envelope. ORACLE back-calculates the maximum MW you can build within that budget. Best when you have a fixed equity raise or project finance ticket.',
  },
  target_irr_first: {
    short: 'Set target IRR — ORACLE finds the lever to hit it.',
    detail:
      'You set the minimum acceptable return. ORACLE identifies which single lever (pricing, build cost, debt, or size) must move to reach that target. Use this to reverse-engineer the deal structure.',
  },

  // ── Capacity ─────────────────────────────────────────────────────────────────

  total_mw: {
    short: 'Total IT load capacity in megawatts.',
    detail:
      'This is the MW of computing power the data center will deliver to tenants — not the total power drawn (add ~10% for PUE overhead). '
      + '20 MW is a small enterprise DC. 50–100 MW is a typical hyperscale shell. 300+ MW is a sovereign-scale campus. '
      + 'Below 20 MW, fixed costs (land, substation, design) compress margins significantly.',
    unit: 'MW',
    range: '10 MW — 1,000 MW',
  },

  // ── Deal models ──────────────────────────────────────────────────────────────

  powered_shell: {
    short: 'Build the shell, lease it to a big operator for 15–20 years.',
    detail:
      'You build the empty data center (structure, power, land). An operator like Equinix or a hyperscaler moves in, equips it, and pays NNN rent. '
      + 'You keep the building and your brand. The operator pays all operating costs (power, staff, maintenance). '
      + 'Revenue is ~33% of full-ops but risk is very low — no operational exposure, stable 15–20yr cash flow, '
      + 'highest bankability score. Closest comparable: Meta × Blue Owl Hyperion ($27B, 2025).',
  },
  branded_jv: {
    short: 'Co-own 51/49 with an operator. Both names on the building.',
    detail:
      'You contribute 51% of CAPEX, the operator contributes 49%. Both brands are on the building. '
      + 'You keep board control; the operator runs day-to-day. Higher return ceiling than Powered Shell, '
      + 'but slower to close (JV negotiation is complex) and less bankable (shared governance).',
  },
  manage_only: {
    short: 'Operator runs everything. You collect a management fee.',
    detail:
      'You own the asset. The operator manages it entirely and earns a fee. You capture the full upside '
      + 'of a well-run data center without operating it yourself. Best margin potential but highest execution dependency.',
  },
  white_label: {
    short: 'Operator brand on the building. You own the asset invisibly.',
    detail:
      'You finance and own the asset, but the operator\'s brand is on the building. Typical in sovereign markets '
      + 'where a local entity must appear as the operator. Good bankability, but you lose brand visibility.',
  },
  neocloud_gpu: {
    short: 'GPU-as-a-service. Fastest deployment, highest price/kW.',
    detail:
      'AI GPU clusters rented by the hour or month. Revenue/kW is 3–5× higher than shell leases, '
      + 'but utilization risk is higher and GPU supply can be constrained. Best for AI-first cases '
      + 'where you want to capture the premium GPU pricing window (2024–2027).',
  },
  sovereign_ai: {
    short: 'Sovereign co-investment. Government as anchor partner.',
    detail:
      'The sovereign fund (QIA, Mubadala, PIF) co-invests and is the anchor offtake customer. '
      + 'Lowest cost of capital (ECA financing unlocked), strongest brand, but slowest to close '
      + 'and requires government process. Best for 300 MW+ platforms where ECA financing is critical.',
  },

  // ── Hardware mix ─────────────────────────────────────────────────────────────

  'hardware_mix.classic_pct': {
    short: 'Standard air-cooled server racks. Lower rev/kW.',
    detail:
      'Traditional enterprise and colocation racks (air-cooled, ~10–20 kW/rack). '
      + 'Lowest CAPEX/rack, most operator options, but revenue/MW is lowest. '
      + 'Suitable for general enterprise cloud workloads. Typically 20–40% of a diversified DC mix.',
    unit: '%',
    range: '0% — 80%',
  },
  'hardware_mix.liquid_pct': {
    short: 'Liquid-cooled high-density racks. Higher rev/kW.',
    detail:
      'Rear-door or direct liquid cooling for high-density racks (50–100+ kW/rack). '
      + 'Required for HPC and some AI training clusters. Higher CAPEX (cooling infra) '
      + 'but commands higher $/kW from advanced compute tenants.',
    unit: '%',
    range: '0% — 70%',
  },
  'hardware_mix.ai_pct': {
    short: 'AI GPU clusters. Highest rev/kW, highest demand.',
    detail:
      'Dedicated AI training and inference racks (GB200 NVL72, H100/H200 SXM5). '
      + 'Revenue/MW can reach 3–5× standard racks at current hyperscaler pricing. '
      + 'Requires liquid cooling, specific power density, and longer procurement lead times (9–12 months for GB200).',
    unit: '%',
    range: '0% — 100%',
  },
  'hardware_mix.utilization_pct': {
    short: 'Expected average occupancy of your IT capacity.',
    detail:
      'The fraction of your MW that will be actively leased or used on average over the year. '
      + 'A fully contracted take-or-pay hyperscale deal typically underwrites 80–85%. '
      + 'Below 72% signals over-building risk. Above 92% is a stress assumption — '
      + 'lenders typically cap the base case at 85–88% to preserve downside cushion.',
    unit: '%',
    range: '50% — 95%',
  },
  'hardware_mix.gpu_sku_id': {
    short: 'The GPU model driving AI cluster pricing.',
    detail:
      'GB200 NVL72: NVIDIA\'s 2025 flagship AI chip, highest $/hr but 9–12 month lead time. '
      + 'H100 SXM5: 2024 workhorse, widely available, $2–3/hr on spot. '
      + 'H200 SXM5: H100 successor with higher memory bandwidth, ~15% premium over H100. '
      + 'The GPU model affects the revenue/MW calculation in the engine.',
  },
  'hardware_mix.gpu_hour_price': {
    short: 'Your hourly GPU rental rate to tenants ($/GPU-hr).',
    detail:
      'The price you charge for GPU-hour access. Market range: $1.5–$2.5/hr for H100 on spot, '
      + '$3–$5/hr for reserved, $5–$8/hr for GB200 NVL72 premium. '
      + 'Higher prices improve revenue but reduce addressable demand. '
      + 'This field only affects NeoCloud GPU archetype calculations.',
    unit: '$/hr',
    range: '$1.00 — $8.00',
  },

  // ── Capital structure ────────────────────────────────────────────────────────

  debt_pct: {
    short: 'Share of total CAPEX financed by debt (ECA / project finance).',
    detail:
      'Typical Qatar sovereign structure: 55–65% ECA/project finance, 35–45% equity. '
      + 'At 60% debt, levered IRR is typically 3–5 points above unlevered IRR. '
      + 'Above 65% → DSCR risk. Below 40% → under-leveraged, missing return potential. '
      + 'ECA lenders (Export Credit Agencies) require DSCR ≥ 1.35 for drawdown.',
    unit: '%',
    range: '30% — 70%',
  },

  // ── IRR ──────────────────────────────────────────────────────────────────────

  irr: {
    short: 'Internal Rate of Return — your annualized return on invested equity.',
    detail:
      'IRR is the discount rate at which your investment breaks even (NPV = 0). '
      + 'A 20% IRR means $1 invested today returns $1 × (1.20)^n after n years. '
      + 'Qatar sovereign IC threshold: typically 18–22% unlevered. '
      + 'Below 14% = difficult to defend. Above 25% = aggressive assumption.',
    unit: '%',
  },

  // ── Other outputs ────────────────────────────────────────────────────────────

  npv: {
    short: 'Net Present Value — total value created at your cost of capital.',
    detail:
      'NPV discounts all future cash flows back to today using WACC. '
      + 'Positive NPV = the investment creates value above your hurdle rate. '
      + 'IC models typically use 10% WACC for Qatar sovereign infrastructure.',
    unit: '$',
  },
  dscr_stabilized: {
    short: 'Debt Service Coverage Ratio at stabilized revenue.',
    detail:
      'DSCR = EBITDA / annual debt service (interest + principal). '
      + 'ECA lenders require ≥ 1.30–1.35. Below 1.20 = covenant breach risk. '
      + 'Above 1.60 = strong credit quality, may unlock lower debt cost.',
  },
  payback_years: {
    short: 'Years to recover your initial equity investment from cash flows.',
    detail:
      'Payback measures how long until cumulative project cash flows equal your equity contribution. '
      + 'IC models typically require payback < 8–9 years. '
      + 'Below 6 years = very strong. Above 10 years = difficult to defend.',
    unit: 'years',
  },
};
