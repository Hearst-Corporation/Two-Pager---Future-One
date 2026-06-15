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

  const selectedArch = PRIMARY_DEAL_ARCHETYPES.find((a) => a.id === primaryId) || PRIMARY_DEAL_ARCHETYPES[0];
  const meta = PRESET_META[selectedArch.id];

  return (
    <>
      <div data-arch-index>
        {PRIMARY_DEAL_ARCHETYPES.map((a) => {
          const selected = primaryId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => select(a.id)}
              aria-pressed={selected}
              data-arch-item
              data-selected={selected}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {meta ? (
        <div data-arch-details>
          <p data-arch-narrative>
            The <strong>{selectedArch.label}</strong> model is ideal for <strong>{meta.ideal_for.toLowerCase()}</strong>. 
            It targets a return of <strong>{meta.return_band}</strong> with a <strong>{LEVEL_LABEL[meta.risk].toLowerCase()}</strong> risk profile. 
            It requires <strong>{LEVEL_LABEL[meta.capital].toLowerCase()}</strong> capital and typically involves partners like <strong>{meta.partner}</strong>.
          </p>

          {meta.bullets?.length > 0 ? (
            <ul data-arch-bullets>
              {meta.bullets.map((b, i) => (
                <li key={i} data-arch-bullet>
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

ArchetypeSegment.propTypes = {
  primaryId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};
