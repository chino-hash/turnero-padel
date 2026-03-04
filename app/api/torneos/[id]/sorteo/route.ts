import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { runSorteo } from '@/lib/services/tournaments'
import { getUserTenantIdSafe, isSuperAdminUser, canAccessTenant, type User as PermissionsUser } from '@/lib/utils/permissions'
import { createErrorResponse, createSuccessResponse } from '@/lib/validations/common'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse('No autorizado'),
        { status: 401 },
      )
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email ?? null,
      role: session.user.role ?? 'USER',
      isAdmin: session.user.isAdmin ?? false,
      isSuperAdmin: session.user.isSuperAdmin ?? false,
      tenantId: session.user.tenantId ?? null,
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json(
        createErrorResponse('Solo administradores pueden realizar el sorteo'),
        { status: 403 },
      )
    }

    const { id } = await context.params
    const isSuperAdmin = await isSuperAdminUser(user)
    let tenantId: string

    if (isSuperAdmin) {
      const t = await prisma.tournament.findUnique({
        where: { id },
        select: { tenantId: true },
      })
      if (!t) {
        return NextResponse.json(
          createErrorResponse('Torneo no encontrado'),
          { status: 404 },
        )
      }
      const hasAccess = await canAccessTenant(user, t.tenantId)
      if (!hasAccess) {
        return NextResponse.json(
          createErrorResponse('No tiene acceso a este torneo'),
          { status: 403 },
        )
      }
      tenantId = t.tenantId
    } else {
      const userTenantId = await getUserTenantIdSafe(user)
      if (!userTenantId) {
        return NextResponse.json(
          createErrorResponse('No tiene un tenant asignado'),
          { status: 403 },
        )
      }
      tenantId = userTenantId
    }

    const body = await _request.json().catch(() => ({}))
    const numberOfGroups = typeof body?.numberOfGroups === 'number' ? body.numberOfGroups : undefined

    const result = await runSorteo(id, tenantId, { numberOfGroups })

    if (!result.ok) {
      return NextResponse.json(
        createErrorResponse(result.error),
        { status: 400 },
      )
    }

    return NextResponse.json(
      createSuccessResponse('Sorteo realizado', { matchesCreated: result.matchesCreated }),
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/torneos/[id]/sorteo:', error)
    return NextResponse.json(
      createErrorResponse('Error al realizar el sorteo', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}
