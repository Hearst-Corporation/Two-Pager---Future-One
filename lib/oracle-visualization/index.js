/**
 * oracle-visualization/index.js
 * Public API — re-exports the three spec builders.
 * Consumed by Agent 7 (strategic memo) and any React component.
 */

const { build2DDiagramSpec, buildTopologySpec, buildDeploymentPhaseSpec } = require('./specs');

module.exports = { build2DDiagramSpec, buildTopologySpec, buildDeploymentPhaseSpec };
