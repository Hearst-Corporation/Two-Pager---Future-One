// lib/hearst-deal-structures.js
// Deal Structure Simulator — derives HEARST-side economics for each of the 5
// archetypes the founder is choosing between for the Qatar AI Hub.
//
// Methodology (sources: CBRE H1 2025, JLL 2025, Brookfield/Compass disclosures,
// Equinix sovereign JV pattern, Meta×Blue Owl Hyperion Oct 2025):
//   1. Take the active scenario's full-stack inputs (the 100%-owned baseline).
//   2. Apply per-archetype factors to derive HEARST's effective inputs.
//   3. Re-run generateProjection() on the modified scenario.
//
// Score dimensions (1-5, 5 = best) reflect strategic trade-offs surfaced in
// the research brief, NOT pure financial returns:
//   - brand:        does HEARST keep its name on the building?
//   - bankability:  how easily can Brookfield finance / securitise this?
//   - speed:        time from term-sheet to MW online
//   - control:      operational governance retained by HEARST
//   - margin:       gross-margin potential on HEARST's invested equity
//   - exit:         tradeability of the stabilised asset

import { generateProjection, calcIrr, calcNpv, generateDebtSchedule } from './hearst-calculations';
import { FINANCIAL_THRESHOLDS } from './hearst-constants';
import { UI } from './ui-strings';

// Default developer margin assumed when stabilized EBITDA is unavailable.
// Source: typical 12-18% dev margin on hyperscale shell deals, 2024-25 (CBRE H1 2025).
const DEFAULT_DEV_MARGIN = 0.15;

/** Qatar capital gains tax rate on real estate disposition.
 * Source: QFZA tax regime + Law No. 24 of 2018 (Income Tax Law) — 10% on capital gains
 * for non-Qatari investors, exemptable under QFZA Free Zone status with conditions.
 * Conservative default: applied even under QFZA assumption. */
const QATAR_CAPITAL_GAINS_TAX = 0.10;

