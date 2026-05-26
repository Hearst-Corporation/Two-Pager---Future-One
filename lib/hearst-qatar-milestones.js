// Milestones critiques Qatar pour la Gantt timeline du simulateur.
// Offsets sont relatifs à la COD (Commercial Operations Date) du projet.

/**
 * @typedef {Object} Milestone
 * @property {number} month_offset   Mois relatif à la COD (négatif = avant COD)
 * @property {string} label
 * @property {string} category       'permit' | 'utility' | 'finance' | 'construction' | 'commercial'
 * @property {string} [warning]      Si fourni, warning à montrer quand le calendrier viole ce milestone
 */

export const QATAR_MILESTONES = [
  {
    month_offset: -24,
    label: 'QFZA permit window opens',
    category: 'permit',
    warning: 'QFZA application can take 6-12 months — start now.',
  },
  {
    month_offset: -18,
    label: 'KAHRAMAA grid connection request',
    category: 'utility',
    warning: 'Grid connection for >10 MW: 15-24 months lead time. Sovereign backing can accelerate.',
  },
  {
    month_offset: -15,
    label: 'Land title or QFZA lease secured',
    category: 'permit',
  },
  {
    month_offset: -12,
    label: 'EPC contract signed (Tier-III, ~$7-9M/MW)',
    category: 'construction',
  },
  {
    month_offset: -12,
    label: 'Brookfield term sheet checkpoint',
    category: 'finance',
    warning: 'Without anchor LP commitment by this point, financing close at risk.',
  },
  {
    month_offset: -6,
    label: 'Power allocation letter (KAHRAMAA)',
    category: 'utility',
  },
  {
    month_offset: -3,
    label: 'Commissioning + Uptime Tier-III certification',
    category: 'construction',
  },
  {
    month_offset: 0,
    label: 'COD — Commercial Operations Date',
    category: 'commercial',
  },
  {
    month_offset: 12,
    label: 'Phase 1 occupancy ≥ 50%',
    category: 'commercial',
  },
  {
    month_offset: 24,
    label: 'Stabilized occupancy (target ≥ 80%)',
    category: 'commercial',
  },
  {
    month_offset: 36,
    label: 'Brookfield underwriting checkpoint (potential refi)',
    category: 'finance',
  },
];

/**
 * Catégorie → token CSS pour styling Gantt.
 */
export const MILESTONE_CATEGORY_COLOR = {
  permit:       'var(--cp-text-muted)',
  utility:      'var(--cp-text-primary)',
  finance:      'var(--cp-accent)',
  construction: 'var(--cp-accent-maroon)',
  commercial:   'var(--cp-text-strong)',
};
