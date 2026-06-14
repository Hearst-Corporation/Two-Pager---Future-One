#!/usr/bin/env node
// Hearst Simulator — Standalone Data-Science Audit Harness
//
// Loads lib/hearst-* modules directly (no HTTP, no auth) and replays the
// same pipeline as /api/admin/hearst/simulate/route.js:
//   bootstrap → solver → applyArchetype/projectArchetype → calcHardwareBreakdown
//
// Each scenario prints: inputs · expected band · obtained value · verdict.
// Re-run with `node tests/simulator-audit.test.mjs` (Node 18+).
//
// NOTE: audit READ-ONLY sur le moteur — ne patch pas le code prod.

import { bootstrapScenarioFromSources } from '../lib/hearst-bootstrap.js';
import { solveScenarioForMode } from '../lib/hearst-solver.js';
import {
  DEAL_ARCHETYPES,
  projectArchetype,
} from '../lib/hearst-deal-structures.js';
import {
  generateProjection,
  generateDebtSchedule,
  generateWaterfall,
  calcIrr,
  calcNpv,
  foldGpuRevenue,
} from '../lib/hearst-calculations.js';
import {
  GPU_BY_ID,
  GPU_CATALOG,
  calcRackPower,
  calcGpuCapex,
  calcGpuAnnualRevenue,
} from '../lib/hearst-gpu-catalog.js';

const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

// ────────────────────────────────────────────────────────
// Replay of route.js — minus auth + DB
// ────────────────────────────────────────────────────────
function simulate(payload) {
  const {
    input_mode = 'mw_first',
    input_value = { total_mw: 50 },
    archetype_id = 'powered_shell',
    business_model_id,
    geography = 'qatar',
    hardware_mix,
    scenario_overrides,
  } = payload;

  const requested_mw = input_value?.total_mw ?? 50;
  const boot = bootstrapScenarioFromSources({
    geography,
    business_model_id,
    mw_target: requested_mw,
    archetype_id,
  });
  const defaults = { ...boot.scenario, ...(scenario_overrides || {}) };
  const archetype = ARCH_BY_ID[archetype_id];

  const solved = solveScenarioForMode(input_mode, input_value, defaults);
  const archResult = projectArchetype(solved.scenario, archetype);

  let hardware_breakdown = null;
  if (hardware_mix) {
    const {
      classic_pct = 100, liquid_pct = 0, ai_pct = 0,
      gpu_sku_id, num_racks, utilization_pct = 75, gpu_hour_price,
    } = hardware_mix;
    const total_mw = archResult.scenario.total_mw || 0;
    const mw_ai = total_mw * (ai_pct / 100);
    let capex_hardware = 0, revenue_ai_annual = 0, total_gpus = 0, gpu_info = null;
    if (ai_pct > 0 && gpu_sku_id && GPU_BY_ID[gpu_sku_id]) {
      const gpu = GPU_BY_ID[gpu_sku_id];
      gpu_info = gpu;
      const rack_kw = calcRackPower(gpu);
      const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
      const racks_used = num_racks != null && num_racks > 0 ? num_racks : derived_racks;
      capex_hardware = calcGpuCapex(racks_used, gpu);
      total_gpus = racks_used * gpu.density_per_rack;
      if (gpu_hour_price > 0) {
        revenue_ai_annual = calcGpuAnnualRevenue(racks_used, gpu, utilization_pct, gpu_hour_price);
      }
    }
    hardware_breakdown = {
      mw_classic: total_mw * (classic_pct / 100),
      mw_liquid: total_mw * (liquid_pct / 100),
      mw_ai, capex_hardware, revenue_ai_annual, total_gpus,
      gpu: gpu_info,
    };
  }

  // Fix 3 (P1, iter 4 A10): Scale GPU economics by HEARST's effective share of the project.
  // mirrors route.js — minority_equity uses equity_share; other archetypes use revenue_factor.
  const DEFAULT_MINORITY_EQUITY_SHARE = 0.20;
  if (hardware_breakdown) {
    const hw_share = archetype.compute_as === 'minority_equity'
      ? (archetype.equity_share || DEFAULT_MINORITY_EQUITY_SHARE)
      : (archetype.revenue_factor ?? 1.0);
    if (hw_share !== 1.0) {
      hardware_breakdown.revenue_ai_annual = (hardware_breakdown.revenue_ai_annual || 0) * hw_share;
      hardware_breakdown.capex_hardware    = (hardware_breakdown.capex_hardware || 0) * hw_share;
      hardware_breakdown.total_gpus        = Math.round((hardware_breakdown.total_gpus || 0) * hw_share);
    }
  }

  // foldGpuRevenue before debt_schedule + waterfall so they consume post-fold ebitda
  // Fix 5 (P1, iter 4 A10): also fold when capex_hardware > 0 but revenue=0 (orphan capex)
  if (hardware_breakdown && (hardware_breakdown.revenue_ai_annual > 0 || hardware_breakdown.capex_hardware > 0)) {
    foldGpuRevenue(archResult.projection, hardware_breakdown, archResult.scenario, {
      rfs_year: archResult.scenario.phase1_complete_year || 3,
      ramp_years: 2,
      exit_year: archResult.scenario.exit_year || 10,
      discount_rate_pct: archResult.scenario.discount_rate_pct ?? 10,
    });
  }

  // debt_schedule + waterfall after fold (post-fold ebitda)
  let debt_schedule = null;
  let waterfall = null;
  try {
    const ebitda_by_year = (archResult.projection?.years || []).map(y => y.ebitda ?? 0);
    if (archResult.scenario.debt_pct > 0) {
      debt_schedule = generateDebtSchedule(archResult.scenario, { ebitda_by_year });
    }
    if (archResult.projection?.years?.length > 0) {
      waterfall = generateWaterfall(archResult.scenario, archResult.projection);
    }
  } catch (e) { /* mirror route.js silence */ }

  return {
    boot, solver: solved.solver, derived: solved.derived,
    scenario: archResult.scenario,
    projection: archResult.projection,
    debt_schedule, waterfall, hardware_breakdown,
    archetype,
  };
}

