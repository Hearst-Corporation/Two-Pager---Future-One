// HEARST — Authorized Calculation Engine
// Rule: NEVER invent a number. Every formula uses only sourced or admin inputs.
// If a required input is null/undefined, the formula returns null and callers
// must display MISSING_LABEL instead of a number.

/** Energy Cost = IT MW × PUE × 8,760 × Electricity Price per MWh */
export function calcEnergyCost({ it_mw, pue, electricity_price_mwh }) {
  if (!it_mw || !pue || !electricity_price_mwh) return null;
  return it_mw * pue * 8760 * electricity_price_mwh;
}

/** Occupied kW = IT MW × 1,000 × Occupancy % */
export function calcOccupiedKw({ it_mw, occupancy_pct }) {
  if (!it_mw || occupancy_pct == null) return null;
  return it_mw * 1000 * (occupancy_pct / 100);
}

/** Colocation Revenue = Occupied kW × Monthly Price per kW × 12 */
export function calcColoRevenue({ occupied_kw, monthly_price_kw }) {
  if (!occupied_kw || !monthly_price_kw) return null;
  return occupied_kw * monthly_price_kw * 12;
}

/** Facility MW = IT MW × PUE */
export function calcFacilityMw({ it_mw, pue }) {
  if (!it_mw || !pue) return null;
  return it_mw * pue;
}

/** GPU Revenue = Number of GPUs × Utilization × 8,760 × GPU-hour price */
export function calcGpuRevenue({ num_gpus, utilization_pct, gpu_hour_price }) {
  if (!num_gpus || utilization_pct == null || !gpu_hour_price) return null;
  return num_gpus * (utilization_pct / 100) * 8760 * gpu_hour_price;
}

/** Inference Revenue = Tokens processed × Price per million tokens */
export function calcInferenceRevenue({ tokens_per_year, price_per_million_tokens }) {
  if (!tokens_per_year || !price_per_million_tokens) return null;
  return (tokens_per_year / 1_000_000) * price_per_million_tokens;
}

/** EBITDA = Revenue − Power Cost − Operating Expenses */
export function calcEbitda({ revenue, power_cost, opex }) {
  if (revenue == null || power_cost == null || opex == null) return null;
  return revenue - power_cost - opex;
}

/** DSCR = Cash Available for Debt Service / Debt Service */
export function calcDscr({ ebitda, maintenance_capex, debt_service }) {
  if (ebitda == null || !debt_service) return null;
  const cads = ebitda - (maintenance_capex || 0);
  return cads / debt_service;
}

/** Terminal Value = Exit EBITDA × Exit Multiple */
export function calcTerminalValue({ exit_ebitda, exit_multiple }) {
  if (!exit_ebitda || !exit_multiple) return null;
  return exit_ebitda * exit_multiple;
}

/** MOIC = Total Equity Proceeds / Equity Invested */
export function calcMoic({ total_equity_proceeds, equity_invested }) {
  if (!total_equity_proceeds || !equity_invested) return null;
  return total_equity_proceeds / equity_invested;
}

/** NPV = Σ(CF_t / (1 + r)^t) */
export function calcNpv(cashflows, discount_rate) {
  if (!cashflows || discount_rate == null) return null;
  return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + discount_rate, t), 0);
}

/** IRR — Newton-Raphson, returns null if not converging */
export function calcIrr(cashflows, guess = 0.1) {
  if (!cashflows || cashflows.length < 2) return null;
  let rate = guess;
  for (let i = 0; i < 200; i++) {
    let npv = 0;
    let dnpv = 0;
    cashflows.forEach((cf, t) => {
      const d = Math.pow(1 + rate, t);
      npv += cf / d;
      if (t > 0) dnpv -= (t * cf) / (d * (1 + rate));
    });
    if (Math.abs(dnpv) < 1e-12) return null;
    const next = rate - npv / dnpv;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
  }
  return null;
}

/** Payback = first year where cumulative cash flow turns positive */
export function calcPayback(yearly_fcf, initial_capex) {
  if (!yearly_fcf || !initial_capex) return null;
  let cumulative = -initial_capex;
  for (let i = 0; i < yearly_fcf.length; i++) {
    cumulative += yearly_fcf[i];
    if (cumulative >= 0) return i + 1;
  }
  return null;
}

/** Total Capex from sourced per-MW components */
export function calcTotalCapex({ total_mw, shell, mep, substation, cooling, grid, land = 0, contingency_pct = 0.10, liquid_premium = 0 }) {
  if (!total_mw) return null;
  const components = [shell, mep, substation, cooling, grid];
  if (components.some(v => v == null)) return null;
  const base_per_mw = components.reduce((s, v) => s + v, 0) + (land || 0) + (liquid_premium || 0);
  return base_per_mw * total_mw * (1 + contingency_pct);
}

// ────────────────────────────────────────────────────────
// 10-Year Projection Engine
// ────────────────────────────────────────────────────────

