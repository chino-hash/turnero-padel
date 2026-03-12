import { removeDuplicates, mergeArraysUnique } from './utils/array-utils'
import { env, getAdminConfig, isDevelopment } from "./config/env"

const adminConfig = getAdminConfig()

// Función para obtener prisma de forma segura
const getPrisma = async () => {
  if (typeof window !== 'undefined') {
    return null // No disponible en el navegador
  }
  
  try {
    const { prisma } = await import('@/lib/database/neon-config')
    return prisma
  } catch (error) {
    console.error('Error importando prisma:', error)
    return null
  }
}

/**
 * Sistema flexible de administradores
 * 
 * Prioridad:
 * 1. Base de datos (AdminWhitelist) - Permite gestión dinámica
 * 2. Variable de entorno (ADMIN_EMAILS) - Fallback y administradores principales
 * 
 * Características:
 * - Administradores principales siempre activos (desde env)
 * - Administradores dinámicos desde base de datos
 * - Cache para optimizar rendimiento
 * - Logs de acceso para auditoría
 */

// Cache para optimizar consultas
let adminCache: Set<string> | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Función para limpiar el cache (útil para tests)
export const clearAdminCache = (): void => {
  adminCache = null
  cacheExpiry = 0
}

// Administradores principales desde variable de entorno (siempre activos)
const getEnvAdmins = (): string[] => {
  const envAdmins = adminConfig.emails || []
  const filteredEmails = envAdmins.filter((email: string) => email.length > 0)
  // Eliminar duplicados manteniendo el orden original
  return removeDuplicates(filteredEmails)
}

// Obtener administradores desde base de datos (deprecated - usar funciones específicas por tenant)
const getDbAdmins = async (): Promise<string[]> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return []
  }
  
  try {
    const admins = await prisma.adminWhitelist.findMany({
      where: { isActive: true },
      select: { email: true }
    })
    const emails = admins.map((admin: { email: string }) => admin.email.toLowerCase())
    // Eliminar duplicados que puedan existir en la base de datos
    return removeDuplicates(emails)
  } catch (error) {
    console.error('Error obteniendo administradores de BD:', error)
    return []
  }
}

/**
 * Verifica si un email es super admin (tenantId null en AdminWhitelist o SUPER_ADMIN_EMAILS)
 */
export const isSuperAdmin = async (email: string): Promise<boolean> => {
  if (!email) return false
  
  // Primero verificar en variables de entorno (más rápido y no requiere BD)
  try {
    const { getSuperAdminConfig } = await import('./config/env')
    const superAdminConfig = getSuperAdminConfig()
    const superAdminEmails = superAdminConfig.emails || []
    if (superAdminEmails.map((e: string) => e.toLowerCase()).includes(email.toLowerCase())) {
      return true
    }
  } catch (error) {
    // Si hay error al leer config, continuar con verificación en BD
  }
  
  const prisma = await getPrisma()
  if (!prisma) {
    // Fallback: verificar en variables de entorno directamente
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    return superAdminEmails.includes(email.toLowerCase())
  }
  
  try {
    const admin = await prisma.adminWhitelist.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: null, // Super admin tiene tenantId null
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    })

    if (admin) return true

    // Último fallback: variable de entorno directa (por si env/config falló)
    const envEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) || []
    return envEmails.includes(email.toLowerCase())
  } catch (error) {
    console.error('[AdminSystem] Error verificando super admin:', email, error)
    // Fallback a env cuando la BD falla (ej. en cold start o errores de conexión)
    const envEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) || []
    return envEmails.includes(email.toLowerCase())
  }
}

/**
 * Verifica si un email es admin de un tenant específico
 */
export const isAdminForTenant = async (email: string, tenantId: string): Promise<boolean> => {
  if (!email || !tenantId) return false
  
  const prisma = await getPrisma()
  if (!prisma) {
    return false
  }
  
  try {
    const admin = await prisma.adminWhitelist.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenantId,
        role: 'ADMIN',
        isActive: true,
      },
    })
    
    return !!admin
  } catch (error) {
    console.error('Error verificando admin de tenant:', error)
    return false
  }
}

/**
 * Devuelve los IDs de tenants donde el usuario es ADMIN (activo).
 * Útil para asignar al usuario al tenant correcto cuando entra sin tenantSlug
 * (p. ej. owner creado desde super-admin que aún no entró por la URL del club).
 */
export const getTenantIdsWhereUserIsAdmin = async (email: string): Promise<string[]> => {
  if (!email) return []
  const prisma = await getPrisma()
  if (!prisma) return []
  try {
    const rows = await prisma.adminWhitelist.findMany({
      where: {
        email: email.toLowerCase(),
        role: 'ADMIN',
        isActive: true,
        tenantId: { not: null },
      },
      select: { tenantId: true },
    })
    return rows.map((r) => r.tenantId as string).filter(Boolean)
  } catch (error) {
    console.error('Error obteniendo tenants donde usuario es admin:', error)
    return []
  }
}

