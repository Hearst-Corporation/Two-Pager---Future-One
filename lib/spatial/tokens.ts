/**
 * lib/spatial/tokens.ts — ORACLE Spatial Layer 0 (Tokens)
 * ------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for every color used by a spatial renderer.
 *
 * Hard rule (CLAUDE.md): no spatial renderer may contain a hex literal.
 * Every color originates here and resolves to a cockpit `var(--color-*)`
 * CSS variable. SVG `fill`/`stroke` attributes accept `var(--color-*)`
 * directly, so renderers pass these strings straight through.
 *
 * Each semantic color exposes BOTH:
 *   .var  → `var(--color-x)`  — use in SVG fill/stroke (resolves at paint)
 *   .hex  → canonical hex     — escape hatch ONLY for math (e.g. gradient
 *                               interpolation, opacity baking) where a CSS
 *                               variable cannot be computed. Renderers must
 *                               prefer .var.
 *
 * The .hex values are mirrored from app/globals.css :root. If a cockpit
 * variable changes, update it there; the .hex here is the documented mirror.
 */

export interface SpatialColor {
  /** `var(--color-*)` — pass directly to SVG fill / stroke. */
  readonly var: string;
  /** Canonical hex mirror of the cockpit variable (math escape hatch only). */
  readonly hex: string;
}

/**
 * Build a SpatialColor. The `.var` form embeds the canonical hex as a CSS
 * fallback — `var(--x, #hex)` — so the color is ALWAYS legible even where the
 * cockpit `--color-*` variables are not in scope (e.g. the (cockpit) route
 * group does not load globals.css :root). This makes every spatial diagram a
 * self-contained, theme-independent, PDF-safe institutional infographic:
 * if the app theme defines the variable it wins; otherwise the fixed light
 * institutional value applies. Without the fallback, unresolved var() collapses
 * to the SVG default (black), producing dark-on-dark output.
 */
const c = (cssVar: string, hex: string): SpatialColor => ({ var: `var(${cssVar}, ${hex})`, hex });

/**
 * Semantic spatial palette.
 *
 * Mapping rationale (audited from the 7 legacy renderers):
 *  - dataHall  ← bordeaux family (#7f1d1d / phase 1)   → --color-accent-*
 *  - power     ← steel/grey family (#374151 substations) → --color-gray-*
 *  - cooling   ← blue family (#1e40af / #1e3a5f pipes)  → --color-info
 *  - network   ← teal/green fiber (#065f46)             → --color-success
 *  - security  ← warm amber (#92400e gensets/alerts)    → --color-warning
 *  - sovereign ← violet (#7c3aed govcloud / national)   → --color-op-vantage
 */
export const TOKENS = {
  // ── Asset category accents ──────────────────────────────────────
  dataHall: {
    base: c('--color-accent-primary', '#9F1239'),
    strong: c('--color-accent-strong', '#BE123C'),
    soft: c('--color-accent-soft', '#E11D48'),
    /** legacy deep bordeaux used for phase-1 roofs */
    deep: c('--color-op-qia', '#8B1C1C'),
  },
  power: {
    base: c('--color-gray-700', '#3D4450'),
    strong: c('--color-gray-800', '#2A2F38'),
    soft: c('--color-gray-600', '#4B5363'),
    line: c('--color-gray-700', '#3D4450'),
  },
  cooling: {
    base: c('--color-info', '#2563EB'),
    strong: c('--color-op-cra', '#003087'),
    soft: c('--color-op-ntt', '#009FDB'),
    pipe: c('--color-info', '#2563EB'),
  },
  network: {
    base: c('--color-success', '#059669'),
    strong: c('--color-op-cbre', '#005B41'),
    soft: c('--color-op-nvidia', '#76B900'),
  },
  security: {
    base: c('--color-warning', '#D97706'),
    strong: c('--color-op-qai', '#9C5A1D'),
    soft: c('--color-op-coreweave', '#E05A1A'),
  },
  sovereign: {
    base: c('--color-op-vantage', '#6B3FA0'),
    strong: c('--color-op-mayer_brown', '#003B5C'),
    soft: c('--color-op-lambda', '#4F5BD5'),
  },

  // ── Phase coloring (deployment phasing across all renderers) ─────
  phase: {
    p1: c('--color-accent-primary', '#9F1239'),
    p2: c('--color-op-cra', '#003087'),
    p3: c('--color-success', '#059669'),
    expansion: c('--color-gray-500', '#5B616A'),
  },

  // ── Neutrals / chrome ───────────────────────────────────────────
  background: c('--color-bg-main', '#F5F5F6'),
  surface: c('--color-surface', '#FFFFFF'),
  surfaceAlt: c('--color-bg-secondary', '#ECECEE'),
  border: c('--color-border-medium', '#C9CDD2'),
  borderLight: c('--color-border-light', '#E4E6EA'),
  borderStrong: c('--color-border-strong', '#2A2F36'),

  // ── Typography fills ────────────────────────────────────────────
  text: c('--color-text-primary', '#1A1D24'),
  textSecondary: c('--color-text-secondary', '#3A4048'),
  textMuted: c('--color-text-muted', '#8A9099'),
  textInverse: c('--color-text-inverse', '#FFFFFF'),
  annotation: c('--color-gray-400', '#8A9099'),

  // ── Status (used by power/cooling flow + comparison boards) ──────
  success: c('--color-success', '#059669'),
  warning: c('--color-warning', '#D97706'),
  error: c('--color-error', '#DC2626'),
  info: c('--color-info', '#2563EB'),
} as const;

/**
 * Ordered phase palette — replaces the local PHASE_COLORS / ROOF_COLORS /
 * WALL_L / WALL_R arrays that were duplicated across renderers.
 * Index 0 = Phase 1, etc.
 */
export const PHASE_PALETTE: readonly SpatialColor[] = [
  TOKENS.phase.p1,
  TOKENS.phase.p2,
  TOKENS.phase.p3,
];

/**
 * Iso wall shading — the legacy renderer used distinct left/right/roof hues
 * per phase to fake lighting. We derive them from the same phase tokens so
 * there is exactly ONE source of phase color. `roof` is the base token;
 * `wallLeft` / `wallRight` carry an opacity hint for the renderer to apply.
 */
export interface IsoShade {
  readonly roof: SpatialColor;
  readonly wallLeft: SpatialColor;
  readonly wallRight: SpatialColor;
}

export const PHASE_ISO_SHADE: readonly IsoShade[] = PHASE_PALETTE.map((p) => ({
  roof: p,
  wallLeft: p,
  wallRight: p,
}));

/** Map a category id → its base accent color (for the asset registry). */
export type SpatialCategory =
  | 'data_hall'
  | 'power'
  | 'cooling'
  | 'network'
  | 'security'
  | 'sovereign';

export const CATEGORY_COLOR: Record<SpatialCategory, SpatialColor> = {
  data_hall: TOKENS.dataHall.base,
  power: TOKENS.power.base,
  cooling: TOKENS.cooling.base,
  network: TOKENS.network.base,
  security: TOKENS.security.base,
  sovereign: TOKENS.sovereign.base,
};
