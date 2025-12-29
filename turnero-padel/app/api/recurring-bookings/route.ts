import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { z } from 'zod'

const schema = z.object({
  courtId: z.string().min(1),
  userId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional()
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
  }
  const { courtId, userId, weekday, startTime, endTime, startsAt, endsAt, notes } = parsed.data
  try {
    const rule = await prisma.recurringBooking.create({
      data: {
        courtId,
        userId,
        weekday,
        startTime,
        endTime,
        startsAt: new Date(`${startsAt}T00:00:00`),
        endsAt: endsAt ? new Date(`${endsAt}T00:00:00`) : null,
        status: 'ACTIVE',
        notes
      }
    })
    return NextResponse.json({ success: true, data: { id: rule.id } })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}