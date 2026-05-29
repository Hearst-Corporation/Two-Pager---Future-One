/**
 * lib/spatial/board.ts — ORACLE Spatial Layer 0 (Canvas discipline)
 * ------------------------------------------------------------------
 * Shared geometry discipline so every spatial diagram obeys the same
 * safe-area, title-band and auto-fit rules. This is what guarantees
 * "nothing renders outside the safe area" and "no clipping / no giant
 * empty space" across all 7 renderers — boardroom + PDF grade.
 *
 * Pure math only (no React, no hex). Renderers import these constants
 * and helpers instead of inventing their own margins.
 */

/** Universal inner margin (px, in viewBox units) — nothing draws past this. */
export const SAFE_MARGIN = 18;

/** Reserved band at the top of every diagram for title + subtitle. */
export const TITLE_BAND = 40;

/** Reserved band at the bottom for axis labels / legend strip when used. */
export const FOOT_BAND = 24;

/** Standard corner radius for the white "paper" board and inner cards. */
export const RADIUS = {
  board: 10,
  card: 8,
  chip: 6,
} as const;

/** Standard stroke weights — thin, institutional. */
export const STROKE = {
  hair: 0.75, // muted grid lines
  thin: 1,
  base: 1.5,
  bold: 2,
} as const;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The safe content rectangle inside a viewBox, after reserving the title
 * band (top) and an optional foot band (bottom).
 */
export function safeArea(
  frameW: number,
  frameH: number,
  opts: { title?: boolean; foot?: boolean; margin?: number } = {},
): Box {
  const m = opts.margin ?? SAFE_MARGIN;
  const top = m + (opts.title ? TITLE_BAND : 0);
  const bottom = m + (opts.foot ? FOOT_BAND : 0);
  return {
    x: m,
    y: top,
    w: frameW - m * 2,
    h: frameH - top - bottom,
  };
}

export interface FitTransform {
  /** uniform scale to apply to raw points */
  scale: number;
  /** translation after scaling, so the content is centered in the target box */
  tx: number;
  ty: number;
  /** apply the transform to a raw point */
  apply: (x: number, y: number) => { x: number; y: number };
}

/**
 * Compute a uniform scale + translation that fits a set of raw 2D points
 * (already projected, e.g. iso screen-space) into a target Box with no
 * clipping and centered. Solves Campus3D/Campus2D "clipped + blank space":
 * the scene auto-fits the safe area regardless of asset count.
 */
export function fitPointsTo(
  points: Array<{ x: number; y: number }>,
  target: Box,
  pad = 0,
): FitTransform {
  if (points.length === 0) {
    return { scale: 1, tx: 0, ty: 0, apply: (x, y) => ({ x, y }) };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const contentW = Math.max(maxX - minX, 1e-6);
  const contentH = Math.max(maxY - minY, 1e-6);
  const availW = target.w - pad * 2;
  const availH = target.h - pad * 2;
  const scale = Math.min(availW / contentW, availH / contentH);
  // center the scaled content in the target box
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const tx = target.x + pad + (availW - scaledW) / 2 - minX * scale;
  const ty = target.y + pad + (availH - scaledH) / 2 - minY * scale;
  return {
    scale,
    tx,
    ty,
    apply: (x, y) => ({ x: x * scale + tx, y: y * scale + ty }),
  };
}

/**
 * Greedy 1-D label de-collision along the Y axis: given desired y positions
 * (sorted by priority), nudge them apart so each is at least `minGap` from
 * its neighbour, staying within [yMin, yMax]. Returns adjusted y per input
 * index. Used by Regional/Scenario to stop labels stacking.
 */
export function deCollideY(
  desired: number[],
  minGap: number,
  yMin: number,
  yMax: number,
): number[] {
  const order = desired.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  let last = -Infinity;
  const out = new Array(desired.length);
  for (const { y, i } of order) {
    let ny = Math.max(y, last + minGap);
    ny = Math.min(Math.max(ny, yMin), yMax);
    out[i] = ny;
    last = ny;
  }
  return out;
}
