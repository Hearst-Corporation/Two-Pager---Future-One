/**
 * lib/spatial/assets/manifest.ts — ORACLE 3D asset manifest
 * ------------------------------------------------------------------
 * The bridge between the abstract asset CATALOG (schema/registry) and real,
 * externally-produced 3D geometry (Gemini / Blender → GLB) living under
 * public/spatial-assets/3d/<category>/.
 *
 * GOVERNING RULE
 *   A 3D asset may only be rendered when its manifest entry has
 *   `approved === true` AND `status === 'approved'`. Anything else → the view
 *   shows a placeholder. This prevents unvetted/candidate geometry from ever
 *   reaching a stakeholder deck.
 *
 * Every entry here starts as `status: 'missing'` / `approved: false`. As the
 * Blender/Gemini pipeline delivers and we vet a GLB, flip status→'approved'
 * and approved→true and fill version/created_by/source_tool/license.
 */
import type { SpatialCategory } from '../tokens';
import type { Dimensions } from '../grid';
import type { SpatialViewKind } from '../placeholder-mode';
import { REQUIRED_ASSETS } from '../placeholder-mode';
import { ALL_ASSETS } from './registry';

export type AssetStatus = 'missing' | 'candidate' | 'approved' | 'deprecated';

export interface ManifestEntry {
  id: string;                 // matches a registry asset id, e.g. 'hall.50mw'
  category: SpatialCategory;
  label: string;
  /** path under /public — the served GLB once it exists */
  file_path: string;
  version: string;            // semver of the geometry, '0.0.0' = none yet
  dimensions: Dimensions;     // real-world metres (mirrors catalog footprint)
  scale: number;              // multiplier to bring GLB units → metres
  anchor_point: { x: number; y: number; z: number }; // origin within the model
  ports: string[];            // port ids carried over from the catalog asset
  approved: boolean;          // HARD gate — false until vetted
  created_by: string | null;  // author / operator who produced the asset
  source_tool: 'blender' | 'gemini' | 'manual' | null;
  license: string | null;
  notes: string;
  status: AssetStatus;
  last_validated_at: string | null; // ISO date when last vetted, else null
}

/** Base path where externally-produced GLB assets are served from. */
export const ASSET_3D_BASE = '/spatial-assets/3d';

const CATEGORY_DIR: Record<SpatialCategory, string> = {
  data_hall: 'data-halls',
  power: 'power',
  cooling: 'cooling',
  network: 'network',
  // 'security' is a token group; security zones live under sovereign in the
  // catalog, so no asset carries this category — mapped for type completeness.
  security: 'sovereign',
  sovereign: 'sovereign',
};

/**
 * The manifest is DERIVED from the catalog so the two never drift: every
 * catalog asset gets a manifest slot, defaulting to missing/unapproved with a
 * conventional file_path it WILL occupy once produced.
 */
export const MANIFEST: ManifestEntry[] = ALL_ASSETS.map((a) => ({
  id: a.id,
  category: a.category,
  label: a.label,
  file_path: `${ASSET_3D_BASE}/${CATEGORY_DIR[a.category]}/${a.id.replace(/\./g, '-')}.glb`,
  version: '0.0.0',
  dimensions: a.dimensions,
  scale: 1,
  anchor_point: { x: 0, y: 0, z: 0 },
  ports: a.ports.map((p) => p.id),
  approved: false,
  created_by: null,
  source_tool: null,
  license: null,
  notes: 'Awaiting externally-produced GLB (Gemini/Blender pipeline).',
  status: 'missing',
  last_validated_at: null,
}));

const BY_ID: ReadonlyMap<string, ManifestEntry> = new Map(MANIFEST.map((m) => [m.id, m]));

export function getManifestEntry(id: string): ManifestEntry | undefined {
  return BY_ID.get(id);
}

/** A single asset is renderable only if vetted + approved. */
export function isAssetApproved(id: string): boolean {
  const m = BY_ID.get(id);
  return !!m && m.approved === true && m.status === 'approved';
}

/**
 * A view may render its REAL renderer only if EVERY asset it requires is
 * approved. Otherwise the caller must show a placeholder. Views with no asset
 * requirements (regional/scenario/phasing) are data-driven, not geometry-
 * driven, so they are gated solely by VISUAL_PLACEHOLDER_MODE, not here.
 */
export function canRenderView(kind: SpatialViewKind): boolean {
  const required = REQUIRED_ASSETS[kind];
  if (required.length === 0) return false; // no approved-geometry path yet
  return required.every(isAssetApproved);
}

/** Manifest roll-up for dashboards / the placeholder metadata panel. */
export function manifestSummary() {
  const by: Record<AssetStatus, number> = { missing: 0, candidate: 0, approved: 0, deprecated: 0 };
  for (const m of MANIFEST) by[m.status] += 1;
  return { total: MANIFEST.length, ...by };
}

/** Per-view asset readiness, for the placeholder "assets required" panel. */
export function viewAssetStatus(kind: SpatialViewKind) {
  return REQUIRED_ASSETS[kind].map((id) => {
    const m = BY_ID.get(id);
    return {
      id,
      label: m?.label ?? id,
      status: m?.status ?? ('missing' as AssetStatus),
      approved: m?.approved ?? false,
      file_path: m?.file_path ?? null,
    };
  });
}
