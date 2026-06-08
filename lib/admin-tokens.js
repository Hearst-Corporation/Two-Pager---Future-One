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
   Cockpit Dark Glass — reference var(--cp-*) only (cp-tokens.css).
   Use color-mix() so tints track the root tokens.
*/

/* Status foreground — use these instead of raw hex */
export const C = {
  error:   'var(--cp-error)',
  warning: 'var(--cp-warning)',
  success: 'var(--cp-success)',
  info:    'var(--cp-info)',

  /* Status background tints */
  errorBg:   'var(--cp-error-bg)',
  warningBg: 'var(--cp-warning-bg)',
  successBg: 'var(--cp-success-bg)',
  infoBg:    'var(--cp-info-bg)',

  /* Status border tints */
  errorBorder:   'color-mix(in srgb, var(--cp-error)   18%, transparent)',
  warningBorder: 'color-mix(in srgb, var(--cp-warning) 18%, transparent)',
  successBorder: 'color-mix(in srgb, var(--cp-success) 18%, transparent)',
  infoBorder:    'color-mix(in srgb, var(--cp-info)    18%, transparent)',

  /* Status tint fills (alert strips, badges) */
  errorTint:   'color-mix(in srgb, var(--cp-error)   7%, transparent)',
  warningTint: 'color-mix(in srgb, var(--cp-warning) 7%, transparent)',
  successTint: 'color-mix(in srgb, var(--cp-success) 7%, transparent)',
  infoTint:    'color-mix(in srgb, var(--cp-info)    7%, transparent)',

  /* Text */
  textPrimary:   'var(--cp-text-primary)',
  textSecondary: 'var(--cp-text-body)',
  textMuted:     'var(--cp-text-muted)',
  textInverse:   'var(--cp-text-strong)',

  /* Surfaces */
  surface:    'var(--cp-surface-1)',
  bgMain:     'var(--cp-bg-deep)',
  bgSecondary:'var(--cp-surface-2)',

  /* Borders */
  borderLight:  'var(--cp-border-soft)',
  borderMedium: 'var(--cp-border)',
  borderStrong: 'var(--cp-border-strong)',
};

/* ---------- Avatar palette (deterministic from email hash) ----------
   8 colors used by Avatar.jsx. Centralised here so they can be
   updated in one place if the brand palette changes.
*/
export const AVATAR_PALETTE = [
  'var(--cp-info)',
  'var(--cp-violet)',
  'var(--cp-success)',
  'var(--cp-warning)',
  'var(--cp-error)',
  'var(--cp-info-strong)',
  'var(--cp-accent-soft)',
  'var(--cp-op-qia)',
];

/* ---------- Pillar accent colors ---------- */
export const PILLAR_COLOR = {
  datacenter: 'var(--cp-info)',
  mining:     'var(--cp-warning)',
  hub:        'var(--cp-success)',
};

/* ---------- Status colors (initiatives, pipeline) ---------- */
export const STATUS_COLOR = {
  not_started: 'var(--cp-text-muted)',
  planned:     'var(--cp-info)',
  in_progress: 'var(--cp-warning)',
  blocked:     'var(--cp-error)',
  done:        'var(--cp-success)',
  archived:    'var(--cp-text-faint)',
};

/* ---------- Partner / entity colors ---------- */
export const PARTNER_KIND_COLOR = {
  institution: 'var(--cp-violet)',
  authority:   'var(--cp-error)',
  foundation:  'var(--cp-success)',
  sponsor:     'var(--cp-warning)',
};

export const OWNER_ENTITY_COLOR = {
  hearst:  'var(--cp-info)',
  jv:      'var(--cp-violet)',
  you:     'var(--cp-success)',
  partner: 'var(--cp-warning)',
  joint:   'var(--cp-accent-soft)',
};
