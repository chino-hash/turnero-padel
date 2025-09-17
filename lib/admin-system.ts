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
  const filteredEmails = envAdmins.filter(email => email.length > 0)
  // Eliminar duplicados manteniendo el orden original
  return removeDuplicates(filteredEmails)
}

// Obtener administradores desde base de datos
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

// Agregar nuevo administrador (solo administradores pueden hacer esto)
export const addAdmin = async (
  newAdminEmail: string, 
  addedByEmail: string, 
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return { success: false, message: 'Función no disponible en el navegador' }
  }
  
  try {
    // Verificar que quien agrega sea administrador
    const isAuthorized = await isAdminEmail(addedByEmail)
    if (!isAuthorized) {
      return { success: false, message: 'No tienes permisos para agregar administradores' }
    }
    
    const normalizedEmail = newAdminEmail.toLowerCase().trim()
    
    // Verificar que el email no esté ya en la lista
    const existing = await prisma.adminWhitelist.findUnique({
      where: { email: normalizedEmail }
    })
    
    if (existing) {
      if (existing.isActive) {
        return { success: false, message: 'Este email ya es administrador' }
      } else {
        // Reactivar administrador existente
        await prisma.adminWhitelist.update({
          where: { email: normalizedEmail },
          data: { 
            isActive: true, 
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
        addedBy: addedByEmail,
        notes: notes || 'Agregado por administrador',
        isActive: true
      }
    })
    
    // Limpiar cache
    adminCache = null
    
    // Log de auditoría
    console.log(`🔐 Nuevo administrador agregado: ${normalizedEmail} por ${addedByEmail}`)
    
    return { success: true, message: 'Administrador agregado exitosamente' }
    
  } catch (error) {
    console.error('Error agregando administrador:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// Remover administrador (solo administradores pueden hacer esto)
export const removeAdmin = async (
  adminEmailToRemove: string, 
  removedByEmail: string
): Promise<{ success: boolean; message: string }> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return { success: false, message: 'Función no disponible en el navegador' }
  }
  
  try {
    // Verificar que quien remueve sea administrador
    const isAuthorized = await isAdminEmail(removedByEmail)
    if (!isAuthorized) {
      return { success: false, message: 'No tienes permisos para remover administradores' }
    }
    
    const normalizedEmail = adminEmailToRemove.toLowerCase().trim()
    
    // No permitir remover administradores principales (de env)
    const envAdmins = getEnvAdmins()
    if (envAdmins.includes(normalizedEmail)) {
      return { success: false, message: 'No se pueden remover administradores principales' }
    }
    
    // No permitir auto-remoción
    if (normalizedEmail === removedByEmail.toLowerCase().trim()) {
      return { success: false, message: 'No puedes removerte a ti mismo' }
    }
    
    // Desactivar administrador
    const updated = await prisma.adminWhitelist.updateMany({
      where: { 
        email: normalizedEmail,
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
    console.log(`🔐 Administrador removido: ${normalizedEmail} por ${removedByEmail}`)
    
    return { success: true, message: 'Administrador removido exitosamente' }
    
  } catch (error) {
    console.error('Error removiendo administrador:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// Listar todos los administradores (para panel de admin)
export const listAdmins = async (): Promise<{
  envAdmins: string[]
  dbAdmins: Array<{
    email: string
    isActive: boolean
    addedBy: string | null
    notes: string | null
    createdAt: Date
  }>
}> => {
  const prisma = await getPrisma()
  if (!prisma) {
    return { envAdmins: getEnvAdmins(), dbAdmins: [] }
  }
  
  try {
    const envAdmins = getEnvAdmins()
    const dbAdmins = await prisma.adminWhitelist.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return { envAdmins, dbAdmins }
  } catch (error) {
    console.error('Error listando administradores:', error)
    return { envAdmins: getEnvAdmins(), dbAdmins: [] }
  }
}

// Determinar rol del usuario
export const determineUserRole = async (email: string): Promise<'admin' | 'user'> => {
  const isAdmin = await isAdminEmail(email)
  return isAdmin ? 'admin' : 'user'
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
