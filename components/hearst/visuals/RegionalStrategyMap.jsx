/**
 * RegionalStrategyMap — placeholder wrapper.
 * Data-driven (not 3D-geometry) view. Renders a clean institutional
 * placeholder until an approved regional renderer exists. Legacy SVG is
 * quarantined in ./_quarantine.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';

export default function RegionalStrategyMap({ scenarios = [] }) {
  void scenarios; void VISUAL_PLACEHOLDER_MODE; // contract preserved; real renderer pending
  return <SpatialPlaceholder kind="regional" region="GCC" />;
}
