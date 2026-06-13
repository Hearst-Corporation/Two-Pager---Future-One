'use client';

import PropTypes from 'prop-types';
import { Card } from '@/components/hearst/ui';
import InfoHint from '@/components/hearst/InfoHint';
import { G } from '@/lib/cp-styles';

const ICONS = {
  powered_shell: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="9" y1="7" x2="9" y2="7.01" /><line x1="15" y1="7" x2="15" y2="7.01" />
      <line x1="9" y1="11" x2="9" y2="11.01" /><line x1="15" y1="11" x2="15" y2="11.01" />
      <path d="M13 21v-3h-2v3" />
    </>
  ),
  neocloud_gpu: (
    <>
      <path d="M7 14a3 3 0 0 1 .4-6A4.5 4.5 0 0 1 16 7.5a3.2 3.2 0 0 1 .3 6.4" />
      <rect x="8" y="14" width="8" height="6" rx="1" />
      <line x1="11" y1="14" x2="11" y2="20" /><line x1="13" y1="14" x2="13" y2="20" />
    </>
  ),
  hyperscaler_self_build: (
    <>
      <circle cx="7" cy="8" r="2.5" /><circle cx="17" cy="8" r="2.5" />
      <path d="M7 10.5V14a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-3.5" />
      <line x1="12" y1="14" x2="12" y2="21" />
    </>
  ),
  sovereign_ai: (
    <>
      <path d="M4 9l8-5 8 5" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="6" y1="9" x2="6" y2="18" /><line x1="10" y1="9" x2="10" y2="18" />
      <line x1="14" y1="9" x2="14" y2="18" /><line x1="18" y1="9" x2="18" y2="18" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
};

const FALLBACK_ICON = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
  </>
);

function ArchetypeIcon({ id, selected }) {
  return (
    <span style={{ ...S.iconBadge, ...(selected ? S.iconBadgeSelected : {}) }}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={S.iconSvg}
      >
        {ICONS[id] || FALLBACK_ICON}
      </svg>
    </span>
  );
}
ArchetypeIcon.propTypes = { id: PropTypes.string, selected: PropTypes.bool };

export default function ArchetypePicker({ archetypes = [], primaryId, onSelectPrimary }) {
  return (
    <div data-archetype-grid style={S.grid}>
      {archetypes.map((a) => {
        const isPrimary = primaryId === a.id;
        return (
          <div key={a.id} style={S.cardWrap}>
            <Card
              as="button"
              type="button"
              onClick={() => onSelectPrimary?.(a.id)}
              padding="none"
              hover
              aria-pressed={isPrimary}
              surface={2}
              style={{ ...S.card, ...(isPrimary ? G.selected : {}) }}
            >
              <ArchetypeIcon id={a.id} selected={isPrimary} />
              <span style={S.title}>{a.label}</span>
              <span style={S.desc}>{a.short}</span>
            </Card>
            {a.description && (
              <span style={S.hintSlot}>
                <InfoHint label={a.label} align="right" content={{ title: a.label, body: a.description }} />
              </span>
            )}
          </div>
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
    gap: '1px',
    background: 'var(--cp-border)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    overflow: 'hidden',
    minWidth: 0,
  },
  cardWrap: {
    position: 'relative',
    display: 'flex',
    minWidth: 0,
    background: 'var(--cp-surface-2)',
  },
  hintSlot: {
    position: 'absolute',
    top: 'var(--cp-space-1)',
    right: 'var(--cp-space-1)',
    zIndex: 'var(--cp-z-floating)',
    opacity: 0.55,
  },
  card: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-2) var(--cp-space-1)',
    textAlign: 'center',
    minHeight: 'var(--cp-tile-minh)',
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    transition: 'background var(--cp-dur-base) var(--cp-ease)',
  },
  iconBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--cp-control-md)',
    height: 'var(--cp-control-md)',
    borderRadius: 'var(--cp-radius-xs)',
    border: '1px solid var(--cp-border)',
    background: 'var(--cp-surface-1)',
    color: 'var(--cp-text-muted)',
    flexShrink: 0,
  },
  iconBadgeSelected: {
    borderColor: 'var(--cp-border-strong)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
  },
  iconSvg: {
    width: '16px',
    height: '16px',
    strokeWidth: '1.5px',
  },
  title: {
    fontSize: 'var(--cp-font-micro)',
    lineHeight: 'var(--cp-leading-snug)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-strong)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
    padding: '0 var(--cp-space-1)',
  },
  desc: {
    fontSize: 'var(--cp-font-nano)',
    lineHeight: 'var(--cp-leading-heading)',
    color: 'var(--cp-text-muted)',
    padding: '0 var(--cp-space-1)',
    maxWidth: '100%',
  },
};
