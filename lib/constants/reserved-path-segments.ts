/**
 * Segmentos de path que no deben interpretarse como tenant slug.
 * Usado en middleware (x-tenant-slug), extractTenantSlugFromUrl y getTenantFromRequest.
 */
export const RESERVED_PATH_SEGMENTS = [
  'api',
  'auth',
  'login',
  'dashboard',
  'admin',
  'admin-panel',
  'super-admin',
  'club',
  'reservas',
  'payments',
  'test',
  'demo',
  '_next',
  'favicon.ico',
] as const

export function isReservedPathSegment(segment: string): boolean {
  const lower = segment.toLowerCase()
  return (RESERVED_PATH_SEGMENTS as readonly string[]).includes(lower)
}
