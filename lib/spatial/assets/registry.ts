/**
 * lib/spatial/assets/registry.ts — ORACLE Spatial Layer 1 (Registry)
 * ------------------------------------------------------------------
 * The single lookup surface over the whole asset catalog. Renderers and
 * the future composer resolve assets by id or by category from here.
 * They never import a catalog file directly.
 */
import type { SpatialAsset } from './schema';
import type { SpatialCategory } from '../tokens';
import { DATA_HALLS } from './catalog/data-halls';
import { POWER } from './catalog/power';
import { COOLING } from './catalog/cooling';
import { NETWORK } from './catalog/network';
import { SOVEREIGN } from './catalog/sovereign';

/** Flat catalog, all categories. */
export const ALL_ASSETS: readonly SpatialAsset[] = [
  ...DATA_HALLS,
  ...POWER,
  ...COOLING,
  ...NETWORK,
  ...SOVEREIGN,
];

/** id → asset, for O(1) resolution. */
const BY_ID: ReadonlyMap<string, SpatialAsset> = new Map(
  ALL_ASSETS.map((a) => [a.id, a]),
);

/** Resolve an asset by its stable id (e.g. 'hall.50mw'). */
export function getAsset(id: string): SpatialAsset | undefined {
  return BY_ID.get(id);
}

/** Resolve or throw — for code paths that require the asset to exist. */
export function requireAsset(id: string): SpatialAsset {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`[spatial] unknown asset id: ${id}`);
  return a;
}

/** All assets in a category. */
export function assetsByCategory(category: SpatialCategory): SpatialAsset[] {
  return ALL_ASSETS.filter((a) => a.category === category);
}

/** Every known asset id. */
export function listAssetIds(): string[] {
  return ALL_ASSETS.map((a) => a.id);
}

/** Catalog size, grouped by category — for diagnostics / catalog viewer. */
export function catalogStats(): Record<SpatialCategory, number> {
  return ALL_ASSETS.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<SpatialCategory, number>,
  );
}
