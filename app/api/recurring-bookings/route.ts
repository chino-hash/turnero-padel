import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { z } from 'zod'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

const schema = z.object({
  courtId: z.string().min(1),
  userId: z.string().min(1).optional(),
  guestName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional()
}).refine((d) => !!d.userId || (!!d.guestName && !!d.guestEmail), {
  message: 'Debe enviar userId o guestName y guestEmail',
  path: ['userId']
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

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
  }
  const { courtId, userId: bodyUserId, guestName, guestEmail, weekday, startTime, endTime, startsAt, endsAt, notes } = parsed.data

  const userTenantId = await getUserTenantIdSafe(user)
  
  // Validar cancha y obtener tenantId
  const court = await prisma.court.findUnique({
    where: { id: courtId },
    select: { tenantId: true }
  })
  if (!court) {
    return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
  }
  const tenantId = court.tenantId

  if (!isSuperAdmin && userTenantId && court.tenantId !== userTenantId) {
    return NextResponse.json({ error: 'No tienes permisos para crear reservas recurrentes en esta cancha' }, { status: 403 })
  }

  let userId: string
  if (bodyUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: bodyUserId },
      select: { id: true, tenantId: true }
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    if (!isSuperAdmin && userTenantId && targetUser.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'No tienes permisos para crear reservas recurrentes para este usuario' }, { status: 403 })
    }
    userId = targetUser.id
  } else if (guestName && guestEmail) {
    const email = guestEmail.trim().toLowerCase()
    let guest = await prisma.user.findUnique({
      where: { email_tenantId: { email, tenantId } },
      select: { id: true },
    })
    if (!guest) {
      guest = await prisma.user.create({
        data: {
          tenantId,
          email,
          name: guestName.trim() || null,
          fullName: guestName.trim() || null,
        },
        select: { id: true },
      })
    }
    userId = guest.id
  } else {
    return NextResponse.json({ error: 'Debe enviar userId o guestName y guestEmail' }, { status: 400 })
  }

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
        notes,
        tenantId: tenantId!
      }
    })
    return NextResponse.json({ success: true, data: { id: rule.id } })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}