/**
 * lib/spatial/assets/schema.ts — ORACLE Spatial Layer 1 (Asset Contract)
 * ------------------------------------------------------------------
 * An asset is DATA, not a React component. A single asset definition must
 * be reusable across the 2D floorplan, the isometric SVG, the future
 * Three.js renderer, PDF export, power-flow, cooling-flow and timeline.
 *
 * The contract below is what every catalog entry must satisfy. Renderers
 * read these definitions; they never hardcode an asset again.
 */
import type { Dimensions } from '../grid';
import type { SpatialCategory, SpatialColor } from '../tokens';

/** A connection point on an asset — the thing that makes COMPOSITION possible. */
export interface Port {
  /** stable local id, unique within the asset (e.g. 'pwr-in', 'cool-supply') */
  id: string;
  /** what flows through this port */
  kind: 'power' | 'cooling' | 'network' | 'data';
  /** flow direction relative to the asset */
  dir: 'in' | 'out' | 'bidi';
  /**
   * Normalized position on the asset footprint, 0..1 in each axis.
   * (0,0,0) = near-left-bottom corner; (1,1,1) = far-right-top.
   * The composer maps this onto absolute scene coords per renderer.
   */
  at: { x: number; y: number; z: number };
  label?: string;
}

/** Capacity envelope — optional, category-dependent. */
export interface Capacity {
  /** IT load in megawatts (data halls, power blocks) */
  mw?: number;
  /** Uptime tier (data halls / power) */
  tier?: 'I' | 'II' | 'III' | 'IV';
  /** Power usage effectiveness (cooling) */
  pue?: number;
  /** Thermal capacity in kW (cooling) */
  kw_thermal?: number;
  /** Fiber capacity / lit pairs (network) */
  fiber_pairs?: number;
}

/** Render hints. Renderers own the drawing; assets own the parameters. */
export interface RenderSpec {
  /** primary fill/accent (token, resolves to var(--color-*)) */
  color: SpatialColor;
  /**
   * shape archetype the renderers switch on. Keeps the asset declarative:
   * the asset says "I am a hall", the renderer decides how a hall looks in
   * 2D vs iso vs 3D.
   */
  shape: 'hall' | 'block' | 'tower' | 'zone' | 'node' | 'plant';
  /** optional path to a real GLB model for the future Three.js renderer */
  glb?: string;
  /** label shown on the asset in diagrams */
  glyph?: string;
}

export interface AssetMetadata {
  vendor?: string;
  capex_per_mw_usd?: number;
  /** provenance for institutional credibility */
  source?: string;
  /** free-form notes surfaced in tooltips / data rooms */
  notes?: string;
}

/** The canonical spatial asset. */
export interface SpatialAsset {
  /** stable id, e.g. 'hall.50mw' — NEVER reinvented */
  id: string;
  category: SpatialCategory;
  label: string;
  dimensions: Dimensions;
  capacity?: Capacity;
  ports: Port[];
  render: RenderSpec;
  metadata?: AssetMetadata;
}

/** A catalog file exports an array of these. */
export type AssetCatalog = readonly SpatialAsset[];
