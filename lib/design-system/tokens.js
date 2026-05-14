/* ============================================================
   OPENCLAW · DARK UI DESIGN TOKENS
   ------------------------------------------------------------
   Premium dark dashboard theme — inspired by hardware/monitoring
   SaaS interfaces. Single source of truth for colors, spacing,
   radius, shadows, borders, typography, layout sizes.

   Rule: NEVER hardcode values in components. Import from here.
   ============================================================ */

/* ---------- Backgrounds (dark blue/black) ---------- */
export const BG = {
  base:       '#05070d',
  elevated:   '#080b14',
  surface:    '#0b1020',
  surfaceHi:  '#0f1528',
  overlay:    'rgba(5, 7, 13, 0.85)',
};

/* ---------- Cards ---------- */
export const CARD = {
  bg:         'rgba(255, 255, 255, 0.03)',
  bgHover:    'rgba(255, 255, 255, 0.06)',
  border:     'rgba(255, 255, 255, 0.08)',
  borderHover:'rgba(255, 255, 255, 0.12)',
  radius:     12,
  radiusSm:   8,
  radiusLg:   16,
};

/* ---------- Text ---------- */
export const TEXT = {
  primary:    '#f8fafc',
  secondary:  '#94a3b8',
  muted:      '#64748b',
  inverse:    '#05070d',
};

/* ---------- Accents (cyan/electric blue) ---------- */
export const ACCENT = {
  main:       '#00b7ff',
  strong:     '#38bdf8',
  soft:       '#7dd3fc',
  glow:       'rgba(0, 183, 255, 0.15)',
  glowStrong: 'rgba(0, 183, 255, 0.30)',
};

/* ---------- Status ---------- */
export const STATUS = {
  success:    '#22c55e',
  warning:    '#f59e0b',
  danger:     '#ef4444',
  info:       '#3b82f6',
};

/* ---------- Spacing scale (px) ---------- */
export const SP = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

/* ---------- Typography sizes (px) ---------- */
export const T = {
  micro:   9,
  mini:   10,
  caption: 11,
  small:  12,
  body:   13,
  base:   14,
  h4:     16,
  h3:     18,
  h2:     20,
  h1:     24,
  statS:  28,
  statM:  36,
  statL:  48,
};

/* ---------- Font weights ---------- */
export const W = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
  heavy:    800,
  black:    900,
};

/* ---------- Letter-spacing (px) ---------- */
export const LS = {
  tight:   -0.5,
  normal:   0,
  loose:    0.3,
  wide:     0.5,
  wider:    0.8,
  label:    1,
  caps:     1.2,
  capsWide: 1.8,
  capsMax:  2.2,
};

/* ---------- Shadows ---------- */
export const SHADOW = {
  sm:   '0 1px 2px rgba(0, 0, 0, 0.30)',
  md:   '0 4px 12px rgba(0, 0, 0, 0.40)',
  lg:   '0 8px 24px rgba(0, 0, 0, 0.50)',
  xl:   '0 16px 48px rgba(0, 0, 0, 0.60)',
  glow: '0 0 20px rgba(0, 183, 255, 0.10)',
  glowStrong: '0 0 30px rgba(0, 183, 255, 0.20)',
};

/* ---------- Borders ---------- */
export const BORDER = {
  width: 1,
  color: 'rgba(255, 255, 255, 0.08)',
  colorHover: 'rgba(255, 255, 255, 0.14)',
  colorActive: 'rgba(0, 183, 255, 0.35)',
};

/* ---------- Layout sizes ---------- */
export const LAYOUT = {
  sidebarWidth: 72,
  leftPanelWidth: 300,
  rightPanelWidth: 360,
  chatMinWidth: 520,
  headerHeight: 56,
  panelHeaderHeight: 48,
};

/* ---------- Z-index scale ---------- */
export const Z = {
  base:     1,
  dropdown: 50,
  sticky:   100,
  modal:    200,
  tooltip:  300,
};

/* ---------- Transitions ---------- */
export const TRANSITION = {
  fast:   '0.10s ease',
  normal: '0.15s ease',
  slow:   '0.25s ease',
};

/* ---------- Glassmorphism ---------- */
export const GLASS = {
  bg: 'rgba(255, 255, 255, 0.03)',
  bgHover: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  backdrop: 'blur(12px) saturate(140%)',
};

/* ---------- Scrollbar ---------- */
export const SCROLLBAR = {
  width: 6,
  track: 'transparent',
  thumb: 'rgba(255, 255, 255, 0.10)',
  thumbHover: 'rgba(255, 255, 255, 0.18)',
};

/* ---------- Focus states ---------- */
export const FOCUS = {
  ring: '0 0 0 2px rgba(0, 183, 255, 0.30)',
  ringOffset: '2px',
};

/* ---------- Nav item states ---------- */
export const NAV = {
  itemHeight: 40,
  itemGap: 2,
  iconSize: 18,
  activeBg: 'rgba(0, 183, 255, 0.08)',
  activeBorder: 'rgba(0, 183, 255, 0.35)',
  activeGlow: '0 0 12px rgba(0, 183, 255, 0.10)',
  hoverBg: 'rgba(255, 255, 255, 0.04)',
};

/* ============================================================
   CSS-IN-JS HELPERS
   Use these to build style objects inline.
   ============================================================ */

/** Build a card style object */
export function cardStyle(overrides = {}) {
  return {
    background: CARD.bg,
    border: `1px solid ${CARD.border}`,
    borderRadius: CARD.radius,
    ...overrides,
  };
}

/** Build a glass panel style object */
export function glassStyle(overrides = {}) {
  return {
    background: GLASS.bg,
    backdropFilter: GLASS.backdrop,
    WebkitBackdropFilter: GLASS.backdrop,
    border: `1px solid ${GLASS.border}`,
    borderRadius: CARD.radius,
    ...overrides,
  };
}

/** Build an active nav item style */
export function navActiveStyle(overrides = {}) {
  return {
    background: NAV.activeBg,
    borderLeft: `2px solid ${ACCENT.main}`,
    boxShadow: NAV.activeGlow,
    color: TEXT.primary,
    ...overrides,
  };
}
