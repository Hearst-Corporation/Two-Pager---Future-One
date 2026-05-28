// lib/oracle-intelligence/index.js
// Sprint 2 — Infrastructure Intelligence Layer public exports.

export * from './schema.js';
export { ENTITIES, ENTITY_BY_ID } from './entities.js';
export {
  DATAPOINTS, DATAPOINT_BY_ID,
  DATAPOINTS_BY_ENTITY, DATAPOINTS_BY_REGION, DATAPOINTS_BY_COMPARABLE,
} from './datapoints.js';
export { COMPARABLE_PROFILES, COMPARABLE_DIMENSIONS, compareEntitiesOnDimension } from './comparables.js';
export { DECISION_TENSIONS, TENSION_BY_ID } from './tensions.js';
export { COMMERCIAL_ABSORPTION } from './absorption.js';
export { REALITY_CONSTRAINTS, detectRealityViolations } from './reality.js';
export {
  selectRelevantDatapoints,
  selectComparableProfiles,
  selectMaterialTensions,
  buildIntelligenceBrief,
} from './query.js';
