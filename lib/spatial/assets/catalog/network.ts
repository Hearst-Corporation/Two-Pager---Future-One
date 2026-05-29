/**
 * catalog/network.ts — ORACLE Spatial asset catalog: NETWORK
 */
import type { AssetCatalog } from '../schema';
import { TOKENS } from '../../tokens';
import { FOOTPRINT } from '../../grid';

export const NETWORK: AssetCatalog = [
  {
    id: 'network.fiber_entry',
    category: 'network',
    label: 'Fiber Entry / PoP',
    dimensions: FOOTPRINT.network.fiberEntry,
    capacity: { fiber_pairs: 288 },
    ports: [
      { id: 'carrier', kind: 'network', dir: 'in', at: { x: 0, y: 0.5, z: 0 }, label: 'Carrier dark fiber' },
      { id: 'campus', kind: 'network', dir: 'out', at: { x: 1, y: 0.5, z: 0 }, label: 'Campus backbone' },
    ],
    render: { color: TOKENS.network.base, shape: 'node', glyph: 'PoP' },
    metadata: { source: 'ORACLE network baseline', notes: 'Diverse dual-entry' },
  },
  {
    id: 'network.mmr',
    category: 'network',
    label: 'Meet-Me Room',
    dimensions: FOOTPRINT.network.mmr,
    capacity: { fiber_pairs: 864 },
    ports: [
      { id: 'north', kind: 'network', dir: 'bidi', at: { x: 0.5, y: 0, z: 0 } },
      { id: 'south', kind: 'network', dir: 'bidi', at: { x: 0.5, y: 1, z: 0 } },
    ],
    render: { color: TOKENS.network.strong, shape: 'block', glyph: 'MMR' },
    metadata: { source: 'ORACLE network baseline', notes: 'Carrier-neutral interconnect' },
  },
  {
    id: 'network.interconnect',
    category: 'network',
    label: 'Interconnect Hub',
    dimensions: FOOTPRINT.network.mmr,
    capacity: { fiber_pairs: 1_728 },
    ports: [
      { id: 'fabric', kind: 'network', dir: 'bidi', at: { x: 0.5, y: 0.5, z: 0 }, label: 'Cross-connect fabric' },
    ],
    render: { color: TOKENS.network.soft, shape: 'node', glyph: 'IX' },
    metadata: { source: 'ORACLE network baseline' },
  },
];
