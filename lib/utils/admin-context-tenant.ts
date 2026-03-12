/**
 * Persiste el tenant de contexto del panel de administración en el cliente.
 * Así, al abrir /admin-panel/admin/canchas sin ?tenantId=, se usa el último tenant
 * con el que se estuvo trabajando (ej. el del dashboard o super-admin).
 */

const COOKIE_ID = 'admin-context-tenant-id'
const COOKIE_SLUG = 'admin-context-tenant-slug'
const MAX_AGE = 60 * 60 * 24 // 24 horas

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MAX_AGE};SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const row = document.cookie.split('; ').find((r) => r.startsWith(name + '='))
  if (!row) return null
  const value = row.split('=').slice(1).join('=')
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function setAdminContextTenant(tenantId: string | null, tenantSlug: string | null): void {
  if (tenantId) setCookie(COOKIE_ID, tenantId)
  if (tenantSlug) setCookie(COOKIE_SLUG, tenantSlug)
}

export function getAdminContextTenant(): { tenantId: string | null; tenantSlug: string | null } {
  return {
    tenantId: getCookie(COOKIE_ID),
    tenantSlug: getCookie(COOKIE_SLUG),
  }
}
