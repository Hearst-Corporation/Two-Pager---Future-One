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
import { asRatio } from './hearst-units';

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
    label: 'Shell + Long Lease',
    short: 'We build it, a big operator rents it for 15-20 years',
    operator_role: 'Operator rents the building (long lease)',
    description:
      'We build the empty data center (walls, power, land). A big operator like Equinix moves in, ' +
      'equips it, and pays rent for 15-20 years. We keep ownership and our name on the building. ' +
      'Lowest risk, steady rent. Closest example: Meta x Blue Owl Hyperion ($27B, 2025).',
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
    deal_terms: [
      'Our name stays on the building. Operator only gets a small interior panel.',
      'Lease lasts 15-20 years, with 3% yearly rent increases.',
      'No exclusive deal — we stay free to bring other operators into nearby buildings.',
      'We can exit the lease if the operator gets bought out or delisted.',
    ],
    real_comp: 'Meta x Blue Owl Hyperion (Oct 2025) — $27B / Blue Owl owns 80% / Meta leases 100% for ~15 yr.',
  },
  {
    id: 'branded_jv',
    code: 'A',
    label: 'Co-branded Joint Venture (51 / 49)',
    short: 'We own 51%, an operator owns 49%, both names on the building',
    operator_role: 'Co-investor (49% partner)',
    description:
      'We team up with an operator like Equinix. We put in 51% of the money, they put in 49%. ' +
      'Both names appear on the building. They run the day-to-day, we keep board control. ' +
      'Rare in practice (closest: Equinix x Omantel MC1 Oman, 2020, but operator brand dominates).',
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
    deal_terms: [
      'Both names on the building — lock our name in first position in the contract.',
      'We pick the CEO and Chair, partner picks the CFO and COO. We approve any building sale.',
      'Clear exit rules so the partner cannot block us when we want to sell.',
      'Banks charge slightly more for the loan because the partner only covers part of the deal.',
    ],
    real_comp: 'Equinix x Omantel MC1 Oman (2020) — operating JV, but brand stays "Equinix MC1".',
  },
  {
    id: 'manage_only',
    code: 'C',
    label: 'In-House (Outsourced Operations)',
    short: 'We own 100%, an outside team runs the daily operations',
    operator_role: 'Service provider, no ownership',
    description:
      'We own the entire building and sign customers ourselves. A specialist company (like Schneider or Vertiv) ' +
      'is paid a fixed fee (around 10-15% of revenue) to handle maintenance, security and monitoring. ' +
      'We get all the upside but also carry all the risk of filling the building.',
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
    deal_terms: [
      'Hard service targets (uptime, response time, energy efficiency) with fee penalties if missed.',
      'We can swap the operations partner with 12 months notice — no lock-in.',
      'We need to build our own sales team and customer relationships before opening.',
      'Banks ask for stronger guarantees because no big operator covers the loan.',
    ],
    real_comp: 'Multiple GCC sovereign DCs use Schneider/Vertiv on O&M-only contracts.',
  },
  {
    id: 'white_label',
    code: 'D',
    label: 'Hidden Operator',
    short: 'We are the public brand, an invisible partner runs the building',
    operator_role: 'Invisible operator (behind the scenes)',
    description:
      'We own 100% and are the only brand customers see. A specialist partner runs the building in the background ' +
      'without ever appearing publicly. Customers (Microsoft, Oracle, etc.) sign contracts directly with us. ' +
      'Partner is paid like a service provider (around 20% of revenue). Same model as Compass Datacenters.',
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
    deal_terms: [
      'Partner signs an NDA — cannot mention us as a client publicly.',
      'All customer contracts are signed directly by us — the partner is a subcontractor.',
      'Tech upgrades for next-gen AI chips are included in the operations contract.',
      'Compass (owned by Brookfield) is the preferred partner — leverages our Brookfield relationship.',
    ],
    real_comp: 'Compass Datacenters (Brookfield/OTPP, $5.5B acq. 2023) — 800 MW operated white-label for hyperscalers.',
  },
  {
    id: 'sale_leaseback',
    code: 'E',
    label: 'Build & Sell',
    short: 'We build it, sell once stabilized, optionally lease part back',
    operator_role: 'Buyer who keeps the building',
    description:
      'We build the data center, then sell it to an infrastructure investor or operator once it is filled with customers. ' +
      'Big one-time payout, but we exit the long-term story. Goes against our brand goal — included as a fallback only ' +
      'if the Qatar mandate becomes politically difficult.',
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
    deal_terms: [
      'WARNING: kills our brand presence. Only use as a backup if politics force an exit.',
      'Wait until the building is at least 80% full before selling — usually 3 to 4 years after opening.',
      'Sale price depends on yield expectations (around 6-8% in top markets, 7-9% in frontier markets).',
      'Qatar charges tax on the gain — work with the Qatar Free Zone authority to optimize.',
    ],
    real_comp: 'Iron Mountain DC acquisitions; numerous tier-2 developer exits to Blackstone/KKR.',
  },
  {
    id: 'neocloud_gpu',
    code: 'F',
    label: 'GPU Rental Cloud (CoreWeave-style)',
    short: 'We own both the building and the AI chips, and rent computing power by the hour',
    operator_role: 'Full AI cloud provider',
    description:
      'We own the building AND the AI chips inside. We rent computing power by the hour to AI labs, startups and large companies. ' +
      'Direct competitor to CoreWeave and Lambda. Highest revenue but short customer contracts (1-3 years) ' +
      'and chips need replacing every 18-24 months. Cheap Qatar electricity (~$32/MWh) protects our margins.',
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
    deal_terms: [
      'Customer contracts last 1 to 3 years — mix of reserved clusters and on-demand usage.',
      'Replace chips every 24 months — older chips lose 40-60% of value over 3 years.',
      'Need high-quality fiber connectivity (via Equinix or Ooredoo).',
      'Customer mix: ~40% AI labs, ~40% enterprise AI, ~20% government AI training.',
    ],
    real_comp: 'CoreWeave $19B IPO (Q1 2025) — 500MW GPU cloud. Lambda Series D 2024 = $300M valued ~$2.5B.',
  },
  {
    id: 'hyperscaler_self_build',
    code: 'G',
    label: 'Tech Giant Partnership (Minority Stake)',
    short: 'We invest 15-30% in a data center built and run by AWS, Google, or Meta',
    operator_role: 'Tech giant (AWS/Google/Meta) runs everything',
    description:
      'We invest as a minority partner (15-30%) in a data center that a tech giant (AWS, Google, Meta) ' +
      'builds and runs in Qatar. We collect dividends and a capital gain when we exit. ' +
      'No control, no brand visibility. Best for steady financial returns, but we lose the strategic story.',
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
    deal_terms: [
      'We own 15-30%, the tech giant owns 70-85% and makes all the decisions.',
      'Annual dividends of around 7-9% on the money we put in.',
      'No board seat (maybe one observer). No say in commercial decisions.',
      'We can exit alongside the tech giant when they sell at a typical valuation of 18-22x profit.',
    ],
    real_comp: 'Saudi-PIF in AWS Riyadh (announced 2024) — minority infrastructure stake.',
  },
  {
    id: 'sovereign_ai',
    code: 'H',
    label: 'Government AI Cluster',
    short: 'A dedicated AI center for the Qatar government, 10-15 year contract',
    operator_role: 'We run it, Qatar Gov / Qai is the only customer',
    description:
      'An AI center built specifically for the Qatar government and its agencies (QIA, Qai, defense, ministries). ' +
      'Contract lasts 10-15 years at a negotiated price (usually our cost plus 15-20%). One customer means no risk of empty space. ' +
      'Our brand becomes linked to Qatar national tech sovereignty. Steady margin, but growth limited to government budget.',
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
    deal_terms: [
      'Single customer: Qatar Gov / Qai / defense. 10-15 year guaranteed contract.',
      'Fully isolated from the public internet, military-grade encryption.',
      'Strict compliance: Qatar data protection law, GDPR-equivalent, plus US defense rules for defense use.',
      'Hard to sell later: Qatar Gov has first refusal on any sale. Natural buyers are Brookfield or Qai.',
    ],
    real_comp: 'UAE G42 sovereign AI ($1.5B Microsoft 2024); Saudi HUMAIN PIF (2024).',
  },
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
 * @returns {object} modified scenario (does NOT mutate the input)
 */
