import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database/neon-config'
import { auth } from '../../../../lib/auth'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '../../../../lib/utils/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (!session.user?.isAdmin && !session.user?.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }

    // Construir usuario para validación de permisos
    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    const userTenantId = await getUserTenantIdSafe(user)

    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    const queryTenantId = url.searchParams.get('tenantId')?.trim() || null
    if (!key) {
      return NextResponse.json({ success: false, error: 'key requerido' }, { status: 400 })
    }

    // Super Admin con tenantId en query: filtrar por ese tenant; si no es super admin: filtrar por tenant del usuario
    const where: any = { key }
    if (isSuperAdmin && queryTenantId) {
      where.tenantId = queryTenantId
    } else if (!isSuperAdmin && userTenantId) {
      where.tenantId = userTenantId
    }

    const item = await prisma.systemSetting.findFirst({ where })
    if (!item) {
      return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: item }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error' }, { status: 500 })
  }
}
