import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../lib/auth'
import { getTenantFromSlug, canAccessTenant } from '../../../lib/tenant/context'
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

    // Permitir forzar vista pública/deduplicada vía query param; Super Admin puede filtrar por tenantId
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || searchParams.get('scope') || searchParams.get('mode')
    const dedupe = searchParams.get('dedupe')
    const forcePublic = (view && /public|active/i.test(view)) || dedupe === 'true'
    const queryTenantId = searchParams.get('tenantId')?.trim() || null
    const queryTenantSlug = searchParams.get('tenantSlug')?.trim() || null

    // Si viene tenantSlug (ej. dashboard?tenantSlug=metro-padel-360), exigir sesión y acceso al tenant
    if (queryTenantSlug) {
      if (!session?.user?.email) {
        return NextResponse.json(
          createErrorResponse('No autorizado', 'Inicia sesión para ver las canchas de este club'),
          { status: 403 }
        )
      }
      const tenant = await getTenantFromSlug(queryTenantSlug)
      if (!tenant) {
        return NextResponse.json(
          createErrorResponse('Tenant no encontrado', `No existe un tenant con slug "${queryTenantSlug}"`),
          { status: 404 }
        )
      }
      if (!tenant.isActive) {
        return NextResponse.json(
          createErrorResponse('Tenant inactivo', 'Este club no está disponible'),
          { status: 403 }
        )
      }
      const allowed = await canAccessTenant(session.user.email, tenant.id)
      if (!allowed) {
        return NextResponse.json(
          createErrorResponse('No autorizado', 'No tienes acceso a este tenant'),
          { status: 403 }
        )
      }
      // Vista pública/booking (dashboard, reservas): solo canchas activas para todos
      // Panel admin sin view=public sigue usando getAllCourts vía ?tenantId= en otra ruta
      const isAdmin = session.user.isAdmin || session.user.isSuperAdmin
      const courts = forcePublic
        ? await getCourts(tenant.id)
        : isAdmin
          ? await getAllCourts(tenant.id, { includeTenant: Boolean(session.user.isSuperAdmin) })
          : await getCourts(tenant.id)
      return NextResponse.json(courts)
    }

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

    // Si es admin con tenantId en query: super admin puede pedir cualquier tenant; admin solo el suyo
    // Si es admin con tenant en sesión (userTenantId): devolver solo canchas de ese tenant (incl. super admin "dentro" de un tenant)
    // Si es super admin sin tenant: devolver todas las canchas (ej. vista desde /super-admin)
    // Caso contrario: solo activas del tenant o vista pública
    const canUseQueryTenant =
      queryTenantId && (isSuperAdmin || queryTenantId === userTenantId)
    const courts = (session?.user?.isAdmin && !forcePublic && canUseQueryTenant)
      ? await getAllCourts(queryTenantId!, { includeTenant: isSuperAdmin })
      : (session?.user?.isAdmin && !forcePublic && userTenantId)
      ? await getAllCourts(userTenantId, { includeTenant: isSuperAdmin }) // Admin o super admin en contexto de tenant: solo ese tenant
      : (session?.user?.isAdmin && !forcePublic && isSuperAdmin)
      ? await getAllCourts(undefined, { includeTenant: true }) // Super admin sin tenant: todas
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
  let rawBody: unknown = null
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

    rawBody = await request.json()
    const parsed = courtUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      console.error('PUT /api/courts - validación fallida', {
        zodErrors: formatZodErrors(parsed.error),
        rawBody,
      })
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 }
      )
    }
    const { id, ...updateData } = parsed.data
    console.info('PUT /api/courts - payload validado', {
      id,
      updateKeys: Object.keys(updateData),
      courtType: updateData.courtType ?? null,
      tenantId: updateData.tenantId ?? null,
      isActive: updateData.isActive ?? null,
      userTenantId,
      isSuperAdmin,
    })

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
    const errorWithCode = error as { code?: string; meta?: unknown; stack?: string } | null
    console.error('Error en PUT /api/courts (debug):', {
      message: error instanceof Error ? error.message : 'Error interno del servidor',
      code: errorWithCode?.code ?? null,
      meta: errorWithCode?.meta ?? null,
      stack: errorWithCode?.stack ?? null,
      rawBody,
    })
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json(
      { error: message },
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
