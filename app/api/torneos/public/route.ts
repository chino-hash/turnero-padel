import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/neon-config'
import { getPublicTournaments } from '@/lib/services/tournaments'
import { createErrorResponse, createSuccessResponse } from '@/lib/validations/common'

/**
 * GET /api/torneos/public
 * Listado público de torneos con inscripciones abiertas.
 * Query: ?slug=xxx (slug del club) o ?tenantId=xxx para filtrar por club.
 * No requiere autenticación.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const tenantId = searchParams.get('tenantId')

    let filterTenantId: string | undefined
    if (tenantId && tenantId.trim()) {
      filterTenantId = tenantId.trim()
    } else if (slug && slug.trim()) {
      const tenant = await prisma.tenant.findFirst({
        where: { slug: slug.trim(), isActive: true },
        select: { id: true },
      })
      if (tenant) filterTenantId = tenant.id
    }

    const tournaments = await getPublicTournaments(filterTenantId)
    return NextResponse.json(
      createSuccessResponse('OK', tournaments),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch (error) {
    console.error('GET /api/torneos/public:', error)
    return NextResponse.json(
      createErrorResponse('Error al obtener torneos', 'Error interno del servidor'),
      { status: 500 },
    )
  }
}
