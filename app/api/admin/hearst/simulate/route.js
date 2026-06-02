// POST /api/admin/hearst/simulate
//
// Stateless preview endpoint pour le simulator (/admin/hearst/simulator).
// Prend en entrée le mode (mw_first | capital_first | target_irr_first),
// la valeur du champ vedette, un archetype, et un hardware_mix optionnel.
// Retourne une projection complète SANS écrire en DB.
//
// Pipeline :
//   1. bootstrapScenarioFromSources → defaults Qatar par défaut
//   2. solveScenarioForMode         → résout le mode + injecte le total_mw
//   3. applyArchetype + projectArchetype → applique les facteurs d'archétype
//   4. generateWaterfall + generateDebtSchedule → flows financiers
//   5. (si hardware_mix) calcHardwareBreakdown → CAPEX hardware + revenue AI
//
// La persistance se fait à part via POST /api/admin/hearst/scenarios après
// confirmation utilisateur ("Save as Scenario" dans la page simulator).

import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/supabase-admin';
import { withValidation } from '@/lib/validators/withValidation';
import { SimulateRequestSchema } from '@/lib/validators/hearst';
import {
  DEAL_ARCHETYPES,
  projectArchetype,
} from '@/lib/hearst-deal-structures';
import {
  generateDebtSchedule,
  generateWaterfall,
  foldGpuRevenue,
} from '@/lib/hearst-calculations';
import { solveScenarioForMode } from '@/lib/hearst-solver';
import { bootstrapScenarioFromSources } from '@/lib/hearst-bootstrap';
import {
  GPU_BY_ID,
  calcGpuCapex,
  calcGpuAnnualRevenue,
  calcRackPower,
} from '@/lib/hearst-gpu-catalog';

const ARCHETYPE_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

// Fallback equity share when archetype.equity_share is not set (minority_equity archetypes
// always define equity_share, but this guards against future archetypes that forget it).
const DEFAULT_MINORITY_EQUITY_SHARE = 0.20;

/**
 * Calcule le breakdown hardware (densités + GPU) pour un mix donné.
 * Retourne null si le mix est trivial (100% classic, pas d'AI).
 */
function calcHardwareBreakdown(scenario, hardware_mix) {
  if (!hardware_mix) return null;
  const {
    classic_pct = 100,
    liquid_pct = 0,
    ai_pct = 0,
    gpu_sku_id,
    num_racks,
    utilization_pct = 75,
    gpu_hour_price,
  } = hardware_mix;

  const total_mw = scenario.total_mw || 0;
  const mw_classic = total_mw * (classic_pct / 100);
  const mw_liquid = total_mw * (liquid_pct / 100);
  const mw_ai = total_mw * (ai_pct / 100);

  let capex_hardware = 0;
  let revenue_ai_annual = 0;
  let total_gpus = 0;
  let gpu_info = null;

  if (ai_pct > 0 && gpu_sku_id && GPU_BY_ID[gpu_sku_id]) {
    const gpu = GPU_BY_ID[gpu_sku_id];
    gpu_info = gpu;
    const rack_kw = calcRackPower(gpu);
    const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
    const racks_used = num_racks != null && num_racks > 0 ? num_racks : derived_racks;

    capex_hardware = calcGpuCapex(racks_used, gpu);
    total_gpus = racks_used * gpu.density_per_rack;
    if (gpu_hour_price != null && gpu_hour_price > 0) {
      revenue_ai_annual = calcGpuAnnualRevenue(racks_used, gpu, utilization_pct, gpu_hour_price);
    }
  }

  return {
    mw_classic,
    mw_liquid,
    mw_ai,
    capex_hardware,
    revenue_ai_annual,
    total_gpus,
    gpu: gpu_info ? {
      id: gpu_info.id,
      sku: gpu_info.sku,
      vendor: gpu_info.vendor,
      tdp_w: gpu_info.tdp_w,
      density_per_rack: gpu_info.density_per_rack,
      rack_scale: gpu_info.rack_scale,
    } : null,
  };
}

