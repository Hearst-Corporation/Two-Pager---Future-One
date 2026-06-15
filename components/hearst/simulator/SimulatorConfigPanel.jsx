'use client';
import { UI } from '@/lib/ui-strings';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import ArchetypeSegment from './ArchetypeSegment';
import ScaleControl from './ScaleControl';
import TechnologyStackStep from './sections/TechnologyStackStep';
import './simulator-config.css';

export default function SimulatorConfigPanel({
  state,
  dispatch,
  projection,
  scenario,
  derived,
  solver,
  projectionStale,
  loading,
}) {
  const totalMw = scenario?.total_mw ?? state.total_mw;

  return (
    <div data-sim-config-v2>
      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_THESIS_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_THESIS_HINT}</p>
        </header>
        <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
      </section>

      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_SIZE_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_SIZE_HINT}</p>
        </header>
        <ScaleControl
          state={state}
          dispatch={dispatch}
          projection={projection}
          scenario={scenario}
          derived={derived}
          solver={solver}
          projectionStale={projectionStale}
          loading={loading}
        />
      </section>

      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_HW_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_HW_HINT}</p>
        </header>
        <TechnologyStackStep
          totalMw={totalMw}
          value={state.hardware_mix}
          onChange={(next) => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: next })}
        />
      </section>
    </div>
  );
}
