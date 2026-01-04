/**
 * Helpers de permisos para validar acceso cross-tenant
 * Incluye funciones para verificar permisos de super admin, admin de tenant, y usuarios
 */

import { isSuperAdmin, isAdminForTenant, canAccessTenant as canAccessTenantHelper } from '../admin-system';
import { getUserTenantId } from '../tenant/context';

export interface User {
  id?: string;
  email?: string | null;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  tenantId?: string | null;
}

/**
 * Verifica si un usuario es super admin
 */
export async function isSuperAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user || !user.email) {
    return false;
  }

  // Si ya tiene el flag isSuperAdmin, usarlo
  if (user.isSuperAdmin !== undefined) {
    return user.isSuperAdmin;
  }

  // Si tiene el rol, verificar
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Verificar en la base de datos
  return await isSuperAdmin(user.email);
}

/**
 * Verifica si un usuario puede acceder a un tenant específico
 * - Super admin puede acceder a todos
 * - Admin de tenant solo puede acceder a su tenant
 * - User solo puede acceder a su tenant
 */
export async function canAccessTenant(
  user: User | null | undefined,
  tenantId: string
): Promise<boolean> {
  if (!user || !user.email || !tenantId) {
    return false;
  }

  // Super admin puede acceder a todos
  const isSuper = await isSuperAdminUser(user);
  if (isSuper) {
    return true;
  }

  // Verificar si el usuario puede acceder al tenant
  return await canAccessTenantHelper(user.email, tenantId);
}

/**
 * Verifica si un usuario puede gestionar admins de un tenant
 * - Super admin puede gestionar admins de todos los tenants
 * - Admin de tenant puede gestionar admins de su tenant
 * - User no puede gestionar admins
 */
export async function canManageAdmins(
  user: User | null | undefined,
  tenantId?: string | null
): Promise<boolean> {
  if (!user || !user.email) {
    return false;
  }

  // Super admin puede gestionar admins de todos los tenants
  const isSuper = await isSuperAdminUser(user);
  if (isSuper) {
    return true;
  }

  // Si no hay tenantId, solo super admin puede gestionar
  if (!tenantId) {
    return false;
  }

  // Admin de tenant puede gestionar admins de su tenant
  return await isAdminForTenant(user.email, tenantId);
}

/**
 * Obtiene la lista de tenants a los que un usuario puede acceder
 * - Super admin: todos los tenants activos
 * - Admin/User: solo su tenant
 */
export async function getAccessibleTenants(user: User | null | undefined): Promise<string[]> {
  if (!user || !user.email) {
    return [];
  }

  const isSuper = await isSuperAdminUser(user);
  
  if (isSuper) {
    // Super admin puede acceder a todos los tenants activos
    try {
      const { prisma } = await import('../database/neon-config');
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      return tenants.map((t) => t.id);
    } catch (error) {
      console.error('[Permissions] Error obteniendo tenants:', error);
      return [];
    }
  }

  // Admin/User solo puede acceder a su tenant
  const tenantId = user.tenantId || (user.id ? await getUserTenantId(user.id) : null);
  return tenantId ? [tenantId] : [];
}

/**
 * Verifica si un usuario puede realizar una operación en un recurso de un tenant
 * Combina verificación de acceso al tenant con permisos de operación
 */
export async function canPerformOperation(
  user: User | null | undefined,
  tenantId: string,
  operation: 'read' | 'create' | 'update' | 'delete',
  resourceType?: string
): Promise<boolean> {
  if (!user || !user.email) {
    return false;
  }

  // Verificar acceso al tenant primero
  const hasAccess = await canAccessTenant(user, tenantId);
  if (!hasAccess) {
    return false;
  }

  // Super admin puede hacer todo
  const isSuper = await isSuperAdminUser(user);
  if (isSuper) {
    return true;
  }

  // Para operaciones de lectura, cualquier usuario del tenant puede leer
  if (operation === 'read') {
    return true;
  }

  // Para operaciones de modificación, solo admin puede hacerlo
  // (los usuarios pueden crear/actualizar sus propias reservas, pero eso se maneja en los servicios)
  if (operation === 'create' || operation === 'update') {
    // Los usuarios pueden crear/actualizar sus propios recursos (se valida en servicios específicos)
    return true;
  }

  // Para delete, solo admin
  if (operation === 'delete') {
    const userTenantId = user.tenantId || (user.id ? await getUserTenantId(user.id) : null);
    if (userTenantId !== tenantId) {
      return false;
    }
    return await isAdminForTenant(user.email, tenantId);
  }

  return false;
}

/**
 * Obtiene el tenantId del usuario desde la sesión o la base de datos
 */
export async function getUserTenantIdSafe(user: User | null | undefined): Promise<string | null> {
  if (!user) {
    return null;
  }

  // Si ya tiene tenantId en la sesión, usarlo
  if (user.tenantId) {
    return user.tenantId;
  }

  // Si tiene id, obtener desde la base de datos
  if (user.id) {
    return await getUserTenantId(user.id);
  }

  return null;
}



