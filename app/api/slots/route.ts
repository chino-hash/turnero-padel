import { NextRequest, NextResponse } from 'next/server'
// Fuerza ejecuci�n en Node y evita optimizaci�n est�tica en Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { getCourtById, checkCourtAvailability } from '../../../lib/services/courts'
import { getDefaultOperatingHours } from '../../../lib/services/system-settings'
import { z } from 'zod'
import { isDevelopment } from '../../../lib/config/env'
import { OperatingHoursSchema, parseJsonSafely } from '../../../lib/schemas'

// Esquema de validaci�n para los par�metros de entrada
const slotsQuerySchema = z.object({
  courtId: z.string().min(1, 'courtId es requerido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date debe tener formato YYYY-MM-DD')
})

// Cache simple en memoria para optimizar consultas repetidas
const slotsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Helpers
function hhmmToHour(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h + (m || 0) / 60
}

function hourToHHMM(hour: number): string {
  const total = Math.round(hour * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    const rawParams = {
      courtId: searchParams.get('courtId'),
      date: searchParams.get('date')
    }

    // Validar par�metros de entrada
    const validationResult = slotsQuerySchema.safeParse(rawParams)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Par�metros inv�lidos', 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { courtId, date: dateStr } = validationResult.data

    // Verificar cache
    const cacheKey = `${courtId}-${dateStr}`
    const cached = slotsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit para', cacheKey)
      return NextResponse.json({
        ...cached.data,
        cached: true,
        responseTime: Date.now() - startTime
      })
    }

    // Validar que la fecha no sea en el pasado
    const requestedDate = new Date(`${dateStr}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (requestedDate < today) {
      return NextResponse.json({ 
        error: 'No se pueden consultar slots de fechas pasadas' 
      }, { status: 400 })
    }

    // Validar que la fecha no sea m�s de 30 d�as en el futuro
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 30)
    
    if (requestedDate > maxDate) {
      return NextResponse.json({ 
        error: 'No se pueden consultar slots con m�s de 30 d�as de anticipaci�n' 
      }, { status: 400 })
    }

    const court = await getCourtById(courtId)
    if (!court) {
      return NextResponse.json({ 
        error: 'Cancha no encontrada',
        courtId 
      }, { status: 404 })
    }

    // Parsear + validar operating hours de la cancha con fallback seguro (desde SystemSetting)
    const defaultOperatingHours = await getDefaultOperatingHours()
    const parsedHours = parseJsonSafely(court.operatingHours ?? null, OperatingHoursSchema, defaultOperatingHours)
    if (!parsedHours.ok) {
      console.warn('OperatingHours inv�lido, usando fallback:', parsedHours.error)
    }

    const hours = parsedHours.data
    const startHour = hhmmToHour(hours.start)
    const endHour = hhmmToHour(hours.end)
    const slotDuration = (hours.slot_duration || 90) / 60 // minutos  horas
    const basePrice = (court as any).basePrice ?? (court as any).base_price ?? 6000
    const priceMultiplier = court.priceMultiplier || 1
    const finalPrice = Math.round(basePrice * priceMultiplier)

    console.log('Generando slots para cancha', court.name, `(${court.id})`, 'el', dateStr)
    console.log(`Horarios: ${hours.start} - ${hours.end} (${startHour}h - ${endHour}h)`)    

    // Generar slots de forma m�s eficiente
    const slots = []
    const availabilityPromises = []
    
    // Crear todas las promesas de disponibilidad primero
    for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
      const startTime = hourToHHMM(h)
      const endTime = hourToHHMM(h + slotDuration)
      
      availabilityPromises.push(
        checkCourtAvailability(courtId, requestedDate, startTime, endTime)
          .then(isAvailable => ({
            id: `${courtId}--${dateStr}--${startTime}`,
            startTime,
            endTime,
            timeRange: `${startTime} - ${endTime}`,
            isAvailable,
            price: finalPrice,
            courtId,
            date: dateStr
          }))
      )
    }
    
    // Ejecutar todas las consultas de disponibilidad en paralelo
    const slotsResults = await Promise.all(availabilityPromises)
    slots.push(...slotsResults)

    // Calcular estad�sticas
    const open = slots.filter(s => s.isAvailable).length
    const total = slots.length
    const rate = total > 0 ? Math.round((open / total) * 100) : 0
    const responseTime = Date.now() - startTime

    const responseData = {
      slots,
      summary: { 
        total, 
        open, 
        rate,
        date: dateStr,
        courtName: court.name
      },
      courtName: court.name,
      courtId: court.id,
      cached: false,
      responseTime
    }

    // Guardar en cache
    slotsCache.set(cacheKey, {
      data: { ...responseData, cached: false },
      timestamp: Date.now()
    })

    console.log(`Slots generados: ${total} total, ${open} disponibles (${rate}%) en ${responseTime} ms`)
    
    return NextResponse.json(responseData)
  } catch (err) {
    const responseTime = Date.now() - startTime
    console.error('GET /api/slots error:', err)
    
    // Manejo de errores m�s espec�fico
    if (err instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos de entrada inv�lidos',
        details: err.issues,
        responseTime
      }, { status: 400 })
    }
    
    if (err instanceof Error) {
      return NextResponse.json({ 
        error: 'Error interno del servidor',
        message: isDevelopment ? err.message : 'Error interno',
        responseTime
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
       error: 'Error interno del servidor',
       responseTime
     }, { status: 500 })
   }
 }

// Endpoint para limpiar cache (�til para administradores)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get('courtId')
    const date = searchParams.get('date')
    const action = searchParams.get('action')

    if (action === 'clear-all') {
      const cacheSize = slotsCache.size
      slotsCache.clear()
      console.log(`Cache completo limpiado (${cacheSize} entradas)`)
      return NextResponse.json({ 
        message: 'Cache completo limpiado',
        clearedEntries: cacheSize
      })
    }

    if (courtId && date) {
      const cacheKey = `${courtId}-${date}`
      const deleted = slotsCache.delete(cacheKey)
      console.log('Cache limpiado para', cacheKey)
      return NextResponse.json({ 
        message: deleted ? 'Entrada de cache eliminada' : 'Entrada no encontrada',
        cacheKey,
        deleted
      })
    }

    if (courtId) {
      let deletedCount = 0
      for (const [key] of slotsCache) {
        if (key.startsWith(`${courtId}-`)) {
          slotsCache.delete(key)
          deletedCount++
        }
      }
      console.log(`Cache limpiado para cancha ${courtId}: ${deletedCount} entradas`)
      return NextResponse.json({ 
        message: `Cache limpiado para cancha ${courtId}`,
        courtId,
        deletedEntries: deletedCount
      })
    }

    return NextResponse.json({ 
      error: 'Par�metros inv�lidos. Use action=clear-all, o proporcione courtId y/o date'
    }, { status: 400 })

  } catch (err) {
    console.error('DELETE /api/slots error:', err)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// Endpoint para obtener estad�sticas del cache
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'cache-stats') {
      const now = Date.now()
      const stats = {
        totalEntries: slotsCache.size,
        validEntries: 0,
        expiredEntries: 0,
        entries: [] as any[]
      }

      for (const [key, value] of slotsCache) {
        const isExpired = now - value.timestamp > CACHE_TTL
        const entry = {
          key,
          timestamp: value.timestamp,
          age: now - value.timestamp,
          expired: isExpired,
          courtId: key.split('-')[0],
          date: key.split('-').slice(1).join('-')
        }
        
        stats.entries.push(entry)
        if (isExpired) {
          stats.expiredEntries++
        } else {
          stats.validEntries++
        }
      }

      return NextResponse.json(stats)
    }

    return NextResponse.json({ 
      error: 'Acci�n no v�lida. Use action: "cache-stats"'
    }, { status: 400 })

  } catch (err) {
    console.error('POST /api/slots error:', err)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
