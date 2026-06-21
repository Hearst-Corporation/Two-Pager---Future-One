// ⚠️ QUARANTINE — TO_BE_REPLACED_BY_CANONICAL_QATAR_MODEL
// Cas figés Conservative/Base/Upside ≠ scénarios bear/base/bull du HTML canonique Qatar.
// Remplacement prévu par lib/investment-model/scenarios/. Voir docs/investment-model-migration.md.
//
// HEARST scenario cases — Conservative / Base / Upside.
//
// Issus de la collecte data marché FUTUR ONE (20 sous-agents, web-sourcé 2024-2026,
// vérification adversariale). Chaque cas se traduit en `scenario_overrides` que la
// route POST /simulate fusionne PAR-DESSUS le bootstrap sourcé
// (lib/hearst-bootstrap.js → PUBLIC_SOURCES_LIBRARY).
//
// PRINCIPE :
//   • BASE       = on NE force RIEN (overrides = {}). Le bootstrap sourcé (médianes
//                  PUBLIC_SOURCES_LIBRARY + sources DB used_in_model=true) reste la
//                  vérité vivante. Les `assumptions` listées pour Base sont les
//                  médianes sourcées de référence (affichage), pas des overrides.
//   • CONSERVATIVE / UPSIDE = overrides EXPLICITES exprimés dans les champs moteur
//                  (ScenarioWritableFields), chacun avec sa source.
//
// MAPPING (variable marché → champ moteur), toutes vers de vrais champs writable :
//   power_price        → electricity_price_mwh       (USD/MWh, direct)
//   tenant_price       → price_hyperscale_kw_month    (USD/kW/mois, modèle hyperscale par défaut)
//   utilization        → target_occupancy_pct         (scale aussi la courbe de ramp interne)
//   pue                → pue
//   capex (risque)     → capex_contingency_pct        (levier CAPEX sans distordre les composants sourcés)
//   maintenance        → opex_maintenance_pct
//   debt rate          → debt_interest_rate
//   leverage           → debt_pct
//   tenor              → debt_term_years
//   exit cap rate      → exit_multiple = 1 / cap_rate (exit_multiple = EV/EBITDA, cf. calcTerminalValue)
//
// NON injecté (pas de champ moteur writable → distordrait le modèle) → `context` (affichage seul) :
//   dscr (covenant, c'est une SORTIE), risk_premium (intégré au cap rate / spread dette),
//   tenant_mix (piloté par le business_model_id choisi par l'utilisateur),
//   ramp shape (courbe fixe dans generateProjection, scalée par target_occupancy_pct).

/** Champs moteur affichés dans le panneau de provenance, dans cet ordre. */
export const CASE_ASSUMPTION_FIELDS = [
  'electricity_price_mwh',
  'price_hyperscale_kw_month',
  'target_occupancy_pct',
  'pue',
  'capex_contingency_pct',
  'opex_maintenance_pct',
  'debt_interest_rate',
  'debt_pct',
  'debt_term_years',
  'exit_multiple',
];

