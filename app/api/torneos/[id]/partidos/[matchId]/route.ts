import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMatchById, updateMatch, deleteMatch } from '@/lib/services/tournaments'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { tournamentMatchUpdateSchema } from '@/lib/validations/tournament'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string; matchId: string }> }

function requireAdminTenant(session: { user: { id?: string; isAdmin?: boolean } }) {
  if (!session?.user?.id) return { status: 401 as const, error: 'No autorizado' }
  if (!session.user.isAdmin) return { status: 403 as const, error: 'Solo administradores del club pueden gestionar partidos' }
  return null
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    const authError = requireAdminTenant(session!)
    if (authError) {
      return NextResponse.json(createErrorResponse(authError.error), { status: authError.status })
    }

    const user: PermissionsUser = {
      id: session!.user.id,
      email: session!.user.email ?? null,
      role: session!.user.role ?? 'USER',
      isAdmin: session!.user.isAdmin ?? false,
      isSuperAdmin: session!.user.isSuperAdmin ?? false,
      tenantId: session!.user.tenantId ?? null,
    }
    const userTenantId = await getUserTenantIdSafe(user)
    if (!userTenantId) {
      return NextResponse.json(createErrorResponse('No tiene un tenant asignado'), { status: 403 })
    }

    const { id, matchId } = await context.params
    const match = await getMatchById(id, matchId, userTenantId)
    if (!match) {
      return NextResponse.json(createErrorResponse('Partido no encontrado'), { status: 404 })
    }
    return NextResponse.json(createSuccessResponse('OK', match), { status: 200 })
  } catch (error) {
    console.error('GET /api/torneos/[id]/partidos/[matchId]:', error)
    return NextResponse.json(
      createErrorResponse('Error al obtener partido', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    const authError = requireAdminTenant(session!)
    if (authError) {
      return NextResponse.json(createErrorResponse(authError.error), { status: authError.status })
    }

    const isSuperAdmin = session!.user && (await isSuperAdminUser({
      id: session!.user.id,
      email: session!.user.email ?? null,
      role: session!.user.role ?? 'USER',
      isAdmin: session!.user.isAdmin ?? false,
      isSuperAdmin: session!.user.isSuperAdmin ?? false,
      tenantId: session!.user.tenantId ?? null,
    }))
    if (isSuperAdmin) {
      return NextResponse.json(createErrorResponse('El super administrador no puede gestionar partidos'), { status: 403 })
    }

    const userTenantId = await getUserTenantIdSafe({
      id: session!.user.id,
      email: session!.user.email ?? null,
      role: session!.user.role ?? 'USER',
      isAdmin: session!.user.isAdmin ?? false,
      isSuperAdmin: session!.user.isSuperAdmin ?? false,
      tenantId: session!.user.tenantId ?? null,
    })
    if (!userTenantId) {
      return NextResponse.json(createErrorResponse('No tiene un tenant asignado'), { status: 403 })
    }

    const { id, matchId } = await context.params
    const raw = await request.json()
    const parsed = tournamentMatchUpdateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 },
      )
    }

    const match = await updateMatch(id, matchId, userTenantId, parsed.data)
    if (!match) {
      return NextResponse.json(createErrorResponse('Partido no encontrado'), { status: 404 })
    }
    return NextResponse.json(createSuccessResponse('Partido actualizado', match), { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 },
      )
    }
    console.error('PATCH /api/torneos/[id]/partidos/[matchId]:', error)
    return NextResponse.json(
      createErrorResponse('Error al actualizar partido', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    const authError = requireAdminTenant(session!)
    if (authError) {
      return NextResponse.json(createErrorResponse(authError.error), { status: authError.status })
    }

    const isSuperAdmin = session!.user && (await isSuperAdminUser({
      id: session!.user.id,
      email: session!.user.email ?? null,
      role: session!.user.role ?? 'USER',
      isAdmin: session!.user.isAdmin ?? false,
      isSuperAdmin: session!.user.isSuperAdmin ?? false,
      tenantId: session!.user.tenantId ?? null,
    }))
    if (isSuperAdmin) {
      return NextResponse.json(createErrorResponse('El super administrador no puede gestionar partidos'), { status: 403 })
    }

    const userTenantId = await getUserTenantIdSafe({
      id: session!.user.id,
      email: session!.user.email ?? null,
      role: session!.user.role ?? 'USER',
      isAdmin: session!.user.isAdmin ?? false,
      isSuperAdmin: session!.user.isSuperAdmin ?? false,
      tenantId: session!.user.tenantId ?? null,
    })
    if (!userTenantId) {
      return NextResponse.json(createErrorResponse('No tiene un tenant asignado'), { status: 403 })
    }

    const { id, matchId } = await context.params
    const deleted = await deleteMatch(id, matchId, userTenantId)
    if (!deleted) {
      return NextResponse.json(createErrorResponse('Partido no encontrado'), { status: 404 })
    }
    return NextResponse.json(createSuccessResponse('Partido eliminado'), { status: 200 })
  } catch (error) {
    console.error('DELETE /api/torneos/[id]/partidos/[matchId]:', error)
    return NextResponse.json(
      createErrorResponse('Error al eliminar partido', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}
