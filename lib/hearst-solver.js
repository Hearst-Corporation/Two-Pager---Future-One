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
  leverage:     [0,         0.85],
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
    capex_contingency_pct = 0.10,
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
  const fully_loaded_per_mw = base_per_mw * (1 + capex_contingency_pct);
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

  const evalAt = (v) => {
    const s = applyLever(scenario, lever, v);
    const p = generateProjection(s);
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
 * Construit un scenario hydraté en fonction du mode d'entrée.
 *
 *   - mw_first        : input_value.total_mw → scenario.total_mw
 *   - capital_first   : input_value.total_capex_usd → mwFromCapital → total_mw
 *   - target_irr_first: lance solveForTargetIrr et retourne le scenario solved
 *
 * @param {string} input_mode    'mw_first' | 'capital_first' | 'target_irr_first'
 * @param {object} input_value   Payload du mode (cf. SimulateRequestSchema)
 * @param {object} defaults      Scénario de base (defaults Qatar ou archétype defaults)
 * @returns {{ scenario: object, derived: object, solver?: SolverResult }}
 */
export function solveScenarioForMode(input_mode, input_value, defaults = {}) {
  if (input_mode === 'mw_first') {
    const total_mw = input_value?.total_mw ?? 0;
    return {
      scenario: { ...defaults, total_mw },
      derived: { total_mw },
    };
  }

  if (input_mode === 'capital_first') {
    const capital = input_value?.total_capex_usd ?? 0;
    const { mw, capex_per_mw_used, breakdown } = mwFromCapital(capital, defaults);
    return {
      scenario: { ...defaults, total_mw: mw },
      derived: { mw, capex_per_mw_used, breakdown, capital_usd: capital },
    };
  }

  if (input_mode === 'target_irr_first') {
    const target_irr = (input_value?.target_irr_pct ?? 15) / 100;
    const lever = input_value?.lever ?? 'pricing';
    const total_mw = input_value?.total_mw ?? defaults.total_mw ?? 50;
    const baseline = { ...defaults, total_mw };
    const result = solveForTargetIrr(baseline, target_irr, lever);
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
