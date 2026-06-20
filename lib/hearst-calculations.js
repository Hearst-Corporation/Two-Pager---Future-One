// HEARST — Authorized Calculation Engine
// Rule: NEVER invent a number. Every formula uses only sourced or admin inputs.
// If a required input is null/undefined, the formula returns null and callers
// must display MISSING_LABEL instead of a number.
//
// Percent convention: ALL *_pct fields are stored as 0..100 and divided by 100 at each
// consumption site via explicit /100 arithmetic. No helper wrapper is used.
// This applies without exception to: debt_pct, opex_*_pct, debt_interest_rate,
// target_occupancy_pct, capex_contingency_pct, annual_escalation_pct,
// equity_hearst_pct, equity_brookfield_pct, equity_qatar_pct.
// No ratio (0..1) _pct fields remain after A19.

import { BUSINESS_MODELS, SITE_READINESS, GPU_REFRESH_DEFAULTS, FINANCIAL_THRESHOLDS, TAX_DEFAULTS } from './hearst-constants';

/** Maintenance capex as a fraction of annual revenue (industry benchmark: 2%).
 * Source: CBRE H1 2025 — operator O&M typically 1.5-2.5% of top-line for stabilised DCs. */
const MAINTENANCE_CAPEX_PCT_OF_REVENUE = 0.02;

// Wave 1 (C8) — CAPEX reconciliation benchmark. Median of the library's
// capex_total_per_mw comps (CBRE MENA $7.5M, Equinix ~$8.5M, CoreWeave-class
// ~$8.8M, hyperscaler-spec ~$11M; see PUBLIC_SOURCES_LIBRARY metric_id
// 'capex_total_per_mw'). Used ONLY to FLAG a mismatch — the model number is
// not altered. The bottom-up build can legitimately exceed this; the warning
// forces the discrepancy to be disclosed rather than hidden.
const CAPEX_BENCHMARK_PER_MW = 8_850_000;
const CAPEX_RECONCILE_TOLERANCE = 0.15;

/** Energy Cost = IT MW × PUE × 8,760 × Electricity Price per MWh.
 * Returns 0 when electricity_price_mwh === 0 (NNN lease: tenant pays power). */
