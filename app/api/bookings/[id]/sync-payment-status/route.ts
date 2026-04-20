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
import { BookingWebhookHandler } from '@/lib/services/payments/BookingWebhookHandler'
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

    const isAdmin = user.role === 'ADMIN' || isSuperAdmin
    const canReadBooking =
      isAdmin ||
      booking.userId === session.user.id ||
      (!!userTenantId && booking.tenantId === userTenantId)

    if (booking.status !== 'PENDING' && booking.status !== 'CANCELLED') {
      if (!canReadBooking) {
        return NextResponse.json({ success: true, updated: false }, { status: 200 })
      }
      const result = await bookingService.getBookingById(bookingId)
      return NextResponse.json(result.success ? { success: true, data: result.data } : result, {
        status: result.success ? 200 : 404
      })
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
      if (!canReadBooking) {
        return NextResponse.json({ success: true, updated: false }, { status: 200 })
      }
      const result = await bookingService.getBookingById(bookingId)
      return NextResponse.json(result.success ? { success: true, data: result.data, updated: false } : result, {
        status: result.success ? 200 : 404
      })
    }

    // Reusar la misma lógica del webhook para mantener el comportamiento consistente
    // (incluye casos de pago tardío con reserva CANCELLED y validación de conflictos).
    const webhookHandler = new BookingWebhookHandler()
    const webhookResult = await webhookHandler.handle({
      type: 'payment',
      data: {
        id: approvedPayment.id,
        status: 'approved',
        external_reference: bookingId,
        transaction_amount: approvedPayment.transaction_amount,
      },
    })

    if (!webhookResult.processed) {
      return NextResponse.json(
        { success: false, error: webhookResult.error || 'No se pudo sincronizar el pago' },
        { status: 400 }
      )
    }

    if (!canReadBooking) {
      return NextResponse.json(
        { success: true, updated: !!webhookResult.bookingUpdated, message: webhookResult.error },
        { status: 200 }
      )
    }

    const result = await bookingService.getBookingById(bookingId)
    return NextResponse.json(
      result.success
        ? { success: true, data: result.data, updated: !!webhookResult.bookingUpdated, message: webhookResult.error }
        : result,
      { status: result.success ? 200 : 404 }
    )
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/sync-payment-status:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
