import PillarDeck from '@/components/presentation/pitch-misa/shared/PillarDeck';
import { PILLARS } from '@/components/presentation/pitch-misa/shared/pillars';

export const metadata = {
  title: 'FUTUR ONE × MISA · Pillar I — Data Center',
  description: 'Tier IV sovereign hyperscale platform — operator stack for MISA',
};

export default function PitchDatacenterPage() {
  return <PillarDeck pillar={PILLARS.datacenter} />;
}