export function calcEnergyCost({ it_mw, pue, electricity_price_mwh }) {
  if (!it_mw || !pue || electricity_price_mwh == null) return null;
  if (electricity_price_mwh === 0) return 0;
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
  return Math.max(0, exit_ebitda * exit_multiple);
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

/** Total Capex from sourced per-MW components.
 * @param {number} contingency_pct  Stored as 0..100 (pure percent). Default 10 = 10% contingency. */
export function calcTotalCapex({ total_mw, shell, mep, substation, cooling, grid, land = 0, contingency_pct = 10, liquid_premium = 0 }) {
  if (!total_mw) return null;
  const components = [shell, mep, substation, cooling, grid];
  if (components.some(v => v == null)) return null;
  const base_per_mw = components.reduce((s, v) => s + v, 0) + (land || 0) + (liquid_premium || 0);
  // contingency_pct is stored as 0..100 (pure percent) — divide by 100 at consumption
  return base_per_mw * total_mw * (1 + (contingency_pct || 0) / 100);
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
    annual_escalation_pct = 2,
    debt_pct = 0, debt_interest_rate,
    capex_shell_per_mw, capex_mep_per_mw, capex_substation_per_mw,
    capex_cooling_per_mw, capex_grid_per_mw, capex_land_per_mw = 0,
    capex_contingency_pct = 10,
    exit_multiple, exit_year = 10,
    start_year = 2026,
  } = scenario || {};

  if (!total_mw)               missing_inputs.push('total_mw');
  if (!pue)                    missing_inputs.push('pue');
  if (electricity_price_mwh == null) missing_inputs.push('electricity_price_mwh');
  if (!target_occupancy_pct)   missing_inputs.push('target_occupancy_pct');

  const has_revenue = price_retail_colo_kw_month || price_wholesale_kw_month || price_hyperscale_kw_month;
  if (!has_revenue)            missing_inputs.push('price_kw_month (retail/wholesale/hyperscale)');

  const has_capex = capex_shell_per_mw != null && capex_mep_per_mw != null;
  if (!has_capex)              warnings.push('Capex not fully sourced — total capex estimated as N/A');

  if (missing_inputs.length > 0) {
    return { years: [], missing_inputs, warnings, total_capex: null };
  }

  const total_capex = has_capex
    ? calcTotalCapex({ total_mw, shell: capex_shell_per_mw, mep: capex_mep_per_mw, substation: capex_substation_per_mw || 0, cooling: capex_cooling_per_mw || 0, grid: capex_grid_per_mw || 0, land: capex_land_per_mw, contingency_pct: capex_contingency_pct })
    : null;

  // ── Wave 1 (C8) — CAPEX reconciliation check (disclose, don't alter) ─
  // The bottom-up component sum can diverge materially from the sourced
  // top-down $/MW benchmark. Surface the mismatch rather than hiding it.
  let capex_reconciliation = null;
  if (total_capex && total_mw) {
    const model_per_mw = total_capex / total_mw;
    const delta = (model_per_mw - CAPEX_BENCHMARK_PER_MW) / CAPEX_BENCHMARK_PER_MW;
    capex_reconciliation = {
      model_capex_per_mw: Math.round(model_per_mw),
      benchmark_capex_per_mw: CAPEX_BENCHMARK_PER_MW,
      delta_pct: Math.round(delta * 1000) / 10,
      within_tolerance: Math.abs(delta) <= CAPEX_RECONCILE_TOLERANCE,
    };
    if (!capex_reconciliation.within_tolerance) {
      warnings.push(`CAPEX RECONCILIATION WARNING — bottom-up $${(model_per_mw / 1e6).toFixed(2)}M/MW vs benchmark $${(CAPEX_BENCHMARK_PER_MW / 1e6).toFixed(2)}M/MW (delta ${(delta * 100).toFixed(0)}%). Reconcile before relying on IRR/MOIC.`);
    }
  }

  // ── Wave 1 (C9) — gate revenue to commercial operation date (COD) ───
  // SITE_READINESS encodes cod_offset_months (e.g. greenfield = 36mo). It was
  // collected but never consumed, so revenue was billed from Year 1. Compute
  // the first operating year and rebase the ramp to it: no revenue, opex or
  // power is booked before the facility is delivered.
  const codOffsetMonths = scenario?.cod_offset_months
    ?? (scenario?.site_readiness ? SITE_READINESS[scenario.site_readiness]?.cod_offset_months : null)
    ?? 0;
  const revenue_start_year = Math.floor((codOffsetMonths || 0) / 12) + 1;
  if (revenue_start_year > 1) {
    warnings.push(`Revenue gated to operating year ${revenue_start_year} (COD offset ${codOffsetMonths} mo) — no revenue, opex or power booked before facility delivery.`);
  }

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
    // target_occupancy_pct is pure percent (0..100)
    return Math.min(1.0, base * ((target_occupancy_pct || 90) / 90));
  }

  // Weighted avg price per kW/month from commercial split
  // Build price lookup dynamically from BUSINESS_MODELS (covers all 13 models).
  function getWeightedPrice(year) {
    const split = commercial_split || { retail_colo: 100 };
    // Base price map: 3 directly available scenario prices
    const basePriceMap = {
      price_retail_colo_kw_month:   price_retail_colo_kw_month,
      price_wholesale_kw_month:     price_wholesale_kw_month,
      price_hyperscale_kw_month:    price_hyperscale_kw_month,
    };
    // Resolve price_key for each business model from BUSINESS_MODELS catalog
    const modelPriceKey = {};
    for (const bm of BUSINESS_MODELS) {
      if (bm.price_key) modelPriceKey[bm.id] = bm.price_key;
    }
    let total_pct = 0;
    let weighted_price = 0;
    for (const [model, pct] of Object.entries(split)) {
      if (pct <= 0) continue;
      const priceKey = modelPriceKey[model];
      const price = priceKey ? basePriceMap[priceKey] : null;
      if (price) {
        // annual_escalation_pct is 0..100 — divide by 100 at consumption
        weighted_price += (pct / 100) * price * Math.pow(1 + (annual_escalation_pct || 0) / 100, year - 1);
        total_pct += pct / 100;
      }
    }
    return total_pct > 0 ? weighted_price / total_pct : null;
  }

  // Pure percent convention: debt_pct and debt_interest_rate are stored as 0..100
  const debt_amount = total_capex ? total_capex * ((debt_pct || 0) / 100) : null;

  // Amortizing debt schedule (replaces interest-only constant)
  const _debtRows = generateDebtSchedule(scenario)?.schedule || [];
  const debtServiceForYear = (y) =>
    _debtRows[y - 1]?.total_service ??
    ((debt_amount && debt_interest_rate) ? debt_amount * ((debt_interest_rate || 0) / 100) : 0);

  // ── Interest During Construction (IDC) ──────────────────────────────────
  // The debt is drawn during construction but the asset produces no revenue
  // before COD. The lender still charges interest across those months. Ignoring
  // it understates the equity outflow and inflates IRR (worst on greenfield).
  // IDC = drawn debt × annual rate × construction years.
  // Simplification: assume the full facility (debt tranche) is drawn upfront and
  // accrues interest over the pre-COD period (revenue_start_year − 1 full years).
  // No invented number — uses sourced cod_offset_months (→ revenue_start_year)
  // and the scenario's own debt rate.
  const construction_years = Math.max(0, revenue_start_year - 1);
  const idc = (debt_amount && debt_interest_rate)
    ? debt_amount * ((debt_interest_rate || 0) / 100) * construction_years
    : 0;
  if (idc > 0) {
    warnings.push(`Interest During Construction booked: $${(idc / 1e6).toFixed(1)}M of debt interest accrues across ${construction_years} construction year(s) before revenue. Added to the equity outflow at close.`);
  }

  // Equity ticket (levered basis): equity investor puts in total_capex × (1 − debt%),
  // PLUS the interest accrued on debt during construction (IDC is equity-funded at close).
  const equity_invested = total_capex != null
    ? total_capex * (1 - (debt_pct || 0) / 100) + idc
    : null;

  // ── Operational income tax (minimum defensible layer — P0-2) ──────────────
  // Straight-line depreciation of total_capex over a fixed horizon; interest is
  // tax-deductible. taxable_income = EBITDA − D&A − interest. Tax only on
  // positive income (loss years → 0, never a refund). Terminal value is taxed
  // separately via the existing capital-gains path (no double-tax here).
  const tax_rate = (scenario.tax_rate_pct != null ? scenario.tax_rate_pct : TAX_DEFAULTS.income_tax_rate_pct) / 100;
  const depreciable_life = TAX_DEFAULTS.depreciable_life_years;
  const annual_depreciation = (total_capex != null && depreciable_life > 0)
    ? total_capex / depreciable_life
    : 0;

  const years = [];
  // t0 outflow = equity (including IDC), NOT full capex
  let cumulative_fcf = -(equity_invested || 0);
  const cash_flows = [-(equity_invested || 0)];
  // Post-tax mirror of cash_flows (same t0 equity outflow).
  const cash_flows_post_tax = [-(equity_invested || 0)];

  for (let y = 1; y <= 10; y++) {
    // Wave 1 (C9): operating year relative to COD. Pre-COD years map to opYear<=0,
    // for which getMwLive/getOccupancy return 0 — so no revenue/power/opex is booked
    // before delivery, and the ramp correctly begins at COD (not Year 1).
    const opYear = y - (revenue_start_year - 1);
    const operating = opYear >= 1;
    const mw_live = Math.min(getMwLive(opYear), total_mw);
    const occ_pct = getOccupancy(opYear) * 100;
    const occupied_kw = calcOccupiedKw({ it_mw: mw_live, occupancy_pct: occ_pct });
    const price = getWeightedPrice(opYear);
    const revenue = price ? calcColoRevenue({ occupied_kw, monthly_price_kw: price }) : null;
    const power_cost = calcEnergyCost({ it_mw: mw_live, pue, electricity_price_mwh });

    const opex_pct_total = ((opex_maintenance_pct || 0) + (opex_insurance_pct || 0) + (opex_ga_pct || 0) + (opex_operator_mgmt_fee_pct || 0)) / 100;
    const opex_variable = revenue ? revenue * opex_pct_total : null;
    // Fixed (staff) opex only once operating — the facility doesn't exist pre-COD.
    const opex_fixed = (operating ? (opex_staff_annual_musd || 0) : 0) * 1_000_000;
    const opex = opex_variable != null ? opex_variable + opex_fixed : null;

    const ebitda = revenue != null ? calcEbitda({ revenue, power_cost: power_cost || 0, opex: opex || 0 }) : null;
    const ebitda_margin_pct = (ebitda != null && revenue) ? (ebitda / revenue) * 100 : null;
    const maintenance_capex = revenue ? revenue * MAINTENANCE_CAPEX_PCT_OF_REVENUE : 0;
    // Use amortizing debt service for this year
    const debt_service_y = debtServiceForYear(y);
    // True free cash flow to equity for the year — CAN be negative (the asset did
    // not cover its debt service). This is the number the return must SEE: flooring
    // to 0 erases bad years and inflates IRR/MOIC. Real negative years are preserved.
    const fcf_equity_true = ebitda != null ? ebitda - maintenance_capex - (debt_service_y || 0) : null;
    cumulative_fcf += (fcf_equity_true ?? 0);
    cash_flows.push(fcf_equity_true ?? 0);
    const dscr = (ebitda != null && debt_service_y) ? calcDscr({ ebitda, maintenance_capex, debt_service: debt_service_y }) : null;

    // ── Operational income tax for the year ──────────────────────────────
    // D&A and interest are only booked once operating (the asset doesn't
    // produce taxable income pre-COD). interest_y is the deductible portion of
    // debt service (principal repayment is NOT tax-deductible).
    const interest_y = operating ? (_debtRows[y - 1]?.interest || 0) : 0;
    const depreciation_y = operating ? annual_depreciation : 0;
    // EBIT = EBITDA − D&A ; taxable income further deducts interest.
    const ebit = ebitda != null ? ebitda - depreciation_y : null;
    const taxable_income = ebitda != null ? ebitda - depreciation_y - interest_y : null;
    // No refund: tax only on positive taxable income.
    const cash_taxes = (taxable_income != null && taxable_income > 0) ? taxable_income * tax_rate : 0;
    const fcf_equity_post_tax = fcf_equity_true != null ? fcf_equity_true - cash_taxes : null;
    cash_flows_post_tax.push(fcf_equity_post_tax ?? 0);

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
      free_cash_flow: fcf_equity_true,            // real FCFE PRE-tax — negative allowed (drives pre-tax returns)
      cumulative_fcf,
      debt_service: debt_service_y || null,
      dscr: dscr != null ? round(dscr, 2) : null,
      // ── Operational income tax (P0-2) — straight-line D&A, interest-deductible ──
      depreciation: depreciation_y || null,
      ebit,
      taxable_income,
      cash_taxes: cash_taxes || null,
      free_cash_flow_post_tax: fcf_equity_post_tax,   // FCFE net of operating income tax
    });
  }

  // Terminal value at exit_year (gross = exit EBITDA × multiple)
  const exit_ebitda = years[exit_year - 1]?.ebitda;
  const terminal_value = (exit_ebitda && exit_multiple) ? calcTerminalValue({ exit_ebitda, exit_multiple }) : null;

  // Remaining debt principal at exit (net for equity).
  // FIX P3: when debt_term_years < exit_year, _debtRows[exit_year-1] is undefined
  // (loan fully amortized). Fall back to the last schedule row before the original principal.
  const remaining_debt_at_exit = _debtRows[exit_year - 1]?.closing_balance
    ?? _debtRows[_debtRows.length - 1]?.closing_balance
    ?? (debt_amount || 0);
  const terminal_value_to_equity = terminal_value != null ? Math.max(0, terminal_value - remaining_debt_at_exit) : null;

  // Add equity portion of terminal value to cash flows.
  // Decision B: terminal value keeps the existing capital-gains treatment (handled
  // in the sale-leaseback archetype path). Operational income tax does NOT apply to
  // the exit — so TV_to_equity is added IDENTICALLY to pre-tax and post-tax flows
  // (no double-tax of exit proceeds).
  if (terminal_value_to_equity != null) {
    cash_flows[exit_year] = (cash_flows[exit_year] || 0) + terminal_value_to_equity;
    cash_flows_post_tax[exit_year] = (cash_flows_post_tax[exit_year] || 0) + terminal_value_to_equity;
  }

  // FIX 5c: propagate terminal_value_to_equity to the exit row AND every subsequent row
  // so the chart-cumulative invariant holds for any exit_year < 10.
  if (terminal_value_to_equity && exit_year - 1 < years.length) {
    for (let i = exit_year - 1; i < years.length; i++) {
      years[i].cumulative_fcf += terminal_value_to_equity;
    }
  }

  // TODO: persist discount_rate_pct on hearst_scenarios in a later wave
  const discount_rate = scenario.discount_rate_pct != null ? scenario.discount_rate_pct / 100 : FINANCIAL_THRESHOLDS.discount_rate_pct / 100;
  const irr = calcIrr(cash_flows);
  const npv = calcNpv(cash_flows, discount_rate);
  // Post-tax equity returns (levered) — same cash-flow shape, net of operating income tax.
  const irr_post_tax = calcIrr(cash_flows_post_tax);
  const npv_post_tax = calcNpv(cash_flows_post_tax, discount_rate);
  // Payback on equity basis
  const payback_years = calcPayback(years.map(y => y.free_cash_flow ?? 0), equity_invested || 0);
  const stabilized_row = years.find(y => y.occupancy_pct >= 80) || null;
  const stabilized_ebitda = stabilized_row?.ebitda || null;
  const stabilized_revenue = stabilized_row?.revenue || null;

  // MOIC on real equity basis: sum true distributions (mirrors IRR cash_flows, which
  // now allow negative years — bad years are no longer erased).
  // cash_flows[0] = -equity_invested, cash_flows[1..N] = real FCFE, cash_flows[exit] += TV_to_equity
  // MOIC = total_inflows / equity_invested
  const total_inflows = cash_flows.slice(1).reduce((s, v) => s + v, 0); // already includes TV_to_equity
  const moic = (equity_invested && equity_invested > 0)
    ? total_inflows / equity_invested
    : null;
  // Post-tax MOIC — sum of post-tax distributions over equity invested.
  const total_inflows_post_tax = cash_flows_post_tax.slice(1).reduce((s, v) => s + v, 0);
  const moic_post_tax = (equity_invested && equity_invested > 0)
    ? total_inflows_post_tax / equity_invested
    : null;

  // DSCR at stabilization = first year where occupancy_pct >= 80
  const dscr_stabilized = stabilized_row?.dscr ?? null;

  return {
    years,
    missing_inputs,
    warnings,
    total_capex,
    terminal_value,
    terminal_value_to_equity,
    remaining_debt_at_exit,
    equity_invested,
    idc,                          // interest accrued on debt during construction (in equity_invested)
    construction_years,
    irr,
    npv,
    payback_years,
    stabilized_ebitda,
    stabilized_revenue,
    moic: moic != null ? round(moic, 2) : null,
    dscr_stabilized,
    // ── Post-tax equity returns (levered) — P0-2 ──────────────────────────
    // Board-facing metrics are post-tax; pre-tax values stay available above.
    irr_post_tax,
    npv_post_tax,
    moic_post_tax: moic_post_tax != null ? round(moic_post_tax, 2) : null,
    tax_assumptions: {
      income_tax_rate_pct: tax_rate * 100,
      depreciable_life_years: depreciable_life,
      method: 'straight_line',
      basis: 'levered_equity',
      note: 'Qatar corporate income tax (Law No. 24 of 2018), 10%. Operating income only; terminal value taxed via capital-gains path (no double-tax).',
    },
    // Wave 1 (C8 / C9) — surfaced for the UI/memo to display openly.
    capex_reconciliation,
    revenue_start_year,
    cod_offset_months: codOffsetMonths,
  };
}

