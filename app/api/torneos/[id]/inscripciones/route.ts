import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getRegistrationsWithCupo, createRegistration } from '@/lib/services/tournaments'
import { getUserTenantIdSafe, isSuperAdminUser, canAccessTenant, type User as PermissionsUser } from '@/lib/utils/permissions'
import { tournamentRegistrationCreateSchema } from '@/lib/validations/tournament'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

function requireAdminTenant(session: { user: { id?: string; isAdmin?: boolean } } | null) {
  if (!session?.user?.id) return { status: 401 as const, error: 'No autorizado' }
  if (!session.user.isAdmin) return { status: 403 as const, error: 'Solo administradores del club pueden gestionar inscripciones' }
  return null
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    const authError = requireAdminTenant(session)
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
    const { id } = await context.params

    const isSuperAdmin = await isSuperAdminUser(user)
    let tenantId: string | null = null

    if (isSuperAdmin) {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        select: { tenantId: true },
      })
      if (!tournament) {
        return NextResponse.json(createErrorResponse('Torneo no encontrado'), { status: 404 })
      }
      const hasAccess = await canAccessTenant(user, tournament.tenantId)
      if (!hasAccess) {
        return NextResponse.json(createErrorResponse('No tiene acceso a este torneo'), { status: 403 })
      }
      tenantId = tournament.tenantId
    } else {
      const userTenantId = await getUserTenantIdSafe(user)
      if (!userTenantId) {
        return NextResponse.json(createErrorResponse('No tiene un tenant asignado'), { status: 403 })
      }
      tenantId = userTenantId
    }

    const result = await getRegistrationsWithCupo(id, tenantId)
    if (!result) {
      return NextResponse.json(createErrorResponse('Torneo no encontrado'), { status: 404 })
    }
    return NextResponse.json(createSuccessResponse('OK', result), { status: 200 })
  } catch (error) {
    console.error('GET /api/torneos/[id]/inscripciones:', error)
    return NextResponse.json(
      createErrorResponse('Error al obtener inscripciones', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    const authError = requireAdminTenant(session)
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
    const { id } = await context.params

    const isSuperAdmin = await isSuperAdminUser(user)
    let tenantId: string | null = null

    if (isSuperAdmin) {
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        select: { tenantId: true },
      })
      if (!tournament) {
        return NextResponse.json(createErrorResponse('Torneo no encontrado'), { status: 404 })
      }
      const hasAccess = await canAccessTenant(user, tournament.tenantId)
      if (!hasAccess) {
        return NextResponse.json(createErrorResponse('No tiene acceso a este torneo'), { status: 403 })
      }
      tenantId = tournament.tenantId
    } else {
      const userTenantId = await getUserTenantIdSafe(user)
      if (!userTenantId) {
        return NextResponse.json(createErrorResponse('No tiene un tenant asignado'), { status: 403 })
      }
      tenantId = userTenantId
    }

    const raw = await request.json()
    const parsed = tournamentRegistrationCreateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 },
      )
    }

    const result = await createRegistration(id, tenantId, {
      type: parsed.data.type,
      playerName: parsed.data.playerName,
      playerEmail: parsed.data.playerEmail || undefined,
      playerPhone: parsed.data.playerPhone || undefined,
      partnerName: parsed.data.partnerName || undefined,
      partnerEmail: parsed.data.partnerEmail || undefined,
      partnerPhone: parsed.data.partnerPhone || undefined,
    })

    if ('error' in result) {
      return NextResponse.json(createErrorResponse(result.error), { status: 400 })
    }
    return NextResponse.json(createSuccessResponse('Inscripción creada', { id: result.id }), { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 },
      )
    }
    console.error('POST /api/torneos/[id]/inscripciones:', error)
    return NextResponse.json(
      createErrorResponse('Error al crear inscripción', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}
