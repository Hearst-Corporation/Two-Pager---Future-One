'use client';
import PropTypes from 'prop-types';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { UI } from '@/lib/ui-strings';
import ArchetypeSegment from './ArchetypeSegment';
import ScaleControl from './ScaleControl';
import TechnologyStackStep from './sections/TechnologyStackStep';
import JvStructureVisual from './JvStructureVisual';
import './simulator-config.css';

export default function SimulatorConfigPanel({
  state,
  dispatch,
  scenario,
  projection,
  derived,
  solver,
}) {
  const totalMw = scenario?.total_mw ?? state.total_mw;

  return (
    <div data-sim-config-v2 className="hw-rack">
      <section data-sim-section className="hw-module">
        <header className="hw-module-header">
          <h2 className="hw-label">{UI.SIM_THESIS_TITLE}</h2>
          <p className="hw-hint">{UI.SIM_THESIS_HINT}</p>
        </header>
        <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
      </section>

      <section data-sim-section className="hw-module">
        <header className="hw-module-header">
          <h2 className="hw-label">{UI.SIM_SIZE_TITLE}</h2>
          <p className="hw-hint">{UI.SIM_SIZE_HINT}</p>
        </header>
        <ScaleControl
          state={state}
          dispatch={dispatch}
          projection={projection}
          scenario={scenario}
          derived={derived}
          solver={solver}
        />
      </section>

      <section data-sim-section className="hw-module">
        <header className="hw-module-header">
          <h2 className="hw-label">{UI.SIM_HW_TITLE}</h2>
          <p className="hw-hint">{UI.SIM_HW_HINT}</p>
        </header>
        <TechnologyStackStep
          totalMw={totalMw}
          value={state.hardware_mix}
          onChange={(next) => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: next })}
        />
      </section>

      <section data-sim-section className="hw-module">
        <header className="hw-module-header">
          <h2 className="hw-label">{UI.SIM_STEP_STRUCTURE_TITLE}</h2>
          <p className="hw-hint">{UI.SIM_STEP_STRUCTURE_HINT}</p>
        </header>
        <JvStructureVisual />
      </section>
    </div>
  );
}

SimulatorConfigPanel.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  scenario: PropTypes.object,
  projection: PropTypes.object,
  derived: PropTypes.object,
  solver: PropTypes.object,
};
