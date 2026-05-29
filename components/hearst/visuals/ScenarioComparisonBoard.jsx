/**
 * ScenarioComparisonBoard — placeholder wrapper.
 * Data-driven view. Renders a clean institutional placeholder until an
 * approved comparison renderer exists. Legacy version quarantined in
 * ./_quarantine.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';

export default function ScenarioComparisonBoard({ scenarios = [] }) {
  void scenarios; void VISUAL_PLACEHOLDER_MODE; // contract preserved; real renderer pending
  return <SpatialPlaceholder kind="scenario" />;
}
