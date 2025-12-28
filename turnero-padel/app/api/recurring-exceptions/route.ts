import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { z } from 'zod'

const bodySchema = z.object({
  recurringId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['SKIP','OVERRIDE']),
  newPrice: z.number().optional(),
  reason: z.string().optional()
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
  }
  const { recurringId, date, type, newPrice, reason } = parsed.data
  const dateObj = new Date(`${date}T00:00:00`)
  try {
    const result = await prisma.$transaction(async (tx) => {
      const exception = await tx.recurringBookingException.create({
        data: { recurringId, date: dateObj, type, reason, newPrice }
      })
      const booking = await tx.booking.findFirst({ where: { recurringId, bookingDate: dateObj } })
      if (booking) {
        if (type === 'SKIP') {
          await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
        } else {
          await tx.booking.update({ where: { id: booking.id }, data: { totalPrice: newPrice ?? booking.totalPrice, notes: reason ?? booking.notes } })
        }
      }
      return { exceptionId: exception.id, bookingId: booking?.id }
    })
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}