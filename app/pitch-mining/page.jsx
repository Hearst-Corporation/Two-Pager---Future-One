import PillarDeck from '@/components/pitch-misa/shared/PillarDeck';
import { PILLARS } from '@/components/pitch-misa/shared/pillars';

export const metadata = {
  title: 'FUTUR ONE × MISA · Pillar II — Mining',
  description: 'Industrial-scale dual-use compute — operator stack for MISA',
};

export default function PitchMiningPage() {
  return <PillarDeck pillar={PILLARS.mining} />;
}
