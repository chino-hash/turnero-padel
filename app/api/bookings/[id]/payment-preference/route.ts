import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/bookings/[id]/payment-preference
 * Crear preferencia de pago para una reserva
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitCheck = withRateLimit(bookingUpdateRateLimit)
    const rateLimitResponse = await rateLimitCheck(request)
    if (rateLimitResponse) return rateLimitResponse as any

    const { id: bookingId } = await params
    if (!bookingId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    // Construir usuario para validación de permisos multi-tenant
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
      select: { id: true, userId: true, tenantId: true, status: true, user: { select: { email: true } } }
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 })
    }

    // Cross-tenant: solo super admin puede operar sobre otros tenants
    if (!isSuperAdmin && userTenantId && booking.tenantId !== userTenantId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para crear preferencia de pago para esta reserva' },
        { status: 403 }
      )
    }

    // Resolver id real del usuario en BD (en algunos providers el id de sesión no coincide con User.id)
    let actorUserId = session.user.id
    const dbUserById = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    if (!dbUserById && session.user.email) {
      const dbUserByEmailInTenant = await prisma.user.findUnique({
        where: {
          email_tenantId: {
            email: session.user.email.toLowerCase(),
            tenantId: booking.tenantId
          }
        },
        select: { id: true }
      })
      if (dbUserByEmailInTenant?.id) {
        actorUserId = dbUserByEmailInTenant.id
      }
    }

    // Permisos: admin del tenant o propietario de la reserva
    const normalizedRole = (user.role || '').toUpperCase()
    const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || user.isAdmin || isSuperAdmin
    const bookingEmail = booking.user?.email?.toLowerCase() || null
    const sessionEmail = session.user.email?.toLowerCase() || null
    const isOwnerById = booking.userId === actorUserId
    const isOwnerByEmail = !!bookingEmail && !!sessionEmail && bookingEmail === sessionEmail
    if (!isAdmin && !isOwnerById && !isOwnerByEmail) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para crear preferencia de pago para esta reserva' },
        { status: 403 }
      )
    }

    // Crear preferencia de pago (usa credenciales del tenant)
    const result = await bookingService.createPaymentPreference(bookingId)

    if (!result.success) {
      const statusCode =
        result.code === 'MERCADOPAGO_NOT_CONNECTED' ? 503 :
        result.error?.includes('no encontrada') ? 404 :
        (result.error?.includes('fecha de expiración') || result.error === 'Reserva expirada') ? 400 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/payment-preference:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

