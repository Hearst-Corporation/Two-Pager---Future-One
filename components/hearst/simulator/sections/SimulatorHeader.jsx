'use client';

import PropTypes from 'prop-types';
import { Card, SectionHead } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

/**
 * SimulatorHeader — hero card at the top of the simulator page.
 * Shows the Oracle branding + a "Calculating…" badge while loading.
 * @param {{ loading: boolean }} props
 */
export default function SimulatorHeader({ loading }) {
  return (
    <Card as="header" variant="flat" padding="md" style={S.header}>
      <SectionHead
        hero
        eyebrow={UI.SIM_PAGE_EYEBROW}
        title={UI.SIM_PAGE_TITLE}
        style={{ flex: '1 1 320px', minWidth: 0, marginBottom: 0 }}
      />
      {loading && <div style={S.loadingBadge}>{UI.STATE_CALCULATING}</div>}
    </Card>
  );
}

SimulatorHeader.propTypes = {
  loading: PropTypes.bool,
};

const S = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  loadingBadge: {
    fontSize: 'var(--cp-font-sm)',
    padding: 'var(--cp-space-2) var(--cp-space-4)',
    background: 'var(--cp-accent-soft)',
    color: 'var(--cp-text-strong)',
    borderRadius: 'var(--cp-radius-md)',
    fontWeight: 'var(--cp-weight-semibold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
};
