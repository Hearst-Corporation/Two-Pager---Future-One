import PillarDeck from '@/components/pitch-misa/shared/PillarDeck';
import { PILLARS } from '@/components/pitch-misa/shared/pillars';

export const metadata = {
  title: 'FUTUR ONE × MISA · Pillar III — Hub',
  description: 'Interconnect & AI-cloud — operator stack for MISA',
};

export default function PitchHubPage() {
  return <PillarDeck pillar={PILLARS.hub} />;
}