/**
 * Verifica si un usuario puede acceder a un tenant específico
 * - Super admin puede acceder a todos
 * - Admin de tenant solo puede acceder a su tenant
 * - User solo puede acceder a su tenant
 */
export const canAccessTenant = async (userEmail: string, tenantId: string): Promise<boolean> => {
  if (!userEmail || !tenantId) return false
  
  // Super admin puede acceder a todos
  const isSuper = await isSuperAdmin(userEmail)
  if (isSuper) {
    return true
  }
  
  const prisma = await getPrisma()
  if (!prisma) {
    return false
  }
  
  try {
    // Verificar si el usuario pertenece al tenant
    const user = await prisma.user.findFirst({
      where: {
        email: userEmail.toLowerCase(),
        tenantId: tenantId,
        isActive: true,
      },
    })
    
    if (user) {
      return true
    }
    
    // Verificar si es admin del tenant
    return await isAdminForTenant(userEmail, tenantId)
  } catch (error) {
    console.error('Error verificando acceso a tenant:', error)
    return false
  }
}

// Obtener todos los administradores (env + db) con cache
export const getAllAdmins = async (): Promise<Set<string>> => {
  const now = Date.now()
  
  // Usar cache si está vigente
  if (adminCache && now < cacheExpiry) {
    return adminCache
  }
  
  // Obtener administradores de ambas fuentes
  const envAdmins = getEnvAdmins()
  const dbAdmins = await getDbAdmins()
  
  // Combinar eliminando duplicados y crear cache
  const uniqueAdmins = mergeArraysUnique(envAdmins, dbAdmins)
  const allAdmins = new Set(uniqueAdmins)
  adminCache = allAdmins
  cacheExpiry = now + CACHE_DURATION
  
  return allAdmins
}

// Verificar si un email es administrador
export const isAdminEmail = async (email: string): Promise<boolean> => {
  if (!email) return false
  
  const adminEmails = adminConfig.emails
  if (!adminEmails) return false
  
  return adminEmails.includes(email.toLowerCase())
}

// Verificar si un email es administrador (versión síncrona para casos especiales)
export const isAdminEmailSync = (email: string): boolean => {
  if (!email) return false
  
  const normalizedEmail = email.toLowerCase().trim()
  const envAdmins = getEnvAdmins()
  
  return envAdmins.includes(normalizedEmail)
}

