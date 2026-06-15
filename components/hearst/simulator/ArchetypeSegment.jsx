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
    <div data-focus-stage>
      {PRIMARY_DEAL_ARCHETYPES.map((a) => {
        const selected = primaryId === a.id;
        const m = PRESET_META[a.id];
        return (
          <button
            key={a.id}
            onClick={() => select(a.id)}
            aria-pressed={selected}
            data-focus-item
            data-focused={selected}
            data-dimmed={!selected}
          >
            <div data-focus-title>{a.label}</div>
            {m && <div data-focus-subtitle>{m.tagline}</div>}
            
            <div data-focus-detail>
              {m && (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--cp-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                    {m.ideal_for}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--cp-text-muted)' }}>Return</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cp-text-strong)' }}>{m.return_band}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--cp-text-muted)' }}>Risk</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cp-text-strong)' }}>{LEVEL_LABEL[m.risk]}</div>
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
