/**
 * Construit advisorContext pour OracleAdvisorRail / CockpitChatBridge
 * à partir d'un scénario sauvegardé + projection moteur.
 */

/**
 * @param {object} row — ligne hearst_scenarios (enrichie)
 * @returns {object|null}
 */
function stateFromScenarioRow(row) {
  if (!row) return null;
  return {
    primary_archetype_id: row.primary_archetype_id ?? row.archetype_id ?? null,
    hardware_mix: row.hardware_mix ?? {},
  };
}

/**
 * @param {{ row: object, projection: object, surface: string, scenarioId?: string }} input
 * @returns {object|null}
 */
export function buildAdvisorContextFromScenarioRow({ row, projection, surface, scenarioId }) {
  if (!row || !projection?.years?.length) return null;
  return {
    surface,
    state: stateFromScenarioRow(row),
    scenario: row,
    projection,
    scenarioId: scenarioId ?? row.id,
    savedScenarioId: row.id,
    loading: false,
    error: null,
  };
}

/**
 * @param {object|null|undefined} advisorContext
 * @returns {boolean}
 */
export function hasAdvisorProjection(advisorContext) {
  return Boolean(advisorContext?.projection?.years?.length);
}