// ────────────────────────────────────────────────────────
// GPU Revenue Fold — merges hardware_breakdown GPU revenue into projection
// ────────────────────────────────────────────────────────

/**
 * Merge GPU-cloud revenue into an existing projection in-place.
 * @param {Object} projection — result of generateProjection() or projectArchetype().projection
 * @param {Object} hardware_breakdown — { revenue_ai_annual, capex_hardware }
 * @param {Object} scenario — the post-archetype scenario (for exit_multiple, debt_pct, etc.)
 * @param {Object} opts
 * @param {number} [opts.rfs_year=3] — first year with partial GPU revenue (1/ramp_years); fully ramped at rfs_year + ramp_years − 1
 * @param {number} [opts.ramp_years=2] — linear ramp duration from 0% to 100%
 * @param {number} [opts.exit_year=10]
 * @param {number} [opts.discount_rate_pct=10]
 * @param {number} [opts.gpu_refresh_cycle_years] — redeploy hardware every N years (default: sourced GPU_REFRESH_DEFAULTS, 5)
 * @param {number} [opts.gpu_replacement_cost_pct] — % of initial hardware capex re-spent each cycle (default: sourced, 85)
 * @returns {Object} the mutated projection
 */
export function foldGpuRevenue(projection, hardware_breakdown, scenario = {}, opts = {}) {
  if (!projection?.years?.length) return projection;
  if (!hardware_breakdown?.revenue_ai_annual && !hardware_breakdown?.capex_hardware) return projection;
  const {
    rfs_year = 3, ramp_years = 2, exit_year = 10, discount_rate_pct = FINANCIAL_THRESHOLDS.discount_rate_pct,
    gpu_refresh_cycle_years = GPU_REFRESH_DEFAULTS.refresh_cycle_years,
    gpu_replacement_cost_pct = GPU_REFRESH_DEFAULTS.replacement_cost_pct,
  } = opts;

  // Fix 4 (P1): guard exit_year < rfs_year — GPU never deploys before exit.
  const rfs_year_n = rfs_year;
  const exit_year_n = exit_year;
  if (rfs_year_n > exit_year_n) {
    // Asset is sold before GPU deploys (RFS) → skip fold. DISCLOSE rather than
    // silently dropping GPU economics, so the caller/UI can flag the omission.
    projection.warnings = projection.warnings || [];
    projection.warnings.push(`GPU revenue not modeled — RFS year ${rfs_year_n} is after exit year ${exit_year_n}: the asset is sold before GPU deployment, so no GPU revenue or CAPEX applies.`);
    projection.gpu_skipped_before_rfs = true;
    return projection;
  }

  const gpu_rev_annual = hardware_breakdown.revenue_ai_annual || 0;
  const gpu_capex = hardware_breakdown.capex_hardware || 0;

  // GPU refresh CAPEX — now modeled (sourced defaults, see GPU_REFRESH_DEFAULTS).
  // Hardware is redeployed every `gpu_refresh_cycle_years`; each refresh re-spends
  // `gpu_replacement_cost_pct`% of the initial hardware capex (next-gen pricier,
  // net of secondary resale of the outgoing generation). The refresh cost is booked
  // as a capex outflow against equity in each refresh year after RFS.
  projection.warnings = projection.warnings || [];
  const refresh_cost_each = gpu_capex * ((gpu_replacement_cost_pct || 0) / 100);
  // Refresh years = rfs_year + cycle, + 2×cycle, … within the projection horizon.
  const refresh_years = [];
  if (gpu_capex > 0 && gpu_refresh_cycle_years > 0 && refresh_cost_each > 0) {
    for (let ry = rfs_year + gpu_refresh_cycle_years; ry <= projection.years.length; ry += gpu_refresh_cycle_years) {
      refresh_years.push(ry);
    }
  }
  projection.gpu_refresh_modeled = true;
  projection.gpu_refresh = {
    cycle_years: gpu_refresh_cycle_years,
    replacement_cost_pct: gpu_replacement_cost_pct,
    cost_each: round(refresh_cost_each, 0),
    refresh_years,
    total_refresh_capex: round(refresh_cost_each * refresh_years.length, 0),
  };
  if (refresh_years.length > 0) {
    projection.warnings.push(`GPU refresh CAPEX modeled: ${refresh_years.length} redeployment(s) at years [${refresh_years.join(', ')}], each $${(refresh_cost_each / 1e6).toFixed(1)}M (${gpu_replacement_cost_pct}% of initial hardware capex, ${gpu_refresh_cycle_years}-yr cycle). Sourced default — adjust if a hardware contract specifies otherwise.`);
  } else {
    projection.warnings.push(`GPU refresh CAPEX: no redeployment falls within the projection horizon (${gpu_refresh_cycle_years}-yr cycle, RFS year ${rfs_year}). Single deployment modeled.`);
  }

  // Fix 1 (P0): precompute opex formula components from scenario so we can recompute
  // y.opex after y.revenue grows (pre-fold opex was based on facility-only revenue).
  // Pure percent convention: all opex_*_pct are 0..100; divide by 100 for fraction.
  const opex_pct_total = ((scenario.opex_maintenance_pct || 0) +
                          (scenario.opex_insurance_pct || 0) +
                          (scenario.opex_ga_pct || 0) +
                          (scenario.opex_operator_mgmt_fee_pct || 0)) / 100;
  const opex_fixed = (scenario.opex_staff_annual_musd || 0) * 1_000_000;

  // Update revenue/ebitda/fcf per year with GPU revenue ramp
  projection.years.forEach((y, idx) => {
    // Fix 2 (P0): rfs_year is the first year with partial GPU revenue (1/ramp_years);
    // fully ramped at rfs_year + ramp_years − 1.
    const yrsPostRfs = (idx + 1) - rfs_year + 1;
    const ramp = Math.max(0, Math.min(1, yrsPostRfs / ramp_years));
    const gpu_rev = gpu_rev_annual * ramp;
    y.revenue = (y.revenue || 0) + gpu_rev;
    // Fix 1 (P0): recompute opex based on post-fold revenue so EBITDA reflects real opex scale
    const opex_variable = (y.revenue || 0) * opex_pct_total;
    y.opex = opex_variable + opex_fixed;
    y.ebitda = (y.revenue ?? 0) - (y.power_cost || 0) - y.opex;
    y.ebitda_margin = y.revenue > 0 ? Math.round((y.ebitda / y.revenue) * 1000) / 10 : null;
    const maint_capex = (y.revenue || 0) * MAINTENANCE_CAPEX_PCT_OF_REVENUE;
    y.maintenance_capex = maint_capex;
    // Book the GPU refresh capex in the year it falls due (year index = idx+1).
    const refresh_this_year = refresh_years.includes(idx + 1) ? refresh_cost_each : 0;
    y.gpu_refresh_capex = refresh_this_year || 0;
    y.free_cash_flow = y.ebitda - maint_capex - (y.debt_service || 0) - refresh_this_year;
  });

  // GPU CAPEX timing: facility capex stays at year 0, GPU capex shifts to RFS year
  const facility_capex = projection.total_capex || 0;  // pre-fold facility capex
  projection.total_capex = facility_capex + gpu_capex;

  // ── Recompute operational income tax on the post-fold rows (P0-2) ─────────
  // total_capex grew (facility + GPU), so depreciation rebases; EBITDA grew, so
  // taxable income and cash taxes change. Interest comes from the debt schedule
  // (unchanged by the GPU fold — the loan is sized on facility capex).
  const tax_rate_fold = (scenario.tax_rate_pct != null ? scenario.tax_rate_pct : TAX_DEFAULTS.income_tax_rate_pct) / 100;
  const depr_life_fold = TAX_DEFAULTS.depreciable_life_years;
  const annual_depr_fold = (depr_life_fold > 0) ? projection.total_capex / depr_life_fold : 0;
  const _debtRowsFold = generateDebtSchedule(scenario)?.schedule || [];
  projection.years.forEach((y, i) => {
    const operating = (y.revenue != null && y.revenue > 0) || (y.opex != null && y.opex > 0);
    const interest_y = operating ? (_debtRowsFold[i]?.interest || 0) : 0;
    const depreciation_y = operating ? annual_depr_fold : 0;
    const ebit = y.ebitda != null ? y.ebitda - depreciation_y : null;
    const taxable_income = y.ebitda != null ? y.ebitda - depreciation_y - interest_y : null;
    const cash_taxes = (taxable_income != null && taxable_income > 0) ? taxable_income * tax_rate_fold : 0;
    y.depreciation = depreciation_y || null;
    y.ebit = ebit;
    y.taxable_income = taxable_income;
    y.cash_taxes = cash_taxes || null;
    y.free_cash_flow_post_tax = y.free_cash_flow != null ? y.free_cash_flow - cash_taxes : null;
  });

  // Equity basis: split both capex tranches by debt fraction
  const debtFrac = (scenario?.debt_pct ?? 0) / 100;
  const facility_equity = facility_capex * (1 - debtFrac);
  const gpu_equity = gpu_capex * (1 - debtFrac);

  // Recompute terminal_value from post-fold exit_year ebitda BEFORE building cashflows
  const exit_year_idx = exit_year - 1;
  const exit_ebitda = projection.years[exit_year_idx]?.ebitda;
  if (exit_ebitda != null && scenario?.exit_multiple) {
    projection.terminal_value = Math.max(0, exit_ebitda * scenario.exit_multiple);
  }

  // Terminal value net of remaining debt principal (equity receives only the net)
  const remaining_debt = projection.remaining_debt_at_exit ?? ((projection.total_capex || 0) * debtFrac);
  const terminal_value_to_equity = projection.terminal_value != null
    ? Math.max(0, projection.terminal_value - remaining_debt)
    : null;
  projection.terminal_value_to_equity = terminal_value_to_equity;

  // Build cashflows on equity basis: year 0 = facility equity; GPU equity deployed at rfs_year.
  // Real FCFE — negative years ARE kept (no floor): erasing them inflates IRR/MOIC.
  const cashflows = [-facility_equity];
  for (let i = 0; i < projection.years.length; i++) {
    cashflows.push(projection.years[i].free_cash_flow ?? 0);
  }
  const rfs_idx = Math.max(0, Math.min(projection.years.length - 1, rfs_year - 1));
  cashflows[rfs_idx + 1] = (cashflows[rfs_idx + 1] || 0) - gpu_equity;

  // Add terminal_value_to_equity at exit_year (not gross)
  if (terminal_value_to_equity != null) {
    cashflows[exit_year] = (cashflows[exit_year] || 0) + terminal_value_to_equity;
  }

  projection.irr = calcIrr(cashflows);
  projection.npv = calcNpv(cashflows, discount_rate_pct / 100);

  // Post-tax equity cashflows — same shape as `cashflows`, using post-tax FCFE.
  // GPU equity outflow and TV_to_equity are identical (capex/exit are not income-taxed).
  const cashflows_post_tax = [-facility_equity];
  for (let i = 0; i < projection.years.length; i++) {
    cashflows_post_tax.push(projection.years[i].free_cash_flow_post_tax ?? 0);
  }
  cashflows_post_tax[rfs_idx + 1] = (cashflows_post_tax[rfs_idx + 1] || 0) - gpu_equity;
  if (terminal_value_to_equity != null) {
    cashflows_post_tax[exit_year] = (cashflows_post_tax[exit_year] || 0) + terminal_value_to_equity;
  }
  projection.irr_post_tax = calcIrr(cashflows_post_tax);
  projection.npv_post_tax = calcNpv(cashflows_post_tax, discount_rate_pct / 100);

  // Accumulate cumulative_fcf from the REAL per-row FCFE (mirrors cashflows[] build above),
  // then add terminal_value_to_equity to the exit year row. No flooring.
  let cum = -facility_equity;
  projection.years.forEach((y, i) => {
    if (i === rfs_idx) cum -= gpu_equity;  // GPU equity deployed at RFS year
    cum += y.free_cash_flow;
    y.cumulative_fcf = cum;
  });
  // FIX 5c: propagate terminal_value_to_equity to the exit row AND every subsequent row
  // so the chart-cumulative invariant holds for any exit_year < 10.
  if (terminal_value_to_equity && exit_year_idx < projection.years.length) {
    for (let i = exit_year_idx; i < projection.years.length; i++) {
      projection.years[i].cumulative_fcf += terminal_value_to_equity;
    }
  }

  projection.stabilized_revenue = projection.years.find(y => y.occupancy_pct >= 80)?.revenue ?? null;
  projection.stabilized_ebitda = projection.years.find(y => y.occupancy_pct >= 80)?.ebitda ?? null;

  // Recompute MOIC on equity basis (total equity = facility_equity + gpu_equity)
  // debt_pct is pure percent (0..100)
  const equity_invested = facility_equity + gpu_equity;
  projection.equity_invested = equity_invested;
  if (equity_invested > 0) {
    // MOIC on real equity basis: derived from final cumulative_fcf so the
    // invariant (last_cum / equity_invested + 1 == moic) holds exactly.
    // last_cum = -equity_invested + total_distributions (real, neg allowed) + TV_to_equity
    // => moic = (last_cum + equity_invested) / equity_invested = total_distributions / equity_invested
    const last_cum = projection.years[projection.years.length - 1]?.cumulative_fcf ?? 0;
    projection.moic = +((last_cum + equity_invested) / equity_invested).toFixed(2);
    // Post-tax MOIC — sum of post-tax distributions (incl. TV_to_equity, less GPU equity) over equity.
    const total_post_tax_dist = cashflows_post_tax.slice(1).reduce((s, v) => s + v, 0);
    projection.moic_post_tax = +(total_post_tax_dist / equity_invested).toFixed(2);
  }

  // Recompute per-row DSCR (ebitda grew after GPU revenue fold)
  projection.years.forEach(y => {
    if (y.debt_service && y.debt_service > 0 && y.ebitda != null) {
      const maint = y.maintenance_capex || 0;
      y.dscr = +(((y.ebitda - maint) / y.debt_service)).toFixed(2);
    }
  });

  // Recompute dscr_stabilized from post-fold rows
  const stab_row = projection.years.find(y => y.occupancy_pct >= 80);
  projection.dscr_stabilized = stab_row?.dscr ?? null;

  projection.payback_years = (() => {
    let c = -facility_equity;
    for (let i = 0; i < projection.years.length; i++) {
      c += projection.years[i].free_cash_flow ?? 0;
      if (i === rfs_idx) c -= gpu_equity;
      if (c >= 0) return i + 1;
    }
    return null;
  })();

  return projection;
}

