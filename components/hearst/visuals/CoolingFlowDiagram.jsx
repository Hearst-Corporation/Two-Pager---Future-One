/**
 * CoolingFlowDiagram — placeholder wrapper.
 * Renders a clean institutional placeholder until an approved cooling-flow
 * renderer/asset set exists. Legacy SVG is quarantined in ./_quarantine.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';
import { canRenderView } from '@/lib/spatial/assets/manifest';

export default function CoolingFlowDiagram({ pue = null, cooling_type = null, region = null, scenarioId = null }) {
  const showReal = !VISUAL_PLACEHOLDER_MODE && canRenderView('coolingflow');
  if (showReal) {
    // Approved-asset renderer not yet implemented — fall through to placeholder.
  }
  return <SpatialPlaceholder kind="coolingflow" archetype={cooling_type} region={region} scenarioId={scenarioId} />;
}
