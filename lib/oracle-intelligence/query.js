// lib/oracle-intelligence/query.js
//
// Sprint 2 — Query layer.
// Selectors used by /api/admin/hearst/strategic-memo to hydrate the LLM
// prompt with the most relevant datapoints + comparables + tensions +
// absorption + reality given the scenario context.

import { DATAPOINTS, DATAPOINT_BY_ID } from './datapoints.js';
import { COMPARABLE_PROFILES } from './comparables.js';
import { DECISION_TENSIONS, TENSION_BY_ID } from './tensions.js';
import { COMMERCIAL_ABSORPTION } from './absorption.js';
import { REALITY_CONSTRAINTS, detectRealityViolations } from './reality.js';
import { trustScore, freshnessScore } from './schema.js';

/**
 * Select the top-N datapoints relevant to a scenario, ordered by trust score.
 *
 * @param {object} ctx
 * @param {string} ctx.region — qatar | uae | saudi_arabia | ...
 * @param {string[]} [ctx.comparable_types] — restrict to these comparable types
 * @param {string[]} [ctx.entity_ids] — restrict to these entities
 * @param {number} [ctx.limit=12]
 * @returns {Array} datapoints with trust + freshness
 */
export function selectRelevantDatapoints(ctx = {}) {
  const { region, comparable_types, entity_ids, limit = 12 } = ctx;
  let pool = DATAPOINTS.slice();
  if (region) {
    pool = pool.filter(d => d.region === region || d.region === 'global' || d.region === 'mena' || d.region === 'gcc');
  }
  if (comparable_types?.length) pool = pool.filter(d => comparable_types.includes(d.comparable_type));
  if (entity_ids?.length) pool = pool.filter(d => entity_ids.includes(d.entity_id));
  return pool
    .map(d => ({ ...d, trust: trustScore(d), freshness: freshnessScore(d.timestamp, d.volatility) }))
    .sort((a, b) => b.trust - a.trust)
    .slice(0, limit);
}

/**
 * Pick the comparable profiles most relevant for the scenario's archetype.
 * Default returns 4-5 profiles spanning the relevant business models.
 */
export function selectComparableProfiles({ archetype_id, gpu_focus = false }) {
  // Always include Equinix + Digital Realty (operator baseline) + one MENA anchor (Khazna)
  // Plus archetype-specific peers.
  const base = ['equinix', 'digital_realty', 'khazna'];
  let extra = [];
  if (gpu_focus || archetype_id === 'neocloud_gpu') extra = ['coreweave', 'crusoe', 'lambda'];
  else if (archetype_id === 'sovereign_ai') extra = ['g42', 'neom'];
  else if (archetype_id === 'powered_shell' || archetype_id === 'sale_leaseback') extra = ['brookfield', 'ntt'];
  else extra = ['ntt', 'brookfield'];

  const ids = [...new Set([...base, ...extra])];
  return ids
    .filter(id => COMPARABLE_PROFILES[id])
    .map(id => ({ entity_id: id, profile: COMPARABLE_PROFILES[id] }));
}

/**
 * Pick the decision tensions most likely material for the scenario.
 */
export function selectMaterialTensions({ archetype_id, gpu_focus = false, sovereign_focus = false }) {
  const always = ['speed_vs_resiliency', 'commercialization_speed_vs_occupancy_risk'];
  const conditional = [];
  if (gpu_focus || archetype_id === 'neocloud_gpu') conditional.push('liquid_density_vs_complexity', 'gpu_capex_vs_obsolescence');
  if (sovereign_focus || archetype_id === 'sovereign_ai') conditional.push('sovereign_vs_partnership', 'compute_ownership_vs_capital_efficiency');
  if (archetype_id === 'branded_jv' || archetype_id === 'manage_only') conditional.push('integration_vs_optionality');
  const ids = [...new Set([...always, ...conditional])];
  return ids.map(id => TENSION_BY_ID[id]).filter(Boolean);
}

/**
 * Build a compact intelligence brief the LLM can absorb verbatim before
 * generating the strategic memo. Returns a plain object — not a prompt
 * string — so the endpoint can JSON.stringify it cleanly.
 */
export function buildIntelligenceBrief({ region = 'qatar', archetype_id, gpu_focus = false, sovereign_focus = false, months_to_cod, has_liquid_cooling = false, gpu_sku = null }) {
  const datapoints = selectRelevantDatapoints({ region, limit: 14 });
  const comparables = selectComparableProfiles({ archetype_id, gpu_focus });
  const tensions = selectMaterialTensions({ archetype_id, gpu_focus, sovereign_focus });
  const absorption = COMMERCIAL_ABSORPTION[region] || null;
  const reality_violations = months_to_cod
    ? detectRealityViolations({ months_to_cod, region, has_liquid_cooling, gpu_sku })
    : [];

  return {
    region,
    archetype_id: archetype_id || 'unspecified',
    datapoints: datapoints.map(d => ({
      id: d.id,
      entity_id: d.entity_id,
      source_authority: d.source_authority,
      timestamp: d.timestamp,
      confidence: d.confidence,
      volatility: d.volatility,
      comparable_type: d.comparable_type,
      relevance_score: d.relevance_score,
      trust: d.trust,
      freshness: Math.round(d.freshness * 100) / 100,
      metrics: d.metrics,
      source_name: d.notes?.source_name,
      url: d.notes?.url,
      applicability: d.notes?.applicability,
      caveat: d.notes?.caveat,
    })),
    comparables,
    tensions: tensions.map(t => ({
      id: t.id,
      label: t.label,
      pole_a: t.pole_a,
      pole_b: t.pole_b,
      real_world_examples: t.real_world_examples,
    })),
    absorption,
    reality_violations,
    intelligence_layer_version: 'sprint-2-v1',
    generated_at: new Date().toISOString(),
  };
}

export { detectRealityViolations };
