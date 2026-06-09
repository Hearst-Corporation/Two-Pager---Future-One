'use client';

import { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { Card, SectionHead } from '@/components/hearst/ui';
import ArchetypeRadar from '@/components/hearst/simulator/ArchetypeRadar';
import B2BMatrix from '@/components/hearst/simulator/B2BMatrix';
import { VIZ_META, ARCH_BY_ID } from '@/lib/hearst-results-view';
import { S as CP } from '@/lib/cp-styles';
import { UI } from '@/lib/ui-strings';

const EcosystemNetwork = dynamic(() => import('@/components/hearst/simulator/EcosystemNetwork'), {
  ssr: false,
  loading: () => <div style={CP.loadingPanel}>{UI.RESULTS_LOADING_ECOSYSTEM}</div>,
});

const FinancialSankey = dynamic(() => import('@/components/hearst/simulator/FinancialSankey'), {
  ssr: false,
  loading: () => <div style={CP.loadingPanel}>{UI.RESULTS_LOADING_SANKEY}</div>,
});

/**
 * VisualizationsStep — 4-tab viz panel: radar / network / matrix / sankey.
 * Rail stays visible; chart panel is gated on projection existence.
 *
 * @param {{
 *   activeViz: string,
 *   onSelectViz: function,
 *   state: object,
 *   scenario: object|null,
 *   projection: object|null,
 * }} props
 */
function VisualizationsStep({
  activeViz,
  onSelectViz,
  state,
  scenario,
  projection,
}) {
  const radarArchetypes = useMemo(() => {
    if (!state) return [];
    const ids = new Set([state.primary_archetype_id, 'neocloud_gpu', 'sovereign_ai']);
    return Array.from(ids).map(id => ARCH_BY_ID[id]).filter(Boolean);
  }, [state]);

  const vizEntries = Object.entries(VIZ_META);
  const activeMeta = VIZ_META[activeViz] || VIZ_META[vizEntries[0][0]];

  return (
      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead
          title={UI.RESULTS_VIZ_TITLE}
          hint={UI.RESULTS_VIZ_HINT}
          style={{ marginBottom: 0 }}
        />
        <div data-viz-shell style={S.vizShell}>
          <aside data-viz-step-controls data-viz-rail style={S.vizRail}>
            {vizEntries.map(([id, meta]) => (
              <button
                key={id}
                type="button"
                aria-current={activeViz === id ? 'true' : undefined}
                onClick={() => onSelectViz(id)}
                style={{ ...S.vizRailBtn, ...(activeViz === id ? S.vizRailBtnActive : {}) }}
              >
                <span style={S.vizRailLabel}>{meta.label}</span>
                <span style={S.vizRailDetail}>{meta.detail}</span>
              </button>
            ))}
          </aside>
          {!projection ? (
            <div style={CP.loadingPanel}>{UI.SIM_FILL}</div>
          ) : (
            <Card data-viz-panel variant="card" surface={0} padding="lg" style={{ minWidth: 0 }}>
              <div data-viz-panel-head style={S.vizPanelHead}>
                <div>
                  <h3 style={S.vizTitle}>{activeMeta.title}</h3>
                  <p style={S.vizDetail}>{activeMeta.detail}</p>
                </div>
                <span style={S.vizMode}>{activeMeta.label}</span>
              </div>
              <div data-viz-container style={S.vizContainer}>
                {activeViz === 'radar' && (
                  <ArchetypeRadar archetypes={radarArchetypes} highlighted={[state?.primary_archetype_id]} height={420} />
                )}
                {activeViz === 'network' && (
                  <EcosystemNetwork activeArchetypeId={state?.primary_archetype_id} />
                )}
                {activeViz === 'matrix' && (
                  <B2BMatrix selected={{ businessModelId: state?.business_model_id, clientTypeId: state?.client_type_id }} />
                )}
                {activeViz === 'sankey' && (
                  <FinancialSankey scenario={scenario} projection={projection} height={420} />
                )}
              </div>
            </Card>
          )}
        </div>
      </Card>
  );
}

VisualizationsStep.propTypes = {
  activeViz: PropTypes.string,
  onSelectViz: PropTypes.func.isRequired,
  state: PropTypes.object,
  scenario: PropTypes.object,
  projection: PropTypes.object,
};

export default memo(VisualizationsStep);

const S = {
  vizShell: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--cp-space-4)',
    alignItems: 'start',
  },
  vizRail: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  vizRailBtn: {
    appearance: 'none',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 'var(--cp-space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minHeight: 118,
  },
  vizRailBtnActive: {
    borderColor: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
  },
  vizRailLabel: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  vizRailDetail: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  vizPanelHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-4)',
    marginBottom: 'var(--cp-space-4)',
    width: '100%',
  },
  vizTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
  },
  vizDetail: {
    margin: 'var(--cp-space-1) 0 0',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  vizMode: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  vizContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
  },
};
