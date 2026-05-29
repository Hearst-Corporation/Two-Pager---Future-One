/**
 * catalog/data-halls.ts — ORACLE Spatial asset catalog: DATA HALLS
 */
import type { AssetCatalog } from '../schema';
import { TOKENS } from '../../tokens';
import { FOOTPRINT } from '../../grid';

/** Standard port set for an IT hall: power in, cooling supply+return, fiber. */
const hallPorts = [
  { id: 'pwr-in', kind: 'power' as const, dir: 'in' as const, at: { x: 0, y: 0.5, z: 0 }, label: 'Power feed' },
  { id: 'cool-supply', kind: 'cooling' as const, dir: 'in' as const, at: { x: 1, y: 0.3, z: 0 }, label: 'Chilled supply' },
  { id: 'cool-return', kind: 'cooling' as const, dir: 'out' as const, at: { x: 1, y: 0.7, z: 0 }, label: 'Warm return' },
  { id: 'fiber', kind: 'network' as const, dir: 'bidi' as const, at: { x: 0, y: 1, z: 0 }, label: 'Fiber' },
];

export const DATA_HALLS: AssetCatalog = [
  {
    id: 'hall.10mw',
    category: 'data_hall',
    label: '10MW Hall',
    dimensions: FOOTPRINT.hall.w10,
    capacity: { mw: 10, tier: 'III' },
    ports: hallPorts,
    render: { color: TOKENS.dataHall.base, shape: 'hall', glyph: '10MW' },
    metadata: { capex_per_mw_usd: 8_500_000, source: 'ORACLE baseline' },
  },
  {
    id: 'hall.25mw',
    category: 'data_hall',
    label: '25MW Hall',
    dimensions: FOOTPRINT.hall.w25,
    capacity: { mw: 25, tier: 'III' },
    ports: hallPorts,
    render: { color: TOKENS.dataHall.base, shape: 'hall', glyph: '25MW' },
    metadata: { capex_per_mw_usd: 8_000_000, source: 'ORACLE baseline' },
  },
  {
    id: 'hall.50mw',
    category: 'data_hall',
    label: '50MW Hall',
    dimensions: FOOTPRINT.hall.w50,
    capacity: { mw: 50, tier: 'III' },
    ports: hallPorts,
    render: { color: TOKENS.dataHall.base, shape: 'hall', glyph: '50MW' },
    metadata: { capex_per_mw_usd: 7_400_000, source: 'ORACLE baseline' },
  },
  {
    id: 'hall.gpu',
    category: 'data_hall',
    label: 'GPU Hall',
    dimensions: FOOTPRINT.hall.gpu,
    capacity: { mw: 60, tier: 'III', pue: 1.25 },
    ports: hallPorts,
    render: { color: TOKENS.dataHall.strong, shape: 'hall', glyph: 'GPU' },
    metadata: { vendor: 'NVIDIA reference', capex_per_mw_usd: 11_000_000, source: 'ORACLE GPU densification' },
  },
  {
    id: 'hall.ai_factory',
    category: 'data_hall',
    label: 'AI Factory Hall',
    dimensions: FOOTPRINT.hall.aiFactory,
    capacity: { mw: 100, tier: 'IV', pue: 1.2 },
    ports: hallPorts,
    render: { color: TOKENS.dataHall.deep, shape: 'hall', glyph: 'AI' },
    metadata: { vendor: 'NVIDIA DGX SuperPOD', capex_per_mw_usd: 12_500_000, source: 'ORACLE AI factory archetype' },
  },
  {
    id: 'hall.edge',
    category: 'data_hall',
    label: 'Edge Hall',
    dimensions: FOOTPRINT.hall.edge,
    capacity: { mw: 5, tier: 'II' },
    ports: hallPorts,
    render: { color: TOKENS.dataHall.soft, shape: 'hall', glyph: 'EDGE' },
    metadata: { capex_per_mw_usd: 9_000_000, source: 'ORACLE edge archetype' },
  },
];
