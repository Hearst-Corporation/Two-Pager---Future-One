'use client';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';
import ArchetypeSegment from './ArchetypeSegment';
import CapacityControl from './CapacityControl';
import TechPresetControl from './TechPresetControl';
import './simulator-config.css';

export default function SimulatorConfigPanel({ state, dispatch }) {
  return (
    <div data-sim-config-v2>
      <Card variant="card" surface={0} padding="lg" as="section" data-sim-config-section="archetype">
        <label className="sim-config-label">{UI.SIM_THESIS_TITLE}</label>
        <div data-arch-segment>
          <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
        </div>
      </Card>

      <Card variant="card" surface={0} padding="lg" as="section" data-sim-config-section="capacity">
        <label className="sim-config-label">{UI.SIM_SIZE_TITLE}</label>
        <div data-capacity-control>
          <CapacityControl value={state.total_mw} dispatch={dispatch} />
        </div>
      </Card>

      <Card variant="card" surface={0} padding="lg" as="section" data-sim-config-section="tech">
        <label className="sim-config-label">{UI.SIM_HW_TITLE}</label>
        <div data-tech-preset>
          <TechPresetControl hardwareMix={state.hardware_mix} dispatch={dispatch} />
        </div>
      </Card>
    </div>
  );
}
