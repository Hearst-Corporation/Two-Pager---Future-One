/* ============================================================
   ADMIN UI · DESIGN TOKENS
   ------------------------------------------------------------
   Single source of truth for admin typography, spacing, and
   color helpers. Mirror of components/pitch/tokens.js for the
   /admin section.

   Rule: NEVER hardcode fontSize, fontWeight, letterSpacing,
   spacing, or hex colors in admin components. Reference these
   tokens or the CSS vars in globals.css.
   ============================================================ */

/* ---------- Typography sizes (px) ---------- */
export const T = {
  /* Labels / metadata */
  micro:   9,   // sub-labels, avatar ring text
  mini:   10,   // UPPERCASE section labels, footer links
  caption: 11,  // secondary metadata
  small:  12,   // descriptions, helper text
  body:   13,   // default body, table cells
  base:   14,   // primary body text
  /* Headings */
  h4:     16,   // card sub-headings
  h3:     18,   // section headings
  h2:     20,   // page headings
  h1:     24,   // KPI / stat values
  /* Numerics */
  statS:  24,   // small KPI number
  statM:  32,   // medium KPI number
  statL:  40,   // large KPI number
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

/* ---------- Letter-spacing (px) ----------
   Positive values for UPPERCASE labels, negative for large headings.
*/
export const LS = {
  tight:   -1,   // large headings, KPI numbers
  normal:   0,
  loose:    0.3, // compact secondary text
  wide:     0.5, // body labels
  wider:    0.8, // metadata
  label:    1,   // inline labels
  caps:     1.5, // small uppercase
  capsWide: 2,   // section uppercase labels
  capsMax:  2.5, // primary UPPERCASE labels (title/footer)
};

/* ---------- Spacing scale (px) ----------
   4-based. Use these instead of arbitrary px values.
*/
export const SP = {
  1:  4,
  2:  8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

/* ---------- Color helpers (CSS-var-based) ----------
   Use color-mix() so they always track the root tokens.
   Never hardcode hex here — reference var(--color-*) only.
*/

/* Status foreground — use these instead of raw hex */
export const C = {
  error:   'var(--color-error)',
  warning: 'var(--color-warning)',
  success: 'var(--color-success)',
  info:    'var(--color-info)',

  /* Status background tints */
  errorBg:   'var(--color-error-bg)',
  warningBg: 'var(--color-warning-bg)',
  successBg: 'var(--color-success-bg)',
  infoBg:    'var(--color-info-bg)',

  /* Status border tints (light) */
  errorBorder:   'color-mix(in srgb, var(--color-error)   18%, transparent)',
  warningBorder: 'color-mix(in srgb, var(--color-warning) 18%, transparent)',
  successBorder: 'color-mix(in srgb, var(--color-success) 18%, transparent)',
  infoBorder:    'color-mix(in srgb, var(--color-info)    18%, transparent)',

  /* Status tint fills (alert strips, badges) */
  errorTint:   'color-mix(in srgb, var(--color-error)   7%, transparent)',
  warningTint: 'color-mix(in srgb, var(--color-warning) 7%, transparent)',
  successTint: 'color-mix(in srgb, var(--color-success) 7%, transparent)',
  infoTint:    'color-mix(in srgb, var(--color-info)    7%, transparent)',

  /* Text */
  textPrimary:   'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted:     'var(--color-text-muted)',
  textInverse:   'var(--color-text-inverse)',

  /* Surfaces */
  surface:    'var(--color-surface)',
  bgMain:     'var(--color-bg-main)',
  bgSecondary:'var(--color-bg-secondary)',

  /* Borders */
  borderLight:  'var(--color-border-light)',
  borderMedium: 'var(--color-border-medium)',
  borderStrong: 'var(--color-border-strong)',
};

/* ---------- Avatar palette (deterministic from email hash) ----------
   8 colors used by Avatar.jsx. Centralised here so they can be
   updated in one place if the brand palette changes.
*/
export const AVATAR_PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#a855f7', // violet
];

/* ---------- Pillar accent colors ---------- */
export const PILLAR_COLOR = {
  datacenter: '#3b82f6',
  mining:     '#f59e0b',
  hub:        '#10b981',
};

/* ---------- Status colors (initiatives, pipeline) ---------- */
export const STATUS_COLOR = {
  not_started: '#94a3b8',
  planned:     '#3b82f6',
  in_progress: '#f59e0b',
  blocked:     '#ef4444',
  done:        '#10b981',
  archived:    '#64748b',
};

/* ---------- Partner / entity colors ---------- */
export const PARTNER_KIND_COLOR = {
  institution: '#8b5cf6',
  authority:   '#ef4444',
  foundation:  '#10b981',
  sponsor:     '#f59e0b',
};

export const OWNER_ENTITY_COLOR = {
  hearst:  '#3b82f6',
  jv:      '#8b5cf6',
  you:     '#10b981',
  partner: '#f59e0b',
  joint:   '#ec4899',
};
