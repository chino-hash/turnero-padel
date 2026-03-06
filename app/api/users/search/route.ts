/**
 * GET /api/users/search?q=... - Búsqueda de usuarios del tenant (typeahead)
 * Requiere autenticación. Solo usuarios del tenant del usuario actual.
 * Mínimo 2 caracteres en q.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 10

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email ?? null,
      role: session.user.role ?? 'USER',
      isAdmin: session.user.isAdmin ?? false,
      isSuperAdmin: session.user.isSuperAdmin ?? false,
      tenantId: session.user.tenantId ?? null,
    }

    const tenantId = await getUserTenantIdSafe(user)
    if (!tenantId && !isSuperAdminUser(user)) {
      return NextResponse.json({ success: false, error: 'Tenant no determinado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') ?? '').trim()
    if (q.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ success: true, data: [] })
    }

    const where: any = {
      deletedAt: null,
      isActive: true,
    }
    if (tenantId) {
      where.tenantId = tenantId
    }

    const users = await prisma.user.findMany({
      where: {
        ...where,
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, fullName: true, email: true },
      take: MAX_RESULTS,
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    })

    const data = users.map((u) => ({
      id: u.id,
      name: u.fullName || u.name || 'Sin nombre',
      email: u.email,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/users/search:', error)
    return NextResponse.json({ success: false, error: 'Error en la búsqueda' }, { status: 500 })
  }
}
