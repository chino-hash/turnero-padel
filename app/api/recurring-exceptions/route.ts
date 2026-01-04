import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { z } from 'zod'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

const bodySchema = z.object({
  recurringId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['SKIP','OVERRIDE']),
  newPrice: z.number().optional(),
  reason: z.string().optional()
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Construir usuario para validación de permisos
  const user: PermissionsUser = {
    id: session.user.id,
    email: session.user.email || null,
    role: session.user.role || 'USER',
    isAdmin: session.user.isAdmin || false,
    isSuperAdmin: session.user.isSuperAdmin || false,
    tenantId: session.user.tenantId || null,
  }

  const isSuperAdmin = await isSuperAdminUser(user)

  if (!user.isAdmin && !isSuperAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const userTenantId = await getUserTenantIdSafe(user)

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
  }
  const { recurringId, date, type, newPrice, reason } = parsed.data
  const dateObj = new Date(`${date}T00:00:00`)

  try {
    // Validar que el recurring booking pertenece al tenant del usuario
    if (!isSuperAdmin) {
      const recurringBooking = await prisma.recurringBooking.findUnique({
        where: { id: recurringId },
        select: { tenantId: true }
      })

      if (!recurringBooking) {
        return NextResponse.json({ error: 'Reserva recurrente no encontrada' }, { status: 404 })
      }

      if (userTenantId && recurringBooking.tenantId !== userTenantId) {
        return NextResponse.json({ error: 'No tienes permisos para crear excepciones en esta reserva recurrente' }, { status: 403 })
      }
    }

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