import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { z } from 'zod'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

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
  const { courtId, userId, weekday, startTime, endTime, startsAt, endsAt, notes } = parsed.data

  const userTenantId = await getUserTenantIdSafe(user)
  
  // Validar que la cancha pertenece al tenant accesible
  let tenantId: string | null = null
  
  if (!isSuperAdmin) {
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { tenantId: true }
    })

    if (!court) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
    }

    if (userTenantId && court.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'No tienes permisos para crear reservas recurrentes en esta cancha' }, { status: 403 })
    }

    tenantId = court.tenantId

    // Validar que el usuario pertenece al tenant accesible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (userTenantId && targetUser.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'No tienes permisos para crear reservas recurrentes para este usuario' }, { status: 403 })
    }
  } else {
    // Super admin: obtener tenantId de la cancha
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { tenantId: true }
    })

    if (!court) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
    }

    tenantId = court.tenantId
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