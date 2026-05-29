/**
 * CampusFloorplan2D — placeholder wrapper.
 * Renders a clean institutional placeholder until approved spatial assets
 * exist. The real renderer hooks in when VISUAL_PLACEHOLDER_MODE is off AND
 * the required assets are approved (manifest.canRenderView). Legacy SVG is
 * quarantined in ./_quarantine and intentionally not imported.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';
import { canRenderView } from '@/lib/spatial/assets/manifest';

export default function CampusFloorplan2D({ mw = null, phases = null, archetype = null, region = null, scenarioId = null }) {
  const showReal = !VISUAL_PLACEHOLDER_MODE && canRenderView('campus2d');
  if (showReal) {
    // Approved-asset renderer not yet implemented — fall through to placeholder.
  }
  return <SpatialPlaceholder kind="campus2d" mw={mw} phases={phases} archetype={archetype} region={region} scenarioId={scenarioId} />;
}
