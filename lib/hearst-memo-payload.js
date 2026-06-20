// hearst-memo-payload.js
// Whitelist builder that satisfies MemoPayloadSchema.strict() — only the four
// allowed keys (scenario, projection, hardware_breakdown, archetype_outcome) are
// extracted from a /simulate response; all other keys (waterfall, debt_schedule,
// source_map, source_score, confidence_score, derived, solver) are intentionally
// dropped so the resulting object passes validation without a 400.

/**
 * Build a MemoPayloadSchema-compliant payload from a POST /simulate result.
 *
 * @param {object} result - Raw response from /api/admin/hearst/simulate.
 * @returns {{ scenario?: object, projection?: object, hardware_breakdown?: object, archetype_outcome?: object }}
 */
export function buildMemoPayloadFromSimResult(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('buildMemoPayloadFromSimResult: result must be a non-null object');
  }

  const payload = {};

  // Whitelist only the four keys allowed by MemoPayloadSchema.strict().
  if (result.scenario != null)           payload.scenario           = result.scenario;
  if (result.projection != null)         payload.projection         = result.projection;
  if (result.hardware_breakdown != null) payload.hardware_breakdown = result.hardware_breakdown;
  // P1-a — only include archetype_outcome when .id is a non-empty string;
  // the schema requires archetype_outcome.id ≤ 64 chars, and an object without
  // a valid id causes a 400. Omitting it is safe: the refine only requires
  // scenario OR projection, so archetype_outcome is always optional.
  if (
    result.archetype_outcome != null &&
    typeof result.archetype_outcome.id === 'string' &&
    result.archetype_outcome.id.length > 0
  ) {
    payload.archetype_outcome = result.archetype_outcome;
  }

  return payload;
}
