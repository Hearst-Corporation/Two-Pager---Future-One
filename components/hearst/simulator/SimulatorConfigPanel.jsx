'use client';
import { UI } from '@/lib/ui-strings';
import ArchetypeSegment from './ArchetypeSegment';
import CapacityControl from './CapacityControl';
import TechPresetControl from './TechPresetControl';
import './simulator-config.css';

// Configuration column only. The Decision Control (Generate Board Memo CTA)
// lives in the page's right rail (data-sim-right-panel) — single source of truth.
export default function SimulatorConfigPanel({ state, dispatch }) {
  return (
    <div data-sim-config-v2 className="is-assembling">
      <section data-sim-section className="del-1">
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_THESIS_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_THESIS_HINT}</p>
        </header>
        <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
      </section>

      <section data-sim-section className="del-2">
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_SIZE_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_SIZE_HINT}</p>
        </header>
        <CapacityControl value={state.total_mw} dispatch={dispatch} />
      </section>

      <section data-sim-section className="del-3">
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_HW_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_HW_HINT}</p>
        </header>
        <TechPresetControl hardwareMix={state.hardware_mix} dispatch={dispatch} />
      </section>
    </div>
  );
}
