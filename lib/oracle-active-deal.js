// lib/oracle-active-deal.js
//
// Server-side fallback ("voie b") for chat grounding.
//
// Fetches the project's active scenario from Supabase (schema: crm),
// recomputes the engine projection via generateProjection(), optionally
// folds in GPU revenue if hardware_mix is present on the row, and returns
// { scenario, projection, warnings } — the exact shape buildDealGroundingBlock expects.
//
// Designed to be pure-ish (no side effects beyond DB reads) and safely
// importable from Next.js API routes (nodejs runtime only).
//
// Returns null when:
//   - No project row exists yet
//   - No active_scenario_id is set on the project
//   - The scenario row is missing required inputs (projection.missing_inputs is non-empty)
//   - Any unexpected error (caller must wrap in try/catch)

import { createClient } from '@supabase/supabase-js';
import { generateProjection, foldGpuRevenue } from '@/lib/hearst-calculations';
import {
  GPU_BY_ID,
  calcGpuCapex,
  calcGpuAnnualRevenue,
  calcRackPower,
} from '@/lib/hearst-gpu-catalog';

/**
 * Derive hardware_breakdown from a scenario row's hardware_mix field.
 * Mirrors the calcHardwareBreakdown() function in app/api/admin/hearst/simulate/route.js.
 * Returns null when no meaningful GPU content is present (100% classic or no ai_pct).
 *
 * @param {object} scenario — raw hearst_scenarios row (must have total_mw)
 * @param {object|null} hardware_mix — JSON stored in scenario.hardware_mix
 * @returns {{ capex_hardware: number, revenue_ai_annual: number, mw_ai: number }|null}
 */
function deriveHardwareBreakdown(scenario, hardware_mix) {
  if (!hardware_mix) return null;
  const {
    ai_pct = 0,
    gpu_sku_id,
    num_racks,
    utilization_pct = 75,
    gpu_hour_price,
  } = hardware_mix;

  if (ai_pct <= 0 || !gpu_sku_id) return null;

  const total_mw = scenario.total_mw || 0;
  const mw_ai = total_mw * (ai_pct / 100);
  const gpu = GPU_BY_ID[gpu_sku_id];
  if (!gpu) return null;

  const rack_kw = calcRackPower(gpu);
  const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
  const racks_used = (num_racks != null && num_racks > 0) ? num_racks : derived_racks;
  if (racks_used <= 0) return null;

  const capex_hardware = calcGpuCapex(racks_used, gpu);
  const revenue_ai_annual =
    gpu_hour_price != null && gpu_hour_price > 0
      ? calcGpuAnnualRevenue(racks_used, gpu, utilization_pct, gpu_hour_price)
      : 0;

  return { capex_hardware, revenue_ai_annual, mw_ai };
}

/**
 * Fetch the active scenario for this workspace's project, run the engine,
 * and return { scenario, projection, warnings } — or null if there is no
 * active scenario or the scenario is missing required inputs.
 *
 * @returns {Promise<{ scenario: object, projection: object, warnings: string[] }|null>}
 */
export async function resolveActiveDeal() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('[oracle-active-deal] Missing Supabase env vars');
  }

  const supa = createClient(url, key, {
    db: { schema: 'crm' },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Fetch the most recent project that has an active_scenario_id set.
  //    Single-tenant workspace: there is usually exactly one project row.
  //    If multiple exist, prefer the one with a non-null active_scenario_id,
  //    most recently created.
  const { data: project, error: projErr } = await supa
    .from('hearst_projects')
    .select('id, active_scenario_id')
    .not('active_scenario_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (projErr) throw new Error(`[oracle-active-deal] project fetch: ${projErr.message}`);
  if (!project?.active_scenario_id) return null;

  // 2. Load the active scenario row (all columns via *).
  const { data: scenarioRow, error: scErr } = await supa
    .from('hearst_scenarios')
    .select('*')
    .eq('id', project.active_scenario_id)
    .maybeSingle();

  if (scErr) throw new Error(`[oracle-active-deal] scenario fetch: ${scErr.message}`);
  if (!scenarioRow) return null;

  // 3. Run facility projection.
  //    NOTE: the row is the post-save scenario as recorded by the simulator's
  //    "Save as Scenario" flow — it carries the same fields generateProjection
  //    consumes (total_mw, pue, debt_pct, capex_*_per_mw, prices, etc.).
  //    If the row was created manually via the admin form without running the
  //    simulator first, some fields may be null → missing_inputs will be
  //    non-empty and we return null to avoid surfacing an empty projection.
  const projection = generateProjection(scenarioRow);
  if (!projection || (projection.missing_inputs?.length ?? 0) > 0) return null;

  // 4. Optionally fold GPU revenue when hardware_mix is present.
  //    hardware_mix is stored as a JSON column on the scenario row (set by
  //    the simulator's save flow). If absent or trivially classic (ai_pct=0),
  //    we skip the fold — facility-only projection is sufficient for grounding.
  const hardware_mix = scenarioRow.hardware_mix;
  if (hardware_mix) {
    const hb = deriveHardwareBreakdown(scenarioRow, hardware_mix);
    if (hb && (hb.revenue_ai_annual > 0 || hb.capex_hardware > 0)) {
      foldGpuRevenue(projection, hb, scenarioRow, {});
    }
  }

  const warnings = Array.isArray(projection.warnings) ? projection.warnings : [];
  return { scenario: scenarioRow, projection, warnings };
}
