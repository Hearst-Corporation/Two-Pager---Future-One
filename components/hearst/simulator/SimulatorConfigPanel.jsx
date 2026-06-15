'use client';
import { UI } from '@/lib/ui-strings';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import ArchetypeSegment from './ArchetypeSegment';
import ScaleControl from './ScaleControl';
import TechnologyStackStep from './sections/TechnologyStackStep';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';
import './simulator-config.css';

// Structure asset-based stable : 3 sections empilées (Thesis · Scale · Technology),
// pas de stage switcher. Le détail de l'archétype sélectionné vit dans une zone
// séparée sous la grille de cartes — les cartes gardent une hauteur stable.
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
  const meta = PRESET_META[state.primary_archetype_id];

  return (
    <div data-sim-config-v2>
      <section data-sim-section>
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_THESIS_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_THESIS_HINT}</p>
        </header>
        <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
        {meta && (
          <div data-archetype-detail>
            <p className="archetype-ideal-for">{meta.ideal_for}</p>
            <div className="archetype-meta-row">
              <div>
                <span className="archetype-meta-label">{UI.SIM_META_RETURN}</span>
                <span className="archetype-meta-value">{meta.return_band}</span>
              </div>
              <div>
                <span className="archetype-meta-label">{UI.SIM_META_RISK}</span>
                <span className="archetype-meta-value">{LEVEL_LABEL[meta.risk]}</span>
              </div>
            </div>
          </div>
        )}
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
