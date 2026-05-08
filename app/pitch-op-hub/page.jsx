import { Suspense } from 'react';
import OperatorDeck from '@/components/pitch-operator/shared/OperatorDeck';
import { OPERATOR_PILLARS } from '@/components/pitch-operator/shared/pillars';

export const metadata = {
  title: 'FUTUR ONE · Operator Proposal — Hub',
  description: 'Confidential anchor proposal — Sovereign interconnect & AI-cloud hub',
};

export default function PitchOpHubPage() {
  return (
    <Suspense fallback={null}>
      <OperatorDeck pillar={OPERATOR_PILLARS.hub} />
    </Suspense>
  );
}
