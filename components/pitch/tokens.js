/* ============================================================
   FUTUR ONE · PITCH DECK · DESIGN TOKENS
   ------------------------------------------------------------
   Single source of truth for typography, weights, letter-spacing
   and layout. Imported by both slides.jsx and Deck.jsx.

   Rule: NEVER hardcode fontSize, fontWeight, letterSpacing or
   spacing values in components. Always reference these tokens.
   ============================================================ */

/* ---------- Font stack ---------- */
export const FONT_STACK =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/* ---------- Color references ---------- */
export const ACCENT = 'var(--color-accent-strong)';
export const TEXT_PRIMARY = 'var(--color-text-primary)';
export const TEXT_DIM = 'var(--color-text-secondary)';
export const TEXT_FAINT = 'var(--color-text-muted)';
export const TEXT_INVERSE = 'var(--color-text-inverse)';
export const SURFACE = 'var(--color-surface)';
export const BG_MAIN = 'var(--color-bg-main)';
export const BORDER_LIGHT = 'var(--color-border-light)';
export const BORDER_MEDIUM = 'var(--color-border-medium)';

/* ---------- Typography sizes ----------
   Rule: use `min(<vh>, <px>)` to stay responsive but cap on big screens.
*/
export const T = {
  h1: 'min(18vh, 180px)',
  h2: 'min(5.5vh, 56px)',
  h2Closing: 'min(10vh, 96px)',
  h3: 'min(4.5vh, 42px)',
  lead: 'min(2.2vh, 20px)',
  /** Couverture pitch — entre body et lead */
  subtitle: 'min(2vh, 18px)',
  body: 'min(1.7vh, 15px)',
  caption: 'min(1.5vh, 13px)',
  eyebrow: 12,
  micro: 10,
  /* Numeric / KPI */
  statL: 'min(8vh, 72px)',
  statM: 'min(6vh, 56px)',
  statS: 'min(4vh, 38px)',
  statXS: 'min(3.5vh, 32px)',
};

/* ---------- Weights ---------- */
export const W = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
  black: 900,
};

/* ---------- Letter-spacing ---------- */
export const LS = {
  tightest: -3,
  tight: -2,
  snug: -1,
  hairline: -0.5,
  normal: 0,
  wide: 1,
  wider: 2,
  widest: 3,
  extraWide: 4,
  ultraWide: 5,
  display: -8, // cover title only
};

/* ---------- Layout ---------- */
export const L = {
  padX: '8vw',
  padY: '8vh',
  splitPadL: 'calc(56px + 6vh) 4vw 6vh 8vw',
  splitPadR: 'calc(56px + 6vh) 8vw 6vh 4vw',
  gapGrid: '4vh 2vw',
  marginSection: '5vh',
  marginEyebrow: 24,
  headerHeight: 56,
};

/* ---------- Gradients (overlays) ---------- */
export const G = {
  overlaySurface:
    'linear-gradient(270deg, var(--color-surface) 0%, transparent 20%)',
  overlaySurfaceReverse:
    'linear-gradient(90deg, var(--color-surface) 0%, transparent 20%)',
  overlayClosing:
    'linear-gradient(180deg, color-mix(in srgb, var(--color-bg-main) 90%, transparent) 0%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 50%, var(--color-bg-main) 100%)',
};
