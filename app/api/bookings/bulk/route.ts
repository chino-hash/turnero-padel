import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { bookingService } from '../../../../lib/services/BookingService'
import { withRateLimit, bookingBulkRateLimit } from '../../../../lib/rate-limit'
import { bulkUpdateBookingsSchema } from '../../../../lib/validations/booking'
import { formatZodErrors } from '../../../../lib/validations/common'
import { ZodError } from 'zod'
import { eventEmitters } from '../../../../lib/sse-events'

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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden realizar operaciones masivas' },
        { status: 403 }
      )
    }

    // Aplicar rate limiting más estricto para operaciones bulk
    const rateLimitCheck = withRateLimit(bookingBulkRateLimit)
    const rateLimitResult = await rateLimitCheck(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = bulkUpdateBookingsSchema.parse(body)

    const { bookingIds, updates } = validatedData

    let eventAction: string
    let eventMessage: string

    // Determinar la operación basada en las actualizaciones
    if (updates.status === 'CANCELLED') {
      eventAction = 'bulk_cancelled'
      eventMessage = `${bookingIds.length} reservas canceladas masivamente`
    } else if (updates.status) {
      eventAction = 'bulk_status_updated'
      eventMessage = `Estado actualizado para ${bookingIds.length} reservas`
    } else if (updates.paymentStatus) {
      eventAction = 'bulk_payment_updated'
      eventMessage = `Estado de pago actualizado para ${bookingIds.length} reservas`
    } else {
      eventAction = 'bulk_updated'
      eventMessage = `${bookingIds.length} reservas actualizadas masivamente`
    }

    // Realizar la actualización masiva
    const result = await bookingService.bulkUpdateBookings(
      { bookingIds, updates },
      session.user.role
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    // Emitir evento SSE para actualizaciones en tiempo real
    eventEmitters.bookingsUpdated({
      action: eventAction,
      bookings: bookingIds, // Usar los IDs de las reservas actualizadas
      message: eventMessage,
      userId: session.user.id
    })

    // Si se cancelaron reservas, actualizar disponibilidad de slots
    // Nota: No tenemos acceso directo a los datos de las reservas aquí,
    // pero el evento SSE notificará a los clientes para que actualicen
    if (updates.status === 'CANCELLED') {
      // Emitir evento general de actualización de slots
      // Los clientes deberán refrescar la disponibilidad
      eventEmitters.slotsUpdated({
        action: 'availability_changed',
        courtId: 'all', // Indicar que múltiples canchas pueden estar afectadas
        date: 'multiple', // Indicar que múltiples fechas pueden estar afectadas
        message: 'Disponibilidad actualizada por cancelaciones masivas'
      })
    }

    return NextResponse.json({
      success: true,
      message: eventMessage,
      data: {
        updatedCount: result.data?.count || 0,
        bookingIds: bookingIds
      }
    })
  } catch (error) {
    console.error('Error in PATCH /api/bookings/bulk:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de operación masiva inválidos',
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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden realizar eliminaciones masivas' },
        { status: 403 }
      )
    }

    // Aplicar rate limiting
    const rateLimitCheck = withRateLimit(bookingBulkRateLimit)
    const rateLimitResult = await rateLimitCheck(request)
    
    if (rateLimitResult) {
      return rateLimitResult
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

    // Eliminar reservas masivamente (cancelar)
    const result = await bookingService.bulkUpdateBookings(
      {
        bookingIds,
        updates: {
          status: 'CANCELLED',
          cancellationReason: reason || 'Eliminación masiva por administrador'
        }
      },
      session.user.role
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    // Emitir eventos SSE para actualizaciones en tiempo real
    const deletedCount = result.data?.count || 0;
    eventEmitters.bookingsUpdated({
      action: 'bulk_deleted',
      bookings: [],
      message: `${deletedCount} reservas eliminadas masivamente`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: `${deletedCount} reservas eliminadas exitosamente`,
      data: {
        deletedCount
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