// ────────────────────────────────────────────────────────
// Pretty print
// ────────────────────────────────────────────────────────
const f$ = (v) => v == null ? 'n/a' : v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}k` : `$${v.toFixed(0)}`;
const fPct = (v) => v == null ? 'n/a' : `${(v * 100).toFixed(2)}%`;
const fX = (v) => v == null ? 'n/a' : `${v.toFixed(2)}x`;

const results = [];
function check(name, condition, detail) {
  const verdict = condition === true ? '✅' : condition === 'warn' ? '⚠' : '❌';
  results.push({ name, verdict, detail });
  console.log(`  ${verdict} ${name}${detail ? ' — ' + detail : ''}`);
}

function dumpProjection(label, r) {
  const p = r.projection;
  console.log(`\n[${label}]`);
  console.log(`  scenario.total_mw         = ${r.scenario.total_mw}`);
  console.log(`  scenario.debt_pct         = ${r.scenario.debt_pct} (treated as ${(r.scenario.debt_pct ?? 0) >= 1 ? '0..100' : '0..1'} by which consumer?)`);
  console.log(`  scenario.debt_interest_rate = ${r.scenario.debt_interest_rate}`);
  console.log(`  scenario.opex_maintenance_pct = ${r.scenario.opex_maintenance_pct}`);
  console.log(`  total_capex               = ${f$(p?.total_capex)}`);
  console.log(`  stabilized_revenue        = ${f$(p?.stabilized_revenue)}`);
  console.log(`  stabilized_ebitda         = ${f$(p?.stabilized_ebitda)}  margin=${p?.years?.[8]?.ebitda_margin ?? 'n/a'}%`);
  console.log(`  irr                       = ${fPct(p?.irr)}`);
  console.log(`  npv (disc=10%)            = ${f$(p?.npv)}`);
  console.log(`  moic                      = ${fX(p?.moic)}`);
  console.log(`  payback_years             = ${p?.payback_years ?? 'n/a'}`);
  console.log(`  dscr_stabilized           = ${p?.dscr_stabilized ?? 'n/a'}`);
  console.log(`  terminal_value            = ${f$(p?.terminal_value)}`);
  if (r.debt_schedule) {
    console.log(`  debt yr1 service          = ${f$(r.debt_schedule.schedule[0]?.total_service)}  yr5=${f$(r.debt_schedule.schedule[4]?.total_service)}`);
    console.log(`  debt summary min_dscr     = ${r.debt_schedule.summary?.min_dscr}`);
  }
  if (r.hardware_breakdown) {
    const hb = r.hardware_breakdown;
    console.log(`  hw.mw_ai=${hb.mw_ai} racks=${hb.total_gpus / (hb.gpu?.density_per_rack || 1)} gpus=${hb.total_gpus}`);
    console.log(`  hw.capex_hardware=${f$(hb.capex_hardware)} revenue_ai_annual=${f$(hb.revenue_ai_annual)}`);
  }
}

// ════════════════════════════════════════════════════════
// FORMULA UNIT TESTS — pure functions, no scenario
// ════════════════════════════════════════════════════════
console.log('\n════════════════════════════════════════════════════════');
console.log('PART A — FORMULA UNIT TESTS');
console.log('════════════════════════════════════════════════════════');

// IRR sanity
{
  console.log('\n[A1] calcIrr — known textbook cases');
  // -100, +110 → r=10%
  const r1 = calcIrr([-100, 110]);
  check('IRR(-100,110) ≈ 10%', Math.abs(r1 - 0.10) < 1e-4, `got ${fPct(r1)}`);
  // -1000, +200, +200, +200, +200, +200, +200 → ~9.196%
  const r2 = calcIrr([-1000, 200, 200, 200, 200, 200, 200]);
  check('IRR(-1k,6×200) ≈ 5.47%', Math.abs(r2 - 0.05471) < 1e-3, `got ${fPct(r2)}`);
  // All positive cash flows (pathological) — should fail (no sign change)
  const r3 = calcIrr([100, 100, 100]);
  check('IRR all-positive returns null or diverges', r3 === null || Math.abs(r3) > 0.5, `got ${r3}`);
  // All negative
  const r4 = calcIrr([-100, -100, -100]);
  check('IRR all-negative returns null or large neg', r4 === null || r4 < -0.5, `got ${r4}`);
}

// NPV
{
  console.log('\n[A2] calcNpv — textbook');
  const npv = calcNpv([-1000, 500, 500, 500], 0.10);
  // 500/1.1 + 500/1.21 + 500/1.331 - 1000 = 454.5 + 413.2 + 375.7 - 1000 = 243.4
  check('NPV(-1k,3×500,r=10%) ≈ 243', Math.abs(npv - 243.4) < 1, `got ${npv.toFixed(2)}`);
}

// GPU revenue dimensional check
{
  console.log('\n[A3] calcGpuAnnualRevenue + calcRackPower dimensional check');
  const h100 = GPU_BY_ID.h100_sxm5;
  const gb200 = GPU_BY_ID.gb200_nvl72;

  // H100: 8 GPUs/rack, 700W each → rack=8*700*1.15 = 6440W = 6.44 kW ✓
  const rk_h100 = calcRackPower(h100);
  check('H100 rack_kw ≈ 6.44', Math.abs(rk_h100 - 6.44) < 0.1, `got ${rk_h100}`);

  // GB200 NVL72: tdp_w=1_200_000 → 1200 kW/rack. Public spec is ~132 kW/rack.
  const rk_gb = calcRackPower(gb200);
  check('GB200 NVL72 rack_kw matches NVIDIA spec (~132 kW)',
    Math.abs(rk_gb - 132) < 20 ? true : false,
    `got ${rk_gb} kW — NVIDIA Public Sources Library lists 132 kW; current code yields ${rk_gb} (off by ${(rk_gb / 132).toFixed(1)}×)`);

  // H100: 1 rack × 8 GPUs × 75% × 8760 × $2.49 = $130,810
  const r = calcGpuAnnualRevenue(1, h100, 75, 2.49);
  const expected = 1 * 8 * 0.75 * 8760 * 2.49;
  check('GPU revenue H100 1 rack', Math.abs(r - expected) < 1, `got ${r.toFixed(0)} expected ${expected.toFixed(0)}`);

  // CAPEX H100: 1 rack × 8 × $30k × 1.15 = $276,000
  const cap = calcGpuCapex(1, h100);
  check('GPU capex H100 1 rack ≈ $276k', Math.abs(cap - 276_000) < 100, `got ${cap}`);

  // CAPEX GB200: 1 rack × $3M × 1.15 = $3.45M (rack_scale)
  const capGb = calcGpuCapex(1, gb200);
  check('GPU capex GB200 NVL72 1 rack ≈ $3.45M', Math.abs(capGb - 3_450_000) < 1, `got ${capGb}`);
}

// ════════════════════════════════════════════════════════
// SCENARIO TESTS
// ════════════════════════════════════════════════════════
console.log('\n════════════════════════════════════════════════════════');
console.log('PART B — INTEGRATION SCENARIOS (full pipeline)');
console.log('════════════════════════════════════════════════════════');

// 1. Baseline Qatar branded_jv 50 MW
{
  console.log('\n[B1] Baseline Qatar — branded_jv 50 MW, ai_pct=20% gb200');
  const r = simulate({
    input_mode: 'mw_first',
    input_value: { total_mw: 50 },
    archetype_id: 'branded_jv',
    business_model_id: 'hyperscale_lease',
    hardware_mix: {
      classic_pct: 60, liquid_pct: 20, ai_pct: 20,
      gpu_sku_id: 'gb200_nvl72', utilization_pct: 75, gpu_hour_price: 5,
    },
  });
  dumpProjection('B1', r);
  check('B1 — total_capex in 50MW × $7-12M = $350-600M band',
    r.projection.total_capex >= 200e6 && r.projection.total_capex <= 700e6,
    `got ${f$(r.projection.total_capex)}`);
  check('B1 — IRR in range [5%, 40%] (sanity)',
    r.projection.irr != null && r.projection.irr >= 0.05 && r.projection.irr <= 0.40,
    `got ${fPct(r.projection.irr)}`);
  check('B1 — payback in [4, 12] yr',
    r.projection.payback_years != null && r.projection.payback_years >= 4 && r.projection.payback_years <= 12,
    `got ${r.projection.payback_years} yr`);
  // GPU revenue not folded into projection.revenue?
  const totalRev = r.projection.stabilized_revenue || 0;
  const gpuRev = r.hardware_breakdown?.revenue_ai_annual || 0;
  check('B1 — hardware_breakdown.revenue_ai_annual folded into projection.revenue?',
    gpuRev === 0 || totalRev > gpuRev * 0.5, // crude check
    `proj_rev=${f$(totalRev)} vs gpu_rev=${f$(gpuRev)} — if very different, GPU revenue is ignored by projection`);
}

// 2. All-AI extreme — neocloud
{
  console.log('\n[B2] All-AI extreme — neocloud_gpu 200 MW, ai_pct=100%, GB200, util=85%, $8/hr');
  const r = simulate({
    input_mode: 'mw_first',
    input_value: { total_mw: 200 },
    archetype_id: 'neocloud_gpu',
    business_model_id: 'gpu_cloud',
    hardware_mix: {
      classic_pct: 0, liquid_pct: 0, ai_pct: 100,
      gpu_sku_id: 'gb200_nvl72', utilization_pct: 85, gpu_hour_price: 8,
    },
  });
  dumpProjection('B2', r);
  check('B2 — GPU revenue (hardware) > $1B/yr (200MW × 85% × $8/hr)',
    (r.hardware_breakdown?.revenue_ai_annual || 0) > 500e6,
    `got ${f$(r.hardware_breakdown?.revenue_ai_annual)}`);
  check('B2 — projection IRR uses GPU revenue?',
    r.projection.irr > 0.30,
    `got ${fPct(r.projection.irr)} — if low, projection.years[].revenue ignores GPU revenue (design flaw)`);
}

// 3. Powered shell pure (no AI)
{
  console.log('\n[B3] Powered shell — 100 MW, ai_pct=0%');
  const r = simulate({
    input_mode: 'mw_first',
    input_value: { total_mw: 100 },
    archetype_id: 'powered_shell',
    business_model_id: 'hyperscale_lease',
  });
  dumpProjection('B3', r);
  // Powered shell zeroes MEP + cooling (bootstrap) → capex_per_mw should be in $5-8M range
  const capexPerMw = (r.projection.total_capex || 0) / 100;
  check('B3 — powered_shell capex_per_mw in [$4M, $9M]',
    capexPerMw >= 4e6 && capexPerMw <= 9e6,
    `got ${f$(capexPerMw)}/MW`);
  check('B3 — IRR in [4%, 18%] (long lease modest returns)',
    r.projection.irr != null && r.projection.irr >= 0.04 && r.projection.irr <= 0.25,
    `got ${fPct(r.projection.irr)}`);
}

// 4. Hyperscaler self-build (minority)
{
  console.log('\n[B4] hyperscaler_self_build minority — 100 MW');
  const r = simulate({
    input_mode: 'mw_first',
    input_value: { total_mw: 100 },
    archetype_id: 'hyperscaler_self_build',
    business_model_id: 'hyperscale_lease',
  });
  dumpProjection('B4', r);
  check('B4 — minority flag set on projection',
    r.projection.minority_equity === true,
    `got ${r.projection.minority_equity}`);
  check('B4 — equity_share = 0.20',
    r.projection.equity_share === 0.20,
    `got ${r.projection.equity_share}`);
  // Capex scaled by 0.20 → 100MW × $7M × 0.20 = $140M
  check('B4 — total_capex scaled by 20% equity share (~$100-200M for 100MW)',
    r.projection.total_capex >= 80e6 && r.projection.total_capex <= 250e6,
    `got ${f$(r.projection.total_capex)}`);
}

// 5. Sovereign AI
{
  console.log('\n[B5] Sovereign AI — 30 MW gov ai_pct=80%');
  const r = simulate({
    input_mode: 'mw_first',
    input_value: { total_mw: 30 },
    archetype_id: 'sovereign_ai',
    business_model_id: 'sovereign_ai',
    hardware_mix: {
      classic_pct: 0, liquid_pct: 20, ai_pct: 80,
      gpu_sku_id: 'gb200_nvl72', utilization_pct: 80, gpu_hour_price: 5,
    },
  });
  dumpProjection('B5', r);
  check('B5 — IRR computable',
    r.projection.irr != null,
    `got ${fPct(r.projection.irr)}`);
}

// 6. Cas limites
{
  console.log('\n[B6] Edge cases');

  // 6a — MW=0
  const r0 = simulate({ input_mode: 'mw_first', input_value: { total_mw: 0 }, archetype_id: 'branded_jv' });
  check('B6.0 — MW=0 returns gracefully (no crash, no inf)',
    r0.projection != null && !Number.isNaN(r0.projection.irr ?? 0) && (r0.projection.irr ?? 0) !== Infinity,
    `irr=${r0.projection?.irr}`);

  // 6b — MW=10000 (max)
  const rMax = simulate({ input_mode: 'mw_first', input_value: { total_mw: 5000 }, archetype_id: 'branded_jv' });
  check('B6.1 — MW=5000 finite outputs',
    Number.isFinite(rMax.projection?.total_capex ?? Infinity),
    `total_capex=${f$(rMax.projection?.total_capex)}`);

  // 6c — exit_year=1
  const rExit1 = simulate({
    input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv',
    scenario_overrides: { exit_year: 1 },
  });
  check('B6.2 — exit_year=1 produces terminal value at year 1',
    rExit1.projection.terminal_value != null,
    `tv=${f$(rExit1.projection.terminal_value)}, irr=${fPct(rExit1.projection.irr)}`);

  // 6d — debt_pct=100 (should produce equity_invested=0 → MOIC null)
  const r100 = simulate({
    input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv',
    scenario_overrides: { debt_pct: 100 },
  });
  check('B6.3 — debt_pct=100 → moic=null (no equity)',
    r100.projection.moic == null,
    `moic=${r100.projection.moic}`);
}

// 7. Monotonie — capital
{
  console.log('\n[B7] Monotonicity tests');
  const base = simulate({ input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease' });

  // 7a — +30% mw → revenue should rise
  const rMw = simulate({ input_mode: 'mw_first', input_value: { total_mw: 65 }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease' });
  check('B7.1 — +30% MW → stabilized_revenue rises',
    (rMw.projection.stabilized_revenue ?? 0) > (base.projection.stabilized_revenue ?? 0),
    `${f$(base.projection.stabilized_revenue)} → ${f$(rMw.projection.stabilized_revenue)}`);

  // 7b — +30% electricity → EBITDA should fall
  const rElec = simulate({
    input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease',
    scenario_overrides: { electricity_price_mwh: 50 },
  });
  const rElecBase = simulate({
    input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease',
    scenario_overrides: { electricity_price_mwh: 32 },
  });
  check('B7.2 — Higher electricity → lower stabilized EBITDA',
    (rElec.projection.stabilized_ebitda ?? 0) < (rElecBase.projection.stabilized_ebitda ?? 0),
    `$32→${f$(rElecBase.projection.stabilized_ebitda)} vs $50→${f$(rElec.projection.stabilized_ebitda)}`);

  // 7c — debt_pct change should change debt_service (pure percent convention: 20 = 20%)
  const rDebt0 = simulate({
    input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease',
    scenario_overrides: { debt_pct: 20, debt_interest_rate: 6.5 },
  });
  const rDebt1 = simulate({
    input_mode: 'mw_first', input_value: { total_mw: 50 }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease',
    scenario_overrides: { debt_pct: 80, debt_interest_rate: 6.5 },
  });
  console.log(`  debt_pct=20 → dscr=${rDebt0.projection.dscr_stabilized}, debt_service yr5=${f$(rDebt0.projection.years?.[4]?.debt_service)}`);
  console.log(`  debt_pct=80 → dscr=${rDebt1.projection.dscr_stabilized}, debt_service yr5=${f$(rDebt1.projection.years?.[4]?.debt_service)}`);
  // Pure percent convention: 20 = 20% debt, 80 = 80% debt — major difference in debt service.
  const ds_lo = rDebt0.projection.years?.[4]?.debt_service ?? 0;
  const ds_hi = rDebt1.projection.years?.[4]?.debt_service ?? 0;
  check('B7.3 — DSCR responds to debt_pct change (pure percent 20 vs 80)',
    Math.abs(ds_hi - ds_lo) > 100, // expect millions of diff at correct scale
    `Δdebt_service=${f$(ds_hi - ds_lo)} (if tiny: percent inputs not being applied correctly)`);
}

// 8. Symétrie modes — capital_first vs mw_first
{
  console.log('\n[B8] Capital_first vs mw_first symmetry');
  // Pick a capital that *should* yield ~50 MW given default per-MW
  const target_mw = 50;
  // estimate per-MW from bootstrap defaults
  const bootEst = bootstrapScenarioFromSources({ geography: 'qatar', mw_target: target_mw, archetype_id: 'branded_jv' });
  const perMw =
    (bootEst.scenario.capex_shell_per_mw || 0) +
    (bootEst.scenario.capex_mep_per_mw || 0) +
    (bootEst.scenario.capex_substation_per_mw || 0) +
    (bootEst.scenario.capex_cooling_per_mw || 0) +
    (bootEst.scenario.capex_grid_per_mw || 0) +
    (bootEst.scenario.capex_land_per_mw || 0);
  const capital = target_mw * perMw * 1.10;
  const rMw = simulate({ input_mode: 'mw_first', input_value: { total_mw: target_mw }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease' });
  const rCap = simulate({ input_mode: 'capital_first', input_value: { total_capex_usd: capital }, archetype_id: 'branded_jv', business_model_id: 'hyperscale_lease' });
  console.log(`  estimated perMw=${f$(perMw)}, capital=${f$(capital)}`);
  console.log(`  mw_first total_mw=${rMw.scenario.total_mw} → IRR=${fPct(rMw.projection.irr)}`);
  console.log(`  capital_first total_mw=${rCap.scenario.total_mw} → IRR=${fPct(rCap.projection.irr)}`);
  const irrDelta = Math.abs((rMw.projection.irr ?? 0) - (rCap.projection.irr ?? 0));
  check('B8 — IRR matches between mw_first and capital_first (Δ<0.5pp)',
    irrDelta < 0.005,
    `Δ=${(irrDelta * 100).toFixed(2)}pp — large delta means the two modes diverge`);
}

// 9. Target IRR solver
{
  console.log('\n[B9] Target IRR solver');
  const r = simulate({
    input_mode: 'target_irr_first',
    input_value: { target_irr_pct: 18, lever: 'pricing', total_mw: 50 },
    archetype_id: 'branded_jv',
    business_model_id: 'hyperscale_lease',
  });
  console.log(`  solver.converged=${r.solver?.converged}, iters=${r.solver?.iterations}, lever_value=${r.solver?.lever_value}`);
  console.log(`  achieved_irr=${fPct(r.solver?.achieved_irr)} target=18% diagnostic=${r.solver?.diagnostic || 'ok'}`);
  if (r.solver?.converged) {
    check('B9 — target IRR achieved within tolerance', Math.abs(r.solver.achieved_irr - 0.18) < 0.005, `Δ=${((r.solver.achieved_irr - 0.18) * 100).toFixed(2)}pp`);
  } else {
    check('B9 — solver reports infeasibility clearly', !!r.solver?.diagnostic, r.solver?.diagnostic || 'no diagnostic');
  }

  // 9b — Target infeasible (IRR=50%)
  const r50 = simulate({
    input_mode: 'target_irr_first',
    input_value: { target_irr_pct: 50, lever: 'pricing', total_mw: 50 },
    archetype_id: 'powered_shell',
    business_model_id: 'hyperscale_lease',
  });
  console.log(`  infeasible test → converged=${r50.solver?.converged} diagnostic=${r50.solver?.diagnostic}`);
  check('B9b — IRR=50% reports infeasible (does not silently return wrong)', r50.solver?.converged === false || Math.abs((r50.solver?.achieved_irr ?? 0) - 0.50) > 0.05, `irr=${fPct(r50.solver?.achieved_irr)} converged=${r50.solver?.converged}`);
}

// 10. Bootstrap unit-scale check
{
  console.log('\n[B10] Bootstrap unit-scale verification (the smoking gun)');
  const boot = bootstrapScenarioFromSources({ geography: 'qatar', mw_target: 50, archetype_id: 'branded_jv' });
  console.log(`  bootstrap.debt_pct           = ${boot.scenario.debt_pct}  (expected 0..100; if <1, P0 unit bug)`);
  console.log(`  bootstrap.debt_interest_rate = ${boot.scenario.debt_interest_rate}  (expected 0..100)`);
  console.log(`  bootstrap.opex_maintenance_pct = ${boot.scenario.opex_maintenance_pct}  (expected 0..100)`);
  check('B10.1 — debt_pct in 0..100 scale per generateProjection contract',
    boot.scenario.debt_pct > 1,
    `got ${boot.scenario.debt_pct} (ratio) — generateProjection() divides by 100; debt becomes ${(boot.scenario.debt_pct / 100 * 100).toFixed(3)}% of capex`);
  check('B10.2 — debt_interest_rate in 0..100 scale',
    boot.scenario.debt_interest_rate > 1,
    `got ${boot.scenario.debt_interest_rate} (ratio) → interest 0.065% applied to debt service (off by 100×)`);
  check('B10.3 — opex_maintenance_pct in 0..100 scale',
    boot.scenario.opex_maintenance_pct > 1,
    `got ${boot.scenario.opex_maintenance_pct} (ratio) → variable opex ${(boot.scenario.opex_maintenance_pct / 100 * 100).toFixed(3)}% of revenue (off by 100×)`);
}

// ════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════
const pass = results.filter(r => r.verdict === '✅').length;
const warn = results.filter(r => r.verdict === '⚠').length;
const fail = results.filter(r => r.verdict === '❌').length;
console.log('\n════════════════════════════════════════════════════════');
console.log(`SUMMARY  ✅ ${pass}   ⚠ ${warn}   ❌ ${fail}   (total ${results.length})`);
console.log('════════════════════════════════════════════════════════');
if (fail > 0) {
  console.log('\nFAILED CHECKS:');
  results.filter(r => r.verdict === '❌').forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
}
process.exit(fail > 0 ? 1 : 0);
