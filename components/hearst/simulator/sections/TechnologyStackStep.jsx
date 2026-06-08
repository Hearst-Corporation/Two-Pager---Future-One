'use client';

import PropTypes from 'prop-types';
import HardwareMixer from '@/components/hearst/simulator/HardwareMixer';

export default function TechnologyStackStep({ totalMw, value, onChange }) {
  return (
    <div data-sim-tech>
      <HardwareMixer totalMw={totalMw} value={value} onChange={onChange} />
    </div>
  );
}

TechnologyStackStep.propTypes = {
  totalMw: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};
