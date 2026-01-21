import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { bootstrapTenant } from '@/lib/services/tenants/bootstrap'
import { isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

const schema = z.object({
  slug: z.string().min(1),
  ownerEmail: z.string().email(),
  name: z.string().min(1).optional(),
})

/**
 * POST /api/tenants/bootstrap
 * Solo SUPER_ADMIN: bootstrap idempotente de un tenant (settings + canchas + productos + admin + MP).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
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
        { success: false, error: 'Se requieren permisos de Super Administrador' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const input = schema.parse(body)

    const result = await bootstrapTenant(input)

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/tenants/bootstrap:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

