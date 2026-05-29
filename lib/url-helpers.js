/**
 * Single source of truth for the post-login landing page.
 * ORACLE users must enter the ORACLE Executive Dashboard, NOT the legacy
 * DevHub at `/admin`. The legacy product stays reachable by explicit URL.
 */
export const ORACLE_HOME = '/admin/hearst/executive';

/**
 * Sanitize a value destined for the `?next=` redirect param.
 * Only allows same-origin paths (must start with a single `/`, not `//`).
 * Anything else (absolute URL, protocol-relative, javascript:, etc.) is
 * collapsed to ORACLE_HOME (so a missing/malformed next lands in ORACLE,
 * never the legacy product). A valid explicit `next` always wins.
 */
export function safeNextPath(path) {
  if (typeof path !== 'string') return ORACLE_HOME;
  if (!/^\/[^/]/.test(path)) return ORACLE_HOME;
  return path;
}
