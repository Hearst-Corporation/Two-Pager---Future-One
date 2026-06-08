'use client';

import PropTypes from 'prop-types';
import { Card, SectionHead } from '@/components/hearst/ui';
import ArchetypePicker from '@/components/hearst/simulator/ArchetypePicker';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { UI } from '@/lib/ui-strings';
import { S as CP } from '@/lib/cp-styles';

// The 4 operating models the real market actually runs at scale. These ARE the
// investment thesis types (Big Tech / Standard DC / Government AI / GPU Rental).
const PRIMARY_MODEL_IDS = ['powered_shell', 'neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai'];
const PRIMARY_ARCHETYPES = DEAL_ARCHETYPES.filter(a => PRIMARY_MODEL_IDS.includes(a.id));

/**
 * InvestmentThesisStep — SECTION 01, the HERO. Promotes the operating-model
 * archetype to the primary entry point: "choose the type of investment". This is
 * the single dominant decision the page leads with. Same picker, same data, same
 * onSelectPrimary handler as before — only the framing and position changed.
 * @param {{ primaryId: string, onSelectPrimary: function }} props
 */
export default function InvestmentThesisStep({ primaryId, onSelectPrimary }) {
  return (
    <Card as="section" data-sim-thesis variant="flat" style={CP.sectionColumn} padding="lg">
      <SectionHead title={UI.SIM_THESIS_TITLE} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }} />
      <ArchetypePicker
        archetypes={PRIMARY_ARCHETYPES}
        primaryId={primaryId}
        onSelectPrimary={onSelectPrimary}
      />
    </Card>
  );
}

InvestmentThesisStep.propTypes = {
  primaryId: PropTypes.string,
  onSelectPrimary: PropTypes.func.isRequired,
};
