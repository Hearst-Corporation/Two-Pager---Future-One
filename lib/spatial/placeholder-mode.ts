/**
 * lib/spatial/placeholder-mode.ts — ORACLE Spatial visual gate
 * ------------------------------------------------------------------
 * Until APPROVED, production-grade spatial assets exist, ORACLE must show
 * clean institutional placeholders — never half-baked / clipped / fake-3D
 * visuals. This module is the single switch that enforces that policy.
 *
 *   VISUAL_PLACEHOLDER_MODE === true  (DEFAULT)
 *     → every spatial view renders <SpatialPlaceholder>.
 *
 *   VISUAL_PLACEHOLDER_MODE === false
 *     → a view may render a REAL renderer, but ONLY for the assets it needs
 *       that are marked approved:true in the manifest. Any unapproved asset
 *       still falls back to a placeholder (see manifest.canRenderView).
 *
 * Set NEXT_PUBLIC_VISUAL_PLACEHOLDER_MODE=false in the environment to begin
 * wiring approved renderers. Anything other than the literal string "false"
 * keeps placeholder mode ON (fail-safe default).
 */
export const VISUAL_PLACEHOLDER_MODE: boolean =
  process.env.NEXT_PUBLIC_VISUAL_PLACEHOLDER_MODE !== 'false';

/** The 7 institutional spatial view kinds ORACLE exposes. */
export type SpatialViewKind =
  | 'campus2d'
  | 'campus3d'
  | 'powerflow'
  | 'coolingflow'
  | 'regional'
  | 'scenario'
  | 'phasing';

/**
 * Uniform placeholder frame. Every placeholder renders at the SAME aspect
 * ratio so the 7 views are visually consistent and identically sized in any
 * responsive container (no half-height / mismatched cards). The eventual
 * real renderers may adopt their own aspect ratios; the placeholder does not.
 */
export const PLACEHOLDER_FRAME = { w: 760, h: 440 } as const;

/** Human title + intended aspect hint per view kind (placeholder uses PLACEHOLDER_FRAME). */
export const VIEW_META: Record<
  SpatialViewKind,
  { title: string; subtitle: string; frame: { w: number; h: number }; needs3D: boolean }
> = {
  campus2d:    { title: 'Campus 2D Floorplan',     subtitle: 'Top-down site composition',        frame: PLACEHOLDER_FRAME, needs3D: false },
  campus3d:    { title: 'Campus 3D Isometric',      subtitle: 'Massing from approved 3D assets',   frame: PLACEHOLDER_FRAME, needs3D: true  },
  powerflow:   { title: 'Power Flow',               subtitle: 'Grid → substation → UPS → halls',   frame: PLACEHOLDER_FRAME, needs3D: false },
  coolingflow: { title: 'Cooling Flow',             subtitle: 'Supply / return thermal loops',     frame: PLACEHOLDER_FRAME, needs3D: false },
  regional:    { title: 'GCC Regional Strategy',    subtitle: 'Sovereign footprint, schematic',    frame: PLACEHOLDER_FRAME, needs3D: false },
  scenario:    { title: 'Scenario Comparison',      subtitle: 'Side-by-side investment metrics',   frame: PLACEHOLDER_FRAME, needs3D: false },
  phasing:     { title: 'Deployment Phasing',       subtitle: 'Phase timeline & COD milestones',   frame: PLACEHOLDER_FRAME, needs3D: false },
};

/**
 * Which catalog asset ids each view composes. Drives the placeholder's
 * "assets required" panel and the approval gate. Asset ids are the stable
 * registry ids (see lib/spatial/assets/registry.ts).
 */
export const REQUIRED_ASSETS: Record<SpatialViewKind, string[]> = {
  campus2d:    ['hall.50mw', 'power.substation', 'cooling.liquid_plant', 'network.fiber_entry'],
  campus3d:    ['hall.50mw', 'hall.ai_factory', 'power.substation', 'cooling.towers'],
  powerflow:   ['power.substation', 'power.transformer', 'power.ups'],
  coolingflow: ['cooling.liquid_plant', 'cooling.cdu', 'cooling.towers'],
  regional:    [],
  scenario:    [],
  phasing:     [],
};
