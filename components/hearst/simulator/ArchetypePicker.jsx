'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import { T, L } from '@/lib/cp-styles';

// One glyph per operating model. Simple line icons on currentColor — neutral
// selection (no accent tint). Keyed by archetype id; falls back to a
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
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={S.iconSvg}
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
    <div data-archetype-grid style={L.grid2Min}>
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
            aria-pressed={isPrimary}
            surface={isPrimary ? 3 : 2}
            style={{ ...S.card, ...(isPrimary ? S.cardSelected : {}) }}
          >
            <div style={{ ...S.icon, color: isPrimary ? 'var(--cp-text-primary)' : 'var(--cp-text-muted)' }}>
              <ArchetypeIcon id={a.id} />
            </div>
            <span style={S.title}>{a.label}</span>
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
  card: {
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr',
    gap: 'var(--cp-space-1)',
    textAlign: 'left',
    minHeight: 'var(--cp-archetype-card-min-height)',
  },
  cardSelected: {
    borderColor: 'var(--cp-border-strong)',
    boxShadow: 'inset 3px 0 0 var(--cp-text-muted)',
  },
  icon: {
    display: 'flex',
    transition: 'color var(--cp-dur-base) var(--cp-ease)',
  },
  iconSvg: {
    width: 'var(--cp-icon-lg)',
    height: 'var(--cp-icon-lg)',
    strokeWidth: 'var(--cp-icon-stroke)',
  },
  title: {
    ...T.cardTitle,
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    minWidth: 0,
  },
  desc: {
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-muted)',
  },
};
