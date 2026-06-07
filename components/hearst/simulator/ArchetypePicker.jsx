'use client';

import { ARCHETYPE_PALETTE } from './ArchetypeRadar';

// Each operating model is anchored to how the real market actually runs it:
// who the customer is (B2B / B2C / B2B+B2C), the reference operator, and how
// common the model is across the major players (Equinix, hyperscalers, CoreWeave…).
const MODEL_META = {
  powered_shell:          { title: 'Build & Lease',    tag: 'B2B',       anchor: 'Equinix · Meta × Blue Owl', prevalence: '~80% of large-cap DC deals' },
  branded_jv:             { title: 'Co-branded JV',    tag: 'B2B',       anchor: 'Equinix × Omantel',          prevalence: 'Rare (~15%)' },
  manage_only:           { title: 'In-House',         tag: 'B2B',       anchor: 'GCC operators × Schneider',  prevalence: '~40% of operators' },
  white_label:            { title: 'Hidden Operator',  tag: 'B2B',       anchor: 'Compass Datacenters',        prevalence: '~30% of operators' },
  sale_leaseback:         { title: 'Build & Sell',     tag: 'B2B',       anchor: 'Blackstone · Iron Mountain',  prevalence: 'Exotic — fallback' },
  neocloud_gpu:           { title: 'GPU Cloud',        tag: 'B2B + B2C', anchor: 'CoreWeave · Lambda',          prevalence: 'Emerging (~25%)' },
  hyperscaler_self_build: { title: 'Tech Giant Stake', tag: 'B2B',       anchor: 'PIF × AWS',                  prevalence: '~20% (minority LP)' },
  sovereign_ai:           { title: 'Government AI',    tag: 'B2B · gov', anchor: 'G42 · HUMAIN',               prevalence: 'Government-only' },
};

export default function ArchetypePicker({
  archetypes = [],
  primaryId,
  onSelectPrimary,
}) {
  return (
    <div data-archetype-grid style={S.grid}>
      {archetypes.map(a => {
        const isPrimary = primaryId === a.id;
        const color = ARCHETYPE_PALETTE[a.id] || 'var(--cp-accent-maroon)';
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelectPrimary?.(a.id)}
            style={{
              ...S.card,
              borderColor: isPrimary ? color : 'var(--cp-border)',
              background: isPrimary ? 'var(--cp-accent-soft)' : 'var(--cp-surface-2)',
            }}
          >
            <div style={S.cardCode}>{a.code}</div>
            <div style={S.cardBody}>
              <div style={S.cardTitleRow}>
                <div style={S.cardTitle}>{MODEL_META[a.id]?.title || a.label}</div>
                {isPrimary && <span style={{ ...S.selectedTag, borderColor: color }}>Selected</span>}
              </div>
              <div style={S.cardShort}>{a.short}</div>
              {MODEL_META[a.id] && (
                <div style={S.cardMeta}>
                  <span style={S.metaVal}>{MODEL_META[a.id].anchor}</span>
                  <span style={{ ...S.metaVal, color }}>{MODEL_META[a.id].prevalence}</span>
                </div>
              )}
            </div>
            <div style={S.cardTags}>
              {a.recommended && <span style={S.recoTag}>RECO</span>}
              <span style={{ ...S.b2bTag, color }}>{MODEL_META[a.id]?.tag || ''}</span>
            </div>
            {/*
              Compare was removed from the picker: this step chooses one operating
              thesis. Strategic comparison belongs in the visualizations section.
            */}
          </button>
        );
      })}
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 'var(--cp-space-3)',
  },
  card: {
    appearance: 'none',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
    padding: 'var(--cp-space-4)',
    display: 'grid',
    gridTemplateColumns: '44px minmax(0, 1fr)',
    gap: 'var(--cp-space-3)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all var(--cp-dur-fast) var(--cp-ease)',
  },
  cardCode: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
    background: 'var(--cp-surface-0)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-sm)',
    letterSpacing: 'var(--cp-tracking-wider)',
    alignSelf: 'start',
    textAlign: 'center',
  },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)', minWidth: 0 },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', flexWrap: 'wrap' },
  cardTags: { display: 'flex', gap: 'var(--cp-space-1)' },
  recoTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    background: 'var(--cp-accent-soft)',
    color: 'var(--cp-text-strong)',
    borderRadius: 'var(--cp-radius-sm)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  b2bTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    background: 'var(--cp-surface-0)',
    borderRadius: 'var(--cp-radius-sm)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 'var(--cp-font-lg)',
    lineHeight: 1.15,
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--cp-space-3)',
  },
  metaVal: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-primary)',
    lineHeight: '15px',
  },
  cardShort: {
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    color: 'var(--cp-text-muted)',
  },
  selectedTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
};
