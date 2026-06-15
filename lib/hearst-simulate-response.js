export function buildSimulateResponse({
  archResult,
  archetype,
  projection,
  waterfall,
  debt_schedule,
  hardware_breakdown,
  boot,
  derived,
  solver,
}) {
  return {
    scenario: archResult.scenario,
    projection,
    waterfall,
    debt_schedule,
    archetype_outcome: {
      id: archetype.id,
      label: archetype.label,
      code: archetype.code,
      score: archResult.score,
      scores: archetype.scores,
      compute_as: archetype.compute_as || 'recurring_revenue',
    },
    hardware_breakdown,
    source_map: boot.source_map,
    source_score: boot.confidence_score,
    confidence_score: boot.confidence_score,
    derived,
    solver: solver
      ? {
          converged: solver.converged,
          iterations: solver.iterations,
          lever_value: solver.lever_value,
          achieved_irr: solver.achieved_irr,
          diagnostic: solver.diagnostic,
        }
      : null,
  };
}
