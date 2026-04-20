import { getAdminContextTenant } from '@/lib/utils/admin-context-tenant'

/**
 * URL de GET /api/admin/availability con tenant en query cuando hace falta (super admin).
 * Los admins de club no requieren query: el API usa el tenant de la sesión.
 */
export function buildAdminAvailabilityFetchUrl(args: {
  tenantIdProp?: string | null
  tenantSlugProp?: string | null
  searchParams?: Pick<URLSearchParams, 'get'> | null
  isSuperAdmin: boolean
}): string {
  const sp = args.searchParams
  let tenantId = args.tenantIdProp ?? sp?.get('tenantId')?.trim() ?? null
  let tenantSlug = args.tenantSlugProp ?? sp?.get('tenantSlug')?.trim() ?? null
  if (args.isSuperAdmin && !tenantId && !tenantSlug && typeof window !== 'undefined') {
    const c = getAdminContextTenant()
    tenantId = c.tenantId
    tenantSlug = c.tenantSlug
  }
  const q = new URLSearchParams()
  if (tenantId) q.set('tenantId', tenantId)
  else if (tenantSlug) q.set('tenantSlug', tenantSlug)
  const s = q.toString()
  return s ? `/api/admin/availability?${s}` : '/api/admin/availability'
}
