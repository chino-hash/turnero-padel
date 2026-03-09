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

/** Slugs de tenants de prueba - ocultos en listados públicos para usuarios no superadmin */
export const HIDDEN_TEST_TENANT_SLUGS = ['tenant-de-prueba', 'default', 'tenant-de-prueba-b']

/** @deprecated Usar HIDDEN_TEST_TENANT_SLUGS */
export const HIDDEN_TEST_TENANT_SLUG = HIDDEN_TEST_TENANT_SLUGS[0]

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
  if (HIDDEN_TEST_TENANT_SLUGS.includes(slug)) {
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
 * @param includeHidden - Si true, incluye tenants de prueba (para super admins)
 * @returns Array de tenants activos ordenados alfabéticamente
 */
export async function getAllActiveTenants(includeHidden = false): Promise<TenantPublicInfo[]> {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        ...(!includeHidden && { slug: { notIn: HIDDEN_TEST_TENANT_SLUGS } }),
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



