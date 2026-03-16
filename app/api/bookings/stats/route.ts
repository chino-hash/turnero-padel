import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookingService } from '@/lib/services/BookingService'
import { withRateLimit, bookingCreateRateLimit } from '@/lib/rate-limit'
import { bookingReportSchema, bookingFiltersSchema } from '@/lib/validations/booking'
import { formatZodErrors } from '@/lib/validations/common'
import { ZodError } from 'zod'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { prisma } from '@/lib/database/neon-config'
import { getTenantFromSlug } from '@/lib/tenant/context'

export const runtime = 'nodejs'

// GET /api/bookings/stats - Obtener estadísticas de reservas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Aplicar rate limiting
    const rateLimitCheck = withRateLimit(bookingCreateRateLimit);
    const rateLimitResult = await rateLimitCheck(request);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Obtener parámetros de consulta (mapear startDate/endDate a dateFrom/dateTo para bookingFiltersSchema)
    const { searchParams } = new URL(request.url)
    const queryParams = {
      dateFrom: searchParams.get('startDate') ?? searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('endDate') ?? searchParams.get('dateTo') ?? undefined,
      courtId: searchParams.get('courtId') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      groupBy: searchParams.get('groupBy') || 'day'
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

    // Validar parámetros
    const validatedParams = bookingFiltersSchema.parse(queryParams)

    // Los usuarios normales solo pueden ver sus propias estadísticas
    if (!isSuperAdmin && user.role !== 'ADMIN' && validatedParams.userId !== session.user.id) {
      validatedParams.userId = session.user.id
    }

    // Si se filtra por userId, validar que pertenece al tenant accesible (excepto super admin)
    if (validatedParams.userId && !isSuperAdmin) {
      const targetUser = await prisma.user.findUnique({
        where: { id: validatedParams.userId },
        select: { tenantId: true }
      })

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      if (userTenantId && targetUser.tenantId !== userTenantId) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para ver estadísticas de este usuario' },
          { status: 403 }
        )
      }
    }

    // Obtener estadísticas (filtrar por tenant si no es super admin, o por query si super-admin)
    let tenantIdForStats: string | undefined = isSuperAdmin ? undefined : (userTenantId ?? undefined)
    if (isSuperAdmin) {
      const queryTenantId = searchParams.get('tenantId')?.trim() || null
      const queryTenantSlug = searchParams.get('tenantSlug')?.trim() || null
      if (queryTenantId) tenantIdForStats = queryTenantId
      else if (queryTenantSlug) {
        const tenant = await getTenantFromSlug(queryTenantSlug)
        if (tenant) tenantIdForStats = tenant.id
      }
    }
    const result = await bookingService.getBookingStats(
      validatedParams.dateFrom,
      validatedParams.dateTo,
      tenantIdForStats
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/bookings/stats:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros de consulta inválidos',
          details: formatZodErrors(error)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/bookings/stats/report - Generar reporte de reservas
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
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

    // Solo administradores pueden generar reportes
    if (!user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden generar reportes' },
        { status: 403 }
      )
    }

    // Aplicar rate limiting más estricto para reportes
    const rateLimitCheck = withRateLimit(bookingCreateRateLimit);
    const rateLimitResult = await rateLimitCheck(request);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Obtener y validar datos del cuerpo
    const body = await request.json()
    const validatedData = bookingReportSchema.parse(body)

    // Generar reporte detallado
    const result = await bookingService.getBookingStats(validatedData.dateFrom, validatedData.dateTo)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: result.data
    })
  } catch (error) {
    console.error('Error in POST /api/bookings/stats/report:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          details: formatZodErrors(error)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}