'use client';

import PropTypes from 'prop-types';
import HardwareMixer from '@/components/hearst/simulator/HardwareMixer';

export default function TechnologyStackStep({ totalMw, value, onChange, presetsOnly = false, detailOnly = false }) {
  const variant = presetsOnly ? 'presets' : detailOnly ? 'detail' : 'full';
  return (
    <div data-sim-tech>
      <HardwareMixer totalMw={totalMw} value={value} onChange={onChange} variant={variant} />
    </div>
  );
}

TechnologyStackStep.propTypes = {
  totalMw: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  presetsOnly: PropTypes.bool,
  detailOnly: PropTypes.bool,
};
