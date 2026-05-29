/* ============================================================
   OPENCLAW · NAVIGATION CONFIGURATION
   ------------------------------------------------------------
   Centralized source of truth for HEARST module navigation.
   Each entry defines: route, labels, icons, and which content
   appears in left/right context panels.

   Rule: Components should NOT hardcode nav items. Import from here.
   ============================================================ */

/**
 * @typedef {Object} NavChild
 * @property {string} href - Route path
 * @property {string} label - Display label
 * @property {string} iconKey - Icon identifier from AdminIcons
 */

/**
 * @typedef {Object} NavEntry
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {string} iconKey - Icon identifier
 * @property {string} [href] - Direct link (for leaf nodes)
 * @property {boolean} [isExact] - Whether href must match exactly
 * @property {NavChild[]} [children] - Sub-routes
 * @property {string} [leftPanel] - Content key for left panel
 * @property {string} [rightPanel] - Content key for right panel
 * @property {string} [pageContext] - Page context key for advisor
 */

/** Primary navigation for HEARST module */
export const PRIMARY_NAV = [
  {
    id: 'overview',
    label: 'Overview',
    iconKey: 'home',
    href: '/admin/hearst',
    isExact: true,
    children: [],
    leftPanel: 'overview-context',
    rightPanel: 'overview-metrics',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    iconKey: 'search',
    children: [
      { href: '/admin/hearst/sources',  label: 'Market Intel',  iconKey: 'link' },
      { href: '/admin/hearst/risks',    label: 'Risks',         iconKey: 'warning' },
      { href: '/admin/hearst/about',    label: 'About',         iconKey: 'book' },
    ],
    leftPanel: 'intelligence-context',
    rightPanel: 'intelligence-metrics',
  },
  {
    id: 'model',
    label: 'Model',
    iconKey: 'sliders',
    children: [
      { href: '/admin/hearst/assumptions',    label: 'Assumptions',    iconKey: 'sliders' },
      { href: '/admin/hearst/financial',      label: 'Financial',      iconKey: 'chart' },
      { href: '/admin/hearst/scenarios',      label: 'Scenarios',      iconKey: 'compare' },
      { href: '/admin/hearst/simulator',      label: 'Simulator',      iconKey: 'compass' }, // Wave 1 (C16): was dead route /deal-simulator
    ],
    leftPanel: 'model-context',
    rightPanel: 'model-metrics',
  },
  {
    id: 'deal-flow',
    label: 'Deal Flow',
    iconKey: 'target',
    children: [
      { href: '/admin/hearst/deals',     label: 'Deals',     iconKey: 'folder' },
      { href: '/admin/hearst/pipeline',  label: 'Pipeline',  iconKey: 'target' },
      { href: '/admin/hearst/contracts', label: 'Contracts', iconKey: 'document' },
      { href: '/admin/hearst/timeline',  label: 'Timeline',  iconKey: 'clock' },
    ],
    leftPanel: 'deal-flow-context',
    rightPanel: 'deal-flow-metrics',
  },
  {
    id: 'execution',
    label: 'Execution',
    iconKey: 'folder',
    children: [
      { href: '/admin/hearst/documents', label: 'Documents', iconKey: 'report' },
      { href: '/admin/hearst/data-room', label: 'Data Room', iconKey: 'folder' },
      { href: '/admin/hearst/reports',   label: 'Reports',   iconKey: 'report' },
    ],
    leftPanel: 'execution-context',
    rightPanel: 'execution-metrics',
  },
];

/** Secondary links (header/footer) */
export const SECONDARY_LINKS = [
  { id: 'about', href: '/admin/hearst/about', label: 'How it works', iconKey: 'book' },
  { id: 'audit', href: '/admin/hearst/audit', label: 'Audit trail',  iconKey: 'search' },
];

/**
 * Find the active primary nav entry by pathname.
 * @param {string} pathname
 * @returns {NavEntry|null}
 */
export function findPrimaryByPath(pathname) {
  if (!pathname) return null;
  for (const p of PRIMARY_NAV) {
    if (p.isExact && pathname === p.href) return p;
    if (p.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))) return p;
  }
  return null;
}

/**
 * Find the active child nav entry by pathname.
 * @param {string} pathname
 * @returns {NavChild|null}
 */
export function findChildByPath(pathname) {
  if (!pathname) return null;
  for (const p of PRIMARY_NAV) {
    const child = p.children?.find(c => pathname === c.href || pathname.startsWith(c.href + '/'));
    if (child) return child;
  }
  return null;
}

/**
 * Get the href for a primary tab.
 * Overview returns its own href. Groups return first child's href.
 * @param {NavEntry} primary
 * @returns {string}
 */
export function getPrimaryHref(primary) {
  if (!primary) return '/admin/hearst';
  if (primary.href) return primary.href;
  return primary.children?.[0]?.href || '/admin/hearst';
}

/**
 * Get panel content keys for a pathname.
 * Returns { leftPanel, rightPanel } based on active primary nav.
 * @param {string} pathname
 * @returns {{leftPanel: string, rightPanel: string}}
 */
export function getPanelKeysByPath(pathname) {
  const primary = findPrimaryByPath(pathname);
  if (!primary) {
    return { leftPanel: 'default-context', rightPanel: 'default-metrics' };
  }
  return {
    leftPanel: primary.leftPanel || 'default-context',
    rightPanel: primary.rightPanel || 'default-metrics',
  };
}

/**
 * Check if a pathname is a HEARST route.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isHearstRoute(pathname) {
  if (!pathname) return false;
  return pathname === '/admin/hearst' || pathname.startsWith('/admin/hearst/');
}
