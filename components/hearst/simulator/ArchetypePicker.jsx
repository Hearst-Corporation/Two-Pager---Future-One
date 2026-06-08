'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// One glyph per operating model. Simple line icons on currentColor so they inherit
// the accent when the card is selected. Keyed by archetype id; falls back to a
// neutral node icon for any model without a bespoke glyph.
const ICONS = {
  // Shell + Long Lease — a powered building shell.
  powered_shell: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="9" y1="7" x2="9" y2="7.01" /><line x1="15" y1="7" x2="15" y2="7.01" />
      <line x1="9" y1="11" x2="9" y2="11.01" /><line x1="15" y1="11" x2="15" y2="11.01" />
      <line x1="9" y1="15" x2="9" y2="15.01" /><line x1="15" y1="15" x2="15" y2="15.01" />
      <path d="M13 21v-3h-2v3" />
    </>
  ),
  // GPU Rental Cloud — a cloud over a chip.
  neocloud_gpu: (
    <>
      <path d="M7 14a3 3 0 0 1 .4-6A4.5 4.5 0 0 1 16 7.5a3.2 3.2 0 0 1 .3 6.4" />
      <rect x="8" y="14" width="8" height="6" rx="1" />
      <line x1="11" y1="14" x2="11" y2="20" /><line x1="13" y1="14" x2="13" y2="20" />
    </>
  ),
  // Tech Giant Partnership (Minority Stake) — a handshake / two linked nodes.
  hyperscaler_self_build: (
    <>
      <circle cx="7" cy="8" r="2.5" /><circle cx="17" cy="8" r="2.5" />
      <path d="M7 10.5V14a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-3.5" />
      <line x1="12" y1="14" x2="12" y2="21" />
    </>
  ),
  // Government AI Cluster — a civic / sovereign building.
  sovereign_ai: (
    <>
      <path d="M4 9l8-5 8 5" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="6" y1="9" x2="6" y2="18" /><line x1="10" y1="9" x2="10" y2="18" />
      <line x1="14" y1="9" x2="14" y2="18" /><line x1="18" y1="9" x2="18" y2="18" />
      <line x1="3" y1="18" x2="21" y2="18" /><line x1="3" y1="21" x2="21" y2="21" />
    </>
  ),
};

const FALLBACK_ICON = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
  </>
);

function ArchetypeIcon({ id }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {ICONS[id] || FALLBACK_ICON}
    </svg>
  );
}
ArchetypeIcon.propTypes = { id: PropTypes.string };

/**
 * ArchetypePicker — 2×2 grid of operating-model cards. Each card is intentionally
 * minimal: one icon, the model name, and a single plain-language sentence. No
 * market-proof footer — the thesis choice reads at a glance. Single-select.
 */
export default function ArchetypePicker({ archetypes = [], primaryId, onSelectPrimary }) {
  return (
    <div data-archetype-grid style={S.grid}>
      {archetypes.map((a) => {
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
            aria-pressed={isPrimary}
            surface={2}
            style={S.card}
          >
            <div style={{ ...S.icon, color: isPrimary ? 'var(--cp-accent-maroon)' : 'var(--cp-text-muted)' }}>
              <ArchetypeIcon id={a.id} />
            </div>
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
    gridTemplateRows: 'auto auto 1fr',
    gap: 'var(--cp-space-2)',
    textAlign: 'left',
    minHeight: 124,
  },
  icon: {
    display: 'flex',
    transition: 'color var(--cp-dur-base) var(--cp-ease)',
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
};
