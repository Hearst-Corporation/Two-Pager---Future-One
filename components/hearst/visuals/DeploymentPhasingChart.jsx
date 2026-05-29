/**
 * DeploymentPhasingChart — placeholder wrapper.
 * Data-driven view. Renders a clean institutional placeholder until an
 * approved phasing renderer exists. Legacy version quarantined in
 * ./_quarantine.
 */
import React from 'react';
import SpatialPlaceholder from './SpatialPlaceholder';
import { VISUAL_PLACEHOLDER_MODE } from '@/lib/spatial/placeholder-mode';

export default function DeploymentPhasingChart({ phases = [] }) {
  void VISUAL_PLACEHOLDER_MODE; // contract preserved; real renderer pending
  const count = Array.isArray(phases) ? phases.length : phases;
  return <SpatialPlaceholder kind="phasing" phases={count} />;
}
