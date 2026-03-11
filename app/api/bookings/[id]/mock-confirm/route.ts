import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { clearBookingsCache } from '@/lib/services/courts'
import { eventEmitters } from '@/lib/sse-events'

export const runtime = 'nodejs'

/**
 * POST /api/bookings/[id]/mock-confirm
 * Confirma una reserva en modo demo (sandbox sin credenciales MP).
 * Solo permitido cuando el tenant está en sandbox sin access token.
 * Idempotente: si la reserva ya está CONFIRMED/CANCELLED, responde 200 sin cambios.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tenant: {
          select: {
            id: true,
            mercadoPagoEnabled: true,
            mercadoPagoEnvironment: true,
            mercadoPagoAccessToken: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    const tenant = booking.tenant
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    const isDemoMode =
      tenant.mercadoPagoEnabled === true &&
      (tenant.mercadoPagoEnvironment || 'sandbox') === 'sandbox' &&
      (!tenant.mercadoPagoAccessToken || !String(tenant.mercadoPagoAccessToken).trim())

    if (!isDemoMode) {
      return NextResponse.json(
        { success: false, error: 'Mock confirm solo permitido en modo demo (sandbox sin credenciales)' },
        { status: 403 }
      )
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes confirmar esta reserva' },
        { status: 403 }
      )
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({ success: true, alreadyConfirmed: true }, { status: 200 })
    }

    const tenantId = booking.tenantId
    const amount = booking.depositAmount && booking.depositAmount > 0 ? booking.depositAmount : booking.totalPrice

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'DEPOSIT_PAID',
          expiresAt: null,
          updatedAt: new Date(),
        },
      })

      await tx.payment.create({
        data: {
          tenantId,
          bookingId,
          amount,
          paymentMethod: 'CARD',
          paymentType: 'PAYMENT',
          status: 'completed',
          notes: 'Pago simulado (modo demo)',
        },
      })
    })

    clearBookingsCache(booking.courtId, booking.bookingDate)
    eventEmitters.bookingsUpdated(
      {
        action: 'mock_confirm',
        bookingId,
        message: 'Reserva confirmada (pago simulado)',
      },
      tenantId
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[mock-confirm] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al confirmar la reserva' },
      { status: 500 }
    )
  }
}