export function applyArchetype(scenario, archetype) {
  if (!scenario || !archetype) return scenario;
  const s = { ...scenario };
  const f = archetype.capex_component_factor || {};

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
    // If opex_factor === 0, tenant pays all opex including power — zero out electricity cost
    if (archetype.opex_factor === 0) {
      s.electricity_price_mwh = 0;
    }
  }

  // Operator fee — replaces (does not add to) any scenario-level operator_mgmt_fee.
  // archetype.operator_fee_pct values are integers (0, 5, 8, 12, 20 = percent points).
  // Divide by 100 to align with ratio 0..1 convention used by generateProjection.
  if (archetype.operator_fee_pct != null) {
    s.opex_operator_mgmt_fee_pct = archetype.operator_fee_pct / 100;
  }

  // S3.1 — Debt rate delta by archetype.
  // debt_interest_rate is stored as ratio 0..1 (asRatio() handles legacy 0..100 input).
  // 100 bps = 0.01 in ratio scale, so delta = bps / 10000.
  if (archetype.debt_rate_delta_bps != null && s.debt_interest_rate != null) {
    const delta_ratio = archetype.debt_rate_delta_bps / 10000; // bps → ratio (100 bps = 0.01)
    s.debt_interest_rate = Math.max(0, asRatio(s.debt_interest_rate) + delta_ratio);
  }

  // S3.3 — Brand premium on Branded JV.
  // Applied AFTER revenue_factor scaling (multiplicative on top of the already-scaled prices).
  // Effective revenue = base × revenue_factor × (1 + brand_premium_pct).
  if (archetype.brand_premium_pct != null) {
    ['price_retail_colo_kw_month', 'price_wholesale_kw_month', 'price_hyperscale_kw_month'].forEach((k) => {
      if (s[k] != null) s[k] = s[k] * (1 + archetype.brand_premium_pct);
    });
  }

  return s;
}

