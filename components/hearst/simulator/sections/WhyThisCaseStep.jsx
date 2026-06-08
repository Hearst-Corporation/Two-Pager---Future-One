'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Landmark } from 'lucide-react';
import { Card, SectionHead, Button } from '@/components/hearst/ui';
import ArchetypePicker from '@/components/hearst/simulator/ArchetypePicker';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { UI } from '@/lib/ui-strings';

// The 4 operating models the real market runs at scale — the investment theses.
const PRIMARY_MODEL_IDS = ['powered_shell', 'neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai'];
const PRIMARY_ARCHETYPES = DEAL_ARCHETYPES.filter(a => PRIMARY_MODEL_IDS.includes(a.id));
const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

/**
 * WhyThisCaseStep — the selected thesis, summarised. By default it shows ONLY the
 * chosen archetype (name + one sentence) — never the 4-card menu. The selector is
 * an editor: the 4 cards appear only when the board explicitly clicks "Change
 * thesis". This is the V5 fix — alternatives are no longer the page.
 *
 * Selection data/handler unchanged; this is structure only.
 *
 * @param {{ primaryId: string, onSelectPrimary: function }} props
 */
export default function WhyThisCaseStep({ primaryId, onSelectPrimary }) {
  const [editing, setEditing] = useState(true);
  const selected = ARCH_BY_ID[primaryId];

  // Picking a card both applies the choice and closes the selector — the page
  // returns to showing the case, not the menu.
  const handlePick = (id) => {
    onSelectPrimary?.(id);
    setEditing(false);
  };

  return (
    <Card as="section" data-sim-why variant="flat" style={S.deck} padding="lg">
      <div style={S.head}>
        <div style={S.titleGroup}>
          <span style={S.icon} aria-hidden="true"><Landmark size={18} strokeWidth={1.8} /></span>
          <SectionHead title={UI.SIM_WHY_TITLE} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }} />
        </div>
        <Button
          variant={editing ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setEditing(e => !e)}
          aria-expanded={editing}
          aria-controls="sim-thesis-selector"
        >
          {editing ? UI.SIM_THESIS_DONE : UI.SIM_THESIS_CHANGE}
        </Button>
      </div>

      {editing ? (
        <div id="sim-thesis-selector">
          <ArchetypePicker
            archetypes={PRIMARY_ARCHETYPES}
            primaryId={primaryId}
            onSelectPrimary={handlePick}
          />
        </div>
      ) : (
        <div data-sim-thesis-summary style={S.summary}>
          <span style={S.summaryName}>{selected?.label || primaryId}</span>
          {selected?.short && <span style={S.summaryDesc}>{selected.short}</span>}
        </div>
      )}
    </Card>
  );
}

WhyThisCaseStep.propTypes = {
  primaryId: PropTypes.string,
  onSelectPrimary: PropTypes.func.isRequired,
};

const S = {
  deck: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    flex: '0 0 36px',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-md)',
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    minWidth: 0,
  },
  summaryName: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-xl)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  summaryDesc: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-md)',
    lineHeight: 'var(--cp-leading-normal)',
  },
};
