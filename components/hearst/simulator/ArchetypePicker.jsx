'use client';

import { Card } from '@/components/hearst/ui';

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
        return (
          <Card
            as="button"
            key={a.id}
            type="button"
            onClick={() => onSelectPrimary?.(a.id)}
            padding="md"
            hover
            accent={isPrimary}
            surface={2}
            style={{
              ...S.card,
              borderColor: isPrimary ? 'var(--cp-accent-maroon)' : 'var(--cp-border)',
            }}
          >
            <div className="cp-surface-0" style={{...S.cardCode, padding: 'var(--cp-space-1) var(--cp-space-2)'}}>{a.code}</div>
            <div style={S.cardBody}>
              <div style={S.cardTitleRow}>
                <div style={S.cardTitle}>{MODEL_META[a.id]?.title || a.label}</div>
                {isPrimary && <span className="cp-surface-0" style={{ ...S.selectedTag, borderColor: 'var(--cp-accent-maroon)', padding: 'var(--cp-space-1) var(--cp-space-2)' }}>Selected</span>}
              </div>
              <div style={S.cardShort}>{a.short}</div>
              {MODEL_META[a.id] && (
                <div style={S.cardMeta}>
                  <span style={S.metaVal}>{MODEL_META[a.id].anchor}</span>
                  <span style={S.metaVal}>{MODEL_META[a.id].prevalence}</span>
                </div>
              )}
            </div>
            <div style={S.cardTags}>
              {a.recommended && <span className="cp-surface-accent-soft" style={{...S.recoTag, padding: 'var(--cp-space-1) var(--cp-space-2)'}}>RECO</span>}
              <span className="cp-surface-0" style={{ ...S.b2bTag, color: 'var(--cp-text-primary)', padding: 'var(--cp-space-1) var(--cp-space-2)' }}>{MODEL_META[a.id]?.tag || ''}</span>
            </div>
            {/*
              Compare was removed from the picker: this step chooses one operating
              thesis. Strategic comparison belongs in the visualizations section.
            */}
          </Card>
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
    display: 'grid',
    gridTemplateColumns: '44px minmax(0, 1fr)',
    gap: 'var(--cp-space-3)',
    textAlign: 'left',
  },
  cardCode: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
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
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  b2bTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
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
    lineHeight: 'var(--cp-leading-tight)',
  },
  cardShort: {
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    color: 'var(--cp-text-muted)',
  },
  selectedTag: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
};
