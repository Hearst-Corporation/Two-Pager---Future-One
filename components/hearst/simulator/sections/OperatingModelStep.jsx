'use client';

import PropTypes from 'prop-types';
import { Card, SectionHead } from '@/components/hearst/ui';
import ArchetypePicker from '@/components/hearst/simulator/ArchetypePicker';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { UI } from '@/lib/ui-strings';
import { S as CP } from '@/lib/cp-styles';

// The 4 operating models the real market actually runs at scale.
const PRIMARY_MODEL_IDS = ['powered_shell', 'neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai'];
const PRIMARY_ARCHETYPES = DEAL_ARCHETYPES.filter(a => PRIMARY_MODEL_IDS.includes(a.id));

/**
 * OperatingModelStep — section 02: operating model archetype picker.
 * @param {{ primaryId: string, onSelectPrimary: function }} props
 */
export default function OperatingModelStep({ primaryId, onSelectPrimary }) {
  return (
    <Card as="section" variant="flat" style={CP.sectionColumn} padding="lg">
      <SectionHead
        num="02"
        eyebrow={UI.SIM_OS_EYEBROW}
        title={UI.SIM_OS_TITLE}
        hint={UI.SIM_OS_HINT}
        style={{ marginBottom: 0 }}
      />
      <ArchetypePicker
        archetypes={PRIMARY_ARCHETYPES}
        primaryId={primaryId}
        onSelectPrimary={onSelectPrimary}
      />
    </Card>
  );
}

OperatingModelStep.propTypes = {
  primaryId: PropTypes.string,
  onSelectPrimary: PropTypes.func.isRequired,
};

