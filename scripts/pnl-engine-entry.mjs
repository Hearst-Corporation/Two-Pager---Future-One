// Browser entry: bundles the REAL projection engine pipeline (the exact one
// app/api/admin/hearst/simulate/route.js runs) minus auth / DB / rate-limit, so the
// standalone P&L model recomputes live from the same code the app uses.
//
// Built to an IIFE global `PNLEngine` via vite (npm run build:pnl-engine).
import {
  DEAL_ARCHETYPES,
  projectArchetype,
} from '../lib/hearst-deal-structures';
import {
  generateDebtSchedule,
  generateWaterfall,
  foldGpuRevenue,
} from '../lib/hearst-calculations';
import { solveScenarioForMode } from '../lib/hearst-solver';
import { bootstrapScenarioFromSources } from '../lib/hearst-bootstrap';
import { calcHardwareBreakdown, GPU_CATALOG } from '../lib/hearst-gpu-catalog';
import { FINANCIAL_THRESHOLDS, MINORITY_EQUITY_SHARE_DEFAULT } from '../lib/hearst-constants';
import { buildSimulateResponse } from '../lib/hearst-simulate-response';
import { DEFAULT_GEOGRAPHY } from '../app/admin/hearst/utils/constants';
import {
  INPUT_MODES, SOLVER_LEVERS, ARCHETYPE_OPTIONS, BUSINESS_MODEL_OPTIONS,
  GEOGRAPHY_OPTIONS, OPERATOR_STRATEGY_OPTIONS, OVERRIDE_GROUPS, OVERRIDE_KEYS,
} from '../app/admin/hearst/utils/sim-levers';

const ARCHETYPE_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));
const DEFAULT_MINORITY_EQUITY_SHARE = MINORITY_EQUITY_SHARE_DEFAULT;

/**
 * 1:1 reproduction of the /simulate route handler body (no NextResponse, no auth,
 * no Supabase fetch, no rate-limit). Same bootstrap → solve → archetype → hardware
 * fold → debt/waterfall pipeline, returning the same shape as buildSimulateResponse.
 */
export function runSimulate(req) {
  const {
    input_mode = 'mw_first',
    input_value = { total_mw: 50 },
    archetype_id,
    business_model_id,
    geography = DEFAULT_GEOGRAPHY,
    hardware_mix = null,
    scenario_overrides = {},
  } = req || {};

  const archetype = ARCHETYPE_BY_ID[archetype_id];
  if (!archetype) throw new Error(`Unknown archetype_id: ${archetype_id}`);

  // 1. Bootstrap Qatar defaults (no DB sources in standalone mode)
  const requested_mw = input_value?.total_mw ?? 50;
  const boot = bootstrapScenarioFromSources({
    geography,
    business_model_id,
    mw_target: requested_mw,
    archetype_id,
    extraSources: [],
  });

  // 2. Merge defaults + user overrides
  const defaults = { ...boot.scenario, ...(scenario_overrides || {}) };

  const buildArchetypeProjection = (scenario) => {
    const ar = projectArchetype(scenario, archetype, { scenario_overrides });
    const proj = ar.projection;
    const hb = calcHardwareBreakdown(ar.scenario, hardware_mix);
    if (hb) {
      const hw_share = archetype.compute_as === 'minority_equity'
        ? (archetype.equity_share || DEFAULT_MINORITY_EQUITY_SHARE)
        : (archetype.revenue_factor ?? 1.0);
      if (hw_share !== 1.0) {
        hb.revenue_ai_annual = (hb.revenue_ai_annual || 0) * hw_share;
        hb.capex_hardware    = (hb.capex_hardware || 0) * hw_share;
        hb.total_gpus        = Math.round((hb.total_gpus || 0) * hw_share);
      }
    }
    if (hb && (hb.revenue_ai_annual > 0 || hb.capex_hardware > 0)) {
      foldGpuRevenue(proj, hb, ar.scenario, {
        rfs_year: ar.scenario.phase1_complete_year || 3,
        ramp_years: 2,
        exit_year: ar.scenario.exit_year || 10,
        discount_rate_pct: ar.scenario.discount_rate_pct ?? FINANCIAL_THRESHOLDS.discount_rate_pct,
      });
    }
    return { archResult: ar, hardware_breakdown: hb };
  };

  const totalCapexForMw = (mw) =>
    buildArchetypeProjection({ ...defaults, total_mw: mw }).archResult.projection?.total_capex ?? null;

  // 3. Solve mode
  const { scenario: solvedScenario, derived, solver } = solveScenarioForMode(
    input_mode, input_value, defaults, { totalCapexForMw },
  );

  // 4-6. Final projection through the same pipeline
  const { archResult, hardware_breakdown } = buildArchetypeProjection(solvedScenario);
  const projection = archResult.projection;

  // 7. Debt schedule + waterfall (best effort)
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
    // auxiliary calcs never break the run
    // eslint-disable-next-line no-console
    console.warn('[pnl] debt/waterfall failed:', e?.message);
  }

  return buildSimulateResponse({
    archResult, archetype, projection, waterfall, debt_schedule,
    hardware_breakdown, boot, derived, solver,
  });
}

// Catalogs + lever config for the UI to build controls from the real source.
export const CATALOGS = {
  GPU_CATALOG,
  DEAL_ARCHETYPES,
  INPUT_MODES, SOLVER_LEVERS, ARCHETYPE_OPTIONS, BUSINESS_MODEL_OPTIONS,
  GEOGRAPHY_OPTIONS, OPERATOR_STRATEGY_OPTIONS, OVERRIDE_GROUPS, OVERRIDE_KEYS,
  DEFAULT_GEOGRAPHY,
};
