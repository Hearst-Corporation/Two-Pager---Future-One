'use client';
import { UI } from '@/lib/ui-strings';
import ArchetypeSegment from './ArchetypeSegment';
import CapacityControl from './CapacityControl';
import TechPresetControl from './TechPresetControl';
import './simulator-config.css';

export default function SimulatorConfigPanel({ state, dispatch }) {
  return (
    <div data-sim-config-v2>
      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_THESIS_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_THESIS_HINT}</p>
        </header>
        <div data-arch-segment>
          <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
        </div>
      </section>

      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_SIZE_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_SIZE_HINT}</p>
        </header>
        <div data-capacity-control>
          <CapacityControl value={state.total_mw} dispatch={dispatch} />
        </div>
      </section>

      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_HW_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_HW_HINT}</p>
        </header>
        <div data-tech-preset>
          <TechPresetControl hardwareMix={state.hardware_mix} dispatch={dispatch} />
        </div>
      </section>
    </div>
  );
}
