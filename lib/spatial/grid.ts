/**
 * lib/spatial/grid.ts — ORACLE Spatial Layer 0 (Geometry)
 * ------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for spatial dimensions and grid spacing.
 *
 * Hard rule: no renderer may define a geometry constant locally
 * (no more `const SCALE = 28` / `ORIGIN_X` / hall widths buried in JSX).
 *
 * Unit convention
 *   1 SPATIAL_UNIT == 1 metre (real-world).
 *   Renderers convert metres → SVG pixels via the per-view PX_PER_UNIT.
 *   This keeps asset dimensions physically meaningful and lets every
 *   renderer agree on scale without copy-pasting magic numbers.
 */

/** One spatial grid unit, in metres. */
export const SPATIAL_UNIT = 1;

/** Pixels per spatial unit, per view. Tuned from the legacy renderers. */
export const PX_PER_UNIT = {
  /** Top-down 2D floorplan. Legacy CampusFloorplan2D used a 600×400 frame. */
  plan2d: 1,
  /** Isometric SVG. Legacy Campus3DIsometric used SCALE = 28. */
  iso: 28,
} as const;

/** Standard SVG drawing frame shared by campus renderers. */
export const FRAME = {
  width: 600,
  height: 400,
} as const;

/** Isometric scene origin in SVG coords (was ORIGIN_X / ORIGIN_Y). */
export const ISO_ORIGIN = {
  x: 300,
  y: 260,
} as const;

/**
 * Campus layout spacing — all in spatial units (metres), proportional.
 * Replaces the per-renderer hardcoded offsets.
 */
export const SPACING = {
  /** Gap between adjacent data halls (was hallSpacing = 20 px in 2D). */
  hallAisle: 0.7,
  /** Inter-building setback for plant / power blocks. */
  buildingOffset: 1.0,
  /** Distance from hall row to cooling plant. */
  plantSpacing: 1.5,
  /** Reserved-land expansion zone clearance. */
  expansionSpacing: 2.0,
  /** Site boundary inset (px, 2D frame). */
  siteInset: 12,
} as const;

/**
 * Canonical building footprints, in spatial units (metres-ish, illustrative
 * but proportionally faithful to capacity). Used by the asset catalog so a
 * 50MW hall is visibly larger than a 10MW hall in EVERY renderer.
 */
export const FOOTPRINT = {
  hall: {
    w10: { w: 4, d: 4, h: 3.0 },
    w25: { w: 5, d: 5, h: 3.2 },
    w50: { w: 6, d: 5, h: 3.5 },
    gpu: { w: 6, d: 6, h: 3.8 },
    aiFactory: { w: 7, d: 6, h: 4.0 },
    edge: { w: 3, d: 3, h: 2.6 },
  },
  power: {
    substation: { w: 3, d: 3, h: 2.5 },
    transformer: { w: 2, d: 2, h: 1.8 },
    ups: { w: 2.5, d: 2, h: 2.2 },
    genset: { w: 3, d: 1.5, h: 2.0 },
  },
  cooling: {
    cdu: { w: 2, d: 2, h: 2.0 },
    liquidPlant: { w: 4, d: 3, h: 2.8 },
    chiller: { w: 3, d: 2, h: 2.4 },
    tower: { w: 1.3, d: 1.3, h: 2.5 }, // ⌀ ~ w; rendered as cylinder
  },
  network: {
    fiberEntry: { w: 1.5, d: 1.5, h: 1.5 },
    mmr: { w: 3, d: 2.5, h: 2.4 },
  },
  sovereign: {
    securityZone: { w: 8, d: 6, h: 0.2 }, // a zone footprint, not a building
    govcloud: { w: 6, d: 5, h: 3.5 },
  },
} as const;

export interface Dimensions {
  /** width along iso-x / plan-x, in spatial units */
  w: number;
  /** depth along iso-y / plan-y, in spatial units */
  d: number;
  /** height along iso-z, in spatial units */
  h: number;
}

/** Convert spatial units → SVG pixels for a given view. */
export function unitsToPx(units: number, view: keyof typeof PX_PER_UNIT): number {
  return units * PX_PER_UNIT[view];
}
