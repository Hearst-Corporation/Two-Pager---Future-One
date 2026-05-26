/** Coerce a percentage input that might be ratio (0..1) or percent (0..100) to ratio (0..1).
 * Defensive against scenarios saved before the unit normalization (any value > 1 is treated as 0..100). */
export const asRatio = (v) => v == null ? 0 : v > 1 ? v / 100 : v;