// Agregar nuevo administrador (solo super admins o admins del tenant pueden hacer esto)
export const addAdmin = async (
  newAdminEmail: string, 
  addedByEmail: string, 
  notes?: string,
  tenantId?: string | null,
  role: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'
): Promise<{ success: boolean; message: string }> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return { success: false, message: 'Función no disponible en el navegador' }
  }
  
  try {
    // Verificar permisos
    if (tenantId) {
      // Verificar si es admin del tenant o super admin
      const isAdmin = await isAdminForTenant(addedByEmail, tenantId)
      const isSuper = await isSuperAdmin(addedByEmail)
      if (!isAdmin && !isSuper) {
        return { success: false, message: 'No tienes permisos para agregar administradores a este tenant' }
      }
      // Solo super admin puede crear SUPER_ADMIN
      if (role === 'SUPER_ADMIN' && !isSuper) {
        return { success: false, message: 'Solo super admins pueden crear otros super admins' }
      }
    } else {
      // Solo super admin puede agregar super admins (tenantId null)
      const isSuper = await isSuperAdmin(addedByEmail)
      if (!isSuper) {
        return { success: false, message: 'Solo super admins pueden crear otros super admins' }
      }
      role = 'SUPER_ADMIN' // Forzar SUPER_ADMIN si tenantId es null
    }
    
    const normalizedEmail = newAdminEmail.toLowerCase().trim()
    
    // Verificar que el email no esté ya en la lista
    const existing = await prisma.adminWhitelist.findFirst({
      where: { 
        email: normalizedEmail,
        tenantId: tenantId !== undefined ? (tenantId || null) : undefined
      }
    })
    
    if (existing) {
      if (existing.isActive) {
        return { success: false, message: 'Este email ya es administrador' }
      } else {
        // Reactivar administrador existente
        await prisma.adminWhitelist.update({
          where: { id: existing.id },
          data: { 
            isActive: true, 
            role: role,
            addedBy: addedByEmail,
            notes: notes || 'Reactivado',
            updatedAt: new Date()
          }
        })
        
        // Limpiar cache
        adminCache = null
        
        return { success: true, message: 'Administrador reactivado exitosamente' }
      }
    }
    
    // Crear nuevo administrador
    await prisma.adminWhitelist.create({
      data: {
        email: normalizedEmail,
        tenantId: tenantId || null,
        role: role,
        addedBy: addedByEmail,
        notes: notes || 'Agregado por administrador',
        isActive: true
      }
    })
    
    // Limpiar cache
    adminCache = null
    
    // Log de auditoría
    console.log(`🔐 Nuevo administrador agregado: ${normalizedEmail} por ${addedByEmail} (tenant: ${tenantId || 'global'}, role: ${role})`)
    
    return { success: true, message: 'Administrador agregado exitosamente' }
    
  } catch (error) {
    console.error('Error agregando administrador:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// Remover administrador (solo super admins o admins del tenant pueden hacer esto)
export const removeAdmin = async (
  adminEmailToRemove: string, 
  removedByEmail: string,
  tenantId?: string | null
): Promise<{ success: boolean; message: string }> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return { success: false, message: 'Función no disponible en el navegador' }
  }
  
  try {
    // Verificar permisos
    if (tenantId) {
      // Verificar si es admin del tenant o super admin
      const isAdmin = await isAdminForTenant(removedByEmail, tenantId)
      const isSuper = await isSuperAdmin(removedByEmail)
      if (!isAdmin && !isSuper) {
        return { success: false, message: 'No tienes permisos para remover administradores de este tenant' }
      }
    } else {
      // Solo super admin puede remover super admins
      const isSuper = await isSuperAdmin(removedByEmail)
      if (!isSuper) {
        return { success: false, message: 'Solo super admins pueden remover otros super admins' }
      }
    }
    
    const normalizedEmail = adminEmailToRemove.toLowerCase().trim()
    
    // No permitir auto-remoción
    if (normalizedEmail === removedByEmail.toLowerCase().trim()) {
      return { success: false, message: 'No puedes removerte a ti mismo' }
    }
    
    // Desactivar administrador
    const updated = await prisma.adminWhitelist.updateMany({
      where: { 
        email: normalizedEmail,
        tenantId: tenantId !== undefined ? (tenantId || null) : undefined,
        isActive: true 
      },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    })
    
    if (updated.count === 0) {
      return { success: false, message: 'Administrador no encontrado o ya inactivo' }
    }
    
    // Limpiar cache
    adminCache = null
    
    // Log de auditoría
    console.log(`🔐 Administrador removido: ${normalizedEmail} por ${removedByEmail} (tenant: ${tenantId || 'global'})`)
    
    return { success: true, message: 'Administrador removido exitosamente' }
    
  } catch (error) {
    console.error('Error removiendo administrador:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// Listar todos los administradores (para panel de admin)
export const listAdmins = async (tenantId?: string | null): Promise<Array<{
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  tenantId: string | null
  isActive: boolean
  addedBy: string | null
  notes: string | null
  createdAt: Date
}>> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return []
  }
  
  try {
    // Construir filtro where
    const where: any = {}
    
    if (tenantId !== undefined) {
      // Si se especifica tenantId, filtrar por él (null = solo super admins)
      where.tenantId = tenantId
    }
    // Si tenantId es undefined, no filtrar (todos los admins)
    
    const dbAdmins = await prisma.adminWhitelist.findMany({
      where,
      select: {
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        addedBy: true,
        notes: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Cast del tipo ya que AdminWhitelist solo debería tener ADMIN o SUPER_ADMIN
    return dbAdmins as Array<{
      email: string
      role: 'ADMIN' | 'SUPER_ADMIN'
      tenantId: string | null
      isActive: boolean
      addedBy: string | null
      notes: string | null
      createdAt: Date
    }>
  } catch (error) {
    console.error('Error listando administradores:', error)
    return []
  }
}

// Determinar rol del usuario (deprecated - usar getUserRole con tenantId)
export const determineUserRole = async (email: string): Promise<'admin' | 'user'> => {
  const isAdmin = await isAdminEmail(email)
  return isAdmin ? 'admin' : 'user'
}

/**
 * Determina el rol completo del usuario (SUPER_ADMIN, ADMIN, USER)
 */
export const getUserRole = async (email: string, tenantId?: string | null): Promise<'SUPER_ADMIN' | 'ADMIN' | 'USER'> => {
  if (!email) return 'USER'
  
  // Verificar si es super admin
  const isSuper = await isSuperAdmin(email)
  if (isSuper) {
    return 'SUPER_ADMIN'
  }
  
  // Si hay tenantId, verificar si es admin del tenant
  if (tenantId) {
    const isAdmin = await isAdminForTenant(email, tenantId)
    if (isAdmin) {
      return 'ADMIN'
    }
  }
  
  return 'USER'
}

// Log de acceso administrativo
export const logAdminAccess = (
  email: string, 
  granted: boolean, 
  method: 'email' | 'google' = 'google',
  action?: string
) => {
  if (isDevelopment) {
    console.log('🔐 Admin Access Log:', {
      email,
      granted,
      method,
      action,
      timestamp: new Date().toISOString()
    })
  }
}
