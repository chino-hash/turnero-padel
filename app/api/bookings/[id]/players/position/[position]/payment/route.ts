import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../../lib/auth'
import { bookingService } from '../../../../../../../../lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '../../../../../../../../lib/rate-limit'
import { updateBookingPlayerPaymentSchema } from '../../../../../../../../lib/validations/booking'
import { formatZodErrors } from '../../../../../../../../lib/validations/common'
import { ZodError } from 'zod'
import { eventEmitters } from '../../../../../../../../lib/sse-events'
import { prisma } from '../../../../../../../../lib/database/neon-config'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{
    id: string
    position: string
  }>
}

// PATCH /api/bookings/[id]/players/position/[position]/payment - Actualizar pago del jugador por posición
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const rateLimitCheck = withRateLimit(bookingUpdateRateLimit)
    const rateLimitResponse = await rateLimitCheck(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { id: bookingId, position: positionStr } = await params
    const position = Number(positionStr)
    if (!bookingId || !positionStr || Number.isNaN(position) || position < 1 || position > 4) {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos: bookingId y posición (1-4) requeridos' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = updateBookingPlayerPaymentSchema.parse(body)

    // Resolver playerId por posición dentro de la reserva
    const player = await prisma.bookingPlayer.findFirst({
      where: { bookingId, position }
    })
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Jugador no encontrado para la posición indicada' },
        { status: 404 }
      )
    }

    const result = await bookingService.updatePlayerPaymentAndRecalc(
      bookingId,
      player.id,
      validated,
      session.user.role
    )

    if (!result.success) {
      const statusCode = result.error?.includes('No encontrada') ? 404 :
                        result.error?.includes('permisos') ? 403 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    if (result.data) {
      eventEmitters.bookingsUpdated({
        action: 'player_payment_updated_by_position',
        booking: result.data,
        message: `Pago de jugador (posición ${position}) actualizado en reserva ${bookingId}`
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PATCH /api/bookings/[id]/players/position/[position]/payment:', error)

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