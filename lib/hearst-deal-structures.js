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

import { generateProjection } from './hearst-calculations';

export const DEAL_ARCHETYPES = [
  {
    id: 'powered_shell',
    code: 'B',
    label: 'Powered Shell + NNN Lease',
    short: 'Bail triple-net 15-20 ans',
    operator_role: 'Locataire (anchor tenant)',
    description:
      'HEARST owns the powered shell + utility delivery; the operator (Equinix/NTT) ' +
      'signs a 15-20 yr triple-net lease and fits out the white space. HEARST keeps ' +
      '100% of the building and brand. Closest analog: Meta×Blue Owl Hyperion ($27B, Oct 2025).',
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
    scores: { brand: 5, bankability: 5, speed: 4, control: 4, margin: 3, exit: 5 },
    recommended: true,
    deal_terms: [
      'Signage & legal name = HEARST. Operator may only place an interior back-of-house panel.',
      'Tenor 15-20 yr, 3% annual escalator, mandatory tech-refresh every 7 yr at tenant cost (DLC, ≥100 kW/rack).',
      'No campus-wide exclusivity. HEARST free to bring NTT/DR onto adjacent buildings in Phase 2.',
      'Change-of-control put: HEARST can terminate if Equinix is acquired or de-lists.',
    ],
    real_comp: 'Meta×Blue Owl Hyperion (Oct 2025) — $27B / Blue Owl owns 80% / Meta leases 100% for ~15 yr.',
  },
  {
    id: 'branded_jv',
    code: 'A',
    label: 'Branded JV 51 / 49',
    short: 'Co-brand JV avec opérateur',
    operator_role: 'Co-investisseur 49%',
    description:
      'HEARST and operator co-invest in a single SPV (HEARST 51%, operator 49%). Co-branded "HEARST × Equinix" asset. ' +
      'Operator runs day-to-day, HEARST has board control. RARE in practice — Equinix has never done it ' +
      '(closest: Omantel MC1 Oman 2020, but brand is still Equinix-led).',
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
    scores: { brand: 3, bankability: 3, speed: 2, control: 4, margin: 4, exit: 3 },
    recommended: false,
    deal_terms: [
      'Brand: co-brand only — operator will fight to be listed first; lock the order in the JV agreement.',
      'Governance: HEARST CEO + Chair, operator gets CFO + COO. Reserved matters for HEARST on disposals.',
      'Exit: tag-along + drag-along + ROFR caps to prevent operator blocking HEARST exit.',
      'Operator covenant dilution → lenders will price 50-100 bps wider than NNN.',
    ],
    real_comp: 'Equinix×Omantel MC1 Oman (2020) — operating JV, but brand stays "Equinix MC1".',
  },
  {
    id: 'manage_only',
    code: 'C',
    label: 'Manage-Only (O&M Contract)',
    short: 'HEARST owns 100%, opérateur fait l\'O&M',
    operator_role: 'Prestataire O&M (sans equity)',
    description:
      'HEARST owns 100% of the asset and commercialises directly. The operator (Schneider/Vertiv/Equinix Services) ' +
      'is contracted at a fixed fee (~10-15% of revenue) to run NOC, maintenance, security. HEARST holds ALL lease-up risk.',
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
    scores: { brand: 5, bankability: 2, speed: 3, control: 5, margin: 5, exit: 3 },
    recommended: false,
    deal_terms: [
      'KPIs on the O&M provider: uptime (≥99.999%), MTTR, energy-efficiency targets, with fee clawback if missed.',
      'No exclusivity — HEARST must be able to swap O&M provider on 12-mo notice.',
      'HEARST handles commercial directly → needs to hire a sales force, customer-success team, and connectivity manager BEFORE first MW.',
      'Lenders will require completion guarantees from HEARST/Brookfield (no operator covenant fallback).',
    ],
    real_comp: 'Multiple GCC sovereign DCs use Schneider/Vertiv on O&M-only contracts.',
  },
  {
    id: 'white_label',
    code: 'D',
    label: 'White-Label Operations',
    short: 'Opérateur invisible (modèle Compass)',
    operator_role: 'Opérateur anonyme (back-office)',
    description:
      'HEARST owns 100%, is the customer-facing brand, and the operator runs the floor anonymously. ' +
      'The customer (Microsoft, Oracle) signs with HEARST directly. Operator paid as a service provider (~20% of revenue). ' +
      'Direct analog: Brookfield-owned Compass Datacenters, which operates anonymously for hyperscalers.',
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
    scores: { brand: 5, bankability: 4, speed: 3, control: 4, margin: 4, exit: 4 },
    recommended: false,
    deal_terms: [
      'Operator NDA + brand silence covenant: cannot list HEARST as a client publicly.',
      'Customer contracts are HEARST-Customer (operator is sub-contractor) — preserves brand equity.',
      'Tech-refresh schedule (DLC, GB200/GB300 readiness) baked into the O&M scope.',
      'Use Compass (Brookfield) as preferred provider — leverages your existing Brookfield relationship.',
    ],
    real_comp: 'Compass Datacenters (Brookfield/OTPP, $5.5B acq. 2023) — 800 MW operated white-label for hyperscalers.',
  },
  {
    id: 'sale_leaseback',
    code: 'E',
    label: 'Sale / Sale-Leaseback',
    short: 'HEARST construit, vend, loue',
    operator_role: 'Acheteur final + bailleur',
    description:
      'HEARST develops the asset, sells it to an infra investor or operator at stabilisation, ' +
      'and optionally leases a portion back. Maximises one-time gain, exits the operating story entirely. ' +
      'NOT aligned with HEARST\'s brand or long-term Qatar narrative — included only as a downside reference.',
    capex_component_factor: {
      capex_shell_per_mw: 1.0,
      capex_mep_per_mw: 1.0,
      capex_substation_per_mw: 1.0,
      capex_cooling_per_mw: 1.0,
      capex_grid_per_mw: 1.0,
      capex_land_per_mw: 1.0,
    },
    revenue_factor: 0,    // one-time gain, no recurring revenue modelled here
    opex_factor: 0,
    operator_fee_pct: 0,
    sale_yield_target: 0.07, // 7% developer yield — typical 2024-25 stabilised cap rate
    scores: { brand: 1, bankability: 5, speed: 5, control: 1, margin: 2, exit: 5 },
    recommended: false,
    deal_terms: [
      '❌ DEFEATS THE BRAND PURPOSE. Only consider if Qatar mandate becomes politically untenable.',
      'Stabilisation period (≥80% occupancy) before sale → typically 36-48 months from COD.',
      'Cap rate ~6-8% on stabilised hyperscale NOI in tier-1; ~7-9% in frontier markets.',
      'Tax leakage in Qatar on capital gains — coordinate with Qatar Free Zone authority.',
    ],
    real_comp: 'Iron Mountain DC acquisitions; numerous tier-2 developer exits to Blackstone/KKR.',
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
  }

  // Operator fee — replaces (does not add to) any scenario-level operator_mgmt_fee
  if (archetype.operator_fee_pct != null) {
    s.opex_operator_mgmt_fee_pct = archetype.operator_fee_pct;
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
  const modified = applyArchetype(scenario, archetype);
  const projection = generateProjection(modified);
  const s = archetype.scores || {};
  const dims = ['brand', 'bankability', 'speed', 'control', 'margin', 'exit'];
  const score = Math.round(
    (dims.reduce((acc, d) => acc + (s[d] || 0), 0) / (dims.length * 5)) * 100
  );
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
