'use client';
import PropTypes from 'prop-types';
import { PRIMARY_DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';
import { UI } from '@/lib/ui-strings';
import './simulator-config.css';

// ArchetypeSegment — card grid. Detail (ideal_for, Return, Risk) only on selected card.
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
            data-focused={selected ? 'true' : undefined}
          >
            <div data-focus-title>{a.label}</div>
            {m && <div data-focus-subtitle>{m.tagline}</div>}

            {selected && m && (
              <div data-focus-detail>
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
