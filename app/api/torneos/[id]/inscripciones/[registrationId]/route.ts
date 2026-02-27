import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { updateRegistration, deleteRegistration } from '@/lib/services/tournaments'
import { getUserTenantIdSafe, isSuperAdminUser, canAccessTenant, type User as PermissionsUser } from '@/lib/utils/permissions'
import { tournamentRegistrationUpdateSchema } from '@/lib/validations/tournament'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string; registrationId: string }> }

async function resolveTenantIdForInscription(
  tournamentId: string,
  user: PermissionsUser,
): Promise<{ status: number; error?: string; tenantId?: string }> {
  const isSuperAdmin = await isSuperAdminUser(user)
  if (isSuperAdmin) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { tenantId: true },
    })
    if (!tournament) return { status: 404, error: 'Torneo no encontrado' }
    const hasAccess = await canAccessTenant(user, tournament.tenantId)
    if (!hasAccess) return { status: 403, error: 'No tiene acceso a este torneo' }
    return { status: 200, tenantId: tournament.tenantId }
  }
  const userTenantId = await getUserTenantIdSafe(user)
  if (!userTenantId) return { status: 403, error: 'No tiene un tenant asignado' }
  return { status: 200, tenantId: userTenantId }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    if (!session.user.isAdmin) {
      return NextResponse.json(createErrorResponse('Solo administradores pueden editar inscripciones'), { status: 403 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email ?? null,
      role: session.user.role ?? 'USER',
      isAdmin: session.user.isAdmin ?? false,
      isSuperAdmin: session.user.isSuperAdmin ?? false,
      tenantId: session.user.tenantId ?? null,
    }
    const { id, registrationId } = await context.params
    const resolved = await resolveTenantIdForInscription(id, user)
    if (resolved.error) {
      return NextResponse.json(createErrorResponse(resolved.error), { status: resolved.status })
    }

    const raw = await request.json()
    const parsed = tournamentRegistrationUpdateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 },
      )
    }

    const ok = await updateRegistration(id, registrationId, resolved.tenantId!, parsed.data)
    if (!ok) {
      return NextResponse.json(createErrorResponse('Inscripción no encontrada'), { status: 404 })
    }
    return NextResponse.json(createSuccessResponse('Inscripción actualizada'), { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 },
      )
    }
    console.error('PATCH /api/torneos/[id]/inscripciones/[registrationId]:', error)
    return NextResponse.json(
      createErrorResponse('Error al actualizar inscripción', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    if (!session.user.isAdmin) {
      return NextResponse.json(createErrorResponse('Solo administradores pueden eliminar inscripciones'), { status: 403 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email ?? null,
      role: session.user.role ?? 'USER',
      isAdmin: session.user.isAdmin ?? false,
      isSuperAdmin: session.user.isSuperAdmin ?? false,
      tenantId: session.user.tenantId ?? null,
    }
    const { id, registrationId } = await context.params
    const resolved = await resolveTenantIdForInscription(id, user)
    if (resolved.error) {
      return NextResponse.json(createErrorResponse(resolved.error), { status: resolved.status })
    }

    const ok = await deleteRegistration(id, registrationId, resolved.tenantId!)
    if (!ok) {
      return NextResponse.json(createErrorResponse('Inscripción no encontrada'), { status: 404 })
    }
    return NextResponse.json(createSuccessResponse('Inscripción eliminada'), { status: 200 })
  } catch (error) {
    console.error('DELETE /api/torneos/[id]/inscripciones/[registrationId]:', error)
    return NextResponse.json(
      createErrorResponse('Error al eliminar inscripción', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}
