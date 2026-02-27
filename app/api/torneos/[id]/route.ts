import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getTournamentById,
  updateTournament,
  deleteTournament,
} from '@/lib/services/tournaments'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { tournamentUpdateSchema } from '@/lib/validations/tournament'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
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
        createErrorResponse('No tiene un tenant asignado'),
        { status: 403 },
      )
    }

    const { id } = await context.params
    const tournament = await getTournamentById(id, userTenantId)
    if (!tournament) {
      return NextResponse.json(
        createErrorResponse('Torneo no encontrado'),
        { status: 404 },
      )
    }

    return NextResponse.json(
      createSuccessResponse('OK', tournament),
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/torneos/[id]:', error)
    return NextResponse.json(
      createErrorResponse('Error al obtener torneo', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
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

    const isSuperAdmin = await isSuperAdminUser(user)
    if (isSuperAdmin) {
      return NextResponse.json(
        createErrorResponse('El super administrador no puede editar torneos'),
        { status: 403 },
      )
    }

    const userTenantId = await getUserTenantIdSafe(user)
    if (!userTenantId) {
      return NextResponse.json(
        createErrorResponse('No tiene un tenant asignado'),
        { status: 403 },
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        createErrorResponse('Solo administradores del club pueden editar torneos'),
        { status: 403 },
      )
    }

    const { id } = await context.params
    const raw = await request.json()
    const parsed = tournamentUpdateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 },
      )
    }

    const tournament = await updateTournament(id, userTenantId, parsed.data)
    if (!tournament) {
      return NextResponse.json(
        createErrorResponse('Torneo no encontrado'),
        { status: 404 },
      )
    }

    return NextResponse.json(
      createSuccessResponse('Torneo actualizado', tournament),
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 },
      )
    }
    console.error('PATCH /api/torneos/[id]:', error)
    return NextResponse.json(
      createErrorResponse('Error al actualizar torneo', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
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

    const isSuperAdmin = await isSuperAdminUser(user)
    if (isSuperAdmin) {
      return NextResponse.json(
        createErrorResponse('El super administrador no puede eliminar torneos'),
        { status: 403 },
      )
    }

    const userTenantId = await getUserTenantIdSafe(user)
    if (!userTenantId) {
      return NextResponse.json(
        createErrorResponse('No tiene un tenant asignado'),
        { status: 403 },
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        createErrorResponse('Solo administradores del club pueden eliminar torneos'),
        { status: 403 },
      )
    }

    const { id } = await context.params
    const deleted = await deleteTournament(id, userTenantId)
    if (!deleted) {
      return NextResponse.json(
        createErrorResponse('Torneo no encontrado'),
        { status: 404 },
      )
    }

    return NextResponse.json(
      createSuccessResponse('Torneo eliminado'),
      { status: 200 },
    )
  } catch (error) {
    console.error('DELETE /api/torneos/[id]:', error)
    return NextResponse.json(
      createErrorResponse('Error al eliminar torneo', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}