export const POST = withValidation(SimulateRequestSchema, async (req, parsed) => {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const {
    input_mode,
    input_value,
    archetype_id,
    business_model_id,
    geography = 'qatar',
    hardware_mix,
    scenario_overrides,
  } = parsed;

  const archetype = ARCHETYPE_BY_ID[archetype_id];
  if (!archetype) {
    return NextResponse.json({ error: `Unknown archetype_id: ${archetype_id}` }, { status: 400 });
  }

  // 1. Bootstrap des defaults Qatar depuis PUBLIC_SOURCES_LIBRARY
  const requested_mw = input_value?.total_mw ?? 50;
  const boot = bootstrapScenarioFromSources({
    geography,
    business_model_id,
    mw_target: requested_mw,
    archetype_id,
  });

  // 2. Merge: defaults Qatar + overrides utilisateur
  const defaults = { ...boot.scenario, ...(scenario_overrides || {}) };

  // 3. Résoudre le mode (mw_first / capital_first / target_irr_first)
  const { scenario: solvedScenario, derived, solver } = solveScenarioForMode(
    input_mode,
    input_value,
    defaults,
  );

  // 4. Appliquer l'archétype + projection
  const archResult = projectArchetype(solvedScenario, archetype);
  const projection = archResult.projection;

  // 5. Hardware breakdown (si fourni)
  const hardware_breakdown = calcHardwareBreakdown(archResult.scenario, hardware_mix);

  // Fix 3 (P1): Scale GPU economics by HEARST's effective share of the project:
  // - minority_equity: explicit equity_share (typically 0.20)
  // - other archetypes: revenue_factor (HEARST's revenue share post applyArchetype)
  // powered_shell intentionally has revenue_factor=0.33 → GPU minimal (tenant owns gear in practice)
  // mw_ai, mw_classic, mw_liquid stay as-is (describe the facility, not HEARST's stake)
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

  // 6. Fold GPU revenue into projection if hardware has AI component
  // Fix 5 (P1): also fold when capex_hardware > 0 but revenue=0 (orphan capex case)
  if (hardware_breakdown && (hardware_breakdown.revenue_ai_annual > 0 || hardware_breakdown.capex_hardware > 0)) {
    foldGpuRevenue(projection, hardware_breakdown, archResult.scenario, {
      rfs_year: archResult.scenario.phase1_complete_year || 3,
      ramp_years: 2,
      exit_year: archResult.scenario.exit_year || 10,
      discount_rate_pct: archResult.scenario.discount_rate_pct ?? 10,
    });
  }

  // 7. Debt schedule + waterfall (best effort — after fold so they consume post-fold ebitda)
  let debt_schedule = null;
  let waterfall = null;
  try {
    const ebitda_by_year = (projection?.years || []).map(y => y.ebitda ?? 0);
    if (solvedScenario.debt_pct > 0) {
      debt_schedule = generateDebtSchedule(archResult.scenario, { ebitda_by_year });
    }
    if (projection?.years?.length > 0) {
      waterfall = generateWaterfall(archResult.scenario, projection);
    }
  } catch (e) {
    // Les calculs auxiliaires ne doivent pas faire échouer la route
    console.warn('[simulate] debt/waterfall failed:', e?.message);
  }

  return NextResponse.json({
    scenario: archResult.scenario,
    projection,
    waterfall,
    debt_schedule,
    archetype_outcome: {
      id: archetype.id,
      label: archetype.label,
      code: archetype.code,
      score: archResult.score,
      scores: archetype.scores,
      compute_as: archetype.compute_as || 'recurring_revenue',
    },
    hardware_breakdown,
    source_map: boot.source_map,
    confidence_score: boot.confidence_score,
    derived,
    solver: solver
      ? {
          converged: solver.converged,
          iterations: solver.iterations,
          lever_value: solver.lever_value,
          achieved_irr: solver.achieved_irr,
          diagnostic: solver.diagnostic,
        }
      : null,
  });
});
