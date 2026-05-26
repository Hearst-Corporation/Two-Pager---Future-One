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
    <div style={S.grid}>
      {archetypes.map(a => {
        const isPrimary = primaryId === a.id;
        const isCompared = compareIds.includes(a.id);
        const color = ARCHETYPE_PALETTE[a.id] || 'var(--cp-accent-maroon)';
        return (
          <div
            key={a.id}
            style={{
              ...S.card,
              outline: isPrimary ? `2px solid ${color}` : '2px solid transparent',
              outlineOffset: 2,
              borderColor: isCompared && !isPrimary ? color : 'var(--cp-border)',
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
              <MiniRadar scores={a.scores} size={88} color={color} />
            </div>
            <div style={S.cardActions}>
              <button
                type="button"
                onClick={() => onToggleCompare?.(a.id)}
                style={{
                  ...S.compareBtn,
                  ...(isCompared ? { background: 'transparent', color, borderColor: color } : {}),
                }}>
                {isCompared ? '✓ Compared' : '+ Compare'}
              </button>
              <button
                type="button"
                onClick={() => onSelectPrimary?.(a.id)}
                style={{
                  ...S.selectBtn,
                  ...(isPrimary ? { background: color, borderColor: color, color: 'var(--cp-text-strong)' } : {}),
                }}>
                {isPrimary ? '✓ Selected' : 'Select →'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minHeight: 280,
    transition: 'border-color 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardCode: {
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--cp-text-muted)',
    background: 'var(--cp-surface-0)',
    padding: '3px 8px',
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  cardTags: { display: 'flex', gap: 4 },
  recoTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: '3px 8px',
    background: 'var(--cp-accent-soft)',
    color: 'var(--cp-text-strong)',
    borderRadius: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  b2bTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: '3px 8px',
    background: 'var(--cp-surface-0)',
    borderRadius: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    letterSpacing: -0.1,
  },
  cardShort: {
    fontSize: 11,
    lineHeight: '16px',
    color: 'var(--cp-text-muted)',
    flex: 1,
  },
  cardRadar: {
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 0',
  },
  cardActions: {
    display: 'flex',
    gap: 6,
    marginTop: 'auto',
  },
  compareBtn: {
    flex: 1,
    fontSize: 11,
    height: 28,
    padding: '0 10px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'all 0.12s ease',
  },
  selectBtn: {
    flex: 1,
    fontSize: 11,
    height: 28,
    padding: '0 10px',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'all 0.12s ease',
  },
};
