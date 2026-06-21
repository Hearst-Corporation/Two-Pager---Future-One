// ⚠️ QUARANTINE — TO_BE_REPLACED_BY_CANONICAL_QATAR_MODEL
// Dépend de generateProjection() (moteur quarantiné). Voir docs/investment-model-migration.md.
//
// HEARST Solver — utilitaires inverse pour le simulateur.
//
// Deux familles :
//   1. mwFromCapital            : capital → MW (inverse direct de calcTotalCapex)
//   2. solveForTargetIrr        : target IRR → valeur du lever (bissection)
//   3. solveScenarioForMode     : wrapper qui dispatch sur les 3 modes du simulator
//
// On utilise une bissection plutôt que Newton-Raphson : IRR n'est pas
// monotone près des bornes (NPV changes sign in unusual ways when leverage
// approaches 100% ou pricing tombe sous le seuil de breakeven). Bissection
// est plus lente mais robuste.

import { generateProjection } from './hearst-calculations';

/**
 * @typedef {'capex_per_mw' | 'pricing' | 'leverage' | 'mw'} SolverLever
 *
 * @typedef {Object} SolverOpts
 * @property {number} [max_iterations=25]
 * @property {number} [tolerance=0.001]
 * @property {[number, number]} [bounds]   Surcharge les bornes par lever
 * @property {string}  [pricing_field='price_hyperscale_kw_month']  Pour lever='pricing'
 *
 * @typedef {Object} SolverResult
 * @property {boolean} converged
 * @property {number}  iterations
 * @property {number}  lever_value           Valeur trouvée du lever
 * @property {object}  scenario              Scénario hydraté avec le lever appliqué
 * @property {object}  projection            generateProjection(scenario) final
 * @property {number}  achieved_irr
 * @property {string}  [diagnostic]
 */

/** Bornes par défaut par lever — calibrées sur le marché Qatar DC 2026. */
const LEVER_BOUNDS = {
  capex_per_mw: [2_000_000, 20_000_000],
  pricing:      [50,        400],
  leverage:     [0,         85],   // percent 0..100; 85% = max bankable leverage for DC project finance
  mw:           [5,         1000],
};

/** Mapping du lever vers le champ scénario à muter. */
const LEVER_FIELDS = {
  capex_per_mw: 'capex_shell_per_mw', // proxy : on scale shell, le total bouge linéairement
  pricing:      'price_hyperscale_kw_month',
  leverage:     'debt_pct',
  mw:           'total_mw',
};

/**
 * Inverse : capital total disponible → MW que ce capital finance.
 *
 *   total_mw = capital / (Σ capex_per_mw × (1 + contingency))
 *
 * @param {number} capital_usd
 * @param {object} scenario_defaults  Doit fournir capex_*_per_mw + contingency
 * @returns {{ mw: number, capex_per_mw_used: number, breakdown: object }}
 */
export function mwFromCapital(capital_usd, scenario_defaults = {}) {
  if (!capital_usd || capital_usd <= 0) {
    return { mw: 0, capex_per_mw_used: 0, breakdown: {} };
  }
  const {
    capex_shell_per_mw = 4_400_000,
    capex_mep_per_mw = 3_800_000,
    capex_substation_per_mw = 1_200_000,
    capex_cooling_per_mw = 1_500_000,
    capex_grid_per_mw = 0,
    capex_land_per_mw = 0,
    capex_liquid_cooling_premium_per_mw = 0,
    capex_contingency_pct = 10,
  } = scenario_defaults;

  const components = {
    shell: capex_shell_per_mw,
    mep: capex_mep_per_mw,
    substation: capex_substation_per_mw,
    cooling: capex_cooling_per_mw,
    grid: capex_grid_per_mw,
    land: capex_land_per_mw,
    liquid_premium: capex_liquid_cooling_premium_per_mw,
  };
  const base_per_mw = Object.values(components).reduce((s, v) => s + (v || 0), 0);
  // capex_contingency_pct is 0..100 — divide by 100 at consumption (A19)
  const fully_loaded_per_mw = base_per_mw * (1 + (capex_contingency_pct || 0) / 100);
  if (fully_loaded_per_mw <= 0) {
    return { mw: 0, capex_per_mw_used: 0, breakdown: components };
  }
  const mw = capital_usd / fully_loaded_per_mw;
  return {
    mw: Number(mw.toFixed(2)),
    capex_per_mw_used: fully_loaded_per_mw,
    breakdown: components,
  };
}