export const DEAL_ARCHETYPES = [
  {
    id: 'powered_shell',
    code: 'B',
    label: UI.ARCH_POWERED_SHELL_LABEL,
    short: UI.ARCH_POWERED_SHELL_SHORT,
    operator_role: 'Operator rents the building (long lease)',
    description: UI.ARCH_POWERED_SHELL_DESC,
    // CAPEX coverage by HEARST: shell + substation + grid + land. Tenant pays MEP + cooling.
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 0,
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    // Revenue: NNN rent ~$40-80/kW/mo vs ~$180-215 full hyperscale.
    // Net effect on HEARST top-line: ~30-35% of full-ops revenue.
    revenue_factor: 0.33,
    // Opex pass-through: tenant pays power, staff, maintenance, insurance, G&A.
    opex_factor: 0,
    operator_fee_pct: 0,
    debt_rate_delta_bps: -150, // Source: CBRE H1 2025 — NNN tenant covenant pricing 100-150 bps below merchant DCs.
    scores: { brand: 5, bankability: 5, speed: 4, control: 4, margin: 3, exit: 5 },
    recommended: true,
    deal_terms: UI.ARCH_POWERED_SHELL_TERMS,
    real_comp: UI.ARCH_POWERED_SHELL_COMP,
  },
  {
    id: 'branded_jv',
    code: 'A',
    label: UI.ARCH_BRANDED_JV_LABEL,
    short: UI.ARCH_BRANDED_JV_SHORT,
    operator_role: 'Co-investor (49% partner)',
    description: UI.ARCH_BRANDED_JV_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 0.51,
      capex_mep_per_mw: 0.51,
      capex_substation_per_mw: 0.51,
      capex_cooling_per_mw: 0.51,
      capex_grid_per_mw: 0.51,
      capex_land_per_mw: 0.51,
    },
    revenue_factor: 0.51,
    opex_factor: 0.51,
    operator_fee_pct: 0,
    debt_rate_delta_bps: 75, // Source: JLL 2025 / Brookfield-Compass disclosures — JV dilution of operator covenant adds 50-100 bps vs NNN.
    brand_premium_pct: 0.12, // Source: Equinix MC1 Oman & Equinix Bahrain — operator-led brand commands ~10-15% rent premium on hyperscale colocation.
    scores: { brand: 3, bankability: 3, speed: 2, control: 4, margin: 4, exit: 3 },
    recommended: false,
    deal_terms: UI.ARCH_BRANDED_JV_TERMS,
    real_comp: UI.ARCH_BRANDED_JV_COMP,
  },
  {
    id: 'manage_only',
    code: 'C',
    label: UI.ARCH_MANAGE_ONLY_LABEL,
    short: UI.ARCH_MANAGE_ONLY_SHORT,
    operator_role: 'Service provider, no ownership',
    description: UI.ARCH_MANAGE_ONLY_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 1.0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 1.0,
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    revenue_factor: 1.0,
    opex_factor: 1.0,
    operator_fee_pct: 12, // % of revenue
    debt_rate_delta_bps: 0, // Source: CBRE H1 2025 — Manage-Only is the merchant DC reference rate; no delta.
    scores: { brand: 5, bankability: 2, speed: 3, control: 5, margin: 5, exit: 3 },
    recommended: false,
    deal_terms: UI.ARCH_MANAGE_ONLY_TERMS,
    real_comp: UI.ARCH_MANAGE_ONLY_COMP,
  },
  {
    id: 'white_label',
    code: 'D',
    label: UI.ARCH_WHITE_LABEL_LABEL,
    short: UI.ARCH_WHITE_LABEL_SHORT,
    operator_role: 'Invisible operator (behind the scenes)',
    description: UI.ARCH_WHITE_LABEL_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 1.0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 1.0,
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    revenue_factor: 1.0,
    opex_factor: 1.0,
    operator_fee_pct: 20, // % of revenue
    debt_rate_delta_bps: 50, // Source: Brookfield/Compass disclosures — service-only operator (no equity) requires HEARST completion guarantee; lenders add 50 bps.
    scores: { brand: 5, bankability: 4, speed: 3, control: 4, margin: 4, exit: 4 },
    recommended: false,
    deal_terms: UI.ARCH_WHITE_LABEL_TERMS,
    real_comp: UI.ARCH_WHITE_LABEL_COMP,
  },
  {
    id: 'sale_leaseback',
    code: 'E',
    label: UI.ARCH_SALE_LEASEBACK_LABEL,
    short: UI.ARCH_SALE_LEASEBACK_SHORT,
    operator_role: 'Buyer who keeps the building',
    description: UI.ARCH_SALE_LEASEBACK_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 1.0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 1.0,
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    // NOTE: revenue_factor and opex_factor are NOT consumed when compute_as === 'one_time_sale'.
    // The sale-leaseback projection bypasses applyArchetype() and uses a dedicated dev-exit cash flow.
    revenue_factor: 0,    // one-time gain, no recurring revenue modelled here
    opex_factor: 0,
    operator_fee_pct: 0,
    debt_rate_delta_bps: 0, // Source: CBRE H1 2025 — Sale-Leaseback is short-term construction financing; no delta vs baseline.
    tax_rate: QATAR_CAPITAL_GAINS_TAX,
    sale_yield_target: 0.07, // 7% developer yield — typical 2024-25 stabilised cap rate
    dev_exit_year: 4, // 36-48 months from COD → 4 yr (deal_terms: "Stabilisation period ≥80% occ. typically 36-48 mo")
    compute_as: 'one_time_sale',
    scores: { brand: 1, bankability: 5, speed: 5, control: 1, margin: 2, exit: 5 },
    recommended: false,
    deal_terms: UI.ARCH_SALE_LEASEBACK_TERMS,
    real_comp: UI.ARCH_SALE_LEASEBACK_COMP,
  },
  {
    id: 'neocloud_gpu',
    code: 'F',
    label: UI.ARCH_NEOCLOUD_GPU_LABEL,
    short: UI.ARCH_NEOCLOUD_GPU_SHORT,
    operator_role: 'Full AI cloud provider',
    description: UI.ARCH_NEOCLOUD_GPU_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 1.0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 1.5, // Liquid cooling required for GB200/H200 dense
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    // Revenue is GPU-hour driven, NOT colocation $/kW/mo.
    // Set revenue_factor=1.0 so colo-style scenarios still work; the actual revenue
    // is plugged via hardware_mix.gpu_hour_price in /api/admin/hearst/simulate.
    revenue_factor: 1.0,
    opex_factor: 1.2, // +20% : hardware lifecycle (4 yr depreciation) + GPU support staff
    operator_fee_pct: 8,
    debt_rate_delta_bps: 250, // Higher rate: hardware-heavy, short contracts, ABS-style securitisation 200-300 bps wider
    scores: { brand: 3, bankability: 2, speed: 5, control: 4, margin: 4, exit: 3 },
    recommended: false,
    compute_as: 'gpu_cloud',
    deal_terms: UI.ARCH_NEOCLOUD_GPU_TERMS,
    real_comp: UI.ARCH_NEOCLOUD_GPU_COMP,
  },
  {
    id: 'hyperscaler_self_build',
    code: 'G',
    label: UI.ARCH_HYPERSCALER_LABEL,
    short: UI.ARCH_HYPERSCALER_SHORT,
    operator_role: 'Tech giant (AWS/Google/Meta) runs everything',
    description: UI.ARCH_HYPERSCALER_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 0.20,   // HEARST 20% par défaut
      capex_mep_per_mw: 0.20,
      capex_substation_per_mw: 0.20,
      capex_cooling_per_mw: 0.20,
      capex_grid_per_mw: 0.20,
      capex_land_per_mw: 0.20,
    },
    revenue_factor: 0.20,
    opex_factor: 0.20,
    operator_fee_pct: 0,
    debt_rate_delta_bps: -200, // Hyperscaler covenant (AWS/Google AAA) → -200 bps vs merchant
    scores: { brand: 1, bankability: 5, speed: 4, control: 1, margin: 5, exit: 4 },
    recommended: false,
    compute_as: 'minority_equity',
    equity_share: 0.20,
    deal_terms: UI.ARCH_HYPERSCALER_TERMS,
    real_comp: UI.ARCH_HYPERSCALER_COMP,
  },
  {
    id: 'sovereign_ai',
    code: 'H',
    label: UI.ARCH_SOVEREIGN_AI_LABEL,
    short: UI.ARCH_SOVEREIGN_AI_SHORT,
    operator_role: 'We run it, Qatar Gov / Qai is the only customer',
    description: UI.ARCH_SOVEREIGN_AI_DESC,
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 1.0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 1.3, // Air-gapped + redundancy gov-grade
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    revenue_factor: 0.90, // 90% of merchant pricing — negotiated
    opex_factor: 1.0,
    operator_fee_pct: 5,
    debt_rate_delta_bps: -100, // Sovereign-backed covenant → -100 bps
    scores: { brand: 5, bankability: 5, speed: 3, control: 4, margin: 4, exit: 2 },
    recommended: false,
    compute_as: 'recurring_revenue',
    deal_terms: UI.ARCH_SOVEREIGN_AI_TERMS,
    real_comp: UI.ARCH_SOVEREIGN_AI_COMP,
  },
];

