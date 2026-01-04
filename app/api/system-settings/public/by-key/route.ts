import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/database/neon-config'
import { auth } from '../../../../../lib/auth'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '../../../../../lib/utils/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    const tenantSlug = url.searchParams.get('tenant') || url.searchParams.get('tenantSlug')
    
    if (!key) {
      return NextResponse.json({ success: false, error: 'key requerido' }, { status: 400 })
    }
    const allowed = new Set(['home_card_settings'])
    if (!allowed.has(key)) {
      return NextResponse.json({ success: false, error: 'no permitido' }, { status: 403 })
    }

    // Intentar obtener sesión (opcional para endpoints públicos)
    let user: PermissionsUser | null = null
    let userTenantId: string | null = null
    try {
      const session = await auth()
      if (session?.user) {
        user = {
          id: session.user.id,
          email: session.user.email || null,
          role: session.user.role || 'USER',
          isAdmin: session.user.isAdmin || false,
          isSuperAdmin: session.user.isSuperAdmin || false,
          tenantId: session.user.tenantId || null,
        }
        userTenantId = await getUserTenantIdSafe(user)
      }
    } catch {}

    // Si se proporciona tenantSlug, buscar tenant
    let targetTenantId: string | null = null
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true }
      })
      if (tenant) {
        targetTenantId = tenant.id
      }
    } else if (userTenantId) {
      // Si hay usuario autenticado, usar su tenant
      targetTenantId = userTenantId
    }

    // Construir where clause: si es público y no hay tenant, buscar configuraciones sin tenantId
    // o con isPublic=true. Si hay tenantId, buscar por tenantId e isPublic=true
    const whereClause: any = { 
      key,
      isPublic: true 
    }
    
    if (targetTenantId) {
      whereClause.tenantId = targetTenantId
    }

    const item = await prisma.systemSetting.findFirst({ where: whereClause })
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
