/**
 * POST /api/bookings/[id]/sync-payment-status
 * Sincroniza el estado de pago con Mercado Pago: si la reserva está PENDING y existe
 * un pago aprobado en MP con external_reference=bookingId, actualiza la reserva a CONFIRMED.
 * Útil como fallback cuando el webhook no ha actualizado aún (ej. al volver del checkout).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { prisma } from '@/lib/database/neon-config'
import { getTenantMercadoPagoCredentials } from '@/lib/services/payments/tenant-credentials'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** Buscar pagos en MP por external_reference (bookingId). Devuelve el primero aprobado si existe. */
async function findApprovedPaymentByExternalReference(
  bookingId: string,
  accessToken: string
): Promise<{ id: string | number; status: string; transaction_amount?: number } | null> {
  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  url.searchParams.set('external_reference', bookingId)
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.warn('[sync-payment-status] MP search failed:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  const results = Array.isArray(data?.results) ? data.results : []
  const approved = results.find((p: any) => (p.status || '').toLowerCase() === 'approved')
  return approved ? {
    id: approved.id,
    status: approved.status,
    transaction_amount: approved.transaction_amount != null ? Number(approved.transaction_amount) : undefined,
  } : null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { id: bookingId } = await params
    if (!bookingId?.trim()) {
      return NextResponse.json({ success: false, error: 'ID de reserva requerido' }, { status: 400 })
    }

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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        status: true,
        depositAmount: true,
        totalPrice: true,
        bookingDate: true,
        courtId: true,
        user: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 })
    }

    if (!isSuperAdmin && userTenantId && booking.tenantId !== userTenantId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para esta reserva' },
        { status: 403 }
      )
    }

    const isAdmin = user.role === 'ADMIN' || isSuperAdmin
    if (!isAdmin && booking.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para esta reserva' },
        { status: 403 }
      )
    }

    if (booking.status !== 'PENDING') {
      const result = await bookingService.getBookingById(bookingId)
      return NextResponse.json(result.success ? { success: true, data: result.data } : result, { status: result.success ? 200 : 404 })
    }

    if (!booking.tenantId) {
      return NextResponse.json(
        { success: false, error: 'La reserva no tiene tenant asociado' },
        { status: 400 }
      )
    }

    const credentials = await getTenantMercadoPagoCredentials(booking.tenantId)
    if (!credentials?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Mercado Pago no está configurado para este club' },
        { status: 503 }
      )
    }

    const approvedPayment = await findApprovedPaymentByExternalReference(bookingId, credentials.accessToken)
    if (!approvedPayment) {
      const result = await bookingService.getBookingById(bookingId)
      return NextResponse.json(result.success ? { success: true, data: result.data, updated: false } : result, { status: result.success ? 200 : 404 })
    }

    const amount = approvedPayment.transaction_amount != null
      ? Math.round(Number(approvedPayment.transaction_amount))
      : Math.round((booking.depositAmount || 0) / 100)

    const paidAmountCents =
      (booking.depositAmount ?? 0) > 0
        ? booking.depositAmount!
        : Math.round((booking.totalPrice ?? 0) / 4)
    const titularName = booking.user?.name ?? 'Titular'

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
          tenantId: booking.tenantId!,
          bookingId,
          amount,
          paymentMethod: 'CARD',
          paymentType: 'PAYMENT',
          referenceNumber: String(approvedPayment.id),
          status: 'completed',
          notes: `Pago sincronizado desde MP - Payment ID: ${approvedPayment.id}`,
        },
      })

      // Marcar jugador posición 1 (titular) como pagado; si no existe, crearlo (idempotente)
      try {
        const player1 = await tx.bookingPlayer.findFirst({
          where: { bookingId, position: 1 },
        })
        if (player1) {
          await tx.bookingPlayer.update({
            where: { id: player1.id },
            data: { hasPaid: true, paidAmount: paidAmountCents, updatedAt: new Date() },
          })
        } else {
          await tx.bookingPlayer.create({
            data: {
              bookingId,
              position: 1,
              playerName: titularName,
              hasPaid: true,
              paidAmount: paidAmountCents,
            },
          })
        }
      } catch (playerErr) {
        console.warn('[sync-payment-status] Error actualizando/creando jugador posición 1:', playerErr)
      }
    })

    const result = await bookingService.getBookingById(bookingId)
    return NextResponse.json(result.success ? { success: true, data: result.data, updated: true } : result, { status: result.success ? 200 : 404 })
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/sync-payment-status:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
