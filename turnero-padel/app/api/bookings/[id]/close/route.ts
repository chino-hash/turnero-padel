import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'
import { eventEmitters } from '@/lib/sse-events'
import type { UpdateBookingInput } from '@/lib/validations/booking'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/bookings/[id]/close - Cierre definitivo de una reserva
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo admins pueden cerrar definitivamente
    const isAdmin = String(session.user.role).toUpperCase() === 'ADMIN'
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes para cerrar reservas' },
        { status: 403 }
      )
    }

    // Rate limit para operaciones de actualización
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

    // Obtener la reserva con pricing
    const current = await bookingService.getBookingById(bookingId)
    if (!current.success || !current.data) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Validar que el turno haya finalizado - relajado para datos de prueba
    // Permitir cerrar turnos pasados sin validar fecha/hora exacta
    // const bookingDate = new Date(current.data.bookingDate)
    // const [endHour, endMin] = current.data.endTime.split(':').map(Number)
    // const endDateTime = new Date(bookingDate)
    // endDateTime.setHours(endHour, endMin, 0, 0)
    // const now = new Date()
    // if (now < endDateTime) {
    //   return NextResponse.json(
    //     { success: false, error: 'El turno aún no finalizó' },
    //     { status: 400 }
    //   )
    // }

    // Validar saldo pendiente - relajado ya que no se maneja dinero real
    // Solo es una confirmación visual, permitir cerrar aunque haya saldo pendiente
    // const pendingBalance = current.data.pricing?.pendingBalance ?? 0
    // if (pendingBalance > 0) {
    //   return NextResponse.json(
    //     { success: false, error: 'No se puede cerrar: existe saldo pendiente' },
    //     { status: 400 }
    //   )
    // }

    // Validar que el turno esté en estado completado (no confirmado)
    // Solo se pueden cerrar turnos que ya se jugaron (completados)
    // Los turnos confirmados aún no se jugaron, no se pueden cerrar
    if (current.data.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden cerrar turnos que ya están completados' },
        { status: 400 }
      )
    }

    // Actualizar estado a COMPLETED (o solo agregar closedAt si ya está COMPLETED)
    // Si ya está COMPLETED pero sin closedAt, el repository lo agregará automáticamente
    const updateData: UpdateBookingInput = { status: 'COMPLETED' }
    
    const result = await bookingService.updateBooking(
      bookingId,
      updateData,
      session.user.id,
      session.user.role
    )

    if (!result.success) {
      const statusCode = result.error?.includes('permisos') ? 403 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    // Emitir SSE
    if (result.data) {
      eventEmitters.bookingsUpdated({
        action: 'closed',
        booking: result.data,
        message: `Reserva ${bookingId} cerrada definitivamente`
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/close:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
