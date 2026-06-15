'use client';
import PropTypes from 'prop-types';
import { PRIMARY_DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';
import { UI } from '@/lib/ui-strings';
import './simulator-config.css';

// ArchetypeSegment — Institutional card grid (board-ready).
// Sélectionner un item applique en UN dispatch APPLY_PRESET :
// l'archétype + les defaults canoniques business_model_id / client_type_id.
// Toutes les cartes restent cliquables ET leur détail (ideal_for, Return, Risk)
// est visible en permanence — le board compare les 4 thèses sans cliquer.
// La carte sélectionnée est mise en valeur par sa bordure/surface accent uniquement.
export default function ArchetypeSegment({ primaryId, dispatch }) {
  const select = (id) => {
    const def = MODEL_DEFAULTS[id];
    dispatch({
      type: ACTIONS.APPLY_PRESET,
      value: { primary_archetype_id: id, ...(def || {}) },
    });
  };

  return (
    <div data-focus-stage>
      {PRIMARY_DEAL_ARCHETYPES.map((a) => {
        const selected = primaryId === a.id;
        const m = PRESET_META[a.id];
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => select(a.id)}
            aria-pressed={selected}
            data-focus-item
            data-focused={selected ? 'true' : undefined}
            data-dimmed={!selected ? 'true' : undefined}
          >
            <div data-focus-title>{a.label}</div>
            {m && <div data-focus-subtitle>{m.tagline}</div>}

            <div data-focus-detail>
              {m && (
                <>
                  <p className="archetype-ideal-for">{m.ideal_for}</p>
                  <div className="archetype-meta-row">
                    <div>
                      <span className="archetype-meta-label">{UI.SIM_META_RETURN}</span>
                      <span className="archetype-meta-value">{m.return_band}</span>
                    </div>
                    <div>
                      <span className="archetype-meta-label">{UI.SIM_META_RISK}</span>
                      <span className="archetype-meta-value">{LEVEL_LABEL[m.risk]}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

ArchetypeSegment.propTypes = {
  primaryId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};
