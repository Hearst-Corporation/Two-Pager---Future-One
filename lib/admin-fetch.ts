/**
 * Wrapper around fetch() for /api/admin/* endpoints.
 * On 401 (session expired), redirects to login preserving the current path.
 * Passthrough for all other status codes.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== 'undefined') {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = '/admin/login?next=' + next;
  }
  return res;
}
