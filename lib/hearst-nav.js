// lib/hearst-nav.js
// Primary navigation structure for the HEARST module — 5 grouped tabs.
// Sub-routes are listed as `children` of each primary tab; when the user
// is on a child route, the corresponding primary tab is highlighted and
// a contextual secondary nav appears below.

export const PRIMARY_NAV = [
  {
    id: 'overview',
    label: 'Overview',
    iconKey: 'home',
    href: '/admin/hearst',
    isExact: true,
    children: [],
  },
  {
    id: 'model',
    label: 'Model',
    iconKey: 'sliders',
    children: [
      { href: '/admin/hearst/assumptions',    label: 'Assumptions',    iconKey: 'sliders' },
      { href: '/admin/hearst/sources',        label: 'Sources',        iconKey: 'link' },
      { href: '/admin/hearst/financial',      label: 'Financial',      iconKey: 'chart' },
      { href: '/admin/hearst/scenarios',      label: 'Scenarios',      iconKey: 'compare' },
      { href: '/admin/hearst/deal-simulator', label: 'Deal Simulator', iconKey: 'compass' },
    ],
  },
  {
    id: 'deals',
    label: 'Deals & Docs',
    iconKey: 'folder',
    children: [
      { href: '/admin/hearst/pipeline',  label: 'Pipeline',  iconKey: 'target' },
      { href: '/admin/hearst/data-room', label: 'Data Room', iconKey: 'folder' },
      { href: '/admin/hearst/contracts', label: 'Contracts', iconKey: 'document' },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    iconKey: 'warning',
    children: [
      { href: '/admin/hearst/risks',    label: 'Risks',    iconKey: 'warning' },
      { href: '/admin/hearst/timeline', label: 'Timeline', iconKey: 'clock' },
      { href: '/admin/hearst/reports',  label: 'Reports',  iconKey: 'report' },
    ],
  },
];

// Secondary entry points kept reachable but pushed out of the primary nav
// to reduce cognitive load. "How it works" → ⓘ icon in header.
// "Audit trail" → small link in the layout footer.
export const SECONDARY_LINKS = [
  { id: 'about', href: '/admin/hearst/about', label: 'How it works', iconKey: 'book' },
  { id: 'audit', href: '/admin/hearst/audit', label: 'Audit trail',  iconKey: 'search' },
];

/**
 * Given a pathname, return the active primary tab object (or null).
 * Match rules:
 *   - isExact tabs match only when pathname === tab.href
 *   - otherwise, any child.href that is a prefix of pathname wins
 */
export function findPrimaryByPath(pathname) {
  if (!pathname) return null;
  for (const p of PRIMARY_NAV) {
    if (p.isExact && pathname === p.href) return p;
    if (p.children?.some(c => pathname.startsWith(c.href))) return p;
  }
  return null;
}

/**
 * Pick the destination href for clicking on a primary tab.
 * Overview returns its own href. Group tabs return the first child's href.
 */
export function getPrimaryHref(primary) {
  if (!primary) return '/admin/hearst';
  if (primary.href) return primary.href;
  return primary.children?.[0]?.href || '/admin/hearst';
}
