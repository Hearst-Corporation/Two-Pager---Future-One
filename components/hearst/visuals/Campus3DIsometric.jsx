/**
 * Campus3DIsometric — placeholder wrapper.
 * 3D campus massing is shown ONLY from approved GLB assets. Until then this
 * renders a clean institutional placeholder (no pretend 3D). Legacy SVG iso is
 * quarantined in ./_quarantine and intentionally not imported.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';
import { canRenderView } from '@/lib/spatial/assets/manifest';

export default function Campus3DIsometric({ mw = null, phases = null, archetype = null, region = null, scenarioId = null }) {
  const showReal = !VISUAL_PLACEHOLDER_MODE && canRenderView('campus3d');
  if (showReal) {
    // Approved GLB renderer (Three.js) not yet implemented — fall through to placeholder.
  }
  return <SpatialPlaceholder kind="campus3d" mw={mw} phases={phases} archetype={archetype} region={region} scenarioId={scenarioId} />;
}
