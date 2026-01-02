import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingUpdateRateLimit } from '@/lib/rate-limit'

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
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting
    const rateLimitCheck = withRateLimit(bookingUpdateRateLimit)
    const rateLimitResponse = await rateLimitCheck(request)
    
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

    // Verificar permisos: obtener la reserva para verificar que el usuario sea el dueño o admin
    const bookingResult = await bookingService.getBookingById(bookingId)
    
    if (!bookingResult.success || !bookingResult.data) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos: admin o propietario pueden crear preferencia de pago
    const isAdmin = String(session.user.role).toUpperCase() === 'ADMIN'
    if (!isAdmin && bookingResult.data.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para crear preferencia de pago para esta reserva' },
        { status: 403 }
      )
    }

    // Crear preferencia de pago
    const result = await bookingService.createPaymentPreference(bookingId)

    if (!result.success) {
      const statusCode = result.error?.includes('no encontrada') ? 404 :
                        result.error?.includes('no tiene fecha de expiración') ? 400 : 400
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





