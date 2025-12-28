import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'
import { updateBookingPlayerPaymentSchema } from '@/lib/validations/booking'
import { formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'
import { eventEmitters } from '@/lib/sse-events'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{
    id: string
    playerId: string
  }>
}

// PATCH /api/bookings/[id]/players/[playerId]/payment - Actualizar pago individual del jugador
export async function PATCH(
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

    // Aplicar rate limiting para actualizaciones
    const rateLimitCheck = withRateLimit(bookingUpdateRateLimit)
    const rateLimitResponse = await rateLimitCheck(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id: bookingId, playerId } = await params
    if (!bookingId || !playerId) {
      return NextResponse.json(
        { success: false, error: 'IDs de reserva y jugador requeridos' },
        { status: 400 }
      )
    }

    // Validar datos del cuerpo
    const body = await request.json()
    const validated = updateBookingPlayerPaymentSchema.parse(body)

    // Actualizar pago del jugador y recalcular estado
    const result = await bookingService.updatePlayerPaymentAndRecalc(
      bookingId,
      playerId,
      validated,
      session.user.role
    )

    if (!result.success) {
      const statusCode = result.error?.includes('No encontrada') ? 404 :
                        result.error?.includes('permisos') ? 403 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    // Emitir evento SSE para actualizar paneles en tiempo real
    if (result.data) {
      eventEmitters.bookingsUpdated({
        action: 'player_payment_updated',
        booking: result.data,
        message: `Pago de jugador actualizado en reserva ${bookingId}`
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PATCH /api/bookings/[id]/players/[playerId]/payment:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de actualización de pago inválidos',
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