'use client';
import PropTypes from 'prop-types';
import { PRIMARY_DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { PRESET_META } from './preset-meta';
import './simulator-config.css';

// ArchetypeSegment — card grid. Cartes à hauteur stable (titre + tagline) ;
// le détail de la carte sélectionnée est rendu PAR LE PARENT dans une zone
// séparée [data-archetype-detail], pour que la grille ne reflow jamais.
export default function ArchetypeSegment({ primaryId, dispatch }) {
  const select = (id) => {
    if (primaryId === id) return;
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
            data-archetype-id={a.id}
            data-focus-item
          >
            <div data-focus-title>{a.label}</div>
            {m && <div data-focus-subtitle>{m.tagline}</div>}
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