// ────────────────────────────────────────────────────────
// Debt Schedule
// ────────────────────────────────────────────────────────

/**
 * Generates a year-by-year debt amortization schedule using constant French annuity.
 * Interest-only (IO) window inferred from site_readiness option.
 * debt_pct and debt_interest_rate are stored as 0..100 (pure percent convention).
 *
 * @param {object} scenario
 * @param {object} [options]
 * @param {number} [options.io_years] Override IO window (0 = no IO period)
 * @param {Array}  [options.ebitda_by_year] Array of EBITDA values for DSCR computation
 * @returns {{ schedule: Array, summary: object }|null}
 */
export function generateDebtSchedule(scenario, options = {}) {
  const {
    total_mw, capex_shell_per_mw, capex_mep_per_mw, capex_substation_per_mw = 0,
    capex_cooling_per_mw = 0, capex_grid_per_mw = 0, capex_land_per_mw = 0,
    capex_contingency_pct = 10, debt_pct = 0, debt_interest_rate,
    debt_term_years = 10, site_readiness,
  } = scenario || {};

  const total_capex = calcTotalCapex({
    total_mw, shell: capex_shell_per_mw, mep: capex_mep_per_mw,
    substation: capex_substation_per_mw, cooling: capex_cooling_per_mw,
    grid: capex_grid_per_mw, land: capex_land_per_mw, contingency_pct: capex_contingency_pct,
  });

  if (!total_capex || !debt_pct || !debt_interest_rate || debt_pct <= 0) return null;

  // Pure percent convention: debt_pct and debt_interest_rate are 0..100
  const principal = total_capex * (debt_pct / 100);
  const rate = debt_interest_rate / 100;

  // IO window by site readiness
  const io_map = { greenfield: 2, land_secured: 1, power_reserved: 1, substation_ready: 1, powered_shell: 0, operational: 0 };
  const io_years = options.io_years ?? (io_map[site_readiness] ?? 1);

  const amort_years = debt_term_years - io_years;
  if (amort_years <= 0) return null;

  // Constant annuity (PMT) on the amortizing portion
  const pmt = rate === 0
    ? principal / amort_years
    : (principal * rate) / (1 - Math.pow(1 + rate, -amort_years));

  const ebitda_by_year = options.ebitda_by_year || [];
  const schedule = [];
  let balance = principal;
  let total_interest = 0;
  let total_principal_paid = 0;
  let min_dscr = Infinity;

  for (let y = 1; y <= debt_term_years; y++) {
    const interest = balance * rate;
    let principal_payment = 0;
    let total_service = interest;

    if (y > io_years) {
      principal_payment = pmt - interest;
      total_service = pmt;
    }

    const closing = round(balance - principal_payment, 2);
    const ebitda = ebitda_by_year[y - 1] ?? null;
    const dscr = (ebitda != null && total_service > 0) ? round(ebitda / total_service, 2) : null;

    if (dscr != null && dscr < min_dscr) min_dscr = dscr;

    schedule.push({
      year: y,
      opening_balance: round(balance, 0),
      interest: round(interest, 0),
      principal: round(principal_payment, 0),
      closing_balance: closing > 0 ? closing : 0,
      total_service: round(total_service, 0),
      is_io: y <= io_years,
      dscr,
    });

    total_interest += interest;
    total_principal_paid += principal_payment;
    balance = closing > 0 ? closing : 0;
  }

  const breach_years = schedule.filter(r => r.dscr != null && r.dscr < FINANCIAL_THRESHOLDS.dscr_breach_threshold).map(r => r.year);
  const dscrValues = schedule.filter(r => r.dscr != null).map(r => r.dscr);
  const avg_dscr = dscrValues.length ? round(dscrValues.reduce((s, v) => s + v, 0) / dscrValues.length, 2) : null;

  return {
    schedule,
    summary: {
      principal,
      total_interest: round(total_interest, 0),
      total_principal_paid: round(total_principal_paid, 0),
      debt_term_years,
      io_years,
      min_dscr: min_dscr === Infinity ? null : min_dscr,
      avg_dscr,
      breach_years,
    },
  };
}

