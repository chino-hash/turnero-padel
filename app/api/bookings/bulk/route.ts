import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit } from '@/lib/rate-limit'
import { bulkUpdateBookingSchema } from '@/lib/validations/booking'
import { formatZodError } from '@/lib/validations/common'
import { ZodError } from 'zod'
import { eventEmitters } from '@/lib/sse-events'

export const runtime = 'nodejs'

// PATCH /api/bookings/bulk - Operaciones masivas en reservas
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo administradores pueden realizar operaciones bulk
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden realizar operaciones masivas' },
        { status: 403 }
      )
    }

    // Aplicar rate limiting más estricto para operaciones bulk
    const rateLimitResult = await withRateLimit(
      request,
      'booking-bulk',
      session.user.id
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiadas solicitudes de operaciones masivas. Intenta de nuevo más tarde.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = bulkUpdateBookingSchema.parse(body)

    const { bookingIds, operation, data } = validatedData

    let result
    let eventAction: string
    let eventMessage: string

    switch (operation) {
      case 'cancel':
        result = await bookingService.bulkCancelBookings(
          bookingIds,
          data?.cancellationReason || 'Cancelación masiva por administrador'
        )
        eventAction = 'bulk_cancelled'
        eventMessage = `${bookingIds.length} reservas canceladas masivamente`
        break

      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Estado requerido para actualización masiva' },
            { status: 400 }
          )
        }
        result = await bookingService.bulkUpdateStatus(
          bookingIds,
          data.status
        )
        eventAction = 'bulk_status_updated'
        eventMessage = `${bookingIds.length} reservas actualizadas a estado ${data.status}`
        break

      case 'update_payment_status':
        if (!data?.paymentStatus) {
          return NextResponse.json(
            { success: false, error: 'Estado de pago requerido para actualización masiva' },
            { status: 400 }
          )
        }
        result = await bookingService.bulkUpdatePaymentStatus(
          bookingIds,
          data.paymentStatus
        )
        eventAction = 'bulk_payment_updated'
        eventMessage = `${bookingIds.length} reservas actualizadas a estado de pago ${data.paymentStatus}`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Operación no válida' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Emitir evento SSE para actualizaciones en tiempo real
    eventEmitters.bookingsUpdated({
      action: eventAction,
      bookings: result.data,
      message: eventMessage,
      userId: session.user.id
    })

    // Si se cancelaron reservas, actualizar disponibilidad de slots
    if (operation === 'cancel') {
      const uniqueCourtDates = new Set(
        result.data.map((booking: any) => `${booking.courtId}-${booking.bookingDate}`)
      )
      
      uniqueCourtDates.forEach((courtDate) => {
        const [courtId, date] = courtDate.split('-')
        eventEmitters.slotsUpdated({
          action: 'availability_changed',
          courtId,
          date,
          message: `Disponibilidad actualizada para ${date}`
        })
      })
    }

    return NextResponse.json({
      success: true,
      message: eventMessage,
      data: {
        updatedCount: result.data.length,
        bookings: result.data
      }
    })
  } catch (error) {
    console.error('Error in PATCH /api/bookings/bulk:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de operación masiva inválidos',
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

// DELETE /api/bookings/bulk - Eliminación masiva de reservas (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo administradores pueden realizar eliminaciones masivas
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden realizar eliminaciones masivas' },
        { status: 403 }
      )
    }

    // Aplicar rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      'booking-bulk',
      session.user.id
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiadas solicitudes de eliminación masiva. Intenta de nuevo más tarde.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Obtener IDs de reservas del cuerpo de la solicitud
    const { bookingIds, reason } = await request.json()

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de IDs de reservas' },
        { status: 400 }
      )
    }

    if (bookingIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'No se pueden eliminar más de 50 reservas a la vez' },
        { status: 400 }
      )
    }

    // Eliminar reservas masivamente
    const result = await bookingService.bulkCancelBookings(
      bookingIds,
      reason || 'Eliminación masiva por administrador'
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Emitir eventos SSE para actualizaciones en tiempo real
    eventEmitters.bookingsUpdated({
      action: 'bulk_deleted',
      bookings: result.data,
      message: `${bookingIds.length} reservas eliminadas masivamente`,
      userId: session.user.id
    })

    // Actualizar disponibilidad de slots
    const uniqueCourtDates = new Set(
      result.data.map((booking: any) => `${booking.courtId}-${booking.bookingDate}`)
    )
    
    uniqueCourtDates.forEach((courtDate) => {
      const [courtId, date] = courtDate.split('-')
      eventEmitters.slotsUpdated({
        action: 'availability_changed',
        courtId,
        date,
        message: `Disponibilidad actualizada para ${date}`
      })
    })

    return NextResponse.json({
      success: true,
      message: `${bookingIds.length} reservas eliminadas exitosamente`,
      data: {
        deletedCount: result.data.length,
        bookings: result.data
      }
    })
  } catch (error) {
    console.error('Error in DELETE /api/bookings/bulk:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}