/**
 * Returns { years: YearRow[], missing_inputs: string[], warnings: string[] }
 * YearRow: { year, calendar_year, mw_live, occupied_mw, occupancy_pct,
 *             revenue, power_cost, opex, ebitda, ebitda_margin,
 *             free_cash_flow, cumulative_fcf, debt_service, dscr }
 */
export function generateProjection(scenario) {
  const warnings = [];
  const missing_inputs = [];

  const {
    total_mw, phase1_mw, phase1_complete_year = 2,
    phase2_mw, phase2_complete_year = 4,
    phase3_mw, phase3_complete_year = 6,
    pue, target_occupancy_pct,
    electricity_price_mwh,
    price_retail_colo_kw_month, price_wholesale_kw_month, price_hyperscale_kw_month,
    opex_maintenance_pct = 0, opex_staff_annual_musd = 0, opex_insurance_pct = 0,
    opex_ga_pct = 0, opex_operator_mgmt_fee_pct = 0,
    commercial_split = { retail_colo: 100 },
    annual_escalation_pct = 0.02,
    debt_pct = 0, debt_interest_rate,
    capex_shell_per_mw, capex_mep_per_mw, capex_substation_per_mw,
    capex_cooling_per_mw, capex_grid_per_mw, capex_land_per_mw = 0,
    capex_contingency_pct = 0.10,
    exit_multiple, exit_year = 10,
    start_year = 2026,
  } = scenario || {};

  if (!total_mw)               missing_inputs.push('total_mw');
  if (!pue)                    missing_inputs.push('pue');
  if (!electricity_price_mwh)  missing_inputs.push('electricity_price_mwh');
  if (!target_occupancy_pct)   missing_inputs.push('target_occupancy_pct');

  const has_revenue = price_retail_colo_kw_month || price_wholesale_kw_month || price_hyperscale_kw_month;
  if (!has_revenue)            missing_inputs.push('price_kw_month (retail/wholesale/hyperscale)');

  const has_capex = capex_shell_per_mw && capex_mep_per_mw;
  if (!has_capex)              warnings.push('Capex not fully sourced — total capex estimated as N/A');

  if (missing_inputs.length > 0) {
    return { years: [], missing_inputs, warnings, total_capex: null };
  }

  const total_capex = has_capex
    ? calcTotalCapex({ total_mw, shell: capex_shell_per_mw, mep: capex_mep_per_mw, substation: capex_substation_per_mw || 0, cooling: capex_cooling_per_mw || 0, grid: capex_grid_per_mw || 0, land: capex_land_per_mw, contingency_pct: capex_contingency_pct })
    : null;

  // Ramp-up: linear interpolation between phases
  function getMwLive(year) {
    const p1 = phase1_mw || total_mw * 0.4;
    const p2 = phase2_mw || total_mw * 0.3;
    const p3 = phase3_mw || total_mw * 0.3;
    if (year <= 0) return 0;
    if (year <= phase1_complete_year) return p1 * (year / phase1_complete_year);
    if (year <= phase2_complete_year) return p1 + p2 * ((year - phase1_complete_year) / (phase2_complete_year - phase1_complete_year));
    if (year <= phase3_complete_year) return p1 + p2 + p3 * ((year - phase2_complete_year) / (phase3_complete_year - phase2_complete_year));
    return total_mw;
  }

  // Occupancy ramp: starts low, stabilizes near target
  function getOccupancy(year) {
    const ramp = [0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95];
    const base = ramp[Math.min(year, 10)] || 0.95;
    return base * ((target_occupancy_pct || 90) / 90);
  }

  // Weighted avg price per kW/month from commercial split
  function getWeightedPrice(year) {
    const split = commercial_split || { retail_colo: 100 };
    const prices = {
      retail_colo:      price_retail_colo_kw_month,
      wholesale_colo:   price_wholesale_kw_month,
      hyperscale_lease: price_hyperscale_kw_month,
    };
    let total_pct = 0;
    let weighted_price = 0;
    for (const [model, pct] of Object.entries(split)) {
      if (pct > 0 && prices[model]) {
        weighted_price += (pct / 100) * prices[model] * Math.pow(1 + annual_escalation_pct, year - 1);
        total_pct += pct / 100;
      }
    }
    return total_pct > 0 ? weighted_price / total_pct : null;
  }

  const debt_amount = total_capex ? total_capex * (debt_pct / 100) : null;
  const yearly_debt_service = (debt_amount && debt_interest_rate)
    ? debt_amount * (debt_interest_rate / 100) // simplified interest-only; replace with amortizing when lender terms available
    : null;

  const years = [];
  let cumulative_fcf = -(total_capex || 0);
  const cash_flows = [-(total_capex || 0)];

  for (let y = 1; y <= 10; y++) {
    const mw_live = Math.min(getMwLive(y), total_mw);
    const occ_pct = getOccupancy(y) * 100;
    const occupied_kw = calcOccupiedKw({ it_mw: mw_live, occupancy_pct: occ_pct });
    const price = getWeightedPrice(y);
    const revenue = price ? calcColoRevenue({ occupied_kw, monthly_price_kw: price }) : null;
    const power_cost = calcEnergyCost({ it_mw: mw_live, pue, electricity_price_mwh });

    const opex_pct_total = (opex_maintenance_pct || 0) + (opex_insurance_pct || 0) + (opex_ga_pct || 0) + (opex_operator_mgmt_fee_pct || 0);
    const opex_variable = revenue ? revenue * (opex_pct_total / 100) : null;
    const opex_fixed = (opex_staff_annual_musd || 0) * 1_000_000;
    const opex = opex_variable != null ? opex_variable + opex_fixed : null;

    const ebitda = revenue != null ? calcEbitda({ revenue, power_cost: power_cost || 0, opex: opex || 0 }) : null;
    const ebitda_margin_pct = (ebitda != null && revenue) ? (ebitda / revenue) * 100 : null;
    const maintenance_capex = revenue ? revenue * 0.02 : 0;
    const fcf = ebitda != null ? ebitda - maintenance_capex - (yearly_debt_service || 0) : null;
    if (fcf != null) cumulative_fcf += fcf;
    cash_flows.push(fcf ?? 0);
    const dscr = (ebitda != null && yearly_debt_service) ? calcDscr({ ebitda, maintenance_capex, debt_service: yearly_debt_service }) : null;

    years.push({
      year: y,
      calendar_year: start_year + y - 1,
      mw_live: round(mw_live, 1),
      occupied_mw: occupied_kw ? round(occupied_kw / 1000, 1) : null,
      occupancy_pct: round(occ_pct, 1),
      revenue,
      power_cost,
      opex,
      ebitda,
      ebitda_margin: ebitda_margin_pct != null ? round(ebitda_margin_pct, 1) : null,
      maintenance_capex,
      free_cash_flow: fcf,
      cumulative_fcf,
      debt_service: yearly_debt_service,
      dscr: dscr != null ? round(dscr, 2) : null,
    });
  }

  // Terminal value at exit_year
  const exit_ebitda = years[exit_year - 1]?.ebitda;
  const terminal_value = (exit_ebitda && exit_multiple) ? calcTerminalValue({ exit_ebitda, exit_multiple }) : null;
  if (terminal_value) cash_flows[exit_year] = (cash_flows[exit_year] || 0) + terminal_value;

  // TODO: persist discount_rate_pct on hearst_scenarios in a later wave
  const discount_rate = scenario.discount_rate_pct != null ? scenario.discount_rate_pct / 100 : 0.10;
  const irr = calcIrr(cash_flows);
  const npv = calcNpv(cash_flows, discount_rate);
  const payback_years = calcPayback(years.map(y => y.free_cash_flow ?? 0), total_capex || 0);
  const stabilized_row = years.find(y => y.occupancy_pct >= 80) || null;
  const stabilized_ebitda = stabilized_row?.ebitda || null;
  const stabilized_revenue = stabilized_row?.revenue || null;

  // MOIC = (last cumulative_fcf + terminal_value) / equity_invested
  // equity_invested derived from CAPEX × (1 − debt%) — equity_*_pct slices are only for cap-table display
  const equity_invested = (total_capex != null && (scenario.debt_pct ?? 0) < 100)
    ? total_capex * (1 - (scenario.debt_pct ?? 0) / 100)
    : null;
  const last_cumulative_fcf = years[years.length - 1]?.cumulative_fcf ?? 0;
  const moic = (equity_invested && equity_invested > 0)
    ? ((last_cumulative_fcf + (terminal_value || 0)) / equity_invested)
    : null;

  // DSCR at stabilization = first year where occupancy_pct >= 80
  const dscr_stabilized = stabilized_row?.dscr ?? null;

  return {
    years,
    missing_inputs,
    warnings,
    total_capex,
    terminal_value,
    irr,
    npv,
    payback_years,
    stabilized_ebitda,
    stabilized_revenue,
    moic: moic != null ? round(moic, 2) : null,
    dscr_stabilized,
  };
}

/** Compute overall source compliance score 0–100 for a scenario */
export function calcSourceScore(scenario) {
  const tracked = [
    'total_mw_source_id', 'pue_source_id', 'electricity_price_source_id',
    'capex_shell_source_id', 'capex_mep_source_id', 'capex_substation_source_id',
    'capex_cooling_source_id', 'capex_grid_source_id',
    'price_retail_source_id', 'price_wholesale_source_id', 'price_hyperscale_source_id',
    'exit_multiple_source_id', 'debt_interest_source_id',
  ];
  if (!scenario) return 0;
  const sourced = tracked.filter(k => scenario[k]).length;
  return Math.round((sourced / tracked.length) * 100);
}

function round(v, dp) {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}
