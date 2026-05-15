/* eslint-disable */
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

/** Accent fills / strokes — dérivés de `--color-accent-strong` (pas de RGBA figé) */
export const ACCENT_BG_15 = 'color-mix(in srgb, var(--color-accent-strong) 15%, transparent)';
export const ACCENT_BG_20 = 'color-mix(in srgb, var(--color-accent-strong) 20%, transparent)';
export const ACCENT_BG_05 = 'color-mix(in srgb, var(--color-accent-strong) 5%, transparent)';
export const ACCENT_BORDER_1PX_40 =
  '1px solid color-mix(in srgb, var(--color-accent-strong) 40%, transparent)';
export const ACCENT_GLOW_30 =
  '0 0 30px color-mix(in srgb, var(--color-accent-strong) 30%, transparent)';
export const ACCENT_NODE_SHADOW =
  '0 0 100px color-mix(in srgb, var(--color-accent-strong) 60%, transparent), inset 0 0 50px color-mix(in srgb, var(--color-accent-strong) 40%, transparent)';

/** Texte inverse sur photo / panneau sombre */
export const INVERSE_85 = 'color-mix(in srgb, var(--color-text-inverse) 85%, transparent)';
export const INVERSE_75 = 'color-mix(in srgb, var(--color-text-inverse) 75%, transparent)';
export const INVERSE_70 = 'color-mix(in srgb, var(--color-text-inverse) 70%, transparent)';
export const INVERSE_65 = 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)';
export const INVERSE_60 = 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)';
export const INVERSE_55 = 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)';
export const INVERSE_50 = 'color-mix(in srgb, var(--color-text-inverse) 50%, transparent)';
export const INVERSE_40 = 'color-mix(in srgb, var(--color-text-inverse) 40%, transparent)';
export const INVERSE_20 = 'color-mix(in srgb, var(--color-text-inverse) 20%, transparent)';
export const INVERSE_15 = 'color-mix(in srgb, var(--color-text-inverse) 15%, transparent)';

export const BORDER_INVERSE_8 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 8%, transparent)';
export const BORDER_INVERSE_10 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 10%, transparent)';
export const BORDER_INVERSE_12 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 12%, transparent)';
export const BORDER_INVERSE_15 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 15%, transparent)';
export const BORDER_INVERSE_18 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 18%, transparent)';
export const BORDER_INVERSE_20 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 20%, transparent)';

export const BORDER_INVERSE_6 =
  '1px solid color-mix(in srgb, var(--color-text-inverse) 6%, transparent)';

/** Panneaux type « glass » sur images */
export const GLASS_ON_PHOTO_BG =
  'color-mix(in srgb, var(--color-text-inverse) 3%, transparent)';
export const GLASS_ON_PHOTO_BORDER = BORDER_INVERSE_6;

/** Gris quasi-opaque sur nœuds masterplan */
export const PANEL_DARK_95 =
  'color-mix(in srgb, var(--color-gray-900) 95%, transparent)';
export const PANEL_DARK_85 =
  'color-mix(in srgb, var(--color-gray-900) 85%, transparent)';

export const SHADOW_ELEV_30 =
  '0 10px 30px color-mix(in srgb, var(--color-gray-900) 30%, transparent)';
export const SHADOW_ELEV_40 =
  '0 15px 30px color-mix(in srgb, var(--color-gray-900) 40%, transparent)';
export const SHADOW_ELEV_50 =
  '0 20px 40px color-mix(in srgb, var(--color-gray-900) 50%, transparent)';
export const SHADOW_ELEV_60 =
  '0 25px 50px color-mix(in srgb, var(--color-gray-900) 60%, transparent)';
/** Ombre sous pastilles / icônes sur image */
export const SHADOW_ICON =
  '0 10px 20px color-mix(in srgb, var(--color-gray-900) 50%, transparent)';

/** Ombres légères (cartes sur fond clair) */
export const SHADOW_FLOAT_08 =
  '0 20px 40px color-mix(in srgb, var(--color-gray-900) 8%, transparent)';
export const SHADOW_FLOAT_06 =
  '0 25px 50px color-mix(in srgb, var(--color-gray-900) 6%, transparent)';
export const SHADOW_FLOAT_04 =
  '0 15px 30px color-mix(in srgb, var(--color-gray-900) 4%, transparent)';
export const SHADOW_FLOAT_03 =
  '0 10px 30px color-mix(in srgb, var(--color-gray-900) 3%, transparent)';
export const SHADOW_FLOAT_02 =
  '0 5px 15px color-mix(in srgb, var(--color-gray-900) 2%, transparent)';
export const SHADOW_HOVER_DARK =
  '0 20px 40px color-mix(in srgb, var(--color-gray-900) 20%, transparent)';
export const SHADOW_CARD_MAIN =
  '0 15px 30px color-mix(in srgb, var(--color-gray-900) 15%, transparent)';

/** Panneaux sombres semi-transparents */
export const PANEL_BACK_75 =
  'color-mix(in srgb, var(--color-gray-900) 75%, transparent)';
export const SHADOW_PANEL_DEEP =
  '0 15px 30px color-mix(in srgb, var(--color-gray-900) 40%, transparent), inset 0 1px 0 color-mix(in srgb, var(--color-text-inverse) 5%, transparent)';
export const SHADOW_PANEL_MED =
  '0 15px 30px color-mix(in srgb, var(--color-gray-900) 40%, transparent)';

export const INVERSE_80 = 'color-mix(in srgb, var(--color-text-inverse) 80%, transparent)';

export const TEXT_SHADOW_CONFIDENTIAL =
  '0 1px 8px color-mix(in srgb, var(--color-gray-900) 60%, transparent)';

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
  /** Dégradés bas de carte sur photo */
  scrimPhotoBottom:
    'linear-gradient(180deg, transparent 10%, color-mix(in srgb, var(--color-gray-900) 85%, transparent) 100%)',
  scrimPhotoBottomTight:
    'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--color-gray-900) 85%, transparent) 100%)',
  /** Bandeau hero cartes (accent vs neutre) */
  heroCardAccent:
    'linear-gradient(90deg, color-mix(in srgb, var(--color-accent-strong) 85%, transparent) 0%, color-mix(in srgb, var(--color-gray-900) 30%, transparent) 100%)',
  heroCardDark:
    'linear-gradient(90deg, color-mix(in srgb, var(--color-gray-900) 80%, transparent) 0%, color-mix(in srgb, var(--color-gray-900) 30%, transparent) 100%)',
};
