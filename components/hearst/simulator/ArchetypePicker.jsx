'use client';

import MiniRadar from './MiniRadar';
import { ARCHETYPE_PALETTE } from './ArchetypeRadar';

const B2B_B2C_TAG = {
  powered_shell: 'Business',
  branded_jv: 'Business',
  manage_only: 'Business',
  white_label: 'Business',
  sale_leaseback: 'Business',
  neocloud_gpu: 'Mixed',
  hyperscaler_self_build: 'Minority',
  sovereign_ai: 'Government',
};

export default function ArchetypePicker({
  archetypes = [],
  primaryId,
  compareIds = [],
  onSelectPrimary,
  onToggleCompare,
}) {
  return (
    <div style={S.scroller}>
      {archetypes.map(a => {
        const isPrimary = primaryId === a.id;
        const isCompared = compareIds.includes(a.id);
        const color = ARCHETYPE_PALETTE[a.id] || 'var(--cp-info)';
        return (
          <div
            key={a.id}
            style={{
              ...S.card,
              outline: isPrimary ? `2px solid ${color}` : 'none',
              borderColor: isCompared ? color : 'var(--cp-border)',
            }}
          >
            <div style={S.cardHeader}>
              <div style={S.cardCode}>{a.code}</div>
              <div style={S.cardTags}>
                {a.recommended && <span style={S.recoTag}>RECO</span>}
                <span style={{ ...S.b2bTag, color }}>{B2B_B2C_TAG[a.id] || ''}</span>
              </div>
            </div>
            <div style={S.cardTitle}>{a.label}</div>
            <div style={S.cardShort}>{a.short}</div>
            <div style={S.cardRadar}>
              <MiniRadar scores={a.scores} size={92} color={color} />
            </div>
            <div style={S.cardActions}>
              <button
                type="button"
                onClick={() => onToggleCompare?.(a.id)}
                style={{
                  ...S.compareBtn,
                  ...(isCompared ? { background: color, color: 'var(--cp-text-strong)', borderColor: color } : {}),
                }}>
                {isCompared ? '✓ Compare' : '+ Compare'}
              </button>
              <button
                type="button"
                onClick={() => onSelectPrimary?.(a.id)}
                style={{
                  ...S.selectBtn,
                  ...(isPrimary ? { background: color, color: 'var(--cp-text-strong)' } : {}),
                }}>
                {isPrimary ? 'Selected' : 'Select →'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  scroller: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    paddingBottom: 8,
    scrollSnapType: 'x mandatory',
  },
  card: {
    flexShrink: 0,
    width: 260,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    scrollSnapAlign: 'start',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardCode: {
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--cp-text-muted)',
    background: 'var(--cp-surface-0)',
    padding: '2px 8px',
    borderRadius: 4,
  },
  cardTags: { display: 'flex', gap: 4 },
  recoTag: {
    fontSize: 9,
    fontWeight: 800,
    padding: '2px 6px',
    background: 'var(--cp-success-bg)',
    color: 'var(--cp-success)',
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  b2bTag: {
    fontSize: 9,
    fontWeight: 800,
    padding: '2px 6px',
    background: 'var(--cp-surface-0)',
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  cardTitle: { fontSize: 13, fontWeight: 800, color: 'var(--cp-text-primary)', lineHeight: 1.2 },
  cardShort: { fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.3 },
  cardRadar: { display: 'flex', justifyContent: 'center', padding: '4px 0' },
  cardActions: { display: 'flex', gap: 6, marginTop: 2 },
  compareBtn: {
    flex: 1,
    fontSize: 10,
    padding: '5px 6px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 700,
  },
  selectBtn: {
    flex: 1,
    fontSize: 10,
    padding: '5px 6px',
    background: 'var(--cp-info-strong-cta, var(--cp-info))',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 700,
  },
};
