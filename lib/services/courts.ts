import { prisma } from '@/lib/prisma'
import type { Court } from '@/types/types'

export interface CreateCourtData {
  name: string
  description?: string
  basePrice: number
  priceMultiplier?: number
  features?: string[]
  operatingHours?: {
    start: string
    end: string
    slot_duration: number
  }
}

export interface UpdateCourtData {
  name?: string
  description?: string
  basePrice?: number
  priceMultiplier?: number
  features?: string // JSON string in database
  operatingHours?: string // JSON string in database
  isActive?: boolean
}

// Helper function to transform Prisma court data to Court type
function transformCourtData(court: any): Court {
  // Parse features from JSON string if needed
  let features: string[] = []
  try {
    if (Array.isArray(court.features)) {
      features = court.features
    } else if (typeof court.features === 'string') {
      features = JSON.parse(court.features || '[]')
    }
  } catch {
    features = []
  }

  // Generate colors based on court name or ID
  const getCourtColors = (courtId: string, courtName: string) => {
    const name = courtName.toLowerCase()
    if (name.includes('a') || courtId === 'court-a') {
      return {
        color: '#8b5cf6',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700'
      }
    } else if (name.includes('b') || courtId === 'court-b') {
      return {
        color: '#ef4444',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      }
    } else {
      return {
        color: '#22c55e',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      }
    }
  }

  const colors = getCourtColors(court.id, court.name)

  return {
    id: court.id,
    name: court.name,
    description: court.description || '',
    features,
    priceMultiplier: court.priceMultiplier || 1,
    color: colors.color,
    bgColor: colors.bgColor,
    textColor: colors.textColor,
    base_price: court.basePrice,
    isActive: court.isActive
  }
}

// Obtener todas las canchas activas
export async function getCourts(): Promise<Court[]> {
  try {
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return courts.map(transformCourtData)
  } catch (error) {
    console.error('Error obteniendo canchas:', error)
    throw new Error('Error al obtener las canchas')
  }
}

// Obtener cancha por ID
export async function getCourtById(id: string): Promise<Court | null> {
  try {
    const court = await prisma.court.findUnique({
      where: { id }
    })
    return court ? transformCourtData(court) : null
  } catch (error) {
    console.error('Error obteniendo cancha:', error)
    throw new Error('Error al obtener la cancha')
  }
}

// Crear nueva cancha
export async function createCourt(data: CreateCourtData): Promise<Court> {
  try {
    const court = await prisma.court.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        priceMultiplier: data.priceMultiplier || 1.0,
        features: JSON.stringify(data.features || []),
        operatingHours: JSON.stringify(data.operatingHours || {
          start: "00:00",
          end: "23:00",
          slot_duration: 90
        })
      }
    })
    return transformCourtData(court)
  } catch (error) {
    console.error('Error creando cancha:', error)
    throw new Error('Error al crear la cancha')
  }
}

// Actualizar cancha
export async function updateCourt(id: string, data: UpdateCourtData): Promise<Court> {
  try {
    const court = await prisma.court.update({
      where: { id },
      data
    })
    return transformCourtData(court)
  } catch (error) {
    console.error('Error actualizando cancha:', error)
    throw new Error('Error al actualizar la cancha')
  }
}

// Desactivar cancha (soft delete)
export async function deactivateCourt(id: string): Promise<Court> {
  try {
    const court = await prisma.court.update({
      where: { id },
      data: { isActive: false }
    })
    return transformCourtData(court)
  } catch (error) {
    console.error('Error desactivando cancha:', error)
    throw new Error('Error al desactivar la cancha')
  }
}

// Verificar disponibilidad de cancha
export async function checkCourtAvailability(
  courtId: string,
  date: Date,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: date,
        status: {
          not: 'CANCELLED'
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    })

    return !conflictingBooking
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    throw new Error('Error al verificar disponibilidad')
  }
}