// ────────────────────────────────────────────────────────
// Investor Waterfall
// ────────────────────────────────────────────────────────

/**
 * Distributes FCF cash flows to investors via 3-tier waterfall.
 * Tier 1: Debt service (interest + principal)
 * Tier 2: Preferred return 8% compound on equity invested
 * Tier 3: Remaining FCF split by equity pct (with HEARST carry)
 *
 * @param {object} scenario
 * @param {object} projection  Output of generateProjection()
 * @returns {{ by_investor: object, summary: object }|null}
 */
export function generateWaterfall(scenario, projection) {
  if (!projection || !projection.years?.length || !projection.total_capex) return null;

  const {
    debt_pct = 0,
    equity_hearst_pct = 0, equity_brookfield_pct = 0, equity_qatar_pct = 0,
  } = scenario || {};

  const total_capex = projection.total_capex;
  // Pure percent convention: debt_pct is 0..100
  const total_equity = total_capex * (1 - debt_pct / 100);
  const total_debt = total_capex * (debt_pct / 100);

  // Normalize equity percentages (must sum to 1.0)
  const raw_sum = (equity_hearst_pct || 0) + (equity_brookfield_pct || 0) + (equity_qatar_pct || 0);
  const normalize = raw_sum > 0 ? raw_sum : 1;
  const hearst_share = (equity_hearst_pct || 0) / normalize;
  const brookfield_share = (equity_brookfield_pct || 0) / normalize;
  const qatar_share = (equity_qatar_pct || 0) / normalize;

  // Equity invested per investor
  const hearst_equity_in = total_equity * hearst_share;
  const brookfield_equity_in = total_equity * brookfield_share;
  const qatar_equity_in = total_equity * qatar_share;

  // Debt schedule for Tier 1
  const ebitda_by_year = projection.years.map(y => y.ebitda ?? 0);
  const debt_sched = generateDebtSchedule(scenario, { ebitda_by_year });
  const debt_schedule = debt_sched?.schedule || [];

  // Terminal value at exit year
  const exit_year = scenario.exit_year || 10;
  const terminal_value = projection.terminal_value || 0;

  // Preferred return accrual (default: 8% — industry-standard LP hurdle)
  const DEFAULT_PREF_RATE = FINANCIAL_THRESHOLDS.preferred_return_pct / 100;
  const PREF_RATE = scenario.pref_return_rate_pct != null ? scenario.pref_return_rate_pct / 100 : DEFAULT_PREF_RATE;
  let hearst_pref_accrued = 0;
  let brookfield_pref_accrued = 0;
  let qatar_pref_accrued = 0;

  const hearst_flows = [-hearst_equity_in];
  const brookfield_flows = [-brookfield_equity_in];
  const qatar_flows = [-qatar_equity_in];
  const lender_flows = [-total_debt];

  for (let y = 1; y <= projection.years.length; y++) {
    const row = projection.years[y - 1];
    const fcf_pre_debt = row.ebitda ?? 0;
    const debt_row = debt_schedule[y - 1];
    const debt_service = debt_row?.total_service || 0;
    const _principal_repaid = debt_row?.principal || 0;

    // Tier 1: lender gets debt service (senior — not affected by income tax;
    // interest is tax-deductible, so the lender is served on pre-tax cash).
    const to_lender = Math.min(fcf_pre_debt, debt_service);
    lender_flows.push(to_lender);
    let remaining = Math.max(0, fcf_pre_debt - debt_service);

    // Decision A: equity distributions are POST-TAX. Operating income tax for the
    // year (already computed on EBITDA − D&A − interest) is deducted from the cash
    // available to equity BEFORE the preferred/residual tiers. Terminal value keeps
    // its capital-gains treatment (Decision B) and is added gross at exit below.
    const cash_taxes_y = row.cash_taxes || 0;
    remaining = Math.max(0, remaining - cash_taxes_y);

    // Accrue preferred return on unreturned equity
    hearst_pref_accrued += (hearst_pref_accrued + hearst_equity_in) * PREF_RATE;
    brookfield_pref_accrued += (brookfield_pref_accrued + brookfield_equity_in) * PREF_RATE;
    qatar_pref_accrued += (qatar_pref_accrued + qatar_equity_in) * PREF_RATE;
    const total_pref_due = hearst_pref_accrued + brookfield_pref_accrued + qatar_pref_accrued;

    // Tier 2: preferred return
    const pref_paid = Math.min(remaining, total_pref_due);
    let hearst_pref_paid = 0, brookfield_pref_paid = 0, qatar_pref_paid = 0;
    if (total_pref_due > 0 && pref_paid > 0) {
      hearst_pref_paid = pref_paid * (hearst_pref_accrued / total_pref_due);
      brookfield_pref_paid = pref_paid * (brookfield_pref_accrued / total_pref_due);
      qatar_pref_paid = pref_paid * (qatar_pref_accrued / total_pref_due);
    }
    hearst_pref_accrued = Math.max(0, hearst_pref_accrued - hearst_pref_paid);
    brookfield_pref_accrued = Math.max(0, brookfield_pref_accrued - brookfield_pref_paid);
    qatar_pref_accrued = Math.max(0, qatar_pref_accrued - qatar_pref_paid);
    remaining = Math.max(0, remaining - pref_paid);

    // Tier 3: residual by equity split
    const is_exit_year = y === exit_year;
    const residual_with_tv = remaining + (is_exit_year ? terminal_value : 0);
    const hearst_carry = residual_with_tv * hearst_share;
    const brookfield_carry = residual_with_tv * brookfield_share;
    const qatar_carry = residual_with_tv * qatar_share;

    hearst_flows.push(hearst_pref_paid + hearst_carry);
    brookfield_flows.push(brookfield_pref_paid + brookfield_carry);
    qatar_flows.push(qatar_pref_paid + qatar_carry);
  }

  function investorStats(flows, equity_in) {
    const irr = calcIrr(flows);
    const total_distributions = flows.slice(1).reduce((s, v) => s + v, 0);
    const moic = equity_in > 0 ? round((total_distributions - equity_in) / equity_in + 1, 2) : null;
    return { cash_flows: flows.map(v => round(v, 0)), irr, moic: moic ?? null, total_distributions: round(total_distributions, 0), equity_invested: round(equity_in, 0) };
  }

  const total_lender_repaid = lender_flows.slice(1).reduce((s, v) => s + v, 0);

  return {
    by_investor: {
      hearst:     investorStats(hearst_flows, hearst_equity_in),
      brookfield: investorStats(brookfield_flows, brookfield_equity_in),
      qatar:      investorStats(qatar_flows, qatar_equity_in),
      lender: {
        debt_service_flows: lender_flows.slice(1).map(v => round(v, 0)),
        total_interest: round(debt_sched?.summary?.total_interest || 0, 0),
        total_principal: round(debt_sched?.summary?.total_principal_paid || 0, 0),
        total_repaid: round(total_lender_repaid, 0),
      },
    },
    summary: {
      total_equity,
      total_debt,
      pref_rate: PREF_RATE,
      terminal_value,
    },
  };
}

