/**
 * catalog/cooling.ts — ORACLE Spatial asset catalog: COOLING
 */
import type { AssetCatalog } from '../schema';
import { TOKENS } from '../../tokens';
import { FOOTPRINT } from '../../grid';

export const COOLING: AssetCatalog = [
  {
    id: 'cooling.air_plant',
    category: 'cooling',
    label: 'Air Cooling Plant',
    dimensions: FOOTPRINT.cooling.liquidPlant,
    capacity: { pue: 1.5, kw_thermal: 50_000 },
    ports: [
      { id: 'supply', kind: 'cooling', dir: 'out', at: { x: 1, y: 0.3, z: 0 }, label: 'Cold air' },
      { id: 'return', kind: 'cooling', dir: 'in', at: { x: 1, y: 0.7, z: 0 }, label: 'Hot air' },
    ],
    render: { color: TOKENS.cooling.base, shape: 'plant', glyph: 'AIR' },
    metadata: { source: 'ORACLE cooling baseline' },
  },
  {
    id: 'cooling.liquid_plant',
    category: 'cooling',
    label: 'Liquid Cooling Plant',
    dimensions: FOOTPRINT.cooling.liquidPlant,
    capacity: { pue: 1.2, kw_thermal: 120_000 },
    ports: [
      { id: 'supply', kind: 'cooling', dir: 'out', at: { x: 1, y: 0.3, z: 0 }, label: 'Chilled supply' },
      { id: 'return', kind: 'cooling', dir: 'in', at: { x: 1, y: 0.7, z: 0 }, label: 'Warm return' },
    ],
    render: { color: TOKENS.cooling.strong, shape: 'plant', glyph: 'LIQUID' },
    metadata: { source: 'ORACLE cooling baseline', notes: 'Direct-to-chip + rear-door' },
  },
  {
    id: 'cooling.cdu',
    category: 'cooling',
    label: 'CDU Block',
    dimensions: FOOTPRINT.cooling.cdu,
    capacity: { kw_thermal: 2_000 },
    ports: [
      { id: 'primary', kind: 'cooling', dir: 'in', at: { x: 0, y: 0.5, z: 0 }, label: 'Facility loop' },
      { id: 'secondary', kind: 'cooling', dir: 'out', at: { x: 1, y: 0.5, z: 0 }, label: 'Rack loop' },
    ],
    render: { color: TOKENS.cooling.base, shape: 'block', glyph: 'CDU' },
    metadata: { source: 'ORACLE cooling baseline' },
  },
  {
    id: 'cooling.chiller',
    category: 'cooling',
    label: 'Chiller Block',
    dimensions: FOOTPRINT.cooling.chiller,
    capacity: { kw_thermal: 30_000 },
    ports: [
      { id: 'in', kind: 'cooling', dir: 'in', at: { x: 0, y: 0.5, z: 0 } },
      { id: 'out', kind: 'cooling', dir: 'out', at: { x: 1, y: 0.5, z: 0 } },
    ],
    render: { color: TOKENS.cooling.soft, shape: 'block', glyph: 'CHILL' },
    metadata: { source: 'ORACLE cooling baseline' },
  },
  {
    id: 'cooling.towers',
    category: 'cooling',
    label: 'Cooling Towers',
    dimensions: FOOTPRINT.cooling.tower,
    capacity: { kw_thermal: 40_000 },
    ports: [
      { id: 'hot-in', kind: 'cooling', dir: 'in', at: { x: 0.5, y: 0.5, z: 0 } },
      { id: 'cold-out', kind: 'cooling', dir: 'out', at: { x: 0.5, y: 0.5, z: 0 } },
    ],
    render: { color: TOKENS.cooling.base, shape: 'tower', glyph: 'CT' },
    metadata: { source: 'ORACLE cooling baseline', notes: 'Evaporative; rendered as cylinders' },
  },
];