/**
 * Applique un lever à un scénario (mutation immuable).
 *
 * Pour `capex_per_mw` : on scale les 5 composants principaux (shell/mep/sub/cool/grid)
 * proportionnellement pour atteindre la somme cible. C'est plus fidèle que ne toucher
 * que `shell` qui sous-évaluerait l'effet.
 */
function applyLever(scenario, lever, value) {
  const next = { ...scenario };
  if (lever === 'capex_per_mw') {
    const baseline = {
      shell: scenario.capex_shell_per_mw || 4_400_000,
      mep: scenario.capex_mep_per_mw || 3_800_000,
      sub: scenario.capex_substation_per_mw || 1_200_000,
      cool: scenario.capex_cooling_per_mw || 1_500_000,
      grid: scenario.capex_grid_per_mw || 0,
    };
    const sum = baseline.shell + baseline.mep + baseline.sub + baseline.cool + baseline.grid;
    if (sum <= 0) {
      next.capex_shell_per_mw = value;
      return next;
    }
    const scale = value / sum;
    next.capex_shell_per_mw = baseline.shell * scale;
    next.capex_mep_per_mw = baseline.mep * scale;
    next.capex_substation_per_mw = baseline.sub * scale;
    next.capex_cooling_per_mw = baseline.cool * scale;
    next.capex_grid_per_mw = baseline.grid * scale;
    return next;
  }
  const field = LEVER_FIELDS[lever];
  if (!field) throw new Error(`Unknown solver lever: ${lever}`);
  next[field] = value;
  return next;
}

/**
 * Bissection : trouve la valeur du lever telle que IRR(scenario(lever)) ≈ target.
 *
 * @param {object} scenario        Scénario de base (les autres champs servent de defaults)
 * @param {number} target_irr      Ratio (e.g. 0.15 = 15%)
 * @param {SolverLever} lever
 * @param {SolverOpts} [opts]
 * @returns {SolverResult}
 */
export function solveForTargetIrr(scenario, target_irr, lever, opts = {}) {
  const {
    max_iterations = 25,
    tolerance = 0.001,
    bounds = LEVER_BOUNDS[lever],
    projectionFn,
  } = opts;

  if (!bounds) {
    return {
      converged: false,
      iterations: 0,
      lever_value: null,
      scenario,
      projection: null,
      achieved_irr: null,
      diagnostic: `No bounds for lever "${lever}"`,
    };
  }
  let [low, high] = bounds;

  const _project = projectionFn || generateProjection;
  const evalAt = (v) => {
    const s = applyLever(scenario, lever, v);
    let p;
    try {
      p = _project(s);
    } catch (_err) {
      return { scenario: s, projection: null, irr: null };
    }
    return { scenario: s, projection: p, irr: p?.irr };
  };

  const evalLow = evalAt(low);
  const evalHigh = evalAt(high);

  // Vérifier que la cible est entre les deux extrémités.
  if (evalLow.irr == null || evalHigh.irr == null) {
    return {
      converged: false,
      iterations: 0,
      lever_value: null,
      scenario,
      projection: null,
      achieved_irr: null,
      diagnostic: 'IRR not computable at bounds — fill required inputs (pue, electricity, pricing).',
    };
  }

  // Direction monotone : pour la plupart des leviers, IRR augmente avec pricing/mw
  // et diminue avec capex_per_mw. Avec debt_pct c'est non-monotone : on n'utilise
  // bissection que si signs(IRR_low - target) ≠ signs(IRR_high - target).
  const fLow = evalLow.irr - target_irr;
  const fHigh = evalHigh.irr - target_irr;
  if (fLow * fHigh > 0) {
    // Cible hors plage atteignable
    const best = Math.abs(fLow) < Math.abs(fHigh) ? evalLow : evalHigh;
    return {
      converged: false,
      iterations: 0,
      lever_value: best === evalLow ? low : high,
      scenario: best.scenario,
      projection: best.projection,
      achieved_irr: best.irr,
      diagnostic: `Target IRR ${(target_irr * 100).toFixed(1)}% out of range [${(evalLow.irr * 100).toFixed(1)}%, ${(evalHigh.irr * 100).toFixed(1)}%] for lever ${lever}.`,
    };
  }

  let mid = (low + high) / 2;
  let evalMid = evalAt(mid);
  let iter = 0;

  for (iter = 1; iter <= max_iterations; iter++) {
    if (evalMid.irr == null) {
      return {
        converged: false,
        iterations: iter,
        lever_value: mid,
        scenario: evalMid.scenario,
        projection: evalMid.projection,
        achieved_irr: null,
        diagnostic: 'IRR computation failed mid-bissection.',
      };
    }
    if (Math.abs(evalMid.irr - target_irr) <= tolerance) {
      return {
        converged: true,
        iterations: iter,
        lever_value: mid,
        scenario: evalMid.scenario,
        projection: evalMid.projection,
        achieved_irr: evalMid.irr,
      };
    }
    const fMid = evalMid.irr - target_irr;
    if (fLow * fMid < 0) {
      high = mid;
    } else {
      low = mid;
    }
    mid = (low + high) / 2;
    evalMid = evalAt(mid);
  }

  return {
    converged: false,
    iterations: iter,
    lever_value: mid,
    scenario: evalMid.scenario,
    projection: evalMid.projection,
    achieved_irr: evalMid.irr,
    diagnostic: `Did not converge to ±${tolerance} within ${max_iterations} iterations. Closest IRR = ${(evalMid.irr * 100).toFixed(2)}%.`,
  };
}

