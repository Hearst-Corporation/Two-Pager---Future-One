/**
 * cp-styles.js — Patterns de style DS Oracle
 *
 * Source de vérité pour les objets de style inline récurrents.
 * Tous les tokens sont des var(--cp-*) — jamais de valeur hardcodée.
 *
 * Usage :
 *   import { T, S, L } from '@/lib/cp-styles'
 *   style={T.pageTitle}          // typographie
 *   style={S.loading}            // états UI
 *   style={{ ...L.row, gap: 'var(--cp-space-3)' }}  // layout
 */

// ─── Typographie ────────────────────────────────────────────────────────────

export const T = {
  // Titres de page (H1 visuel)
  pageTitle: {
    margin: 0,
    fontSize: 'var(--cp-font-2xl)',
    fontWeight: 'var(--cp-weight-black)',
    lineHeight: 'var(--cp-leading-tight)',
    letterSpacing: 'var(--cp-tracking-tight)',
    color: 'var(--cp-text-primary)',
  },

  // Titres de section (H2 visuel)
  sectionTitle: {
    margin: 0,
    fontSize: 'var(--cp-font-xl)',
    fontWeight: 'var(--cp-weight-black)',
    lineHeight: 'var(--cp-leading-tight)',
    letterSpacing: 'var(--cp-tracking-tight)',
    color: 'var(--cp-text-primary)',
  },

  // Titres de carte / panneau (H3 visuel)
  cardTitle: {
    margin: 0,
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-primary)',
  },

  // Eyebrow (label CAPS au-dessus d'un titre)
  eyebrow: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },

  // Eyebrow accentué (bordeaux)
  eyebrowAccent: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-accent-strong)',
  },

  // Label de métrique (valeur chiffrée — KPI, résultat)
  metricValue: {
    fontSize: 'var(--cp-font-xl)',
    fontWeight: 'var(--cp-weight-black)',
    lineHeight: 1,
    letterSpacing: 'var(--cp-tracking-tight)',
    color: 'var(--cp-text-primary)',
  },

  // Label sous une métrique
  metricLabel: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },

  // Titre de chart / dataviz
  chartTitle: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-muted)',
    marginBottom: 'var(--cp-space-3)',
  },

  // Corps de texte standard
  body: {
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-regular)',
    lineHeight: 'var(--cp-leading-normal)',
    color: 'var(--cp-text-body)',
  },

  // Texte secondaire / muted
  muted: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-regular)',
    lineHeight: 'var(--cp-leading-normal)',
    color: 'var(--cp-text-muted)',
  },

  // Label de champ (xs, semibold)
  fieldLabel: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },

  // Tab / bouton texte (xs, semibold)
  tabLabel: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
  },
};

// ─── États UI ────────────────────────────────────────────────────────────────

export const S = {
  // Conteneur de page (oracle-page enrichi en inline si besoin)
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-section-gap)',
  },

  // État chargement centré
  loading: {
    padding: 'var(--cp-space-12)',
    textAlign: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-md)',
  },

  // État erreur
  error: {
    padding: 'var(--cp-space-6)',
    color: 'var(--cp-error)',
    fontSize: 'var(--cp-font-base)',
    background: 'var(--cp-error-bg)',
    borderRadius: 'var(--cp-radius-sm)',
  },

  // État vide (empty state)
  empty: {
    padding: 'var(--cp-space-12)',
    textAlign: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-base)',
  },

  // Alerte accent (simulateur / results — fond via .cp-surface-accent-soft ou background inline)
  accentAlert: {
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    color: 'var(--cp-text-strong)',
    border: '1px solid var(--cp-accent)',
    borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
  },

  // Panneaux de chargement (charts dynamiques / results)
  loadingPanel: {
    height: 420,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--cp-text-muted)',
  },
  loadingCard: {
    minHeight: 320,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-bold)',
  },

  // Toast fixe accent (results « scenario saved », etc.)
  toastAccent: {
    position: 'fixed',
    right: 'var(--cp-space-8)',
    bottom: 'var(--cp-space-8)',
    padding: 'var(--cp-space-2) var(--cp-space-5)',
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    boxShadow: 'var(--cp-shadow-md)',
    zIndex: 'var(--cp-z-toast)',
  },
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export const L = {
  // Ligne flex horizontale centrée verticalement
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
  },

  // Ligne flex avec espace entre les éléments
  rowBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
  },

  // Colonne flex
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
  },

  // Grille 2 colonnes auto
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--cp-space-4)',
  },

  // Grille 3 colonnes auto
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--cp-space-4)',
  },

  // Separateur horizontal
  divider: {
    borderTop: '1px solid var(--cp-border)',
    margin: 'var(--cp-space-4) 0',
  },
};

// ─── Recharts (tooltip + axes — pattern répété dans financial/results) ───────

export const RC = {
  // Style tooltip Recharts
  tooltip: {
    background: 'var(--cp-tooltip-bg)',
    border: '1px solid var(--cp-border-strong)',
    color: 'var(--cp-text-strong)',
    borderRadius: 'var(--cp-radius-sm)',
    boxShadow: 'var(--cp-shadow-xs)',
  },

  // Style item dans le tooltip
  tooltipItem: { color: 'var(--cp-text-body)' },

  // Style label dans le tooltip
  tooltipLabel: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs)' },

  // Style wrapper légende
  legend: { color: 'var(--cp-text-body)', fontSize: 'var(--cp-font-xs)' },

  // Style tick axis (XAxis / YAxis)
  axisTick: { fill: 'var(--cp-text-body)' },

  // Style conteneur axis (fontSize)
  axisStyle: { fontSize: 'var(--cp-font-xs)' },
};
