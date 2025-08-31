import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { bookingService } from "@/lib/services/BookingService"
import { withRateLimit } from "@/lib/rate-limit"
import { bookingFiltersSchema, createBookingSchema } from "@/lib/validations/booking"
import { formatZodError } from "@/lib/validations/common"
import { ZodError } from "zod"
import { eventEmitters } from '@/lib/sse-events'

export const runtime = 'nodejs'

// GET /api/bookings - Obtener reservas con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      'booking-read',
      session.user.id
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
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

    // Si no es admin, solo puede ver sus propias reservas
    if (session.user.role !== 'admin' && !validatedParams.userId) {
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
          error: 'Parámetros de consulta inválidos',
          details: formatZodError(error)
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
    const rateLimitResult = await withRateLimit(
      request,
      'booking-create',
      session.user.id
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiadas solicitudes de creación. Intenta de nuevo más tarde.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = createBookingSchema.parse({
      ...body,
      userId: session.user.id // Asegurar que use el ID del usuario autenticado
    })

    // Crear reserva usando el servicio optimizado
    const result = await bookingService.createBooking(validatedData)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
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
          error: 'Datos de reserva inválidos',
          details: formatZodError(error)
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

