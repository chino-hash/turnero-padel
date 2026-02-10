/**
 * Servicios helper para gestión de tenants
 * Proporciona funciones para obtener y validar información de tenants
 */

import { prisma } from '../database/neon-config'
import { getTenantFromSlug } from '../tenant/context'

export interface TenantPublicInfo {
  id: string
  name: string
  slug: string
  description?: string | null
}

/** Slug del tenant de prueba - oculto en listados públicos y en gestión de tenants */
export const HIDDEN_TEST_TENANT_SLUG = 'tenant-de-prueba'

/**
 * Obtiene un tenant por su slug
 * Verifica que el tenant existe y está activo
 * 
 * @param slug - El slug del tenant
 * @returns El tenant o null si no existe o está inactivo
 */
export async function getTenantBySlug(slug: string): Promise<TenantPublicInfo | null> {
  if (!slug || slug.trim().length === 0) {
    return null
  }
  if (slug === HIDDEN_TEST_TENANT_SLUG) {
    return null
  }

  try {
    const tenant = await getTenantFromSlug(slug)
    
    if (!tenant || !tenant.isActive) {
      return null
    }

    // Obtener descripción completa del tenant desde la BD
    const tenantFull = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: true, // La descripción podría estar en settings
      },
    })

    // Intentar extraer descripción de settings si existe
    let description: string | null = null
    if (tenantFull?.settings) {
      try {
        const settings = JSON.parse(tenantFull.settings)
        description = settings.description || null
      } catch {
        // Si settings no es JSON válido, ignorar
      }
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description,
    }
  } catch (error) {
    console.error('[TenantsService] Error obteniendo tenant por slug:', error)
    return null
  }
}

/**
 * Obtiene todos los tenants activos para mostrar en la landing page
 * Retorna solo información pública (id, name, slug, description)
 * 
 * @returns Array de tenants activos ordenados alfabéticamente
 */
export async function getAllActiveTenants(): Promise<TenantPublicInfo[]> {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        slug: { not: HIDDEN_TEST_TENANT_SLUG },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transformar y extraer descripción de settings
    return tenants.map((tenant) => {
      let description: string | null = null
      if (tenant.settings) {
        try {
          const settings = JSON.parse(tenant.settings)
          description = settings.description || null
        } catch {
          // Si settings no es JSON válido, ignorar
        }
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        description,
      }
    })
  } catch (error) {
    console.error('[TenantsService] Error obteniendo tenants activos:', error)
    return []
  }
}

/**
 * Valida que un tenant existe y está activo
 * 
 * @param slug - El slug del tenant a validar
 * @returns true si el tenant existe y está activo, false en caso contrario
 */
export async function isTenantActive(slug: string): Promise<boolean> {
  const tenant = await getTenantBySlug(slug)
  return tenant !== null
}



