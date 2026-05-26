// HEARST Bootstrap — pré-remplit un scénario à partir de PUBLIC_SOURCES_LIBRARY.
//
// La librairie PUBLIC_SOURCES_LIBRARY (lib/hearst-constants.js) contient
// ~48 datapoints sourcés (Equinix 10-K, DR 10-K, NTT MENA, T&T MENA, JLL,
// CBRE, KAHRAMAA, Brookfield). Ce module agrège ces datapoints en defaults
// utilisables par le simulator au lieu de forcer l'utilisateur à saisir
// les ~30 champs un par un.
//
// Stratégie : médiane (robuste vs outliers), filtre par geography + confidence,
// fallback MENA si Qatar manque.

import { PUBLIC_SOURCES_LIBRARY } from './hearst-constants';

/** Mapping metric_id (PUBLIC_SOURCES_LIBRARY) → champ scenario. */
const METRIC_TO_FIELD = {
  capex_shell_per_mw: 'capex_shell_per_mw',
  capex_mep_per_mw: 'capex_mep_per_mw',
  capex_substation_per_mw: 'capex_substation_per_mw',
  capex_cooling_per_mw: 'capex_cooling_per_mw',
  capex_total_per_mw: '_total_capex_marker', // composite, traité séparément
  electricity_price_mwh: 'electricity_price_mwh',
  pue: 'pue',
  price_retail_colo_kw_month: 'price_retail_colo_kw_month',
  price_wholesale_kw_month: 'price_wholesale_kw_month',
  price_hyperscale_kw_month: 'price_hyperscale_kw_month',
  ebitda_margin_pct: '_ebitda_margin_marker',
  debt_pct: 'debt_pct',
  exit_multiple: 'exit_multiple',
  equity_irr_target: '_equity_irr_target_marker',
};

/** Métriques critiques pour calcul du source_score (cf. UI Source Score). */
const CRITICAL_METRICS = [
  'capex_shell_per_mw',
  'capex_mep_per_mw',
  'capex_substation_per_mw',
  'capex_cooling_per_mw',
  'electricity_price_mwh',
  'pue',
  'price_hyperscale_kw_month',
  'debt_pct',
  'exit_multiple',
];

/**
 * Median d'une liste de valeurs numériques (ignore null/undefined).
 */
function median(values) {
  const sorted = values.filter(v => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Filtre des sources par géographie (case-insensitive substring match).
 * Qatar : on inclut aussi "Gulf", "MENA" si confidence_score >= 4.
 */
function filterByGeography(sources, geography) {
  const geo = (geography || 'qatar').toLowerCase();
  if (geo === 'global') return sources;
  return sources.filter(s => {
    const sgeo = (s.geography || '').toLowerCase();
    if (geo === 'qatar') {
      if (sgeo.includes('qatar')) return true;
      if (sgeo.includes('mena') && (s.confidence_score || 0) >= 4) return true;
      if (sgeo.includes('gulf')) return true;
      return false;
    }
    if (geo === 'mena') {
      return sgeo.includes('mena') || sgeo.includes('gulf') || sgeo.includes('qatar');
    }
    return sgeo.includes(geo);
  });
}

/**
 * Bootstrap : retourne un scénario partiellement rempli + map des sources utilisées.
 *
 * @param {Object} opts
 * @param {'qatar'|'mena'|'global'} [opts.geography='qatar']
 * @param {string} [opts.business_model_id]  Si fourni, on privilégie price_<business_model>
 * @param {number} [opts.mw_target=50]       Default si l'utilisateur n'a rien saisi
 * @param {string} [opts.archetype_id]       Pour ajuster les defaults (powered_shell → exclut MEP/cooling)
 * @returns {{ scenario: object, source_map: Record<string,string>, confidence_score: number, metrics_filled: number }}
 */
export function bootstrapScenarioFromSources(opts = {}) {
  const {
    geography = 'qatar',
    business_model_id,
    mw_target = 50,
    archetype_id,
  } = opts;

  const scenario = {
    total_mw: mw_target,
    target_occupancy_pct: 80,
    capex_contingency_pct: 0.10,
    annual_escalation_pct: 0.02,
    start_year: 2026,
    exit_year: 10,
    commercial_split: business_model_id ? { [business_model_id]: 100 } : { hyperscale_lease: 100 },
    // Equity split par défaut Brookfield + Qai narrative
    equity_hearst_pct: 0.20,
    equity_brookfield_pct: 0.55,
    equity_qatar_pct: 0.25,
    debt_interest_rate: 6.5,
    debt_term_years: 12,
    opex_maintenance_pct: 4,
    opex_insurance_pct: 1.5,
    opex_ga_pct: 3,
    opex_operator_mgmt_fee_pct: 5,
    opex_staff_annual_musd: 8,
  };
  const source_map = {};

  // Agréger PUBLIC_SOURCES_LIBRARY par metric_id, géofiltré.
  const grouped = new Map();
  for (const s of PUBLIC_SOURCES_LIBRARY) {
    if (!s || !s.metric_id || s.value == null) continue;
    const list = grouped.get(s.metric_id) || [];
    list.push(s);
    grouped.set(s.metric_id, list);
  }

  for (const [metric_id, sources] of grouped.entries()) {
    const field = METRIC_TO_FIELD[metric_id];
    if (!field) continue;

    let filtered = filterByGeography(sources, geography);
    // Fallback en cascade : Qatar → MENA → Global (toutes confidences)
    if (filtered.length === 0 && geography === 'qatar') {
      filtered = filterByGeography(sources, 'mena');
    }
    if (filtered.length === 0) {
      // Dernier recours : ignorer le filtre géo (Global benchmarks)
      filtered = sources;
    }
    if (filtered.length === 0) continue;

    const med = median(filtered.map(s => s.value));
    if (med == null) continue;

    // Marqueurs spéciaux : pas un champ scenario direct
    if (field === '_total_capex_marker' || field === '_ebitda_margin_marker' || field === '_equity_irr_target_marker') {
      // On ne pousse pas ces marqueurs sur le scenario — ils servent au scoring
      // ou à un advisor downstream.
      continue;
    }

    scenario[field] = med;
    // Choisir LA source dont la valeur est la plus proche de la médiane comme "représentative"
    const closest = filtered
      .map(s => ({ s, delta: Math.abs((s.value || 0) - med) }))
      .sort((a, b) => a.delta - b.delta)[0]?.s;
    if (closest) source_map[field] = closest.id;
  }

  // Adjustments par archétype : powered_shell n'inclut pas MEP/cooling côté HEARST
  if (archetype_id === 'powered_shell') {
    scenario.capex_mep_per_mw = 0;
    scenario.capex_cooling_per_mw = 0;
    // Le locataire prend la responsabilité — on garde le levier dans scenario.notes
  }

  // Source score : % des CRITICAL_METRICS qui ont une source associée
  const filled = CRITICAL_METRICS.filter(m => {
    const field = METRIC_TO_FIELD[m];
    return field && scenario[field] != null;
  }).length;
  const confidence_score = Math.round((filled / CRITICAL_METRICS.length) * 100);

  return {
    scenario,
    source_map,
    confidence_score,
    metrics_filled: filled,
  };
}
