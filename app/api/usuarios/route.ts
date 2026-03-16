import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { getTenantFromSlug } from '@/lib/tenant/context'
import { createErrorResponse, createSuccessResponse, calculatePaginationMeta, formatZodErrors } from '@/lib/validations/common'
import { usuariosListQuerySchema } from '@/lib/validations/usuarios'
import { getUmbralesCategoria, getCategoriaFromReservas } from '@/lib/services/categorias-usuario'
import { ZodError } from 'zod'

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
    const { searchParams } = new URL(request.url)
    let tenantId = await getUserTenantIdSafe(session.user as PermissionsUser)
    if (!tenantId && isSuper) {
      const queryTenantId = searchParams.get('tenantId')?.trim() || null
      const queryTenantSlug = searchParams.get('tenantSlug')?.trim() || null
      if (queryTenantId) tenantId = queryTenantId
      else if (queryTenantSlug) {
        const tenant = await getTenantFromSlug(queryTenantSlug)
        if (tenant) tenantId = tenant.id
      }
      if (!tenantId) {
        const xTenantId = request.headers.get('x-tenant-id')
        if (xTenantId) tenantId = xTenantId
      }
    }
    if (!tenantId) {
      return NextResponse.json(createErrorResponse('Contexto de tenant no disponible'), { status: 403 })
    }
    const query = Object.fromEntries(searchParams.entries())
    const parsed = usuariosListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Parámetros inválidos', undefined, formatZodErrors(parsed.error)),
        { status: 400 }
      )
    }
    const { page, limit, sortBy, sortOrder, q, categoria, actividad } = parsed.data

    const umbrales = await getUmbralesCategoria(tenantId)
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const where: {
      tenantId: string
      deletedAt: null
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; fullName?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>
    } = {
      tenantId,
      deletedAt: null,
    }
    if (q?.trim()) {
      const term = q.trim()
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        discountPercent: true,
        createdAt: true,
        _count: {
          select: {
            bookings: { where: { deletedAt: null } },
          },
        },
        bookings: {
          where: { deletedAt: null },
          orderBy: { bookingDate: 'desc' },
          take: 1,
          select: { bookingDate: true },
        },
      },
    })

    type Row = {
      id: string
      name: string | null
      fullName: string | null
      email: string
      phone: string | null
      role: string
      isActive: boolean
      discountPercent: number | null
      createdAt: Date
      reservas: number
      ultimaReserva: string | null
      categoria: 'VIP' | 'Premium' | 'Regular'
    }

    let rows: Row[] = users.map((u) => {
      const reservas = u._count.bookings
      const ultimaReserva = u.bookings[0]?.bookingDate
        ? new Date(u.bookings[0].bookingDate).toISOString().split('T')[0]
        : null
      const cat = getCategoriaFromReservas(reservas, umbrales)
      return {
        id: u.id,
        name: u.name,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        discountPercent: u.discountPercent ?? null,
        createdAt: u.createdAt,
        reservas,
        ultimaReserva,
        categoria: cat,
      }
    })

    if (categoria) {
      rows = rows.filter((r) => r.categoria === categoria)
    }
    if (actividad) {
      if (actividad === 'nuevos') {
        rows = rows.filter((r) => new Date(r.createdAt) >= hace30Dias)
      } else if (actividad === 'activos') {
        rows = rows.filter((r) => r.ultimaReserva && new Date(r.ultimaReserva) >= hace30Dias)
      } else {
        rows = rows.filter((r) => !r.ultimaReserva || new Date(r.ultimaReserva) < hace30Dias)
      }
    }

    const order = sortOrder === 'asc' ? 1 : -1
    const by = sortBy || 'createdAt'
    if (by === 'reservas') {
      rows.sort((a, b) => (a.reservas - b.reservas) * order)
    } else if (by === 'ultimaReserva') {
      rows.sort((a, b) => {
        const da = a.ultimaReserva ? new Date(a.ultimaReserva).getTime() : 0
        const db = b.ultimaReserva ? new Date(b.ultimaReserva).getTime() : 0
        return (da - db) * order
      })
    } else if (by === 'name' || by === 'nombre') {
      rows.sort((a, b) => {
        const na = (a.name || a.fullName || a.email || '').toLowerCase()
        const nb = (b.name || b.fullName || b.email || '').toLowerCase()
        return na.localeCompare(nb) * order
      })
    } else if (by === 'email') {
      rows.sort((a, b) => a.email.localeCompare(b.email) * order)
    } else {
      rows.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order)
    }

    const total = rows.length
    const start = (page - 1) * limit
    const data = rows.slice(start, start + limit).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
    const meta = calculatePaginationMeta(page, limit, total)
    return NextResponse.json(createSuccessResponse('OK', data, meta))
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Parámetros inválidos', undefined, formatZodErrors(err)),
        { status: 400 }
      )
    }
    console.error('GET /api/usuarios:', err)
    return NextResponse.json(createErrorResponse('Error al listar usuarios', 'Error interno'), { status: 500 })
  }
}