/** Operating models surfaced in the simulator picker (4 of 8 full archetypes). */
export const PRIMARY_MODEL_IDS = [
  'powered_shell',
  'neocloud_gpu',
  'hyperscaler_self_build',
  'sovereign_ai',
];

/**
 * Apply an archetype's economic factors to a base scenario and return a new
 * scenario object suitable for generateProjection().
 *
 * Mutations:
 *   - capex_*_per_mw scaled per component factor (powered_shell keeps shell+grid+sub+land only)
 *   - price_*_kw_month scaled by revenue_factor
 *   - opex_*_pct scaled by opex_factor
 *   - operator_fee_pct added as opex_operator_mgmt_fee_pct (overriding scenario's value)
 *   - debt_pct unchanged (sponsor decides leverage independently)
 *
 * @param {object} scenario - base scenario row from hearst_scenarios
 * @param {object} archetype - one element of DEAL_ARCHETYPES
 * @param {object} [opts] - optional config
 * @param {object} [opts.scenario_overrides] - the raw overrides object from the caller, used to
 *   detect explicit user-supplied values (e.g. electricity_price_mwh) vs bootstrapped defaults.
 * @returns {object} modified scenario (does NOT mutate the input)
 */
function applyArchetype(scenario, archetype, opts = {}) {
  if (!scenario || !archetype) return scenario;
  const s = { ...scenario };
  const f = archetype.capex_component_factor || {};
  const warnings = [];
  const { scenario_overrides } = opts;

  // Scale CAPEX components
  for (const k of Object.keys(f)) {
    if (s[k] != null) s[k] = s[k] * f[k];
  }

  // Scale revenue lines
  if (archetype.revenue_factor != null) {
    ['price_retail_colo_kw_month', 'price_wholesale_kw_month', 'price_hyperscale_kw_month'].forEach((k) => {
      if (s[k] != null) s[k] = s[k] * archetype.revenue_factor;
    });
  }

  // Scale opex percentages (excluding operator mgmt fee — handled separately)
  if (archetype.opex_factor != null) {
    ['opex_maintenance_pct', 'opex_insurance_pct', 'opex_ga_pct', 'opex_staff_annual_musd'].forEach((k) => {
      if (s[k] != null) s[k] = s[k] * archetype.opex_factor;
    });
    // If opex_factor === 0, tenant pays all opex including power.
    // Zero out electricity_price_mwh ONLY when no explicit override is present — if the caller
    // supplied an explicit value via scenario_overrides, respect it and warn instead of
    // silently discarding it. When scenario_overrides is not provided, fall back to checking
    // whether the merged scenario already carries a non-null value (conservative: warns).
    if (archetype.opex_factor === 0) {
      const elecOverridden = scenario_overrides != null
        ? scenario_overrides.electricity_price_mwh != null
        : scenario.electricity_price_mwh != null;
      if (elecOverridden) {
        // Override present: keep the value, surface an informational warning.
        warnings.push(
          'electricity_price_mwh override noted: NNN structure passes electricity cost to tenant. This value does not reduce operator margins in powered_shell archetype.'
        );
      } else {
        s.electricity_price_mwh = 0;
      }
    }
  }

  // Operator fee — replaces (does not add to) any scenario-level operator_mgmt_fee.
  // archetype.operator_fee_pct values are integers (0, 5, 8, 12, 20 = percent points).
  // Store as-is in percent scale (0..100) — generateProjection divides by 100 at consumption.
  if (archetype.operator_fee_pct != null) {
    s.opex_operator_mgmt_fee_pct = archetype.operator_fee_pct;
  }

  // S3.1 — Debt rate delta by archetype.
  // debt_interest_rate is stored as percent (0..100). 100 bps = 1 percentage point.
  // delta_pp = bps / 100 (e.g. 75 bps → +0.75 pp; -150 bps → -1.50 pp)
  if (archetype.debt_rate_delta_bps != null && s.debt_interest_rate != null) {
    const delta_pp = archetype.debt_rate_delta_bps / 100; // bps → percentage points
    s.debt_interest_rate = Math.max(0, (s.debt_interest_rate || 0) + delta_pp);
  }

  // S3.3 — Brand premium on Branded JV.
  // Applied AFTER revenue_factor scaling (multiplicative on top of the already-scaled prices).
  // Effective revenue = base × revenue_factor × (1 + brand_premium_pct).
  if (archetype.brand_premium_pct != null) {
    ['price_retail_colo_kw_month', 'price_wholesale_kw_month', 'price_hyperscale_kw_month'].forEach((k) => {
      if (s[k] != null) s[k] = s[k] * (1 + archetype.brand_premium_pct);
    });
  }

  s._archetype_warnings = warnings;
  return s;
}