// ────────────────────────────────────────────────────────
// Sensitivity Matrix
// ────────────────────────────────────────────────────────

const SENSITIVITY_PARAMS = {
  electricity_price_mwh:     { label: 'Electricity Price',    range_pct: 0.30, unit: '$/MWh' },
  target_occupancy_pct:      { label: 'Occupancy',            range_pct: 0.20, unit: '%', clamp: [10, 100] },
  price_retail_colo_kw_month:{ label: 'Retail Price',         range_pct: 0.25, unit: '$/kW/mo' },
  price_wholesale_kw_month:  { label: 'Wholesale Price',      range_pct: 0.25, unit: '$/kW/mo' },
  price_hyperscale_kw_month: { label: 'Hyperscale Price',     range_pct: 0.25, unit: '$/kW/mo' },
  total_mw:                  { label: 'IT Capacity',          range_pct: 0.30, unit: 'MW', clamp: [1, 10000] },
  debt_pct:                  { label: 'Debt Leverage',        range_pct: 0.25, unit: '%', clamp: [0, 99] },
  exit_multiple:             { label: 'Exit Multiple',        range_pct: 0.30, unit: '×', clamp: [1, 100] },
  capex_shell_per_mw:        { label: 'Shell CAPEX/MW',       range_pct: 0.25, unit: '$/MW' },
  capex_mep_per_mw:          { label: 'MEP CAPEX/MW',         range_pct: 0.25, unit: '$/MW' },
  pue:                       { label: 'PUE',                  range_pct: 0.15, unit: 'ratio', clamp: [1.0, 5.0] },
};

