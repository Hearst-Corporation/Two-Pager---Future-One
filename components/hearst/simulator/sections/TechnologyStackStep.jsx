'use client';

import PropTypes from 'prop-types';
import { Card, SectionHead } from '@/components/hearst/ui';
import HardwareMixer from '@/components/hearst/simulator/HardwareMixer';
import { UI } from '@/lib/ui-strings';
import { S as CP } from '@/lib/cp-styles';

/**
 * TechnologyStackStep — section 03: hardware allocation mixer.
 * @param {{ totalMw: number, value: object, onChange: function }} props
 */
export default function TechnologyStackStep({ totalMw, value, onChange }) {
  return (
    <Card as="section" variant="flat" style={CP.sectionColumn} padding="lg">
      <SectionHead
        num="03"
        eyebrow={UI.SIM_HW_EYEBROW}
        title={UI.SIM_HW_TITLE}
        hint={UI.SIM_HW_HINT}
        style={{ marginBottom: 0 }}
      />
      <HardwareMixer
        totalMw={totalMw}
        value={value}
        onChange={onChange}
      />
    </Card>
  );
}

TechnologyStackStep.propTypes = {
  totalMw: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

