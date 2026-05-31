// lib/copilot-explain-copy.js
//
// Static explain copy for every Simulator input field.
// No LLM. No fetch. Pure data.
//
// Structure: { [field_id]: { short, detail, unit?, range? } }

export const EXPLAIN_COPY = {

  // ── Input modes ─────────────────────────────────────────────────────────────

  mw_first: {
    short: 'Fix IT Load (MW). Model solves for required CAPEX.',
    detail: 'Target IT capacity drives the required capital investment. Use when land or power constraints dictate maximum scale.',
  },
  capital_first: {
    short: 'Fix Total CAPEX ($). Model solves for IT Load.',
    detail: 'Capital envelope limits IT capacity. Use when investment size is the primary constraint (fixed equity or project finance limit).',
  },
  target_irr_first: {
    short: 'Fix Target IRR (%). Model solves for operational parameters.',
    detail: 'Minimum acceptable return dictates required pricing, build cost, debt, or scale. Use to reverse-engineer project viability thresholds.',
  },

  // ── Capacity ─────────────────────────────────────────────────────────────────

  total_mw: {
    short: 'Total IT load capacity (MW).',
    detail: 'Deliverable computing power to tenants (excludes PUE overhead). < 20 MW limits margins due to fixed costs. 50–100 MW aligns with hyperscale shells. 300+ MW requires sovereign-scale campus.',
    unit: 'MW',
    range: '10 MW — 1,000 MW',
  },

  // ── Deal models ──────────────────────────────────────────────────────────────

  powered_shell: {
    short: 'Powered Shell · 15–20 yr NNN Lease.',
    detail: 'Asset ownership without operational exposure. Operator assumes all opex and equips the shell. Highest bankability; lower absolute revenue.',
  },
  branded_jv: {
    short: 'Branded JV · 51/49 Operator Co-Investment.',
    detail: 'Shared CAPEX and brand visibility. Board control retained; operator manages day-to-day. Higher return ceiling; lower bankability due to shared governance.',
  },
  manage_only: {
    short: 'Asset Co. / OpCo Separation · Management Fee.',
    detail: 'Full asset ownership. Operator manages facility for a fee. Highest margin potential; execution dependency on operator performance.',
  },
  white_label: {
    short: 'White Label · Operator Brand.',
    detail: 'Invisible asset ownership with operator-branded facility. High bankability; forfeits brand visibility.',
  },
  neocloud_gpu: {
    short: 'NeoCloud GPU · Short-Term Compute Lease.',
    detail: 'GPU-as-a-Service model. Highest revenue per kW; elevated utilization and supply chain risk. Fast deployment profile.',
  },
  sovereign_ai: {
    short: 'Sovereign AI · Government Anchor.',
    detail: 'Government co-investment and anchor offtake. Lowest cost of capital (ECA eligible); strongest brand. Protracted closing process.',
  },

  // ── Hardware mix ─────────────────────────────────────────────────────────────

  'hardware_mix.classic_pct': {
    short: 'Standard Rack Density · Air Cooled.',
    detail: 'Standard enterprise/colocation racks (10–20 kW/rack). Lowest CAPEX per rack; lowest revenue per MW.',
    unit: '%',
    range: '0% — 80%',
  },
  'hardware_mix.liquid_pct': {
    short: 'High Density · Liquid Cooled.',
    detail: 'Advanced cooling for high-density racks (50–100+ kW/rack). Prerequisite for HPC and specific AI clusters. Higher CAPEX; premium revenue yield.',
    unit: '%',
    range: '0% — 70%',
  },
  'hardware_mix.ai_pct': {
    short: 'AI Cluster · Liquid Cooled.',
    detail: 'Dedicated AI training/inference infrastructure (e.g., GB200 NVL72). Premium revenue multiplier. Requires specialized power density and extended procurement (9–12 mo).',
    unit: '%',
    range: '0% — 100%',
  },
  'hardware_mix.utilization_pct': {
    short: 'Stabilized Utilization.',
    detail: 'Average leased IT capacity. Hyperscale take-or-pay baseline: 80–85%. Utilization < 72% risks margin compression; > 88% exceeds typical lender stress parameters.',
    unit: '%',
    range: '50% — 95%',
  },
  'hardware_mix.gpu_sku_id': {
    short: 'Target GPU Architecture.',
    detail: 'Chip model defining cluster pricing. GB200 NVL72: Premium yield, 9–12 mo lead. H100 SXM5: Standard baseline. H200 SXM5: Enhanced memory premium.',
  },
  'hardware_mix.gpu_hour_price': {
    short: 'GPU Rental Rate ($/hr).',
    detail: 'Hourly compute pricing. Spot range: $1.5–$2.5 (H100). Premium: $5–$8 (GB200 NVL72). Applies to NeoCloud GPU modeling only.',
    unit: '$/hr',
    range: '$1.00 — $8.00',
  },

  // ── IRR ──────────────────────────────────────────────────────────────────────

  irr: {
    short: 'Internal Rate of Return (IRR).',
    detail: 'Annualized return on invested equity (discount rate at NPV = 0). IC threshold typically 18–22% (unlevered). Returns < 14% generally non-viable.',
    unit: '%',
  },

  // ── Other outputs ────────────────────────────────────────────────────────────

  npv: {
    short: 'Net Present Value (NPV).',
    detail: 'Value generated above cost of capital (WACC). Baseline IC discount rate: 10%.',
    unit: '$',
  },
  dscr_stabilized: {
    short: 'Debt Service Coverage Ratio (DSCR).',
    detail: 'EBITDA relative to debt service. ECA minimum requirement: 1.30–1.35x. Ratios < 1.20x flag covenant breach risk.',
  },
  payback_years: {
    short: 'Payback Period.',
    detail: 'Years to recover initial equity. IC threshold: < 8–9 years. Payback < 6 years indicates strong cash yield.',
    unit: 'years',
  },
};
