import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { createErrorResponse, createSuccessResponse, formatZodErrors } from '@/lib/validations/common'
import { consumibleUpdateSchema } from '@/lib/validations/consumible'
import { ZodError } from 'zod'

function getTenantId(request: NextRequest, userTenantId: string | null, isSuperAdmin: boolean): string | null {
  if (userTenantId) return userTenantId
  if (isSuperAdmin) {
    const xTenantId = request.headers.get('x-tenant-id')
    if (xTenantId) return xTenantId
  }
  return null
}

async function resolveTenantAndConsumible(
  request: NextRequest,
  id: string
): Promise<{ tenantId: string; consumible: { id: string; tenantId: string; name: string; description: string | null; isActive: boolean; sortOrder: number; createdAt: Date; updatedAt: Date } } | NextResponse> {
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
  const consumible = await prisma.consumible.findFirst({
    where: { id, tenantId },
    include: { producto: { select: { id: true, nombre: true, precio: true } } },
  })
  if (!consumible) {
    return NextResponse.json(createErrorResponse('Consumible no encontrado'), { status: 404 })
  }
  return { tenantId, consumible }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await resolveTenantAndConsumible(request, id)
    if (result instanceof NextResponse) return result
    return NextResponse.json(createSuccessResponse('OK', result.consumible))
  } catch (err) {
    console.error('GET /api/consumibles/[id]:', err)
    return NextResponse.json(createErrorResponse('Error al obtener consumible', 'Error interno'), { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await resolveTenantAndConsumible(request, id)
    if (result instanceof NextResponse) return result

    const body = await request.json()
    const parsed = consumibleUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 }
      )
    }
    const updateData = parsed.data

    const consumible = await prisma.consumible.update({
      where: { id },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.requisitos !== undefined && { requisitos: updateData.requisitos }),
        ...(updateData.discountPercent !== undefined && { discountPercent: updateData.discountPercent }),
        ...(updateData.tipoBeneficio !== undefined && { tipoBeneficio: updateData.tipoBeneficio }),
        ...(updateData.productoId !== undefined && { productoId: updateData.productoId }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        ...(updateData.sortOrder !== undefined && { sortOrder: updateData.sortOrder }),
      },
      include: { producto: { select: { id: true, nombre: true, precio: true } } },
    })
    return NextResponse.json(createSuccessResponse('Consumible actualizado', consumible))
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(err)),
        { status: 400 }
      )
    }
    console.error('PATCH /api/consumibles/[id]:', err)
    return NextResponse.json(createErrorResponse('Error al actualizar consumible', 'Error interno'), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await resolveTenantAndConsumible(request, id)
    if (result instanceof NextResponse) return result
    await prisma.consumible.delete({ where: { id } })
    return NextResponse.json(createSuccessResponse('Consumible eliminado'))
  } catch (err) {
    console.error('DELETE /api/consumibles/[id]:', err)
    return NextResponse.json(createErrorResponse('Error al eliminar consumible', 'Error interno'), { status: 500 })
  }
}
