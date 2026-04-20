import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { getUserBookings } from '../../../../lib/services/bookings'
import { ExpiredBookingsService } from '../../../../lib/services/bookings/ExpiredBookingsService'
import { getTenantFromSlug } from '../../../../lib/tenant/context'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json([])
    }

    // Determinar tenant efectivo: prioridad a query (tenantId/tenantSlug), fallback a session.user.tenantId
    const { searchParams } = new URL(request.url)
    const queryTenantId = searchParams.get('tenantId')?.trim() || null
    const queryTenantSlug = searchParams.get('tenantSlug')?.trim() || null
    const sessionTenantId = (session.user as { tenantId?: string | null }).tenantId ?? null

    let effectiveTenantId: string | null = queryTenantId
    if (!effectiveTenantId && queryTenantSlug) {
      const tenantFromSlug = await getTenantFromSlug(queryTenantSlug)
      effectiveTenantId = tenantFromSlug?.id ?? null
    }
    if (!effectiveTenantId) {
      effectiveTenantId = sessionTenantId
    }

    // Cancelar reservas pendientes expiradas del tenant (lazy) para que Mis Turnos no muestre pendientes vencidas
    if (effectiveTenantId) {
      try {
        const expiredService = new ExpiredBookingsService()
        await expiredService.cancelExpiredBookings(effectiveTenantId)
      } catch (_) {
        // ignorar; no afectar la respuesta de reservas
      }
    }

    // Esta API solo obtiene las reservas del usuario autenticado
    // No necesita validación cross-tenant adicional ya que el usuario solo puede ver sus propias reservas
    // El servicio getUserBookings filtra por userId y, si corresponde, por tenantId
    const bookings = await getUserBookings(session.user.id, effectiveTenantId)
    return NextResponse.json(bookings ?? [])
  } catch (_) {
    return NextResponse.json([])
  }
}
