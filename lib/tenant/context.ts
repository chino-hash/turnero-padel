/**
 * Utilidades para obtener y manejar el contexto de tenant en requests
 * Incluye funciones para identificar tenant, verificar permisos y cache
 */

import { NextRequest } from 'next/server';
import { prisma } from '../database/neon-config';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  mercadoPagoEnabled: boolean;
  mercadoPagoEnvironment: string | null;
}

// Cache simple en memoria para evitar consultas repetidas
const tenantCache = new Map<string, { tenant: Tenant | null; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpia el cache de tenants expirados
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of tenantCache.entries()) {
    if (now >= value.expiresAt) {
      tenantCache.delete(key);
    }
  }
}

/**
 * Obtiene un tenant por su slug desde la base de datos
 * 
 * @param slug - El slug del tenant
 * @returns El tenant o null si no existe
 */
export async function getTenantFromSlug(slug: string): Promise<Tenant | null> {
  if (!slug || slug.length === 0) {
    return null;
  }

  const cacheKey = `slug:${slug}`;
  const cached = tenantCache.get(cacheKey);
  const now = Date.now();

  // Verificar cache
  if (cached && now < cached.expiresAt) {
    return cached.tenant;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
      },
    });

    const tenantData: Tenant | null = tenant
      ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          isActive: tenant.isActive,
          mercadoPagoEnabled: tenant.mercadoPagoEnabled,
          mercadoPagoEnvironment: tenant.mercadoPagoEnvironment,
        }
      : null;

    // Guardar en cache
    tenantCache.set(cacheKey, {
      tenant: tenantData,
      expiresAt: now + CACHE_TTL,
    });

    // Limpiar cache periódicamente
    if (tenantCache.size > 100) {
      cleanCache();
    }

    return tenantData;
  } catch (error) {
    console.error('[TenantContext] Error obteniendo tenant por slug:', error);
    return null;
  }
}

/**
 * Obtiene un tenant por su ID desde la base de datos
 * 
 * @param tenantId - El ID del tenant
 * @returns El tenant o null si no existe
 */
export async function getTenantFromId(tenantId: string): Promise<Tenant | null> {
  if (!tenantId || tenantId.length === 0) {
    return null;
  }

  const cacheKey = `id:${tenantId}`;
  const cached = tenantCache.get(cacheKey);
  const now = Date.now();

  // Verificar cache
  if (cached && now < cached.expiresAt) {
    return cached.tenant;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
      },
    });

    const tenantData: Tenant | null = tenant
      ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          isActive: tenant.isActive,
          mercadoPagoEnabled: tenant.mercadoPagoEnabled,
          mercadoPagoEnvironment: tenant.mercadoPagoEnvironment,
        }
      : null;

    // Guardar en cache
    tenantCache.set(cacheKey, {
      tenant: tenantData,
      expiresAt: now + CACHE_TTL,
    });

    return tenantData;
  } catch (error) {
    console.error('[TenantContext] Error obteniendo tenant por ID:', error);
    return null;
  }
}

/**
 * Extrae el tenant del request basándose en el path
 * Soporta formatos: /tenant-slug/... o /api/...?tenant=tenant-slug
 * 
 * @param request - El NextRequest
 * @returns El tenant o null si no se puede determinar
 */
export async function getTenantFromRequest(request: NextRequest): Promise<Tenant | null> {
  const url = request.nextUrl;
  
  // Opción 1: Path con tenant slug (/tenant-slug/...)
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Si el primer segmento no es 'api', 'auth', 'login', etc., podría ser un tenant slug
  const reservedPaths = ['api', 'auth', 'login', 'dashboard', 'admin', 'admin-panel', 'super-admin', '_next', 'favicon.ico'];
  
  if (pathParts.length > 0 && !reservedPaths.includes(pathParts[0].toLowerCase())) {
    const potentialSlug = pathParts[0];
    const tenant = await getTenantFromSlug(potentialSlug);
    if (tenant) {
      return tenant;
    }
  }

  // Opción 2: Query parameter (?tenant=tenant-slug)
  const tenantSlug = url.searchParams.get('tenant');
  if (tenantSlug) {
    return await getTenantFromSlug(tenantSlug);
  }

  // Opción 3: Header x-tenant-id
  const tenantId = request.headers.get('x-tenant-id');
  if (tenantId) {
    return await getTenantFromId(tenantId);
  }

  return null;
}

/**
 * Obtiene el tenantId de un usuario
 * 
 * @param userId - El ID del usuario
 * @returns El tenantId del usuario o null si no existe
 */
export async function getUserTenantId(userId: string): Promise<string | null> {
  if (!userId || userId.length === 0) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    return user?.tenantId || null;
  } catch (error) {
    console.error('[TenantContext] Error obteniendo tenantId del usuario:', error);
    return null;
  }
}

/**
 * Verifica si un email es super admin
 * 
 * @param email - El email a verificar
 * @returns true si es super admin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  if (!email || email.length === 0) {
    return false;
  }

  try {
    const admin = await prisma.adminWhitelist.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: null, // Super admin tiene tenantId null
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    return !!admin;
  } catch (error) {
    console.error('[TenantContext] Error verificando super admin:', error);
    return false;
  }
}

/**
 * Verifica si un usuario puede acceder a un tenant específico
 * 
 * @param userEmail - El email del usuario
 * @param tenantId - El ID del tenant
 * @returns true si el usuario puede acceder al tenant
 */
export async function canAccessTenant(userEmail: string, tenantId: string): Promise<boolean> {
  if (!userEmail || !tenantId) {
    return false;
  }

  // Super admin puede acceder a todos los tenants
  const isSuper = await isSuperAdmin(userEmail);
  if (isSuper) {
    return true;
  }

  try {
    // Verificar si el usuario pertenece al tenant
    const user = await prisma.user.findFirst({
      where: {
        email: userEmail.toLowerCase(),
        tenantId: tenantId,
        isActive: true,
      },
    });

    if (user) {
      return true;
    }

    // Verificar si es admin del tenant
    const admin = await prisma.adminWhitelist.findFirst({
      where: {
        email: userEmail.toLowerCase(),
        tenantId: tenantId,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return !!admin;
  } catch (error) {
    console.error('[TenantContext] Error verificando acceso a tenant:', error);
    return false;
  }
}

/**
 * Limpia el cache de tenants (útil para tests o cuando se actualiza un tenant)
 * 
 * @param slug - Si se proporciona, limpia solo ese tenant. Si no, limpia todo el cache.
 */
export function clearTenantCache(slug?: string): void {
  if (slug) {
    tenantCache.delete(`slug:${slug}`);
    // También buscar por ID si tenemos el slug en cache
    // Esto es una simplificación - en producción podríamos mantener un mapa slug->id
  } else {
    tenantCache.clear();
  }
}



