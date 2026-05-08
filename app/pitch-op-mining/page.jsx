import { Suspense } from 'react';
import OperatorDeck from '@/components/pitch-operator/shared/OperatorDeck';
import { OPERATOR_PILLARS } from '@/components/pitch-operator/shared/pillars';

export const metadata = {
  title: 'FUTUR ONE · Operator Proposal — Mining',
  description: 'Confidential operator proposal — Industrial dual-use compute platform',
};

export default function PitchOpMiningPage() {
  return (
    <Suspense fallback={null}>
      <OperatorDeck pillar={OPERATOR_PILLARS.mining} />
    </Suspense>
  );
}
