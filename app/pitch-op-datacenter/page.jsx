import { Suspense } from 'react';
import OperatorDeck from '@/components/pitch-operator/shared/OperatorDeck';
import { OPERATOR_PILLARS } from '@/components/pitch-operator/shared/pillars';

export const metadata = {
  title: 'FUTUR ONE · Operator Proposal — Data Center',
  description: 'Confidential operator proposal — Tier IV sovereign hyperscale platform',
};

export default function PitchOpDatacenterPage() {
  return (
    <Suspense fallback={null}>
      <OperatorDeck pillar={OPERATOR_PILLARS.datacenter} />
    </Suspense>
  );
}
