import { NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { getUserBookings } from '../../../../lib/services/bookings'
import { ExpiredBookingsService } from '../../../../lib/services/bookings/ExpiredBookingsService'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json([])
    }

    // Cancelar reservas pendientes expiradas del tenant (lazy) para que Mis Turnos no muestre pendientes vencidas
    const tenantId = (session.user as { tenantId?: string | null }).tenantId ?? null
    if (tenantId) {
      try {
        const expiredService = new ExpiredBookingsService()
        await expiredService.cancelExpiredBookings(tenantId)
      } catch (_) {
        // ignorar; no afectar la respuesta de reservas
      }
    }

    // Esta API solo obtiene las reservas del usuario autenticado
    // No necesita validación cross-tenant adicional ya que el usuario solo puede ver sus propias reservas
    // El servicio getUserBookings ya filtra por userId
    const bookings = await getUserBookings(session.user.id)
    return NextResponse.json(bookings ?? [])
  } catch (_) {
    return NextResponse.json([])
  }
}