/**
 * Compute the full archetype outcome for a scenario:
 *   - modified scenario
 *   - generated 10-yr projection
 *   - composite strategic score (avg of 6 dimensions, 0-100)
 *
 * @returns {{ scenario, projection, score, archetype }}
 */
export function projectArchetype(scenario, archetype) {
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
    const discount = (scenario.discount_rate_pct ?? 10) / 100;

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
    const equity_invested = (total_capex || 0) * (1 - asRatio(scenario.debt_pct ?? 0));
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
        npv,
        payback_years: dev_exit,
        stabilized_ebitda: null,
        stabilized_revenue: null,
        moic,
        dscr_stabilized: null,
        missing_inputs,
        sale_mode: true,
      },
      score,
      archetype,
    };
  }

  // Minority equity (hyperscaler_self_build): HEARST en LP minoritaire.
  // Revenue = dividends sur EBITDA × equity_share, exit = stake × sale_proceeds.
  // applyArchetype scale déjà tous les flux par 0.20 — la projection standard est juste plus petite.
  // On ajoute un override pour annoter le résultat et limiter le control narrative.
  if (archetype.compute_as === 'minority_equity') {
    const modified = applyArchetype(scenario, archetype);
    const projection = generateProjection(modified);
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
    const modified = applyArchetype(scenario, archetype);
    const projection = generateProjection(modified);
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

  const modified = applyArchetype(scenario, archetype);
  const projection = generateProjection(modified);
  return { scenario: modified, projection, score, archetype };
}

/**
 * Convenience — run all archetypes against a single scenario and return
 * them sorted by composite score (recommended first).
 */
export function projectAllArchetypes(scenario) {
  return DEAL_ARCHETYPES.map((a) => projectArchetype(scenario, a)).sort((a, b) => {
    if (a.archetype.recommended && !b.archetype.recommended) return -1;
    if (!a.archetype.recommended && b.archetype.recommended) return 1;
    return b.score - a.score;
  });
}

/**
 * Whitelist of scenario columns considered writable through the create API.
 * Mirrors `ScenarioWritableFields` in lib/validators/hearst.js.
 * Used by the Deal Simulator's "Materialize archetype" flow to strip
 * read-only / server-managed fields before POST.
 */
export const SCENARIO_WRITABLE_KEYS = [
  // Identity / meta (project_id, name, scenario_type sont déjà fournis explicitement)
  'description', 'is_active', 'is_locked',
  // Capacity phasing
  'total_mw', 'total_mw_source_id', 'phase1_mw', 'phase1_complete_year',
  'phase2_mw', 'phase2_complete_year', 'phase3_mw', 'phase3_complete_year',
  // Power
  'pue', 'pue_source_id', 'target_occupancy_pct', 'start_year',
  // CAPEX
  'capex_shell_per_mw', 'capex_shell_source_id',
  'capex_mep_per_mw', 'capex_mep_source_id',
  'capex_substation_per_mw', 'capex_substation_source_id',
  'capex_cooling_per_mw', 'capex_cooling_source_id',
  'capex_grid_per_mw', 'capex_grid_source_id',
  'capex_contingency_pct',
  'capex_liquid_cooling_premium_per_mw',
  'capex_land_per_mw', 'capex_land_source_id',
  // OPEX
  'electricity_price_mwh', 'electricity_price_source_id',
  'opex_maintenance_pct', 'opex_staff_annual_musd', 'opex_insurance_pct',
  'opex_ga_pct', 'opex_operator_mgmt_fee_pct',
  // Revenue
  'price_retail_colo_kw_month', 'price_retail_source_id',
  'price_wholesale_kw_month', 'price_wholesale_source_id',
  'price_hyperscale_kw_month', 'price_hyperscale_source_id',
  'annual_escalation_pct',
  // Capital structure
  'equity_hearst_pct', 'equity_brookfield_pct', 'equity_qatar_pct',
  'debt_pct', 'debt_interest_rate', 'debt_interest_source_id', 'debt_term_years',
  // Exit
  'exit_multiple', 'exit_multiple_source_id', 'exit_year',
  // Commercial
  'commercial_split', 'operator_strategy',
  // Simulator metadata
  'input_mode', 'input_value', 'hardware_mix',
];
