import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'
import { updateBookingPlayerPaymentSchema } from '@/lib/validations/booking'
import { formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'
import { eventEmitters } from '@/lib/sse-events'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

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

    // Construir usuario para validación de permisos
    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    const userTenantId = await getUserTenantIdSafe(user)

    // Validar permisos cross-tenant y obtener tenantId del booking
    let bookingTenantId = userTenantId
    if (!isSuperAdmin) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { tenantId: true }
      })

      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Reserva no encontrada' },
          { status: 404 }
        )
      }

      bookingTenantId = booking.tenantId

      if (userTenantId && booking.tenantId !== userTenantId) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para actualizar esta reserva' },
          { status: 403 }
        )
      }
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

    let result = await bookingService.updatePlayerPaymentAndRecalc(
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

    // Confirmación al pagar depósito: si la reserva está PENDING y el total pagado >= % configurado, pasar a CONFIRMED (solo reservas creadas por usuario, no admin)
    if (result.data && result.data.status === 'PENDING') {
      const players = result.data.players || []
      const total = Number(result.data.totalPrice) || 0
      const playerCount = Math.max(1, players.length)
      const sharePerPlayer = total / playerCount
      // Si el UI solo envía hasPaid (sin paidAmount), estimar parte proporcional por jugador que marcó pagado
      const totalPaid = players.reduce((s: number, p: { hasPaid?: boolean; paidAmount?: number }) => {
        const amount = Number(p.paidAmount) || 0
        const effective = p.hasPaid ? (amount > 0 ? amount : Math.round(sharePerPlayer)) : amount
        return s + effective
      }, 0)
      const setting = bookingTenantId
        ? await prisma.systemSetting.findFirst({
            where: { tenantId: bookingTenantId, key: 'depositConfirmPercent' },
            select: { value: true }
          })
        : null
      const percent = setting?.value ? Math.min(100, Math.max(0, parseInt(setting.value, 10) || 0)) : 0
      if (percent > 0 && total > 0 && totalPaid >= (total * percent) / 100) {
        const confirmResult = await bookingService.updateBooking(
          bookingId,
          { status: 'CONFIRMED' },
          session.user.id,
          session.user.role
        )
        if (confirmResult.success && confirmResult.data) {
          result = { ...result, data: confirmResult.data }
          eventEmitters.bookingsUpdated({
            action: 'booking_auto_confirmed_by_deposit',
            booking: confirmResult.data,
            message: `Reserva confirmada al alcanzar el ${percent}% de pago`
          }, bookingTenantId)
        }
      }
    }

    if (result.data) {
      eventEmitters.bookingsUpdated({
        action: 'player_payment_updated_by_position',
        booking: result.data,
        message: `Pago de jugador (posición ${position}) actualizado en reserva ${bookingId}`
      }, bookingTenantId)
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