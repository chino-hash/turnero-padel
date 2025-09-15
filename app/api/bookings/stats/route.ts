import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { bookingService } from '../../../../lib/services/BookingService'
import { withRateLimit, bookingCreateRateLimit } from '../../../../lib/rate-limit'
import { bookingReportSchema, bookingFiltersSchema } from '../../../../lib/validations/booking'
import { formatZodErrors } from '../../../../lib/validations/common'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

// GET /api/bookings/stats - Obtener estadísticas de reservas
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
    const rateLimitCheck = withRateLimit(bookingCreateRateLimit);
    const rateLimitResult = await rateLimitCheck(request);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const queryParams = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      courtId: searchParams.get('courtId'),
      userId: searchParams.get('userId'),
      groupBy: searchParams.get('groupBy') || 'day'
    }

    // Validar parámetros
    const validatedParams = bookingFiltersSchema.parse(queryParams)

    // Los usuarios normales solo pueden ver sus propias estadísticas
    if (session.user.role !== 'ADMIN' && validatedParams.userId !== session.user.id) {
      validatedParams.userId = session.user.id
    }

    // Obtener estadísticas
    const result = await bookingService.getBookingStats(
      validatedParams.dateFrom,
      validatedParams.dateTo
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/bookings/stats:', error)
    
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

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/bookings/stats/report - Generar reporte de reservas
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

    // Solo administradores pueden generar reportes
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden generar reportes' },
        { status: 403 }
      )
    }

    // Aplicar rate limiting más estricto para reportes
    const rateLimitCheck = withRateLimit(bookingCreateRateLimit);
    const rateLimitResult = await rateLimitCheck(request);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = bookingReportSchema.parse(body)

    // Generar reporte detallado
    const result = await bookingService.getBookingStats(validatedData.dateFrom, validatedData.dateTo)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: result.data
    })
  } catch (error) {
    console.error('Error in POST /api/bookings/stats/report:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
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