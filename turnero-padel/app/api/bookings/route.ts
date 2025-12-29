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

export const runtime = 'nodejs'

// GET /api/bookings - Obtener reservas con filtros y paginaci├│n
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticaci├│n
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

    // Obtener par├ímetros de consulta
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

    // Validar par├ímetros
    const validatedParams = bookingFiltersSchema.parse(queryParams)

    // Si no es admin, solo puede ver sus propias reservas
    if (session.user.role !== 'ADMIN' && !validatedParams.userId) {
      validatedParams.userId = session.user.id
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
          error: 'Par├ímetros de consulta inv├ílidos',
          details: formatZodErrors(error)
        },
        { status: 400 }
      )
    }

    // Fallback: devolver datos m├¡nimos para no bloquear el panel
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
    // Verificar autenticaci├│n
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting m├ís estricto para creaci├│n
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

    // Crear reserva usando el servicio optimizado
    const result = await bookingService.createBooking(validatedData, session.user.id)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Invalidar cach├® de reservas para esta fecha y cancha
    if (result.data) {
      const bookingDate = new Date(result.data.bookingDate)
      clearBookingsCache(validatedData.courtId, bookingDate)
    }

    // Emitir eventos SSE para actualizaciones en tiempo real
    eventEmitters.bookingsUpdated({
      action: 'created',
      booking: result.data,
      message: `Nueva reserva creada para ${validatedData.bookingDate} ${validatedData.startTime}-${validatedData.endTime}`
    })
    
    eventEmitters.slotsUpdated({
      action: 'availability_changed',
      courtId: validatedData.courtId,
      date: validatedData.bookingDate,
      message: `Disponibilidad actualizada para ${validatedData.bookingDate}`
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bookings:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de reserva inv├ílidos',
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


