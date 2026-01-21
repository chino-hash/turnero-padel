import { prisma } from '../database/neon-config'
import type { User } from '../../types/types'

// Tipo para roles de usuario
export type Role = 'USER' | 'ADMIN'

export interface UpdateUserData {
  name?: string
  phone?: string
  role?: Role
  isActive?: boolean
}

export interface UserWithStats extends User {
  _count: {
    bookings: number
  }
}

// Helper function to transform Prisma user data to User type
function transformUserData(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0], // Use email prefix if name is null
    phone: user.phone || undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

// Helper function to transform Prisma user data with stats to UserWithStats type
function transformUserWithStatsData(user: any): UserWithStats {
  return {
    ...transformUserData(user),
    _count: {
      bookings: user._count?.bookings || 0
    }
  }
}

// Obtener usuario por ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    })
    return user ? transformUserData(user) : null
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    throw new Error('Error al obtener el usuario')
  }
}

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Usar findFirst porque email ahora es parte de un índice compuesto (email, tenantId)
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    })
    return user ? transformUserData(user) : null
  } catch (error) {
    console.error('Error obteniendo usuario por email:', error)
    throw new Error('Error al obtener el usuario')
  }
}

// Obtener todos los usuarios (admin)
export async function getAllUsers(): Promise<UserWithStats[]> {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return users.map(transformUserWithStatsData)
  } catch (error) {
    console.error('Error obteniendo todos los usuarios:', error)
    throw new Error('Error al obtener los usuarios')
  }
}

// Actualizar usuario
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data
    })
    return transformUserData(user)
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    throw new Error('Error al actualizar el usuario')
  }
}

// Actualizar último login
export async function updateLastLogin(id: string): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    })
    return transformUserData(user)
  } catch (error) {
    console.error('Error actualizando último login:', error)
    throw new Error('Error al actualizar último login')
  }
}

// Desactivar usuario
export async function deactivateUser(id: string): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
    return transformUserData(user)
  } catch (error) {
    console.error('Error desactivando usuario:', error)
    throw new Error('Error al desactivar el usuario')
  }
}

// Activar usuario
export async function activateUser(id: string): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true }
    })
    return transformUserData(user)
  } catch (error) {
    console.error('Error activando usuario:', error)
    throw new Error('Error al activar el usuario')
  }
}

// Obtener estadísticas de usuario
export async function getUserStats(id: string) {
  try {
    const [totalBookings, activeBookings, completedBookings, cancelledBookings] = await Promise.all([
      prisma.booking.count({
        where: { userId: id }
      }),
      prisma.booking.count({
        where: { 
          userId: id,
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
        }
      }),
      prisma.booking.count({
        where: { 
          userId: id,
          status: 'COMPLETED'
        }
      }),
      prisma.booking.count({
        where: { 
          userId: id,
          status: 'CANCELLED'
        }
      })
    ])

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuario:', error)
    throw new Error('Error al obtener las estadísticas')
  }
}

// Buscar usuarios
export async function searchUsers(query: string): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } }
        ]
      },
      orderBy: { name: 'asc' },
      take: 20
    })
    return users.map(transformUserData)
  } catch (error) {
    console.error('Error buscando usuarios:', error)
    throw new Error('Error al buscar usuarios')
  }
}

/**
 * Asegura que un usuario existe en la base de datos
 * Si no existe, lo crea con el tenantId proporcionado
 * Si existe, actualiza name/image si cambió
 * 
 * @param email - Email del usuario
 * @param name - Nombre del usuario
 * @param image - URL de la imagen del usuario
 * @param tenantId - ID del tenant al que pertenece el usuario
 * @returns Usuario creado o actualizado
 */
export async function ensureUserExists(
  email: string,
  name: string | null,
  image: string | null,
  tenantId: string
): Promise<any> {
  if (!email || !tenantId) {
    throw new Error('Email y tenantId son requeridos')
  }

  try {
    // Verificar que el tenant existe y está activo
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true }
    })

    if (!tenant) {
      throw new Error(`Tenant con ID ${tenantId} no existe`)
    }

    if (!tenant.isActive) {
      throw new Error(`Tenant con ID ${tenantId} está inactivo`)
    }

    // Usar upsert para crear o actualizar el usuario
    // El constraint único [email, tenantId] asegura que no haya duplicados
    const user = await prisma.user.upsert({
      where: {
        email_tenantId: {
          email: email.toLowerCase(),
          tenantId: tenantId
        }
      },
      update: {
        name: name || undefined,
        image: image || undefined,
        emailVerified: new Date(), // Marcar email como verificado si viene de OAuth
      },
      create: {
        email: email.toLowerCase(),
        name: name,
        image: image,
        tenantId: tenantId,
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
      },
    })

    return user
  } catch (error: any) {
    console.error('Error en ensureUserExists:', error)
    
    // Si es un error de constraint único, intentar obtener el usuario existente
    if (error.code === 'P2002') {
      const existingUser = await prisma.user.findUnique({
        where: {
          email_tenantId: {
            email: email.toLowerCase(),
            tenantId: tenantId
          }
        }
      })
      if (existingUser) {
        return existingUser
      }
    }
    
    throw new Error(`Error al crear/actualizar usuario: ${error.message}`)
  }
}