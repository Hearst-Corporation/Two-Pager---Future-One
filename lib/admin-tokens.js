/* ============================================================
   ADMIN UI · DESIGN TOKENS
   ------------------------------------------------------------
   Color helpers and semantic palettes for admin components.
   Typography, spacing, and weight values live exclusively in
   Design tokens as var(--cp-*).
   ============================================================ */

/* ---------- Color helpers (CSS-var-based) ---------- */

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
