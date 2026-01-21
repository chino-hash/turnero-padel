/**
 * Servicios helper para gestión de tenants
 * Proporciona funciones para obtener y validar información de tenants
 */

import { prisma } from '../database/neon-config'
import { getTenantFromSlug } from '../tenant/context'
import { isDevelopment, isTest } from '../config/env'

export interface TenantPublicInfo {
  id: string
  name: string
  slug: string
  description?: string | null
}

const TEST_TENANT = {
  name: 'tenant de prueba',
  slug: 'tenant-de-prueba',
  description: 'Club de prueba para la landing page',
}

async function ensureTestTenant() {
  if (!isDevelopment && !isTest) {
    return
  }

  try {
    const existing = await prisma.tenant.findUnique({
      where: { slug: TEST_TENANT.slug },
      select: {
        id: true,
        settings: true,
      },
    })

    if (!existing) {
      await prisma.tenant.create({
        data: {
          name: TEST_TENANT.name,
          slug: TEST_TENANT.slug,
          isActive: true,
          settings: JSON.stringify({ description: TEST_TENANT.description }),
        },
      })
      return
    }

    let settings: Record<string, unknown> = {}
    if (existing.settings) {
      try {
        settings = JSON.parse(existing.settings)
      } catch {
        settings = {}
      }
    }

    if (!settings.description) {
      settings.description = TEST_TENANT.description
    }

    await prisma.tenant.update({
      where: { id: existing.id },
      data: {
        name: TEST_TENANT.name,
        isActive: true,
        settings: JSON.stringify(settings),
      },
    })
  } catch (error) {
    console.error('[TenantsService] Error creando tenant de prueba:', error)
  }
}

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
    await ensureTestTenant()

    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
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



