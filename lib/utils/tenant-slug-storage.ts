/**
 * Utilidades para persistir tenantSlug durante el flujo OAuth
 * Usa cookies para mantener el tenantSlug entre redirecciones
 */

import { cookies } from 'next/headers'

const TENANT_SLUG_COOKIE_NAME = 'tenant-slug'

/**
 * Guarda el tenantSlug en una cookie
 * @param tenantSlug - El slug del tenant a guardar
 */
export async function saveTenantSlug(tenantSlug: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TENANT_SLUG_COOKIE_NAME, tenantSlug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutos (suficiente para el flujo OAuth)
  })
}

/**
 * Obtiene el tenantSlug de la cookie
 * @returns El tenantSlug o null si no existe
 */
export async function getTenantSlug(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(TENANT_SLUG_COOKIE_NAME)
  return cookie?.value || null
}

/**
 * Elimina la cookie del tenantSlug
 */
export async function clearTenantSlug(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TENANT_SLUG_COOKIE_NAME)
}

/**
 * Extrae tenantSlug del callbackUrl
 * @param callbackUrl - URL que puede contener tenantSlug como query param
 * @returns El tenantSlug o null si no existe
 */
export function extractTenantSlugFromUrl(callbackUrl: string | undefined): string | null {
  if (!callbackUrl) return null
  
  try {
    // Intentar parsear como URL completa
    const url = new URL(callbackUrl, 'http://localhost')
    return url.searchParams.get('tenantSlug')
  } catch {
    // Si no es una URL válida, intentar extraer manualmente
    const match = callbackUrl.match(/tenantSlug=([^&]+)/)
    if (match) {
      return decodeURIComponent(match[1])
    }
  }
  
  return null
}