/**
 * Generates an N×N sensitivity grid comparing two scenario parameters.
 * Each cell = { irr, npv, moic, dscr, delta_irr_vs_baseline }
 *
 * @param {object} scenario
 * @param {string} paramX  Column axis parameter key
 * @param {string} paramY  Row axis parameter key
 * @param {number} [steps=5]  Grid size (steps × steps cells)
 * @returns {{ axis_x, axis_y, cells, baseline, break_even_zone }|null}
 */
export function generateSensitivity(scenario, paramX, paramY, steps = 5) {
  if (!scenario || paramX === paramY) return null;
  if (!SENSITIVITY_PARAMS[paramX] || !SENSITIVITY_PARAMS[paramY]) return null;

  const clampVal = (v, param) => {
    const info = SENSITIVITY_PARAMS[param];
    if (!info.clamp) return v;
    return Math.min(info.clamp[1], Math.max(info.clamp[0], v));
  };

  const makeRange = (param) => {
    const base = scenario[param];
    if (base == null || base === 0) return null;
    const r = SENSITIVITY_PARAMS[param].range_pct;
    const lo = clampVal(base * (1 - r), param);
    const hi = clampVal(base * (1 + r), param);
    return Array.from({ length: steps }, (_, i) => lo + (i / (steps - 1)) * (hi - lo));
  };

  const x_values = makeRange(paramX);
  const y_values = makeRange(paramY);
  if (!x_values || !y_values) return null;

  // Baseline
  const baseline_proj = generateProjection(scenario);
  const baseline = {
    irr: baseline_proj.irr,
    npv: baseline_proj.npv,
    moic: baseline_proj.moic,
    dscr: baseline_proj.dscr_stabilized,
  };

  // Grid: cells[row_y][col_x]
  const cells = y_values.map(yv =>
    x_values.map(xv => {
      const override = { ...scenario, [paramX]: xv, [paramY]: yv };
      const proj = generateProjection(override);
      const irr = proj.irr;
      const delta_irr = (irr != null && baseline.irr != null) ? round(irr - baseline.irr, 4) : null;
      return {
        irr: irr != null ? round(irr, 4) : null,
        npv: proj.npv != null ? round(proj.npv, 0) : null,
        moic: proj.moic,
        dscr: proj.dscr_stabilized,
        delta_irr_vs_baseline: delta_irr,
      };
    })
  );

  // Break-even zones
  const irr_hurdle = FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100;
  let first_positive_row = null;
  let first_hurdle_row = null;
  cells.forEach((row, ri) => {
    const avg_irr = row.filter(c => c.irr != null).reduce((s, c) => s + c.irr, 0) / (row.filter(c => c.irr != null).length || 1);
    if (first_positive_row == null && avg_irr > 0) first_positive_row = ri;
    if (first_hurdle_row == null && avg_irr >= irr_hurdle) first_hurdle_row = ri;
  });

  return {
    axis_x: { param: paramX, label: SENSITIVITY_PARAMS[paramX].label, unit: SENSITIVITY_PARAMS[paramX].unit, values: x_values.map(v => round(v, 4)) },
    axis_y: { param: paramY, label: SENSITIVITY_PARAMS[paramY].label, unit: SENSITIVITY_PARAMS[paramY].unit, values: y_values.map(v => round(v, 4)) },
    cells,
    baseline,
    break_even_zone: { irr_positive_above_row: first_positive_row, irr_above_hurdle_above_row: first_hurdle_row },
  };
}

