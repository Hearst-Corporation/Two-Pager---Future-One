'use client';
import { SectionHead } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';
import ArchetypeSegment from './ArchetypeSegment';
import CapacityControl from './CapacityControl';
import TechPresetControl from './TechPresetControl';
import './simulator-config.css';

export default function SimulatorConfigPanel({ state, dispatch }) {
  return (
    <div data-sim-config-v2>
      <section data-sim-config-section="archetype">
        <SectionHead title={UI.SIM_THESIS_TITLE} hint={UI.SIM_THESIS_HINT} />
        <div data-arch-segment>
          <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
        </div>
      </section>

      <section data-sim-config-section="capacity">
        <SectionHead title={UI.SIM_SIZE_TITLE} hint={UI.SIM_SIZE_HINT} />
        <div data-capacity-control>
          <CapacityControl value={state.total_mw} dispatch={dispatch} />
        </div>
      </section>

      <section data-sim-config-section="tech">
        <SectionHead title={UI.SIM_HW_TITLE} hint={UI.SIM_HW_HINT} />
        <div data-tech-preset>
          <TechPresetControl hardwareMix={state.hardware_mix} dispatch={dispatch} />
        </div>
      </section>
    </div>
  );
}
