/** Canonical compare trio for Financial page (not 100+ saved plans as pills). */
export const CANONICAL_SCENARIO_TYPES = ['base', 'downside', 'upside'];

/**
 * Returns true when a scenario row (or bare name string) is a test/synthetic
 * artefact that should be hidden from all UI lists and dropdowns.
 *
 * Matched patterns (conservative — business names like "Base case" or
 * "Powered Shell 50MW" are never touched):
 *   • Starts with "E2E-TEST-"  → E2E critical-path suite (RUN_TAG format,
 *                                 e.g. "E2E-TEST-1718800000000")
 *
 * Intentionally NOT matched: anything that doesn't start with a clear test
 * sentinel. A false positive (hiding a real scenario) is worse than a false
 * negative (showing a test row).
 *
 * @param {string | { name?: string } | null | undefined} nameOrRow
 * @returns {boolean}
 */
export function isTestScenario(nameOrRow) {
  if (!nameOrRow) return false;
  const name = typeof nameOrRow === 'string' ? nameOrRow : (nameOrRow.name || '');
  // E2E-TEST-<timestamp> — exact prefix from tests/e2e/helpers/critical-path.ts
  if (name.startsWith('E2E-TEST-')) return true;
  // "E2E-TEST-<ts> memo" is the memo title; scenario name variant "E2E-TEST-<ts> 20MW"
  // Both covered above. Guard the memo title form too (startsWith check is sufficient).
  return false;
}

/**
 * @param {Array<{ id: string, scenario_type?: string, created_at?: string }>} scenarios
 * @returns {Array<object>} newest row per canonical type
 */
export function groupCanonicalScenarios(scenarios) {
  const byType = {};
  for (const s of scenarios || []) {
    const t = s.scenario_type;
    if (!CANONICAL_SCENARIO_TYPES.includes(t)) continue;
    const prev = byType[t];
    if (!prev || String(s.created_at || '') > String(prev.created_at || '')) {
      byType[t] = s;
    }
  }
  return CANONICAL_SCENARIO_TYPES.map((t) => byType[t]).filter(Boolean);
}

/**
 * Saved plans / presets — dedupe by name, keep newest.
 * @param {Array<{ id: string, name?: string, scenario_type?: string, created_at?: string }>} scenarios
 * @returns {Array<object>}
 */
export function dedupeSavedPlans(scenarios) {
  const canonicalIds = new Set(groupCanonicalScenarios(scenarios).map((s) => s.id));
  const others = (scenarios || []).filter(
    (s) => !canonicalIds.has(s.id) && !CANONICAL_SCENARIO_TYPES.includes(s.scenario_type) && !isTestScenario(s),
  );
  const byName = new Map();
  for (const s of others) {
    const key = (s.name || '').trim() || s.id;
    const prev = byName.get(key);
    if (!prev || String(s.created_at || '') > String(prev.created_at || '')) {
      byName.set(key, s);
    }
  }
  return [...byName.values()].sort(
    (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')),
  );
}

/**
 * @param {Array<{ id: string, is_active?: boolean, scenario_type?: string, projection?: { years?: unknown[] } }>} scenarios
 * @returns {string|null}
 */
export function pickDefaultPrimaryScenarioId(scenarios) {
  if (!scenarios?.length) return null;
  const active = scenarios.find((s) => s.is_active);
  if (active) return active.id;
  const base = groupCanonicalScenarios(scenarios).find((s) => s.scenario_type === 'base');
  if (base) return base.id;
  const withProjection = scenarios.find((s) => s.projection?.years?.length);
  if (withProjection) return withProjection.id;
  return scenarios[0].id;
}

/**
 * @param {string} scenarioType
 * @returns {'base'|'downside'|'upside'|null}
 */
export function canonicalScenarioColorType(scenarioType) {
  if (scenarioType === 'downside') return 'downside';
  if (scenarioType === 'upside') return 'upside';
  if (scenarioType === 'base') return 'base';
  return null;
}
