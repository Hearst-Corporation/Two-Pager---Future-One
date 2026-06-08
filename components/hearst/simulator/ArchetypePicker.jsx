'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// Market proof per operating model — anchor / prevalence / customer tag.
// Title + description come from DEAL_ARCHETYPES (a.label / a.short). Only the
// 4 primary models are shown in the picker; meta is keyed by archetype id.
const MODEL_META = {
  powered_shell: {
    anchor: UI.SIM_OS_M_POWERED_SHELL_ANCHOR,
    prevalence: UI.SIM_OS_M_POWERED_SHELL_PREVALENCE,
    tag: UI.SIM_OS_M_POWERED_SHELL_TAG,
  },
  neocloud_gpu: {
    anchor: UI.SIM_OS_M_NEOCLOUD_GPU_ANCHOR,
    prevalence: UI.SIM_OS_M_NEOCLOUD_GPU_PREVALENCE,
    tag: UI.SIM_OS_M_NEOCLOUD_GPU_TAG,
  },
  hyperscaler_self_build: {
    anchor: UI.SIM_OS_M_HYPERSCALER_ANCHOR,
    prevalence: UI.SIM_OS_M_HYPERSCALER_PREVALENCE,
    tag: UI.SIM_OS_M_HYPERSCALER_TAG,
  },
  sovereign_ai: {
    anchor: UI.SIM_OS_M_SOVEREIGN_AI_ANCHOR,
    prevalence: UI.SIM_OS_M_SOVEREIGN_AI_PREVALENCE,
    tag: UI.SIM_OS_M_SOVEREIGN_AI_TAG,
  },
};

/**
 * ArchetypePicker — 2×2 grid of operating-model cards. Two-tier calm card:
 * name + plain-language description up top, market proof demoted to a quiet
 * footer. Equal heights via grid rows. Single-select.
 */
export default function ArchetypePicker({ archetypes = [], primaryId, onSelectPrimary }) {
  return (
    <div data-archetype-grid style={S.grid}>
      {archetypes.map((a) => {
        const isPrimary = primaryId === a.id;
        const meta = MODEL_META[a.id];
        return (
          <Card
            as="button"
            key={a.id}
            type="button"
            onClick={() => onSelectPrimary?.(a.id)}
            padding="md"
            hover
            accent={isPrimary}
            aria-pressed={isPrimary}
            surface={2}
            style={S.card}
          >
            <div style={S.titleRow}>
              <span style={S.title}>{a.label}</span>
              <span style={S.pills}>
                {a.recommended && (
                  <span className="cp-surface-accent-soft" style={S.recoTag}>{UI.SIM_OS_RECO}</span>
                )}
                {isPrimary && (
                  <span className="cp-surface-0" style={{ ...S.selectedTag, borderColor: 'var(--cp-accent-maroon)' }}>
                    {UI.SIM_OS_SELECTED}
                  </span>
                )}
              </span>
            </div>

            <div style={S.desc}>{a.short}</div>

            {meta && (
              <div style={S.footer}>
                <span style={S.footAnchor}>{meta.anchor}</span>
                <span style={S.footDot}>·</span>
                <span style={S.footPrev}>{meta.prevalence}</span>
                <span style={S.footTag}>{meta.tag}</span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

ArchetypePicker.propTypes = {
  archetypes: PropTypes.array,
  primaryId: PropTypes.string,
  onSelectPrimary: PropTypes.func,
};

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 'var(--cp-space-3)',
    alignItems: 'stretch',
  },
  card: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    gap: 'var(--cp-space-2)',
    textAlign: 'left',
    minHeight: 132,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-2)',
  },
  title: {
    fontSize: 'var(--cp-font-lg)',
    lineHeight: 1.15,
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-tight)',
    minWidth: 0,
  },
  pills: {
    display: 'inline-flex',
    gap: 'var(--cp-space-1)',
    flexShrink: 0,
  },
  recoTag: {
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    borderRadius: 'var(--cp-radius-sm)',
  },
  selectedTag: {
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    border: '1px solid var(--cp-accent-maroon)',
    borderRadius: 'var(--cp-radius-sm)',
  },
  desc: {
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    color: 'var(--cp-text-muted)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    flexWrap: 'wrap',
    paddingTop: 'var(--cp-space-2)',
    borderTop: '1px solid var(--cp-border)',
  },
  footAnchor: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
  },
  footDot: {
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-faint)',
  },
  footPrev: {
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-muted)',
  },
  footTag: {
    marginLeft: 'auto',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
};
