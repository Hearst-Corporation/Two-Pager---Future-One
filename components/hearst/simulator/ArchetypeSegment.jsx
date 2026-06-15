'use client';
import PropTypes from 'prop-types';
import { Card, Badge } from '@/components/hearst/ui';
import { PRIMARY_DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { UI } from '@/lib/ui-strings';
import './simulator-config.css';

// ArchetypeSegment — segment cliquable des 4 archétypes primaires. Sélectionner
// une carte applique en UN dispatch APPLY_PRESET : l'archétype + les defaults
// canoniques business_model_id / client_type_id (MODEL_DEFAULTS), comme le bridge
// de page.jsx. Pas de SET_PRIMARY_ARCHETYPE seul (qui ne pose pas les defaults).

export default function ArchetypeSegment({ primaryId, dispatch }) {
  const select = (id) => {
    const def = MODEL_DEFAULTS[id];
    dispatch({
      type: ACTIONS.APPLY_PRESET,
      value: { primary_archetype_id: id, ...(def || {}) },
    });
  };

  return (
    <>
      {PRIMARY_DEAL_ARCHETYPES.map((a) => {
        const selected = primaryId === a.id;
        return (
          <Card
            key={a.id}
            as="button"
            variant="card"
            surface={selected ? 2 : 1}
            padding="md"
            hover
            accent={selected}
            onClick={() => select(a.id)}
            aria-pressed={selected}
            data-arch-card={a.id}
            data-selected={selected}
          >
            <span data-arch-card-head>
              <span data-arch-label>{a.label}</span>
              {a.recommended ? <Badge tone="accent">{UI.ARCH_RECOMMENDED}</Badge> : null}
            </span>
            <span data-arch-short>{a.short || a.operator_role}</span>
          </Card>
        );
      })}
    </>
  );
}

ArchetypeSegment.propTypes = {
  primaryId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};
