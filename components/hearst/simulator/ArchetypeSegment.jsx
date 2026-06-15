'use client';
import PropTypes from 'prop-types';
import { PRIMARY_DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';
import './simulator-config.css';

// ArchetypeSegment — Index Typographique (Strategic Storyboard, passe 2).
// Sélectionner un item applique en UN dispatch APPLY_PRESET :
// l'archétype + les defaults canoniques business_model_id / client_type_id.
// La PRÉSENTATION est un master-detail textuel, sans boîtes.
export default function ArchetypeSegment({ primaryId, dispatch }) {
  const select = (id) => {
    const def = MODEL_DEFAULTS[id];
    dispatch({
      type: ACTIONS.APPLY_PRESET,
      value: { primary_archetype_id: id, ...(def || {}) },
    });
  };

  return (
    <div className="hw-button-grid">
      {PRIMARY_DEAL_ARCHETYPES.map((a) => {
        const selected = primaryId === a.id;
        const m = PRESET_META[a.id];
        return (
          <button
            key={a.id}
            onClick={() => select(a.id)}
            aria-pressed={selected}
            className="hw-button"
          >
            <div className="hw-led-row">
              <span className="hw-button-title">{a.label}</span>
              <span className="hw-led"></span>
            </div>
            
            {m && (
              <div className="hw-button-meta">
                <span>{m.tagline}</span>
                <span style={{ opacity: 0.6, marginTop: '4px' }}>Risk: {LEVEL_LABEL[m.risk]}</span>
              </div>
            )}
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
