/**
 * PowerFlowDiagram — placeholder wrapper.
 * Renders a clean institutional placeholder until an approved power-flow
 * renderer/asset set exists. Legacy SVG is quarantined in ./_quarantine.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';
import { canRenderView } from '@/lib/spatial/assets/manifest';

export default function PowerFlowDiagram({ mw = null, tier = null, region = null, scenarioId = null }) {
  const showReal = !VISUAL_PLACEHOLDER_MODE && canRenderView('powerflow');
  if (showReal) {
    // Approved-asset renderer not yet implemented — fall through to placeholder.
  }
  return <SpatialPlaceholder kind="powerflow" mw={mw} archetype={tier != null ? `Tier ${tier}` : null} region={region} scenarioId={scenarioId} />;
}
