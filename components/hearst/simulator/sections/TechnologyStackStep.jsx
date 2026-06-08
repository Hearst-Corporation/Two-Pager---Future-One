'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Cpu } from 'lucide-react';
import { Card, SectionHead } from '@/components/hearst/ui';
import HardwareMixer from '@/components/hearst/simulator/HardwareMixer';
import { UI } from '@/lib/ui-strings';
import { S as CP } from '@/lib/cp-styles';

/**
 * TechnologyStackStep — SECTION 03: hardware allocation, COLLAPSED BY DEFAULT.
 * The user opts into hardware detail; it no longer dominates the page. Mixer state
 * lives in the page reducer (state.hardware_mix), so mount/unmount is lossless.
 * @param {{ totalMw: number, value: object, onChange: function }} props
 */
export default function TechnologyStackStep({ totalMw, value, onChange }) {
  const [open, setOpen] = useState(true);
  return (
    <Card as="section" data-sim-tech variant="flat" style={CP.sectionColumn} padding="lg">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="sim-tech-body"
        style={S.head}
      >
        <span style={S.titleGroup}>
          <span style={S.icon} aria-hidden="true"><Cpu size={18} strokeWidth={1.8} /></span>
          <SectionHead title={UI.SIM_HW_TITLE} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none', flex: '1 1 auto', minWidth: 0 }} />
        </span>
        <span aria-hidden="true" style={{ ...S.chevron, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div id="sim-tech-body">
          <HardwareMixer totalMw={totalMw} value={value} onChange={onChange} />
        </div>
      )}
    </Card>
  );
}

TechnologyStackStep.propTypes = {
  totalMw: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

const S = {
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    width: '100%',
    padding: 0,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'inherit',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    flex: '0 0 36px',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-md)',
  },
  chevron: {
    flexShrink: 0,
    fontSize: 'var(--cp-font-md)',
    color: 'var(--cp-text-muted)',
    transition: 'transform var(--cp-dur-base) var(--cp-ease)',
  },
};
