'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, SectionHead, Button } from '@/components/hearst/ui';
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
  const [open, setOpen] = useState(false);
  return (
    <Card as="section" data-sim-tech variant="flat" style={CP.sectionColumn} padding="lg">
      <div style={S.head}>
        <SectionHead
          num="03"
          eyebrow={UI.SIM_HW_EYEBROW}
          title={UI.SIM_HW_TITLE}
          hint={UI.SIM_HW_HINT}
          style={{ marginBottom: 0, flex: '1 1 auto', minWidth: 0 }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="sim-tech-body"
          style={S.toggle}
        >
          {open ? UI.SIM_HW_HIDE : UI.SIM_HW_SHOW}
          <span aria-hidden="true" style={{ ...S.chevron, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </Button>
      </div>

      {open ? (
        <div id="sim-tech-body">
          <HardwareMixer totalMw={totalMw} value={value} onChange={onChange} />
        </div>
      ) : (
        <p style={S.collapsedNote}>{UI.SIM_HW_COLLAPSED_NOTE}</p>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  toggle: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
  },
  chevron: {
    fontSize: 'var(--cp-font-xs)',
    transition: 'transform var(--cp-dur-base) var(--cp-ease)',
  },
  collapsedNote: {
    margin: 0,
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    color: 'var(--cp-text-muted)',
  },
};
