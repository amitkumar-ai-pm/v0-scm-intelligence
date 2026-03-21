/** If an API returns 401, send user to login with return path. Call from client after fetch. */
export function redirectToLoginIfUnauthorized(status: number): boolean {
  if (status !== 401 || typeof window === 'undefined') return false
  const path = window.location.pathname + window.location.search
  window.location.href = '/login?from=' + encodeURIComponent(path)
  return true
}