// Drivers ranked by the tornado, in a sensible default order. Each must exist in
// SENSITIVITY_PARAMS (range + clamp). Price params not populated for the active
// business model (null/0) are skipped automatically.
export const TORNADO_DEFAULT_PARAMS = [
  'exit_multiple',
  'price_hyperscale_kw_month',
  'target_occupancy_pct',
  'debt_interest_rate',
  'debt_pct',
  'electricity_price_mwh',
  'pue',
  'price_wholesale_kw_month',
  'price_retail_colo_kw_month',
];

// SENSITIVITY_PARAMS entries used by the tornado but absent from the 2-D grid set.
const TORNADO_EXTRA_PARAMS = {
  debt_interest_rate: { label: 'Debt Rate', range_pct: 0.25, unit: '%', clamp: [0, 50] },
};

/**
 * Generates a one-variable-at-a-time tornado: for each driver, bumps it ±range_pct
 * and measures the IRR swing vs the base scenario. Sorted by |swing| desc so the
 * biggest mover is first. Uses generateProjection consistently for base and bumped
 * runs, so the deltas are self-consistent (relative driver sensitivity).
 *
 * @param {object} scenario  post-bootstrap/override scenario
 * @param {string[]} [params=TORNADO_DEFAULT_PARAMS]
 * @returns {{ base_irr: number, bars: Array }|null}
 */
export function generateTornado(scenario, params = TORNADO_DEFAULT_PARAMS) {
  if (!scenario) return null;
  const base_proj = generateProjection(scenario);
  const base_irr = base_proj?.irr;
  if (base_irr == null) return null;

  const paramInfo = (p) => SENSITIVITY_PARAMS[p] || TORNADO_EXTRA_PARAMS[p] || null;
  const clampVal = (v, info) => (info.clamp ? Math.min(info.clamp[1], Math.max(info.clamp[0], v)) : v);

  const bars = [];
  for (const p of params) {
    const info = paramInfo(p);
    const baseVal = scenario[p];
    if (!info || baseVal == null || baseVal === 0) continue;

    const lo = clampVal(baseVal * (1 - info.range_pct), info);
    const hi = clampVal(baseVal * (1 + info.range_pct), info);
    const irr_lo = generateProjection({ ...scenario, [p]: lo })?.irr;
    const irr_hi = generateProjection({ ...scenario, [p]: hi })?.irr;
    if (irr_lo == null || irr_hi == null) continue;

    const delta_lo = irr_lo - base_irr;
    const delta_hi = irr_hi - base_irr;
    bars.push({
      param: p,
      label: info.label,
      unit: info.unit,
      range_pct: info.range_pct,
      base_value: round(baseVal, 4),
      low_value: round(lo, 4),
      high_value: round(hi, 4),
      irr_low: round(irr_lo, 4),
      irr_high: round(irr_hi, 4),
      delta_low: round(delta_lo, 4),
      delta_high: round(delta_hi, 4),
      swing: round(Math.abs(delta_hi - delta_lo), 4),
    });
  }

  bars.sort((a, b) => b.swing - a.swing);
  return { base_irr: round(base_irr, 4), bars };
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
