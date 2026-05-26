/**
 * Sanitize a value destined for the `?next=` redirect param.
 * Only allows same-origin paths (must start with a single `/`, not `//`).
 * Anything else (absolute URL, protocol-relative, javascript:, etc.) is
 * collapsed to `/admin`.
 */
export function safeNextPath(path) {
  if (typeof path !== 'string') return '/admin';
  if (!/^\/[^/]/.test(path)) return '/admin';
  return path;
}
