import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/database/neon-config'
import { withRateLimit, bookingReadRateLimit, bookingUpdateRateLimit } from '../../../../../lib/rate-limit'
import { eventEmitters } from '../../../../../lib/sse-events'
import { createBookingExtraSchema } from '../../../../../lib/validations/extras'
import { ZodError } from 'zod'
import { BookingService } from '../../../../../lib/services/BookingService'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/bookings/[id]/extras - Listar extras de una reserva
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const rateLimitResponse = await withRateLimit(bookingReadRateLimit)(request)
    if (rateLimitResponse) return rateLimitResponse

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'ID de reserva requerido' }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      select: { id: true, userId: true }
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 })
    }

    if (session.user.role !== 'ADMIN' && booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'No tienes permisos para ver esta reserva' }, { status: 403 })
    }

    const extras = await prisma.bookingExtra.findMany({
      where: { bookingId, deletedAt: null },
      include: {
        producto: true,
        player: {
          select: { id: true, playerName: true, position: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: extras })
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]/extras:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/bookings/[id]/extras - Agregar extra a una reserva
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const rateLimitResponse = await withRateLimit(bookingUpdateRateLimit)(request)
    if (rateLimitResponse) return rateLimitResponse

    const { id: bookingId } = await params
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'ID de reserva requerido' }, { status: 400 })
    }

    const body = await request.json()
    const payload = createBookingExtraSchema.parse(body)

    // Validaciones de asignación
    if (payload.assignedToAll && payload.playerId) {
      return NextResponse.json({ success: false, error: 'No se puede asignar a todos y a un jugador específico a la vez' }, { status: 400 })
    }
    if (!payload.assignedToAll && !payload.playerId) {
      return NextResponse.json({ success: false, error: 'playerId es requerido si no se asigna a todos' }, { status: 400 })
    }

    // Verificar reserva y permisos
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
      const producto = await tx.producto.findFirst({
        where: { id: payload.productoId, activo: true },
      })
      if (!producto) {
        throw new Error('Producto no encontrado o inactivo')
      }
      if (producto.stock < payload.quantity) {
        throw new Error('Stock insuficiente')
      }

      const unitPrice = producto.precio
      const totalPrice = unitPrice * payload.quantity

      const created = await tx.bookingExtra.create({
        data: {
          bookingId,
          playerId: payload.assignedToAll ? null : payload.playerId,
          productoId: payload.productoId,
          quantity: payload.quantity,
          unitPrice,
          totalPrice,
          assignedToAll: payload.assignedToAll,
          notes: payload.notes,
        }
      })

      await tx.producto.update({
        where: { id: payload.productoId },
        data: { stock: producto.stock - payload.quantity }
      })

      return created
    })

    // Emitir actualización para tiempo real
    eventEmitters.bookingsUpdated({
      action: 'extras_added',
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
    console.error('Error in POST /api/bookings/[id]/extras:', error)
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.flatten() }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    const status = message.includes('Stock') ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}