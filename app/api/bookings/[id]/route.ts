import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingReadRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'
import { updateBookingSchema } from '@/lib/validations/booking'
import { formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'
import { eventEmitters } from '@/lib/sse-events'
import { clearBookingsCache } from '@/lib/services/courts'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/bookings/[id] - Obtener reserva específica
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const rateLimitResponse = await rateLimitCheck(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    // Obtener reserva
    const result = await bookingService.getBookingById(bookingId)

    if (!result.success) {
      return NextResponse.json(result, { status: 404 })
    }

    // Verificar permisos: admin (mayúsculas/minúsculas) o propietario pueden ver la reserva
    const isAdmin = String(session.user.role).toUpperCase() === 'ADMIN'
    if (!isAdmin && result.data?.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver esta reserva' },
        { status: 403 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - Actualizar reserva
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting más estricto para actualizaciones
    const rateLimitCheck = withRateLimit(bookingUpdateRateLimit)
    const rateLimitResponse = await rateLimitCheck(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // Obtener la reserva original para invalidar el caché de la fecha anterior (si cambió)
    const originalBooking = await bookingService.getBookingById(bookingId)
    const originalCourtId = originalBooking.data?.courtId
    const originalDate = originalBooking.data?.bookingDate ? new Date(originalBooking.data.bookingDate) : null

    // Actualizar reserva
    const result = await bookingService.updateBooking(
      bookingId,
      validatedData,
      session.user.id,
      session.user.role
    )

    if (!result.success) {
      const statusCode = result.error?.includes('No encontrada') ? 404 :
                        result.error?.includes('permisos') ? 403 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    // Invalidar caché de reservas
    if (result.data) {
      const newDate = new Date(result.data.bookingDate)
      
      // Invalidar caché de la fecha nueva
      clearBookingsCache(result.data.courtId, newDate)
      
      // Si cambió la fecha o cancha, invalidar también la fecha anterior
      if ((originalDate && originalDate.getTime() !== newDate.getTime()) || 
          (originalCourtId && originalCourtId !== result.data.courtId)) {
        if (originalCourtId && originalDate) {
          clearBookingsCache(originalCourtId, originalDate)
        }
      }
    }

    // Emitir evento SSE para actualizaciones en tiempo real
    if (result.data) {
      eventEmitters.bookingsUpdated({
        action: 'updated',
        booking: result.data,
        message: `Reserva ${bookingId} actualizada`
      })

      // Si se cambió la fecha/hora, actualizar disponibilidad
      if (validatedData.bookingDate || validatedData.startTime || validatedData.endTime) {
        eventEmitters.slotsUpdated({
          action: 'availability_changed',
          courtId: result.data.courtId,
          date: result.data.bookingDate,
          message: `Disponibilidad actualizada para ${result.data.bookingDate}`
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PUT /api/bookings/[id]:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de actualización inválidos',
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

// DELETE /api/bookings/[id] - Eliminar reserva (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const rateLimitResponse = await withRateLimit(bookingUpdateRateLimit)(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    // Obtener la reserva antes de cancelar para invalidar el caché
    const originalBooking = await bookingService.getBookingById(bookingId)
    const originalCourtId = originalBooking.data?.courtId
    const originalDate = originalBooking.data?.bookingDate ? new Date(originalBooking.data.bookingDate) : null

    // Eliminar reserva (soft delete)
    const result = await bookingService.cancelBooking(
      bookingId,
      'Cancelado por usuario',
      session.user.id,
      session.user.role
    )

    if (!result.success) {
      const statusCode = result.error?.includes('No encontrada') ? 404 :
                        result.error?.includes('permisos') ? 403 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    // Invalidar caché de reservas
    if (result.data) {
      const bookingDate = new Date(result.data.bookingDate)
      clearBookingsCache(result.data.courtId, bookingDate)
    } else if (originalCourtId && originalDate) {
      // Si no hay datos en el resultado, usar los datos originales
      clearBookingsCache(originalCourtId, originalDate)
    }

    // Emitir eventos SSE para actualizaciones en tiempo real
    if (result.data) {
      eventEmitters.bookingsUpdated({
        action: 'cancelled',
        booking: result.data,
        message: `Reserva ${bookingId} cancelada`
      })

      eventEmitters.slotsUpdated({
        action: 'availability_changed',
        courtId: result.data.courtId,
        date: result.data.bookingDate,
        message: `Disponibilidad actualizada para ${result.data.bookingDate}`
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
