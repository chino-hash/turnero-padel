import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { ensureCourtsForPlan } from '@/lib/services/tenants/bootstrap'
import { isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/tenants/[id]/ensure-courts
 * Crea las canchas faltantes según el plan del tenant (Cancha 1..N).
 * Solo Super Admin.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

    const { id } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant no encontrado' }, { status: 404 })
    }

    const courtsEnsured = await ensureCourtsForPlan(id)
    return NextResponse.json({ success: true, data: { courts: courtsEnsured } }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/tenants/[id]/ensure-courts:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