// Sources récurrentes (collecte 2026-06-21).
const SRC = {
  power: { source: 'Enerdata / GlobalPetrolPrices (Qatar)', url: 'https://www.enerdata.net/estore/country-profiles/qatar.html' },
  powerPpa: { source: 'PV Magazine — Al Kharsaah 800 MW PPA record', url: 'https://www.pv-magazine.com/2020/01/23/qatars-800-mw-pv-tender-saw-world-record-final-price-0-01567-kwh/' },
  colo: { source: 'CBRE / JLL DC pricing (US/EMEA proxy + prime émergente)', url: 'https://www.cbre.com/insights/reports/global-data-center-trends-2025' },
  occ: { source: 'JLL 2026 Global DC Outlook (take-up / stabilisation)', url: 'https://www.jll.com/en-us/insights/market-outlook/data-center-outlook' },
  pue: { source: 'Uptime Institute 15th Survey / Microsoft (climat chaud)', url: 'https://uptimeinstitute.com/about-ui/press-releases/uptimes-15th-annual-global-data-center-survey-results-shows-both-commitment-and-hesitancy' },
  capex: { source: 'Turner & Townsend DCCI 2025 (MENA risk)', url: 'https://reports.turnerandtownsend.com/data-centre-construction-cost-index-2025/data-centre-cost-trends' },
  opex: { source: 'Epoch AI / Alpha-Matica DC cost structure', url: 'https://www.alpha-matica.com/post/deconstructing-the-data-center-a-look-at-the-cost-structure-1' },
  debt: { source: 'Global Data Center Hub — DC capital strategy 2025', url: 'https://www.globaldatacenterhub.com/p/data-center-capital-strategy-balancing' },
  debtQatar: { source: 'Ooredoo 552 M$ / MEEZA 219 M$ / JBIC 25 ans (dette Qatar exécutée)', url: 'https://www.jbic.go.jp/en/information/press/press-2025/press_00146.html' },
  exit: { source: 'CBRE IM — Decoding Data Centers (EV/EBITDA, cap rates)', url: 'https://www.cbreim.com/insights/articles/decoding-data-centers' },
};

/**
 * @typedef {Object} CaseAssumption
 * @property {string} field        Clé champ moteur (ScenarioWritableFields).
 * @property {number} value        Valeur affichée (= override appliqué, ou médiane de référence pour Base).
 * @property {string} unit
 * @property {'high'|'medium'|'low'} confidence
 * @property {'confirmed'|'estimated'|'benchmarked'} classification
 * @property {string} source
 * @property {string} sourceUrl
 */

/** Construit une ligne d'hypothèse. */
function a(field, value, unit, confidence, classification, src) {
  return { field, value, unit, confidence, classification, source: src.source, sourceUrl: src.url };
}

