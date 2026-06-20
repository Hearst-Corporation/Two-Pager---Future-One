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
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
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
import { calcHardwareBreakdown } from '@/lib/hearst-gpu-catalog';
import { FINANCIAL_THRESHOLDS, MINORITY_EQUITY_SHARE_DEFAULT } from '@/lib/hearst-constants';
import { buildSimulateResponse } from '@/lib/hearst-simulate-response';
import { rateLimit } from '@/lib/rate-limit';
import { DEFAULT_GEOGRAPHY } from '@/app/admin/hearst/utils/constants';

const ARCHETYPE_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

// Fallback equity share when archetype.equity_share is not set (minority_equity archetypes
// always define equity_share, but this guards against future archetypes that forget it).
const DEFAULT_MINORITY_EQUITY_SHARE = MINORITY_EQUITY_SHARE_DEFAULT;

// Rate limit pour /simulate : 120 req/min par actorId.
// /simulate est un calcul interactif live (chaque slider/sélection POST, debounce
// 300ms côté UI) — read-only, pur CPU, pas d'effet de bord ni d'appel coûteux. La
// limite protège d'une boucle folle, PAS de l'usage humain normal : 10/min bridait
// le simulateur après ~2 ajustements. 120/min = 1 toutes les 500ms en continu.
// Backed by lib/rate-limit (Upstash Redis distribué + fallback in-memory) — un
// compteur in-memory pur se réinitialisait à chaque cold start Vercel (bypass).
const SIM_RL_WINDOW_SEC = 60;
const SIM_RL_MAX = 120;

export const POST = withValidation(SimulateRequestSchema, async (req, parsed) => {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const rl = await rateLimit(auth.profile.id, { limit: SIM_RL_MAX, windowSec: SIM_RL_WINDOW_SEC });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rl.resetSec }, {
      status: 429,
      headers: { 'Retry-After': String(rl.resetSec) },
    });
  }

  const {
    input_mode,
    input_value,
    archetype_id,
    business_model_id,
    geography = DEFAULT_GEOGRAPHY,
    hardware_mix,
    scenario_overrides,
    project_id,
  } = parsed;

  const archetype = ARCHETYPE_BY_ID[archetype_id];
  if (!archetype) {
    return NextResponse.json({ error: `Unknown archetype_id: ${archetype_id}` }, { status: 400 });
  }

  // 1a. Fetch DB sources flagged used_in_model=true (resilient — never breaks the route)
  let extraSources = [];
  if (project_id) {
    try {
      const supa = getAdminClient();
      const { data } = await supa
        .from('hearst_sources')
        .select('id, metric_id, value, geography, confidence_score')
        .eq('project_id', project_id)
        .eq('used_in_model', true);
      if (Array.isArray(data)) extraSources = data;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[simulate][actor=${auth.profile.id}] hearst_sources fetch failed:`, e?.message);
    }
  }

  // 1. Bootstrap des defaults Qatar depuis PUBLIC_SOURCES_LIBRARY (+ DB overrides)
  const requested_mw = input_value?.total_mw ?? 50;
  const boot = bootstrapScenarioFromSources({
    geography,
    business_model_id,
    mw_target: requested_mw,
    archetype_id,
    extraSources,
  });

  // 2. Merge: defaults Qatar + overrides utilisateur
  const defaults = { ...boot.scenario, ...(scenario_overrides || {}) };

  // 4-6 (factored): apply the archetype, compute the hardware breakdown, scale GPU
  // economics by HEARST's effective share, then fold GPU revenue + CAPEX into the
  // projection. Defined BEFORE the solve so the capital_first solver can ask for the
  // engine's TRUE total_capex(MW) — facility + hardware — at any candidate MW.
  // Fix 3 (P1): hw_share scales GPU economics (minority_equity → equity_share;
  //   other archetypes → revenue_factor; powered_shell 0.33 → GPU minimal).
  // Fix 5 (P1): also fold when capex_hardware > 0 but revenue=0 (orphan capex case).
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

  // Engine's true total project CAPEX at a candidate MW — facility + GPU/hardware.
  const totalCapexForMw = (mw) =>
    buildArchetypeProjection({ ...defaults, total_mw: mw }).archResult.projection?.total_capex ?? null;

  // 3. Résoudre le mode (mw_first / capital_first / target_irr_first). capital_first
  // is archetype-aware via totalCapexForMw (P0-3); mw_first/target_irr ignore it.
  const { scenario: solvedScenario, derived, solver } = solveScenarioForMode(
    input_mode,
    input_value,
    defaults,
    { totalCapexForMw },
  );

  // 4-6. Build the final projection through the same pipeline the solver evaluated,
  // so the reported total_capex is consistent with the budget end-to-end.
  const { archResult, hardware_breakdown } = buildArchetypeProjection(solvedScenario);
  const projection = archResult.projection;

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
    // eslint-disable-next-line no-console
    console.warn(`[simulate][actor=${auth.profile.id}] debt/waterfall failed:`, e?.message);
  }

  return NextResponse.json(buildSimulateResponse({
    archResult,
    archetype,
    projection,
    waterfall,
    debt_schedule,
    hardware_breakdown,
    boot,
    derived,
    solver,
  }));
});
