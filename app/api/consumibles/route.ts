import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { consumibleCreateSchema } from '@/lib/validations/consumible'
import { ZodError } from 'zod'

function getTenantId(request: NextRequest, userTenantId: string | null, isSuperAdmin: boolean): string | null {
  if (userTenantId) return userTenantId
  if (isSuperAdmin) {
    const xTenantId = request.headers.get('x-tenant-id')
    if (xTenantId) return xTenantId
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    const isAdmin = session.user.role === 'ADMIN'
    const isSuper = await isSuperAdminUser(session.user as PermissionsUser)
    if (!isAdmin && !isSuper) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    const userTenantId = await getUserTenantIdSafe(session.user as PermissionsUser)
    const tenantId = getTenantId(request, userTenantId, isSuper)
    if (!tenantId) {
      return NextResponse.json(createErrorResponse('Contexto de tenant no disponible'), { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const soloActivos = searchParams.get('activos') === 'true'

    const where = { tenantId } as { tenantId: string; isActive?: boolean }
    if (soloActivos) where.isActive = true

    const consumibles = await prisma.consumible.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { producto: { select: { id: true, nombre: true, precio: true } } },
    })
    return NextResponse.json(createSuccessResponse('OK', consumibles))
  } catch (err) {
    console.error('GET /api/consumibles:', err)
    return NextResponse.json(createErrorResponse('Error al listar consumibles', 'Error interno'), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    const isAdmin = session.user.role === 'ADMIN'
    const isSuper = await isSuperAdminUser(session.user as PermissionsUser)
    if (!isAdmin && !isSuper) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    const userTenantId = await getUserTenantIdSafe(session.user as PermissionsUser)
    const tenantId = getTenantId(request, userTenantId, isSuper)
    if (!tenantId) {
      return NextResponse.json(createErrorResponse('Contexto de tenant no disponible'), { status: 403 })
    }

    const body = await request.json()
    const parsed = consumibleCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 }
      )
    }
    const data = parsed.data

    const consumible = await prisma.consumible.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        requisitos: data.requisitos ?? null,
        discountPercent: data.discountPercent ?? null,
        tipoBeneficio: data.tipoBeneficio ?? null,
        productoId: data.productoId ?? null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    })
    return NextResponse.json(createSuccessResponse('Consumible creado', consumible), { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(err)),
        { status: 400 }
      )
    }
    console.error('POST /api/consumibles:', err)
    return NextResponse.json(createErrorResponse('Error al crear consumible', 'Error interno'), { status: 500 })
  }
}
