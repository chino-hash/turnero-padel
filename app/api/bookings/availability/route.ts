import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { bookingService } from '../../../../lib/services/BookingService'
import { withRateLimit, bookingReadRateLimit } from '../../../../lib/rate-limit'
import { checkAvailabilitySchema } from '../../../../lib/validations/booking'
import { formatZodErrors } from '../../../../lib/validations/common'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

// GET /api/bookings/availability - Verificar disponibilidad de slots
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
    const rateLimitCheck = withRateLimit(bookingReadRateLimit)
    const rateLimitResult = await rateLimitCheck(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const queryParams = {
      courtId: searchParams.get('courtId'),
      bookingDate: searchParams.get('date'),
      startTime: searchParams.get('startTime'),
      endTime: searchParams.get('endTime'),
      excludeBookingId: searchParams.get('excludeBookingId')
    }

    // Validar parámetros
    const validatedParams = checkAvailabilitySchema.parse(queryParams)

    // Verificar disponibilidad
    const result = await bookingService.checkAvailability({
      courtId: validatedParams.courtId,
      bookingDate: validatedParams.bookingDate,
      startTime: validatedParams.startTime,
      endTime: validatedParams.endTime,
      excludeBookingId: validatedParams.excludeBookingId
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/bookings/availability:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros de disponibilidad inválidos',
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

// POST /api/bookings/availability/slots - Obtener slots disponibles para una fecha
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

    // Aplicar rate limiting
    const rateLimitCheck = withRateLimit(bookingReadRateLimit)
    const rateLimitResult = await rateLimitCheck(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const { courtId, date, duration = 90 } = body

    if (!courtId || !date) {
      return NextResponse.json(
        { success: false, error: 'ID de cancha y fecha son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const [y, m, d] = date.split('-').map(Number)
    const bookingDate = new Date(y as number, (m as number) - 1, d as number)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (bookingDate < today) {
      return NextResponse.json(
        { success: false, error: 'No se pueden obtener slots para fechas pasadas' },
        { status: 400 }
      )
    }

    // Validar duración
    if (duration < 30 || duration > 240) {
      return NextResponse.json(
        { success: false, error: 'La duración debe estar entre 30 y 240 minutos' },
        { status: 400 }
      )
    }

    // Obtener slots disponibles
    const result = await bookingService.getAvailabilitySlots(
      courtId,
      date,
      duration
    )

    if (!result.success || !result.data) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Slots disponibles para ${date}`,
      data: {
        courtId,
        date,
        duration,
        slots: result.data,
        totalSlots: result.data.length
      }
    })
  } catch (error) {
    console.error('Error in POST /api/bookings/availability/slots:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
