import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { bookingService } from "@/lib/services/BookingService"
import { prisma } from "@/lib/database/neon-config"
import { withRateLimit, bookingReadRateLimit, bookingCreateRateLimit } from '@/lib/rate-limit'
import { bookingFiltersSchema, createBookingSchema } from "@/lib/validations/booking"
import { formatZodErrors } from "@/lib/validations/common"
import { ZodError } from "zod"
import { eventEmitters } from '@/lib/sse-events'
import { clearBookingsCache } from '@/lib/services/courts'
import { canAccessTenant, getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

// GET /api/bookings - Obtener reservas con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    let session: any = null
    try {
      session = await auth()
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting para lectura de reservas
    const rateLimitCheck = withRateLimit(bookingReadRateLimit)
    const rateLimitResult = await rateLimitCheck(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      courtId: searchParams.get('courtId') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'bookingDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    // Validar parámetros
    const validatedParams = bookingFiltersSchema.parse(queryParams)

    // Construir usuario para validación de permisos
    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    const userTenantId = await getUserTenantIdSafe(user)

    // Si no es admin ni super admin, solo puede ver sus propias reservas
    if (!isSuperAdmin && user.role !== 'ADMIN' && !validatedParams.userId) {
      validatedParams.userId = session.user.id
    }

    // Si se filtra por userId, validar que pertenece al tenant accesible (excepto super admin)
    if (validatedParams.userId && !isSuperAdmin) {
      const targetUser = await prisma.user.findUnique({
        where: { id: validatedParams.userId },
        select: { tenantId: true }
      })

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Validar que el usuario target pertenece al tenant accesible
      if (userTenantId && targetUser.tenantId !== userTenantId) {
        return NextResponse.json(
          { success: false, error: 'No tiene permisos para ver reservas de este usuario' },
          { status: 403 }
        )
      }
    }

    // Agregar tenantId al filtro (seguridad en múltiples capas)
    if (!isSuperAdmin && userTenantId) {
      validatedParams.tenantId = userTenantId
    }

    // Obtener reservas
    const result = await bookingService.getAllBookings(validatedParams)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/bookings:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros de consulta inválidos',
          details: formatZodErrors(error)
        },
        { status: 400 }
      )
    }

    // Fallback: devolver datos mínimos para no bloquear el panel
    try {
      const page = 1
      const limit = 20
      const bookings = await prisma.booking.findMany({
        include: {
          court: { select: { id: true, name: true, basePrice: true, priceMultiplier: true, operatingHours: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
          players: { select: { id: true, playerName: true, position: true, hasPaid: true, paidAmount: true } },
          extras: { select: { id: true, totalPrice: true, assignedToAll: true, deletedAt: true, player: { select: { position: true } }, producto: { select: { nombre: true } } } },
          payments: { select: { id: true, amount: true, paymentMethod: true, paymentType: true, status: true, createdAt: true } }
        },
        orderBy: { bookingDate: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      })
      return NextResponse.json({ success: true, message: 'Reservas obtenidas (fallback)', data: bookings, meta: { page, limit, total: bookings.length, totalPages: 1 } })
    } catch (fallbackErr) {
      console.error('Error fallback GET /api/bookings:', fallbackErr)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
}

// POST /api/bookings - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting más estricto para creación
    const rateLimitCheck = withRateLimit(bookingCreateRateLimit)
    const rateLimitResult = await rateLimitCheck(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = createBookingSchema.parse({
      ...body,
      userId: session.user.id // Asegurar que use el ID del usuario autenticado
    })

    // Construir usuario para validación de permisos
    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    const userTenantId = await getUserTenantIdSafe(user)

    // Validar que el courtId pertenece al tenant del usuario (excepto super admin)
    if (!isSuperAdmin && validatedData.courtId) {
      const court = await prisma.court.findUnique({
        where: { id: validatedData.courtId },
        select: { tenantId: true, isActive: true }
      })

      if (!court) {
        return NextResponse.json(
          { success: false, error: 'Cancha no encontrada' },
          { status: 404 }
        )
      }

      if (!court.isActive) {
        return NextResponse.json(
          { success: false, error: 'La cancha no está activa' },
          { status: 400 }
        )
      }

      // Validar que la cancha pertenece al tenant del usuario
      if (userTenantId && court.tenantId !== userTenantId) {
        return NextResponse.json(
          { success: false, error: 'No tiene permisos para crear reservas en esta cancha' },
          { status: 403 }
        )
      }
    }

    // Crear reserva usando el servicio optimizado
    const result = await bookingService.createBooking(validatedData, session.user.id)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Invalidar caché de reservas para esta fecha y cancha
    if (result.data) {
      const bookingDate = new Date(result.data.bookingDate)
      clearBookingsCache(validatedData.courtId, bookingDate)
    }

    // Emitir eventos SSE para actualizaciones en tiempo real
    eventEmitters.bookingsUpdated({
      action: 'created',
      booking: result.data,
      message: `Nueva reserva creada para ${validatedData.bookingDate} ${validatedData.startTime}-${validatedData.endTime}`
    }, userTenantId)
    
    eventEmitters.slotsUpdated({
      action: 'availability_changed',
      courtId: validatedData.courtId,
      date: validatedData.bookingDate,
      message: `Disponibilidad actualizada para ${validatedData.bookingDate}`
    }, userTenantId)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bookings:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de reserva inválidos',
          details: formatZodErrors(error)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

