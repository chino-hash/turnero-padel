import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'
import { eventEmitters } from '@/lib/sse-events'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { prisma } from '@/lib/database/neon-config'

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

    // Solo admins pueden cerrar definitivamente
    if (!user.isAdmin && !isSuperAdmin) {
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

    const userTenantId = await getUserTenantIdSafe(user)
    
    // Validar permisos cross-tenant antes de obtener la reserva
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
          { success: false, error: 'No tienes permisos para cerrar esta reserva' },
          { status: 403 }
        )
      }
    }

    // Obtener la reserva con pricing
    const current = await bookingService.getBookingById(bookingId)
    if (!current.success || !current.data) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Validar que el turno haya finalizado
    const bookingDate = new Date(current.data.bookingDate)
    const [endHour, endMin] = current.data.endTime.split(':').map(Number)
    const endDateTime = new Date(bookingDate)
    endDateTime.setHours(endHour, endMin, 0, 0)
    const now = new Date()

    if (now < endDateTime) {
      return NextResponse.json(
        { success: false, error: 'El turno aún no finalizó' },
        { status: 400 }
      )
    }

    // Validar saldo pendiente
    const pendingBalance = current.data.pricing?.pendingBalance ?? 0
    if (pendingBalance > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede cerrar: existe saldo pendiente' },
        { status: 400 }
      )
    }

    // Evitar re-cerrar
    if (current.data.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'La reserva ya está cerrada' },
        { status: 400 }
      )
    }

    // Actualizar estado a COMPLETED
    const result = await bookingService.updateBooking(
      bookingId,
      { status: 'COMPLETED' },
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
      }, bookingTenantId)
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