export const SCENARIO_CASES = [
  {
    id: 'conservative',
    labelKey: 'SIM_CASE_CONSERVATIVE',
    subKey: 'SIM_CASE_SUB_CONSERVATIVE',
    tone: 'caution',
    overrides: {
      electricity_price_mwh: 43,
      price_hyperscale_kw_month: 120,
      target_occupancy_pct: 80,
      pue: 1.6,
      capex_contingency_pct: 15,
      opex_maintenance_pct: 5,
      debt_interest_rate: 8,
      debt_pct: 60,
      debt_term_years: 10,
      exit_multiple: 11.1, // cap rate 9.0%
    },
    assumptions: [
      a('electricity_price_mwh', 43, '$/MWh', 'medium', 'estimated', SRC.power),
      a('price_hyperscale_kw_month', 120, '$/kW/mo', 'low', 'benchmarked', SRC.colo),
      a('target_occupancy_pct', 80, '%', 'medium', 'benchmarked', SRC.occ),
      a('pue', 1.6, 'ratio', 'high', 'benchmarked', SRC.pue),
      a('capex_contingency_pct', 15, '%', 'medium', 'estimated', SRC.capex),
      a('opex_maintenance_pct', 5, '%', 'medium', 'benchmarked', SRC.opex),
      a('debt_interest_rate', 8, '%', 'medium', 'benchmarked', SRC.debt),
      a('debt_pct', 60, '%', 'high', 'benchmarked', SRC.debt),
      a('debt_term_years', 10, 'yr', 'high', 'confirmed', SRC.debtQatar),
      a('exit_multiple', 11.1, '× (cap 9.0%)', 'medium', 'benchmarked', SRC.exit),
    ],
    context: {
      dscr_target: 1.45,
      risk_premium_bps: 300,
      tenant_mix: 'Hyperscaler 50 / Enterprise 25 / Sovereign 15 / Cloud 10',
      ramp_note: 'Ramp lente — occupancy stabilisée 80%, montée en charge prudente.',
    },
  },
  {
    id: 'base',
    labelKey: 'SIM_CASE_BASE',
    subKey: 'SIM_CASE_SUB_BASE',
    tone: 'neutral',
    overrides: {}, // bootstrap sourcé vivant — aucune surcharge
    assumptions: [
      a('electricity_price_mwh', 36, '$/MWh', 'high', 'confirmed', SRC.power),
      a('price_hyperscale_kw_month', 150, '$/kW/mo', 'medium', 'benchmarked', SRC.colo),
      a('target_occupancy_pct', 90, '%', 'medium', 'benchmarked', SRC.occ),
      a('pue', 1.5, 'ratio', 'high', 'benchmarked', SRC.pue),
      a('capex_contingency_pct', 10, '%', 'medium', 'estimated', SRC.capex),
      a('opex_maintenance_pct', 4, '%', 'medium', 'benchmarked', SRC.opex),
      a('debt_interest_rate', 7, '%', 'medium', 'benchmarked', SRC.debt),
      a('debt_pct', 65, '%', 'high', 'benchmarked', SRC.debt),
      a('debt_term_years', 15, 'yr', 'high', 'confirmed', SRC.debtQatar),
      a('exit_multiple', 12.5, '× (cap 8.0%)', 'medium', 'benchmarked', SRC.exit),
    ],
    context: {
      dscr_target: 1.35,
      risk_premium_bps: 200,
      tenant_mix: 'Hyperscaler 65 / Enterprise 15 / Sovereign 15 / Cloud 5',
      ramp_note: 'Ramp médiane — occupancy stabilisée 90% (courbe interne du moteur).',
    },
  },
  {
    id: 'upside',
    labelKey: 'SIM_CASE_UPSIDE',
    subKey: 'SIM_CASE_SUB_UPSIDE',
    tone: 'positive',
    overrides: {
      electricity_price_mwh: 25,
      price_hyperscale_kw_month: 184,
      target_occupancy_pct: 95,
      pue: 1.3,
      capex_contingency_pct: 5,
      opex_maintenance_pct: 3,
      debt_interest_rate: 6,
      debt_pct: 70,
      debt_term_years: 20,
      exit_multiple: 14.3, // cap rate 7.0%
    },
    assumptions: [
      a('electricity_price_mwh', 25, '$/MWh', 'medium', 'benchmarked', SRC.powerPpa),
      a('price_hyperscale_kw_month', 184, '$/kW/mo', 'low', 'benchmarked', SRC.colo),
      a('target_occupancy_pct', 95, '%', 'medium', 'benchmarked', SRC.occ),
      a('pue', 1.3, 'ratio', 'medium', 'benchmarked', SRC.pue),
      a('capex_contingency_pct', 5, '%', 'medium', 'estimated', SRC.capex),
      a('opex_maintenance_pct', 3, '%', 'medium', 'benchmarked', SRC.opex),
      a('debt_interest_rate', 6, '%', 'medium', 'benchmarked', SRC.debt),
      a('debt_pct', 70, '%', 'high', 'benchmarked', SRC.debt),
      a('debt_term_years', 20, 'yr', 'high', 'confirmed', SRC.debtQatar),
      a('exit_multiple', 14.3, '× (cap 7.0%)', 'medium', 'benchmarked', SRC.exit),
    ],
    context: {
      dscr_target: 1.25,
      risk_premium_bps: 100,
      tenant_mix: 'Hyperscaler 75 / Enterprise 10 / Sovereign 13 / Cloud 2',
      ramp_note: 'Ramp rapide — occupancy stabilisée 95%, pré-commercialisation forte.',
    },
  },
];

export const DEFAULT_CASE_ID = 'base';
const CASE_BY_ID = Object.fromEntries(SCENARIO_CASES.map((c) => [c.id, c]));

/** Cas par id (fallback Base). */
export function getCase(id) {
  return CASE_BY_ID[id] || CASE_BY_ID[DEFAULT_CASE_ID];
}

/** Overrides moteur du cas (objet vide pour Base). */
export function getCaseOverrides(id) {
  const c = CASE_BY_ID[id];
  if (!c || c.id === DEFAULT_CASE_ID) return {};
  return { ...c.overrides };
}
