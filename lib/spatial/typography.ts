/**
 * lib/spatial/typography.ts — ORACLE Spatial Layer 0 (Typography)
 * ------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for SVG text sizing/weight in spatial renderers.
 *
 * The legacy renderers scattered fontSize values (5.5, 6.5, 7, 7.5, 8, 8.5,
 * 9, 10, 11, 12, 15). This collapses them into a named scale so every
 * diagram speaks with one typographic voice.
 *
 * Font family is fixed to the cockpit stack.
 */

export const FONT_FAMILY = 'Inter, system-ui, sans-serif';

/** Named font-size scale (px, in the 600×400 SVG frame). */
export const FONT_SIZE = {
  /** compass ticks, micro-annotations (was 5.5–6.5) */
  micro: 6,
  /** legend rows, sub-labels (was 7–7.5) */
  caption: 7.5,
  /** standard asset labels (was 8–8.5) */
  label: 8.5,
  /** emphasized labels, badges (was 9–10) */
  emphasis: 10,
  /** section headers (was 11) */
  heading: 11,
  /** hero metrics — MW load (was 12–15) */
  metric: 14,
} as const;

/** Named font weights. */
export const FONT_WEIGHT = {
  regular: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
} as const;

/** Letter-spacing presets for uppercase eyebrow labels. */
export const LETTER_SPACING = {
  tight: '-0.3px',
  normal: '0',
  eyebrow: '1px',
  wide: '2px',
} as const;

export type FontSize = keyof typeof FONT_SIZE;
export type FontWeight = keyof typeof FONT_WEIGHT;

/** Convenience: full text style object for an SVG <text> element. */
export function textStyle(size: FontSize = 'label', weight: FontWeight = 'semibold') {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE[size],
    fontWeight: FONT_WEIGHT[weight],
  };
}