/**
 * capital_first — ARCHETYPE-AWARE (P0-3).
 *
 * Solves MW such that the engine's FULL total CAPEX (facility + GPU/hardware +
 * any archetype-specific CAPEX) ≈ the total-project-CAPEX budget. Uses a bounded
 * binary search over the monotonic total_capex(MW) supplied by the caller — it
 * does NOT re-derive CAPEX (so the solver and the engine never disagree). The old
 * facility-only `mwFromCapital` overshot the budget by 100–180% for GPU/AI
 * archetypes because it ignored hardware CAPEX entirely.
 *
 * @param {number}   budget            Total project CAPEX budget (USD)
 * @param {(mw:number)=>(number|null)} totalCapexForMw  Engine total_capex at a given MW
 * @param {{ max_iterations?:number, bounds?:[number,number] }} [opts]
 * @returns {{ converged:boolean, mw:number|null, capex:number|null, iterations:number,
 *            budget:number, tolerance:number, diagnostic?:string }}
 */
export function solveMwForCapital(budget, totalCapexForMw, opts = {}) {
  const { max_iterations = 30, bounds = LEVER_BOUNDS.mw } = opts;

  if (!(budget > 0)) {
    return { converged: false, mw: 0, capex: 0, iterations: 0, budget: budget || 0, tolerance: 0,
      diagnostic: 'Capital budget must be positive — no MW solved.' };
  }
  const tolerance = Math.max(0.01 * budget, 1_000_000);
  let [low, high] = bounds;

  const capexLow = totalCapexForMw(low);
  const capexHigh = totalCapexForMw(high);
  // Fail honestly if total_capex is not computable or not monotonically increasing.
  if (capexLow == null || capexHigh == null || Number.isNaN(capexLow) || Number.isNaN(capexHigh) || !(capexHigh > capexLow)) {
    return { converged: false, mw: null, capex: null, iterations: 0, budget, tolerance,
      diagnostic: 'total_capex(MW) is not computable or not monotonic across bounds — cannot solve.' };
  }
  // Budget cannot fund even the minimum-scale build → return the floor, flagged (no silent overshoot).
  if (budget < capexLow) {
    return { converged: false, mw: low, capex: capexLow, iterations: 0, budget, tolerance,
      diagnostic: `Budget $${(budget / 1e6).toFixed(0)}M is below the minimum-scale CAPEX $${(capexLow / 1e6).toFixed(0)}M at ${low} MW. Returning ${low} MW (over budget).` };
  }
  // Budget exceeds the cost of the largest allowed build → return the ceiling, flagged.
  if (budget > capexHigh) {
    return { converged: false, mw: high, capex: capexHigh, iterations: 0, budget, tolerance,
      diagnostic: `Budget $${(budget / 1e6).toFixed(0)}M exceeds CAPEX at the max ${high} MW ($${(capexHigh / 1e6).toFixed(0)}M). Returning ${high} MW (under budget).` };
  }

  let mid = (low + high) / 2;
  let capexMid = null;
  let iter = 0;
  for (iter = 1; iter <= max_iterations; iter++) {
    capexMid = totalCapexForMw(mid);
    if (capexMid == null || Number.isNaN(capexMid)) {
      return { converged: false, mw: Number(mid.toFixed(2)), capex: null, iterations: iter, budget, tolerance,
        diagnostic: 'total_capex(MW) failed mid-search — cannot solve.' };
    }
    if (Math.abs(capexMid - budget) <= tolerance) {
      return { converged: true, mw: Number(mid.toFixed(2)), capex: capexMid, iterations: iter, budget, tolerance };
    }
    if (capexMid > budget) high = mid; else low = mid;
    mid = (low + high) / 2;
  }
  return { converged: false, mw: Number(mid.toFixed(2)), capex: capexMid, iterations: iter, budget, tolerance,
    diagnostic: `Did not converge to ±$${(tolerance / 1e6).toFixed(1)}M within ${max_iterations} iterations. Closest CAPEX $${(capexMid / 1e6).toFixed(0)}M vs budget $${(budget / 1e6).toFixed(0)}M.` };
}

