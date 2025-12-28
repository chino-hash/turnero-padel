import { NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { getUserBookings } from '../../../../lib/services/bookings'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json([])
    }

    const bookings = await getUserBookings(session.user.id)
    return NextResponse.json(bookings ?? [])
  } catch (_) {
    return NextResponse.json([])
  }
}
