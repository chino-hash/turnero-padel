/**
 * Utilidades para persistir tenantSlug durante el flujo OAuth
 * Usa cookies para mantener el tenantSlug entre redirecciones
 */

import { cookies } from 'next/headers'
import { isReservedPathSegment } from '@/lib/constants/reserved-path-segments'

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
 * Extrae tenantSlug del callbackUrl (query ?tenantSlug=... o path de un segmento /slug)
 * @param callbackUrl - URL que puede contener tenantSlug como query param o como path
 * @returns El tenantSlug o null si no existe
 */
export function extractTenantSlugFromUrl(callbackUrl: string | undefined): string | null {
  if (!callbackUrl) return null

  try {
    const url = new URL(callbackUrl, 'http://localhost')
    const fromQuery = url.searchParams.get('tenantSlug')
    if (fromQuery) return fromQuery

    // Path de un solo segmento: /metro-padel-360 -> metro-padel-360
    const pathname = url.pathname.replace(/^\/+|\/+$/g, '')
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 1) {
      const segment = segments[0]
      if (!isReservedPathSegment(segment)) return segment
    }
  } catch {
    // Si no es una URL válida, intentar extraer query manualmente
    const match = callbackUrl.match(/tenantSlug=([^&]+)/)
    if (match) {
      return decodeURIComponent(match[1])
    }
    // Path relativo: /metro-padel-360
    const pathOnly = callbackUrl.replace(/^\/+|\/+$/g, '')
    const segments = pathOnly.split('/').filter(Boolean)
    if (segments.length === 1 && !isReservedPathSegment(segments[0])) {
      return segments[0]
    }
  }

  return null
}



