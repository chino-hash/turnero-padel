import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/database/neon-config'
import { withRateLimit, bookingUpdateRateLimit } from '../../../../../../lib/rate-limit'
import { eventEmitters } from '../../../../../../lib/sse-events'
import { BookingService } from '../../../../../../lib/services/BookingService'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string, extraId: string }>
}

// DELETE /api/bookings/[id]/extras/[extraId] - Eliminar extra (soft delete) y restaurar stock
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const rateLimitResponse = await withRateLimit(bookingUpdateRateLimit)(request)
    if (rateLimitResponse) return rateLimitResponse

    const { id: bookingId, extraId } = await params
    if (!bookingId || !extraId) {
      return NextResponse.json({ success: false, error: 'IDs requeridos' }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      select: { id: true, userId: true }
    })
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 })
    }
    if (session.user.role !== 'ADMIN' && booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'No tienes permisos para actualizar esta reserva' }, { status: 403 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const extra = await tx.bookingExtra.findFirst({
        where: { id: extraId, bookingId, deletedAt: null },
      })
      if (!extra) {
        throw new Error('Extra no encontrado')
      }

      await tx.bookingExtra.update({
        where: { id: extraId },
        data: { deletedAt: new Date() }
      })

      // Restaurar stock del producto
      await tx.producto.update({
        where: { id: extra.productoId },
        data: { stock: { increment: extra.quantity } }
      })

      return extra
    })

    eventEmitters.bookingsUpdated({
      action: 'extras_removed',
      bookingId,
      extraId: result.id,
    })

    // Devolver la reserva completa con pricing actualizado
    const service = new BookingService(prisma)
    const bookingResponse = await service.getBookingById(bookingId)
    if (!bookingResponse.success || !bookingResponse.data) {
      return NextResponse.json({ success: false, error: 'Error al obtener la reserva actualizada' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: bookingResponse.data })
  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]/extras/[extraId]:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    const status = message.includes('Extra no encontrado') ? 404 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}