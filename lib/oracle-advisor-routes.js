// Routes où le snapshot IC Advisor n'apporte rien (pas de projection live).
// Le rail droit bascule en chat-only.

const REFERENCE_PREFIXES = [
  '/admin/hearst/deals',
  '/admin/hearst/sources',
  '/admin/hearst/workspace',
];

/**
 * @param {string} pathname
 * @param {URLSearchParams | { get: (k: string) => string | null } | null} [searchParams]
 * @returns {'full' | 'chat-only'}
 */
export function getAdvisorRailMode(pathname, searchParams = null) {
  if (!pathname) return 'full';

  if (REFERENCE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return 'chat-only';
  }

  if (pathname === '/admin/hearst/dossier' || pathname.startsWith('/admin/hearst/dossier/')) {
    const memoId = searchParams?.get?.('memo');
    return memoId ? 'full' : 'chat-only';
  }

  return 'full';
}
