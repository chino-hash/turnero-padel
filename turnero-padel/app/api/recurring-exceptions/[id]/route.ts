import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  try {
    const exception = await prisma.recurringBookingException.findUnique({ where: { id: Number(id) }, include: { recurring: true } })
    if (!exception) return NextResponse.json({ error: 'Excepción no encontrada' }, { status: 404 })
    // Validar conflicto puntual (sin recurringId) en ese rango exacto
    const conflict = await prisma.booking.findFirst({
      where: {
        recurringId: null,
        courtId: exception.recurring.courtId,
        bookingDate: exception.date,
        startTime: exception.recurring.startTime,
        endTime: exception.recurring.endTime,
        status: { not: 'CANCELLED' }
      }
    })
    if (conflict) {
      return NextResponse.json({ error: 'Slot ya reservado puntualmente, no se puede deshacer el SKIP' }, { status: 409 })
    }
    await prisma.recurringBookingException.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}