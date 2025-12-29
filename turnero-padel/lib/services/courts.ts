import { prisma } from '../database/neon-config'
import type { Court, CourtFeatures, OperatingHours } from '../../types/types'

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
  // Parse features JSON (colors), con fallback a colores derivados
  let features: CourtFeatures | null = null
  try {
    if (court.features && typeof court.features === 'string') {
      const parsed = JSON.parse(court.features)
      if (parsed && typeof parsed === 'object' && parsed.color && parsed.bgColor && parsed.textColor) {
        features = {
          color: String(parsed.color),
          bgColor: String(parsed.bgColor),
          textColor: String(parsed.textColor)
        }
      }
    }
  } catch {
    // ignore JSON parse errors
  }

  const getCourtColors = (courtId: string, courtName: string) => {
    const name = (courtName || '').toLowerCase().trim()
    const m = name.match(/cancha\s*(\d+)/i)
    let n = m ? Number(m[1]) : 0
    if (!n) {
      if (courtId === 'cmew6nvsd0001u2jcngxgt8au' || name.includes(' a') || name.startsWith('a')) n = 1
      else if (courtId === 'cmew6nvsd0002u2jcc24nirbn' || name.includes(' b') || name.startsWith('b')) n = 2
      else if (courtId === 'cmew6nvi40000u2jcmer3av60' || name.includes(' c') || name.startsWith('c')) n = 3
    }
    const palette = [
      { color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
      { color: 'from-red-400 to-red-600', bgColor: 'bg-red-100', textColor: 'text-red-700' },
      { color: 'from-green-400 to-green-600', bgColor: 'bg-green-100', textColor: 'text-green-700' },
      { color: 'from-orange-400 to-orange-600', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
      { color: 'from-pink-400 to-pink-600', bgColor: 'bg-pink-100', textColor: 'text-pink-700' },
      { color: 'from-cyan-400 to-cyan-600', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' },
      { color: 'from-gray-300 to-gray-500', bgColor: 'bg-gray-200', textColor: 'text-gray-700' }
    ]
    if (!n || n < 1) n = 3
    const idx = (n - 1) % palette.length
    return palette[idx]
  }

  const colors = getCourtColors(court.id, court.name)

  // Parse operatingHours JSON desde DB string, con fallback seguro
  let operatingHours: OperatingHours = { start: '00:00', end: '23:00', slot_duration: 90 }
  try {
    if (court.operatingHours && typeof court.operatingHours === 'string') {
      const oh = JSON.parse(court.operatingHours)
      if (oh && typeof oh === 'object' && oh.start && oh.end && oh.slot_duration) {
        operatingHours = {
          start: String(oh.start),
          end: String(oh.end),
          slot_duration: Number(oh.slot_duration) || 90
        }
      }
    }
  } catch {
    // keep default
  }

  return {
    id: court.id,
    name: court.name,
    description: court.description || null,
    features: features || {
      color: colors.color,
      bgColor: colors.bgColor,
      textColor: colors.textColor
    },
    priceMultiplier: court.priceMultiplier || 1,
    color: colors.color,
    bgColor: colors.bgColor,
    textColor: colors.textColor,
    basePrice: Math.round((court.basePrice ?? 0) / 100),
    isActive: Boolean(court.isActive),
    operatingHours
  }
}

// Normaliza el nombre para obtener el "nombre canónico" (ej: "Cancha 1")
function canonicalCourtName(name: string): string {
  const base = (name || '').trim()
  // Si viene con sufijo ("Cancha 1 - Premium"), tomar la parte anterior al guión
  const dashIdx = base.indexOf(' - ')
  const leading = dashIdx !== -1 ? base.slice(0, dashIdx).trim() : base
  // Detectar "Cancha N"
  const m = leading.match(/cancha\s*(\d+)/i)
  if (m) return `Cancha ${m[1]}`
  // Detectar alias tipo "Court A/B/C"
  const m2 = leading.match(/court\s*([abc])/i)
  if (m2) {
    const map: Record<string, string> = { a: 'Cancha 1', b: 'Cancha 2', c: 'Cancha 3' }
    return map[m2[1].toLowerCase()] || leading
  }
  return leading
}

// Obtener todas las canchas activas
export async function getCourts(): Promise<Court[]> {
  try {
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    // Deduplicar por nombre canónico
    const groups = new Map<string, any[]>()
    for (const c of courts) {
      const canon = canonicalCourtName(c.name)
      const arr = groups.get(canon) || []
      arr.push(c)
      groups.set(canon, arr)
    }

    const selected: any[] = []
    for (const [canon, items] of groups) {
      // Preferir el que tenga nombre exactamente igual al canónico
      const exact = items.find(it => canonicalCourtName(it.name).toLowerCase() === canon.toLowerCase() && it.name.trim().toLowerCase() === canon.toLowerCase())
      if (exact) {
        selected.push(exact)
        continue
      }
      // En su defecto, el más antiguo (probablemente el original)
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      selected.push(items[0])
    }

    // Transformar y ordenar por nombre
    return selected.map(transformCourtData).sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error obteniendo canchas:', error)
    throw new Error('Error al obtener las canchas')
  }
}

// Obtener todas las canchas (para administraci�n)
export async function getAllCourts(): Promise<Court[]> {
  try {
    const courts = await prisma.court.findMany({
      orderBy: { name: 'asc' }
    })
    return courts.map(transformCourtData)
  } catch (error) {
    console.error('Error obteniendo todas las canchas:', error)
    throw new Error('Error al obtener todas las canchas')
  }
}

// Obtener cancha por ID
export async function getCourtById(id: string): Promise<Court | null> {
  try {
    // Intento directo por ID
    const court = await prisma.court.findUnique({ where: { id } })
    if (court) return transformCourtData(court)

    // Fallback: mapear IDs antiguos y alias a nombres canónicos
    const idToCanonicalName: Record<string, string> = {
      'cmew6nvsd0001u2jcngxgt8au': 'Cancha 1',
      'cmew6nvsd0002u2jcc24nirbn': 'Cancha 2',
      'cmew6nvi40000u2jcmer3av60': 'Cancha 3',
      'court-a': 'Cancha 1',
      'court-b': 'Cancha 2',
      'court-c': 'Cancha 3'
    }
    const canonicalName = idToCanonicalName[id]
    if (!canonicalName) return null

    // Preferir cancha activa con ese nombre
    const activeByName = await prisma.court.findFirst({
      where: { name: canonicalName, isActive: true }
    })
    if (activeByName) return transformCourtData(activeByName)

    // Último recurso: cualquier cancha con ese nombre
    const anyByName = await prisma.court.findFirst({ where: { name: canonicalName } })
    return anyByName ? transformCourtData(anyByName) : null
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
        basePrice: Math.round(data.basePrice * 100),
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
    // Preparar datos para Prisma, convirtiendo basePrice si est� presente
    const prismaData: any = { ...data }
    if (data.basePrice !== undefined) {
      prismaData.basePrice = Math.round(data.basePrice * 100)
    }
    
    const court = await prisma.court.update({
      where: { id },
      data: prismaData
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
      },
      select: { id: true }
    })

    return !conflictingBooking
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    throw new Error('Error al verificar disponibilidad')
  }
}

// Limpiar caché de reservas (útil para invalidar cuando se crean/modifican reservas)
// Por ahora es un stub, puede ser implementado con un caché real si es necesario
export function clearBookingsCache(courtId?: string, date?: Date): void {
  // TODO: Implementar caché de reservas si es necesario
  // Por ahora no hay caché implementado, así que esta función no hace nada
  if (process.env.NODE_ENV === 'development') {
    console.log(`[clearBookingsCache] Cache clear requested for courtId: ${courtId}, date: ${date?.toISOString()}`)
  }
}
