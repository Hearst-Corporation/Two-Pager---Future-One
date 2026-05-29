/**
 * catalog/sovereign.ts — ORACLE Spatial asset catalog: SOVEREIGN ZONES
 */
import type { AssetCatalog } from '../schema';
import { TOKENS } from '../../tokens';
import { FOOTPRINT } from '../../grid';

export const SOVEREIGN: AssetCatalog = [
  {
    id: 'sov.security_zone',
    category: 'sovereign',
    label: 'Security Zone',
    dimensions: FOOTPRINT.sovereign.securityZone,
    ports: [
      { id: 'controlled', kind: 'data', dir: 'bidi', at: { x: 0.5, y: 0, z: 0 }, label: 'Controlled access' },
    ],
    render: { color: TOKENS.sovereign.base, shape: 'zone', glyph: 'SEC' },
    metadata: { source: 'ORACLE sovereign baseline', notes: 'Physical + logical perimeter' },
  },
  {
    id: 'sov.govcloud',
    category: 'sovereign',
    label: 'Government Cloud Zone',
    dimensions: FOOTPRINT.sovereign.govcloud,
    capacity: { mw: 40, tier: 'IV' },
    ports: [
      { id: 'pwr-in', kind: 'power', dir: 'in', at: { x: 0, y: 0.5, z: 0 } },
      { id: 'gov-net', kind: 'network', dir: 'bidi', at: { x: 0.5, y: 0, z: 0 }, label: 'Sovereign network' },
    ],
    render: { color: TOKENS.sovereign.strong, shape: 'hall', glyph: 'GOV' },
    metadata: { source: 'ORACLE sovereign baseline', notes: 'Air-gapped government workloads' },
  },
  {
    id: 'sov.research_zone',
    category: 'sovereign',
    label: 'AI Research Zone',
    dimensions: FOOTPRINT.sovereign.govcloud,
    capacity: { mw: 30, tier: 'III' },
    ports: [
      { id: 'pwr-in', kind: 'power', dir: 'in', at: { x: 0, y: 0.5, z: 0 } },
      { id: 'research-net', kind: 'network', dir: 'bidi', at: { x: 0.5, y: 0, z: 0 } },
    ],
    render: { color: TOKENS.sovereign.soft, shape: 'hall', glyph: 'R&D' },
    metadata: { source: 'ORACLE sovereign baseline' },
  },
  {
    id: 'sov.national_compute',
    category: 'sovereign',
    label: 'National Compute Zone',
    dimensions: FOOTPRINT.sovereign.govcloud,
    capacity: { mw: 80, tier: 'IV' },
    ports: [
      { id: 'pwr-in', kind: 'power', dir: 'in', at: { x: 0, y: 0.5, z: 0 } },
      { id: 'nat-net', kind: 'network', dir: 'bidi', at: { x: 0.5, y: 0, z: 0 }, label: 'National backbone' },
    ],
    render: { color: TOKENS.sovereign.base, shape: 'hall', glyph: 'NAT' },
    metadata: { source: 'ORACLE sovereign baseline', notes: 'Strategic national capacity' },
  },
];
