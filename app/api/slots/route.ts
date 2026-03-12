import { NextRequest, NextResponse } from 'next/server'
// Fuerza ejecución en Node y evita optimización estática en Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { getCourtById, checkMultipleSlotsAvailability } from '../../../lib/services/courts'
import { auth } from '@/lib/auth'
import { getAvailableSlots } from '@/lib/services/availabilityService'
import { ExpiredBookingsService } from '@/lib/services/bookings/ExpiredBookingsService'
import { clearBookingsCache } from '@/lib/services/courts'
import { getDefaultOperatingHours } from '../../../lib/services/system-settings'
import { z } from 'zod'
import { isDevelopment } from '../../../lib/config/env'
import { OperatingHoursSchema, parseJsonSafely } from '../../../lib/schemas'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { canAccessTenant, getTenantFromSlug } from '@/lib/tenant/context'
import { prisma } from '@/lib/database/neon-config'

// Esquema de validación para los parámetros de entrada
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
    // Usar API nativa de Next para parámetros, evitando new URL(req.url)
    const searchParams = req.nextUrl.searchParams
    const rawParams = {
      courtId: searchParams.get('courtId'),
      date: searchParams.get('date')
    }

    // Validar parámetros de entrada
    const validationResult = slotsQuerySchema.safeParse(rawParams)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Parámetros inválidos', 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { courtId, date: dateStr } = validationResult.data
    const queryTenantSlug = searchParams.get('tenantSlug')?.trim() || null

    // Determinar rol de usuario (role-aware)
    const session = await auth().catch(() => null)
    const userRole: 'ADMIN' | 'USER' = (session?.user?.role === 'ADMIN') ? 'ADMIN' : 'USER'

    // Verificar cache (incluir tenantSlug en la clave para no mezclar tenants)
    const cacheKey = queryTenantSlug ? `${courtId}-${dateStr}-${queryTenantSlug}` : `${courtId}-${dateStr}`
    const force = (searchParams.get('force') === 'true')
    const cached = slotsCache.get(cacheKey)
    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit para', cacheKey)
      return NextResponse.json({
        ...cached.data,
        cached: true,
        responseTime: Date.now() - startTime
      })
    }

    // Validar que la fecha no sea en el pasado (tolerante a zona horaria: en Vercel el servidor
    // corre en UTC; el cliente envía la fecha en su "hoy" local, que puede ser "ayer" en UTC)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const todayStr = `${todayUtc.getUTCFullYear()}-${pad(todayUtc.getUTCMonth() + 1)}-${pad(todayUtc.getUTCDate())}`
    const yesterdayUtc = new Date(todayUtc)
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1)
    const yesterdayStr = `${yesterdayUtc.getUTCFullYear()}-${pad(yesterdayUtc.getUTCMonth() + 1)}-${pad(yesterdayUtc.getUTCDate())}`
    if (dateStr < yesterdayStr) {
      return NextResponse.json({ 
        error: 'No se pueden consultar slots de fechas pasadas' 
      }, { status: 400 })
    }

    // Validar que la fecha no sea más de 30 días en el futuro (usar mismo criterio UTC)
    const maxDate = new Date(todayUtc)
    maxDate.setUTCDate(maxDate.getUTCDate() + 30)
    const maxStr = `${maxDate.getUTCFullYear()}-${pad(maxDate.getUTCMonth() + 1)}-${pad(maxDate.getUTCDate())}`
    if (dateStr > maxStr) {
      return NextResponse.json({ 
        error: 'No se pueden consultar slots con más de 30 días de anticipación' 
      }, { status: 400 })
    }

    // Obtener cancha para validar tenant
    const courtRow = await prisma.court.findUnique({
      where: { id: courtId },
      select: { tenantId: true, isActive: true }
    })
    if (!courtRow) {
      return NextResponse.json({ error: 'Cancha no encontrada', courtId }, { status: 404 })
    }
    // No devolver slots para canchas desactivadas (solo activas pueden reservarse)
    if (!courtRow.isActive) {
      return NextResponse.json({
        slots: [],
        courtId,
        date: dateStr,
        summary: { total: 0, open: 0, rate: 0, date: dateStr, courtName: '' },
        courtName: '',
        message: 'Cancha no disponible'
      })
    }

    let userTenantId: string | null = null
    let isSuperAdmin = false
    let user: PermissionsUser | null = null

    if (session?.user) {
      user = {
        id: session.user.id,
        email: session.user.email || null,
        role: session.user.role || 'USER',
        isAdmin: session.user.isAdmin || false,
        isSuperAdmin: session.user.isSuperAdmin || false,
        tenantId: session.user.tenantId || null,
      }
      isSuperAdmin = await isSuperAdminUser(user)
      userTenantId = await getUserTenantIdSafe(user)
    }

    // Contexto por URL (tenantSlug): exigir sesión y acceso al tenant
    if (queryTenantSlug) {
      if (!session?.user?.email) {
        return NextResponse.json({
          error: 'Inicia sesión para ver los horarios',
          courtId
        }, { status: 403 })
      }
      const tenant = await getTenantFromSlug(queryTenantSlug)
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant no encontrado', courtId }, { status: 404 })
      }
      if (!tenant.isActive) {
        return NextResponse.json({
          error: 'Este club no está disponible',
          courtId
        }, { status: 403 })
      }
      const hasAccess = await canAccessTenant(session.user.email, tenant.id)
      if (!hasAccess) {
        return NextResponse.json({
          error: 'No tienes permisos para acceder a esta cancha',
          courtId
        }, { status: 403 })
      }
      if (courtRow.tenantId !== tenant.id) {
        return NextResponse.json({
          error: 'No tienes permisos para acceder a esta cancha',
          courtId
        }, { status: 403 })
      }
    } else if (user && !isSuperAdmin && user.email) {
      // Sin tenantSlug: validar por sesión (usuario debe tener acceso al tenant de la cancha)
      const hasAccess = courtRow.tenantId
        ? await canAccessTenant(user.email, courtRow.tenantId)
        : false
      if (!hasAccess) {
        return NextResponse.json({
          error: 'No tienes permisos para acceder a esta cancha',
          courtId
        }, { status: 403 })
      }
    } else {
      // Sin tenantSlug ni sesión: no permitir (evitar ver turnos de cualquier tenant sin contexto)
      return NextResponse.json({
        error: 'Indica el club (tenantSlug en la URL) o inicia sesión para ver los horarios',
        courtId
      }, { status: 403 })
    }

    const court = await getCourtById(courtId)
    if (!court) {
      return NextResponse.json({ 
        error: 'Cancha no encontrada',
        courtId 
      }, { status: 404 })
    }

    // Obtener tenantId del court (obtener desde la base de datos si es necesario)
    const courtDb = await prisma.court.findUnique({
      where: { id: courtId },
      select: { tenantId: true }
    })
    const tenantId = courtDb?.tenantId || userTenantId

    // Cancelar reservas pendientes expiradas (lazy) para que los slots y Mis Turnos queden coherentes
    if (tenantId) {
      try {
        const expiredService = new ExpiredBookingsService()
        await expiredService.cancelExpiredBookings(tenantId)
        clearBookingsCache()
      } catch (e) {
        console.warn('Error cancelando reservas expiradas en slots:', e)
      }
    }

    if (tenantId && !isSuperAdmin) {
      const tenantRecord = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isActive: true },
      })
      if (!tenantRecord || !tenantRecord.isActive) {
        return NextResponse.json({
          error: 'Este club no está habilitado todavía',
          slots: [],
        }, { status: 400 })
      }
    }

    // Parsear + validar operating hours de la cancha con fallback seguro (desde SystemSetting)
    const defaultOperatingHours = await getDefaultOperatingHours(tenantId)
    const parsedHours = parseJsonSafely(court.operatingHours ?? null, OperatingHoursSchema, defaultOperatingHours)
    if (!parsedHours.ok) {
      console.warn('OperatingHours inválido, usando fallback:', parsedHours.error)
    }

    const requestedDate = new Date(`${dateStr}T00:00:00`)
    let hours = parsedHours.data
    let startHour = hhmmToHour(hours.start)
    let endHour = hhmmToHour(hours.end)
    const slotDuration = Math.max( (hours.slot_duration || 90) / 60, 0.25 )
    if (endHour <= startHour) {
      if (hours.end === '00:00' || hours.end === '24:00') {
        endHour = 24
      } else {
        hours = defaultOperatingHours
        startHour = hhmmToHour(hours.start)
        endHour = hhmmToHour(hours.end)
      }
    }
    const basePrice = (court as any).basePrice ?? (court as any).base_price ?? 6000
    const priceMultiplier = court.priceMultiplier || 1
    const finalPrice = Math.round(basePrice * priceMultiplier)
    const pricePerPerson = Math.round(finalPrice / 4)

    console.log('Generando slots para cancha', court.name, `(${court.id})`, 'el', dateStr)
    console.log(`Horarios: ${hours.start} - ${hours.end} (${startHour}h - ${endHour}h)`)    

    // Generar slots de forma más eficiente
    const slots = []
    // Preparar todos los slots primero
    const slotTimes: Array<{ startTime: string; endTime: string }> = []
    for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
      const startTime = hourToHHMM(h)
      const endTime = hourToHHMM(h + slotDuration)
      slotTimes.push({ startTime, endTime })
    }
    
    // Una sola query optimizada para verificar todos los slots a la vez
    const availabilityMap = await checkMultipleSlotsAvailability(courtId, requestedDate, slotTimes)
    
    // Crear los slots con la disponibilidad ya calculada
    for (const { startTime, endTime } of slotTimes) {
      const slotKey = `${startTime}-${endTime}`
      const isAvailable = availabilityMap.get(slotKey) ?? false
      
      slots.push({
        id: `${courtId}--${dateStr}--${startTime}`,
        startTime,
        endTime,
        timeRange: `${startTime} - ${endTime}`,
        isAvailable,
        price: finalPrice,
        finalPrice,
        pricePerPerson,
        courtId,
        date: dateStr
      })
    }

    // Obtener bloqueos (virtuales para ADMIN + CourtBlocks por torneos para todos)
    try {
      const { virtualBlocks, courtBlocks, thresholdDate } = await getAvailableSlots(courtId, dateStr, dateStr, userRole, userTenantId ?? undefined)

      // CourtBlocks (torneos): marcar slots que solapan con algún bloque como no disponibles
      if (courtBlocks && courtBlocks.length > 0) {
        const dayBlocks = courtBlocks.filter((b) => b.date === dateStr)
        for (const s of slots) {
          const [sStart, sEnd] = s.timeRange.split(' - ')
          for (const b of dayBlocks) {
            if (sStart < b.endTime && sEnd > b.startTime) {
              s.isAvailable = false
              break
            }
          }
        }
      }

      // Bloqueos virtuales (>7 días) para ADMIN usando reglas recurrentes
      if (userRole === 'ADMIN' && dateStr > thresholdDate && virtualBlocks.length > 0) {
        const blockSet = new Set(virtualBlocks.filter(v => v.date === dateStr).map(v => `${v.startTime} - ${v.endTime}`))
        for (const s of slots) {
          if (blockSet.has(s.timeRange)) {
            s.isAvailable = false
          }
        }
      }
    } catch (_err) {
    }

    // Calcular estadísticas
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
      role: userRole,
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
    
    // Manejo de errores más específico
    if (err instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos de entrada inválidos',
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

// Endpoint para limpiar cache (útil para administradores)
export async function DELETE(req: NextRequest) {
  try {
    // Usar req.nextUrl para leer parámetros de forma segura
    const searchParams = req.nextUrl.searchParams
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
      error: 'Parámetros inválidos. Use action=clear-all, o proporcione courtId y/o date'
    }, { status: 400 })

  } catch (err) {
    console.error('DELETE /api/slots error:', err)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// Endpoint para obtener estadísticas del cache
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
      error: 'Acción no válida. Use action: "cache-stats"'
    }, { status: 400 })

  } catch (err) {
    console.error('POST /api/slots error:', err)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
