import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../lib/auth'
import { getCourts, getAllCourts, createCourt, updateCourt } from '../../../lib/services/courts'
import { eventEmitters } from '../../../lib/sse-events'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '../../../lib/utils/permissions'

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
      ? await getAllCourts() // SUPER_ADMIN: todas las canchas sin filtro
      : (session?.user?.isAdmin && !forcePublic && userTenantId)
      ? await getAllCourts(userTenantId) // ADMIN: todas las canchas de su tenant (incluyendo inactivas)
      : await getCourts(userTenantId || undefined) // USER o público: solo activas del tenant
    return NextResponse.json(courts)
  } catch (error) {
    console.error('Error en GET /api/courts:', error)
    // Si hay un error, puede ser porque no hay datos migrados todavía
    // Devolver array vacío en lugar de error 500 para que la aplicación no se rompa
    // TODO: Una vez que se migren los datos con tenantId, remover este fallback
    console.warn('⚠️ Error obteniendo canchas - posiblemente falta migración de datos. Devolviendo array vacío.')
    return NextResponse.json([])
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

    // Si no es super admin, asegurar que el court se cree con el tenantId del usuario
    const data = await request.json()
    if (!isSuperAdmin && userTenantId && !data.tenantId) {
      data.tenantId = userTenantId
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

    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json({ error: 'ID de cancha requerido' }, { status: 400 })
    }

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
