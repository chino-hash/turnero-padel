import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../lib/auth'
import { getCourts, getAllCourts, createCourt, updateCourt, deleteCourt } from '../../../lib/services/courts'
import { eventEmitters } from '../../../lib/sse-events'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '../../../lib/utils/permissions'
import { courtCreateSchema, courtUpdateSchema } from '../../../lib/validations/court'
import { createErrorResponse, formatZodErrors } from '../../../lib/validations/common'

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener sesión; si no existe, devolver canchas activas de forma pública
    let session: any = null
    try {
      session = await auth()
    } catch {}

    // Permitir forzar vista pública/deduplicada vía query param
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || searchParams.get('scope') || searchParams.get('mode')
    const dedupe = searchParams.get('dedupe')
    const forcePublic = (view && /public|active/i.test(view)) || dedupe === 'true'

    // Construir usuario para validación de permisos
    let user: PermissionsUser | null = null
    if (session?.user) {
      user = {
        id: session.user.id,
        email: session.user.email || null,
        role: session.user.role || 'USER',
        isAdmin: session.user.isAdmin || false,
        isSuperAdmin: session.user.isSuperAdmin || false,
        tenantId: session.user.tenantId || null,
      }
    }

    const isSuperAdmin = user ? await isSuperAdminUser(user) : false
    const userTenantId = user ? await getUserTenantIdSafe(user) : null

    // Si es super admin y no se fuerza vista pública, obtener todas las canchas (sin filtro de tenant)
    // Si es admin de tenant, obtener todas las canchas de su tenant (incluyendo inactivas)
    // Caso contrario, devolver solo activas (deduplicadas por nombre) del tenant
    const courts = (session?.user?.isAdmin && !forcePublic && isSuperAdmin)
      ? await getAllCourts(undefined, { includeTenant: true })
      : (session?.user?.isAdmin && !forcePublic && userTenantId)
      ? await getAllCourts(userTenantId) // ADMIN: todas las canchas de su tenant (incluyendo inactivas)
      : await getCourts(userTenantId || undefined) // USER o público: solo activas del tenant
    return NextResponse.json(courts)
  } catch (error) {
    console.error('Error en GET /api/courts:', error)
    return NextResponse.json(
      createErrorResponse('Error al obtener canchas', 'Error interno del servidor'),
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || (!session.user.isAdmin && !session.user.isSuperAdmin)) {
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
    const userTenantId = await getUserTenantIdSafe(user)

    // Solo el super admin puede crear nuevas canchas; los admins del tenant no
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo el Super Administrador puede crear canchas' },
        { status: 403 }
      )
    }

    const raw = await request.json()
    const parsed = courtCreateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 }
      )
    }
    const data = parsed.data

    if (userTenantId && !data.tenantId) {
      data.tenantId = userTenantId
    }
    if (isSuperAdmin && !data.tenantId && !userTenantId) {
      return NextResponse.json(
        createErrorResponse('Debe seleccionar un tenant para la cancha'),
        { status: 400 }
      )
    }

    const court = await createCourt(data)
    
    // Emitir evento SSE para notificar cambios
    eventEmitters.courtsUpdated({
      action: 'created',
      court: court,
      message: `Nueva cancha creada: ${court.name}`
    }, data.tenantId || userTenantId)
    
    return NextResponse.json(court, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/courts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session || (!session.user.isAdmin && !session.user.isSuperAdmin)) {
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
    const userTenantId = await getUserTenantIdSafe(user)

    const raw = await request.json()
    const parsed = courtUpdateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 }
      )
    }
    const { id, ...updateData } = parsed.data

    // Obtener court existente para validación y tenantId del evento
    const { prisma } = await import('../../../lib/database/neon-config')
    const existingCourt = await prisma.court.findUnique({
      where: { id },
      select: { tenantId: true }
    })

    if (!existingCourt) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
    }

    // Validar permisos cross-tenant: verificar que la cancha pertenece al tenant del usuario
    if (!isSuperAdmin) {
      if (userTenantId && existingCourt.tenantId !== userTenantId) {
        return NextResponse.json({ error: 'No tienes permisos para actualizar esta cancha' }, { status: 403 })
      }

      // Prevenir cambio de tenantId si no es super admin
      if (updateData.tenantId && updateData.tenantId !== existingCourt.tenantId) {
        delete updateData.tenantId
      }
    }

    const court = await updateCourt(id, updateData)
    
    // Emitir evento SSE para notificar cambios
    eventEmitters.courtsUpdated({
      action: 'updated',
      court: court,
      message: `Cancha actualizada: ${court.name}`
    }, existingCourt.tenantId || userTenantId)
    
    return NextResponse.json(court)
  } catch (error) {
    console.error('Error en PUT /api/courts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || (!session.user.isAdmin && !session.user.isSuperAdmin)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo el Super Administrador puede eliminar canchas' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID de cancha requerido' }, { status: 400 })
    }

    const { prisma } = await import('../../../lib/database/neon-config')
    const existingCourt = await prisma.court.findUnique({
      where: { id },
      select: { tenantId: true, name: true }
    })
    if (!existingCourt) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
    }

    const court = await deleteCourt(id)
    eventEmitters.courtsUpdated({
      action: 'deleted',
      court: court,
      message: `Cancha eliminada: ${existingCourt.name}`
    }, existingCourt.tenantId)

    return NextResponse.json(court)
  } catch (error) {
    console.error('Error en DELETE /api/courts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