/**
 * Compute the full archetype outcome for a scenario:
 *   - modified scenario
 *   - generated 10-yr projection
 *   - composite strategic score (avg of 6 dimensions, 0-100)
 *
 * @param {object} scenario
 * @param {object} archetype
 * @param {object} [opts] - forwarded to applyArchetype (e.g. { scenario_overrides })
 * @returns {{ scenario, projection, score, archetype }}
 */
export function projectArchetype(scenario, archetype, opts = {}) {
  const s = archetype.scores || {};
  const dims = ['brand', 'bankability', 'speed', 'control', 'margin', 'exit'];
  const score = Math.round(
    (dims.reduce((acc, d) => acc + (s[d] || 0), 0) / (dims.length * 5)) * 100
  );

  if (archetype.compute_as === 'one_time_sale') {
    const baseline = generateProjection(scenario);
    const total_capex = baseline.total_capex;
    // CORR-C: use archetype-level dev_exit_year, NOT scenario.exit_year (which is long-term-hold horizon)
    const dev_exit = archetype.dev_exit_year || 4;
    const discount = (scenario.discount_rate_pct ?? FINANCIAL_THRESHOLDS.discount_rate_pct) / 100;

    const missing_inputs = [...(baseline.missing_inputs || [])];

    // CORR-D: use named constant instead of magic 1.15
    let sale_proceeds;
    if (baseline.stabilized_ebitda != null && baseline.stabilized_ebitda > 0) {
      sale_proceeds = baseline.stabilized_ebitda / archetype.sale_yield_target;
    } else {
      sale_proceeds = (total_capex || 0) * (1 + DEFAULT_DEV_MARGIN);
      missing_inputs.push('stabilized_ebitda (using developer-margin fallback)');
    }

    // CORR-B: build equity cash flows (levered), comparable to other archetypes
    // debt_pct is pure percent (0..100)
    const equity_invested = (total_capex || 0) * (1 - (scenario.debt_pct ?? 0) / 100);
    // MOIC = distributions / initial equity (industry convention).
    // Interim debt_service is captured by IRR, not by MOIC denominator.
    const debtResult = (scenario.debt_pct > 0) ? generateDebtSchedule(scenario) : null;

    let debt_outstanding_at_exit = 0;
    const equity_cash_flows = new Array(dev_exit + 1).fill(0);
    equity_cash_flows[0] = -(equity_invested || 0);

    if (debtResult && debtResult.schedule && debtResult.schedule.length > 0) {
      // Add -debt_service for each year Y1..dev_exit
      for (let t = 1; t <= dev_exit; t++) {
        const row = debtResult.schedule[t - 1]; // schedule is 1-indexed by year
        equity_cash_flows[t] = -(row?.total_service ?? 0);
      }
      // Debt outstanding at exit = closing_balance at end of dev_exit year
      const exitRow = debtResult.schedule[dev_exit - 1];
      debt_outstanding_at_exit = exitRow?.closing_balance ?? 0;
    }

    // S3.4 — Qatar capital gains tax on real estate disposition.
    // Applied on the gain (proceeds − cost basis = total_capex), then netted from equity cash flow.
    const taxable_gain = Math.max(0, sale_proceeds - (total_capex || 0));
    const tax_owed = archetype.tax_rate != null ? taxable_gain * archetype.tax_rate : 0;
    const sale_proceeds_net = sale_proceeds - tax_owed;

    // At exit year, equity receives NET sale_proceeds (post-tax) minus remaining debt
    equity_cash_flows[dev_exit] += sale_proceeds_net - debt_outstanding_at_exit;

    const irr = calcIrr(equity_cash_flows);
    const npv = calcNpv(equity_cash_flows, discount);
    const total_distributions_to_equity = sale_proceeds_net - debt_outstanding_at_exit;
    const moic = equity_invested > 0 ? total_distributions_to_equity / equity_invested : null;

    return {
      scenario,
      projection: {
        total_capex,
        terminal_value: sale_proceeds,   // gross, for display
        sale_proceeds_net,               // net of Qatar capital gains tax
        tax_owed,                        // exposed for debugging / future display
        irr,
        irr_post_tax: irr,               // alias — cash flows already net of capital-gains tax
        npv,
        npv_post_tax: npv,
        payback_years: dev_exit,
        stabilized_ebitda: null,
        stabilized_revenue: null,
        moic,
        moic_post_tax: moic,
        terminal_value_to_equity: sale_proceeds_net - debt_outstanding_at_exit,
        equity_invested,
        dscr_stabilized: null,
        missing_inputs,
        sale_mode: true,
        // Pass-through from baseline for transparency and downstream consumers
        years: baseline.years,
        warnings: baseline.warnings,
        idc: baseline.idc,
        construction_years: baseline.construction_years,
        capex_reconciliation: baseline.capex_reconciliation,
        cod_offset_months: baseline.cod_offset_months,
      },
      score,
      archetype,
    };
  }

  // Helper: lift _archetype_warnings from the modified scenario into the projection.
  function mergeArchetypeWarnings(modified, projection) {
    const aw = modified._archetype_warnings;
    if (aw && aw.length > 0) {
      projection.warnings = [...(projection.warnings || []), ...aw];
    }
    // Remove the internal marker so it doesn't leak into the API response scenario object.
    delete modified._archetype_warnings;
  }

  // Minority equity (hyperscaler_self_build): HEARST en LP minoritaire.
  // Revenue = dividends sur EBITDA × equity_share, exit = stake × sale_proceeds.
  // applyArchetype scale déjà tous les flux par 0.20 — la projection standard est juste plus petite.
  // On ajoute un override pour annoter le résultat et limiter le control narrative.
  if (archetype.compute_as === 'minority_equity') {
    const modified = applyArchetype(scenario, archetype, opts);
    const projection = generateProjection(modified);
    mergeArchetypeWarnings(modified, projection);
    return {
      scenario: modified,
      projection: {
        ...projection,
        minority_equity: true,
        equity_share: archetype.equity_share || 0.20,
        notes: 'HEARST minority — cash flows scaled by equity_share. Dividends-only economics.',
      },
      score,
      archetype,
    };
  }

  // GPU cloud (neocloud_gpu): la projection standard reste valide pour l'enveloppe
  // facility, mais le revenue principal vient des GPU-hours plutôt que du colo.
  // L'API /simulate ajoute revenue_ai en surcharge via hardware_mix. Ici on
  // applique simplement l'archétype et on flague le mode.
  if (archetype.compute_as === 'gpu_cloud') {
    const modified = applyArchetype(scenario, archetype, opts);
    const projection = generateProjection(modified);
    mergeArchetypeWarnings(modified, projection);
    return {
      scenario: modified,
      projection: {
        ...projection,
        gpu_cloud_mode: true,
        notes: 'GPU-hour revenue driven by hardware_mix (see /simulate). Facility-side colo shown for reference.',
      },
      score,
      archetype,
    };
  }

  const modified = applyArchetype(scenario, archetype, opts);
  const projection = generateProjection(modified);
  mergeArchetypeWarnings(modified, projection);
  return { scenario: modified, projection, score, archetype };
}
