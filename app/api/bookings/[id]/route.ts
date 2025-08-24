import { NextResponse } from "next/server"
import { getBookingById } from "@/lib/services/bookings"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { eventEmitters } from "@/lib/sse-events"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const b = await getBookingById(id)
    if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(b)
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { status, cancellationReason } = await request.json()

    // Verificar que la reserva existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { court: true }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    // Verificar permisos: el usuario debe ser el propietario o admin
    const isOwner = existingBooking.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Sin permisos para modificar esta reserva' }, { status: 403 })
    }

    // Solo permitir cancelación si el status es CANCELLED
    if (status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Solo se permite cancelar reservas' }, { status: 400 })
    }

    // Actualizar la reserva
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelada por el usuario',
        updatedAt: new Date()
      },
      include: {
        court: true,
        user: true,
        players: true
      }
    })

    // Emitir eventos SSE
    eventEmitters.bookingsUpdated({
      action: 'cancelled',
      booking: updatedBooking,
      message: `Reserva cancelada: ${existingBooking.court.name} - ${existingBooking.startTime}`
    })

    eventEmitters.slotsUpdated({
      action: 'booking_cancelled',
      courtId: existingBooking.courtId,
      date: existingBooking.startTime,
      message: `Horario liberado en ${existingBooking.court.name}`
    })

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    console.error('Error cancelando reserva:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