/**
 * Construit un scenario hydraté en fonction du mode d'entrée.
 *
 *   - mw_first        : input_value.total_mw → scenario.total_mw
 *   - capital_first   : input_value.total_capex_usd → MW solved so the engine's
 *                       FULL total_capex ≈ budget (archetype-aware) when the caller
 *                       passes opts.totalCapexForMw; otherwise legacy facility-only
 *                       mwFromCapital fallback.
 *   - target_irr_first: lance solveForTargetIrr et retourne le scenario solved
 *
 * @param {string} input_mode    'mw_first' | 'capital_first' | 'target_irr_first'
 * @param {object} input_value   Payload du mode (cf. SimulateRequestSchema)
 * @param {object} defaults      Scénario de base (defaults Qatar ou archétype defaults)
 * @param {{ totalCapexForMw?:(mw:number)=>(number|null) }} [opts]
 * @returns {{ scenario: object, derived: object, solver?: object }}
 */
export function solveScenarioForMode(input_mode, input_value, defaults = {}, opts = {}) {
  if (input_mode === 'mw_first') {
    const total_mw = input_value?.total_mw ?? 0;
    return {
      scenario: { ...defaults, total_mw },
      derived: { total_mw },
    };
  }

  if (input_mode === 'capital_first') {
    const capital = input_value?.total_capex_usd ?? 0;
    // Archetype-aware solve when the caller supplies the engine's total_capex(MW).
    if (typeof opts.totalCapexForMw === 'function') {
      const r = solveMwForCapital(capital, opts.totalCapexForMw, opts);
      return {
        scenario: { ...defaults, total_mw: r.mw ?? 0 },
        derived: {
          mw: r.mw, capital_usd: capital, capex_solved: r.capex,
          converged: r.converged, iterations: r.iterations,
          archetype_aware: true,
          ...(r.diagnostic ? { diagnostic: r.diagnostic } : {}),
        },
        solver: r,
      };
    }
    // Legacy fallback: facility-only closed form (no archetype CAPEX context).
    const { mw, capex_per_mw_used, breakdown } = mwFromCapital(capital, defaults);
    return {
      scenario: { ...defaults, total_mw: mw },
      derived: { mw, capex_per_mw_used, breakdown, capital_usd: capital, archetype_aware: false },
    };
  }

  if (input_mode === 'target_irr_first') {
    const target_irr = (input_value?.target_irr_pct ?? 15) / 100;
    const lever = input_value?.lever ?? 'pricing';
    const total_mw = input_value?.total_mw ?? defaults.total_mw ?? 50;
    const baseline = { ...defaults, total_mw };
    const irrOpts = opts.projectionFn ? { projectionFn: opts.projectionFn } : {};
    const result = solveForTargetIrr(baseline, target_irr, lever, irrOpts);
    return {
      scenario: result.scenario,
      derived: {
        target_irr,
        lever,
        lever_value: result.lever_value,
        converged: result.converged,
        iterations: result.iterations,
      },
      solver: result,
    };
  }

  throw new Error(`Unknown input_mode: ${input_mode}`);
}
