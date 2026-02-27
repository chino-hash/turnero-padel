import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTournamentsByTenant, createTournament } from '@/lib/services/tournaments'
import { getUserTenantIdSafe, isSuperAdminUser, canAccessTenant, type User as PermissionsUser } from '@/lib/utils/permissions'
import { tournamentCreateSchema } from '@/lib/validations/tournament'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'

export async function GET(_request: NextRequest) {
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

    const userTenantId = await getUserTenantIdSafe(user)
    if (!userTenantId) {
      return NextResponse.json(
        createErrorResponse('No tiene un tenant asignado para ver torneos'),
        { status: 403 },
      )
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json(
        createErrorResponse('Solo administradores pueden ver la lista de torneos'),
        { status: 403 },
      )
    }

    const tournaments = await getTournamentsByTenant(userTenantId)
    return NextResponse.json(
      createSuccessResponse('OK', tournaments),
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/torneos:', error)
    return NextResponse.json(
      createErrorResponse('Error al obtener torneos', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const raw = await request.json().catch(() => ({}))
    const tenantIdFromBody = typeof raw?.tenantId === 'string' && raw.tenantId.trim() ? raw.tenantId.trim() : null
    const parsed = tournamentCreateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 },
      )
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    let targetTenantId: string | null = null

    if (isSuperAdmin) {
      if (!tenantIdFromBody) {
        return NextResponse.json(
          createErrorResponse('Seleccione el club para el cual crear el torneo'),
          { status: 403 },
        )
      }
      const hasAccess = await canAccessTenant(user, tenantIdFromBody)
      if (!hasAccess) {
        return NextResponse.json(
          createErrorResponse('No tiene acceso a ese club'),
          { status: 403 },
        )
      }
      targetTenantId = tenantIdFromBody
    } else {
      const userTenantId = await getUserTenantIdSafe(user)
      if (!userTenantId) {
        return NextResponse.json(
          createErrorResponse('No tiene un tenant asignado para crear torneos'),
          { status: 403 },
        )
      }
      if (!session.user.isAdmin) {
        return NextResponse.json(
          createErrorResponse('Solo administradores del club pueden crear torneos'),
          { status: 403 },
        )
      }
      targetTenantId = userTenantId
    }

    if (!targetTenantId) {
      return NextResponse.json(
        createErrorResponse('No se pudo determinar el club'),
        { status: 403 },
      )
    }
    const tournament = await createTournament(targetTenantId, parsed.data)
    return NextResponse.json(
      createSuccessResponse('Torneo creado', tournament),
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 },
      )
    }
    console.error('POST /api/torneos:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json(
      createErrorResponse('Error al crear torneo', message),
      { status: 500 },
    )
  }
}
