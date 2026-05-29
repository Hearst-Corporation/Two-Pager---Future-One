/**
 * catalog/power.ts — ORACLE Spatial asset catalog: POWER
 */
import type { AssetCatalog } from '../schema';
import { TOKENS } from '../../tokens';
import { FOOTPRINT } from '../../grid';

export const POWER: AssetCatalog = [
  {
    id: 'power.substation',
    category: 'power',
    label: '132kV Substation',
    dimensions: FOOTPRINT.power.substation,
    capacity: { mw: 150 },
    ports: [
      { id: 'grid-in', kind: 'power', dir: 'in', at: { x: 0, y: 0.5, z: 0 }, label: 'Grid 132kV' },
      { id: 'mv-out', kind: 'power', dir: 'out', at: { x: 1, y: 0.5, z: 0 }, label: 'MV distribution' },
    ],
    render: { color: TOKENS.power.base, shape: 'block', glyph: '132kV' },
    metadata: { source: 'ORACLE power baseline', notes: 'Primary grid intake' },
  },
  {
    id: 'power.transformer',
    category: 'power',
    label: 'Transformer Yard',
    dimensions: FOOTPRINT.power.transformer,
    capacity: { mw: 75 },
    ports: [
      { id: 'mv-in', kind: 'power', dir: 'in', at: { x: 0, y: 0.5, z: 0 } },
      { id: 'lv-out', kind: 'power', dir: 'out', at: { x: 1, y: 0.5, z: 0 } },
    ],
    render: { color: TOKENS.power.strong, shape: 'block', glyph: 'TX' },
    metadata: { source: 'ORACLE power baseline' },
  },
  {
    id: 'power.ups',
    category: 'power',
    label: 'UPS Block',
    dimensions: FOOTPRINT.power.ups,
    capacity: { mw: 25 },
    ports: [
      { id: 'lv-in', kind: 'power', dir: 'in', at: { x: 0, y: 0.5, z: 0 } },
      { id: 'load-out', kind: 'power', dir: 'out', at: { x: 1, y: 0.5, z: 0 }, label: 'Conditioned load' },
    ],
    render: { color: TOKENS.power.soft, shape: 'block', glyph: 'UPS' },
    metadata: { source: 'ORACLE power baseline', notes: 'N+1 redundancy' },
  },
  {
    id: 'power.battery',
    category: 'power',
    label: 'Battery Block (BESS)',
    dimensions: FOOTPRINT.power.ups,
    capacity: { mw: 20 },
    ports: [
      { id: 'dc-bidi', kind: 'power', dir: 'bidi', at: { x: 0.5, y: 0.5, z: 0 } },
    ],
    render: { color: TOKENS.power.soft, shape: 'block', glyph: 'BESS' },
    metadata: { source: 'ORACLE power baseline' },
  },
  {
    id: 'power.genset',
    category: 'power',
    label: 'Generator Block',
    dimensions: FOOTPRINT.power.genset,
    capacity: { mw: 30 },
    ports: [
      { id: 'standby-out', kind: 'power', dir: 'out', at: { x: 1, y: 0.5, z: 0 }, label: 'Standby feed' },
    ],
    render: { color: TOKENS.security.base, shape: 'block', glyph: 'GEN' },
    metadata: { source: 'ORACLE power baseline', notes: 'Diesel standby, 72h fuel' },
  },
];
