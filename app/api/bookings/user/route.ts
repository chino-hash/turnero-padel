import { NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { getUserBookings } from '../../../../lib/services/bookings'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json([])
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
