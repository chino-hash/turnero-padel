import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { getTenantFromSlug } from '@/lib/tenant/context'
import {
  createSuccessResponse,
  createErrorResponse,
  formatZodErrors,
} from '@/lib/validations/common'
import { estadisticasQuerySchema, type Period } from '@/lib/validations/estadisticas'

function getPeriodRanges(period: Period) {
  const hoy = new Date()
  const endOfToday = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    59,
    59,
    999
  )
  let inicio: Date
  let fin: Date
  switch (period) {
    case 'hoy':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      fin = endOfToday
      break
    case 'semana': {
      inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - hoy.getDay())
      inicio.setHours(0, 0, 0, 0)
      fin = endOfToday
      break
    }
    case 'mes':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      fin = endOfToday
      break
    case 'trimestre': {
      const q = Math.floor(hoy.getMonth() / 3) + 1
      const firstMonthQ = (q - 1) * 3
      inicio = new Date(hoy.getFullYear(), firstMonthQ, 1)
      fin = endOfToday
      break
    }
    case 'ano':
      inicio = new Date(hoy.getFullYear(), 0, 1)
      fin = endOfToday
      break
    default:
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      fin = endOfToday
  }
  const durationMs = fin.getTime() - inicio.getTime()
  const finAnterior = new Date(inicio.getTime() - 1)
  const inicioAnterior = new Date(finAnterior.getTime() - durationMs)
  return { inicio, fin, inicioAnterior, finAnterior }
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse('No autorizado'),
        { status: 401 }
      )
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email ?? null,
      role: session.user.role ?? 'USER',
      isAdmin: session.user.isAdmin ?? false,
      isSuperAdmin: session.user.isSuperAdmin ?? false,
      tenantId: session.user.tenantId ?? null,
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        createErrorResponse('No autorizado'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    let tenantId = await getUserTenantIdSafe(user)
    if (!tenantId && (await isSuperAdminUser(user))) {
      const queryTenantId = searchParams.get('tenantId')?.trim() || null
      const queryTenantSlug = searchParams.get('tenantSlug')?.trim() || null
      if (queryTenantId) tenantId = queryTenantId
      else if (queryTenantSlug) {
        const tenant = await getTenantFromSlug(queryTenantSlug)
        if (tenant) tenantId = tenant.id
      }
    }
    if (!tenantId) {
      return NextResponse.json(
        createErrorResponse('No se pudo determinar el tenant actual'),
        { status: 403 }
      )
    }
    let period: Period = 'mes'
    try {
      const parsed = estadisticasQuerySchema.parse({
        period: searchParams.get('period') ?? undefined,
      })
      period = parsed.period
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          createErrorResponse('Parámetros inválidos', undefined, formatZodErrors(err)),
          { status: 400 }
        )
      }
      throw err
    }

    const { inicio, fin, inicioAnterior, finAnterior } = getPeriodRanges(period)
    const baseWhere = { tenantId, deletedAt: null }

    const bookingRange = { gte: inicio, lte: fin }
    const bookingRangeAnterior = { gte: inicioAnterior, lte: finAnterior }

    const [
      reservasCount,
      reservasAnteriorCount,
      ingresosMes,
      ingresosAnterior,
      usuariosActivos,
      canchasMasUsadas,
      reservasPorHora,
      totalSlotsPosibles,
      totalRecaudado,
      saldoPendiente,
      totalReservasCount,
      totalReservasAnteriorCount,
      totalUsuariosConReservas,
      completadasCount,
      canceladasCount,
      bookingsPorDia,
      ingresosPorDia,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: bookingRange,
        },
      }),
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: bookingRangeAnterior,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          bookingDate: bookingRange,
          paymentStatus: { in: ['DEPOSIT_PAID', 'FULLY_PAID'] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          bookingDate: bookingRangeAnterior,
          paymentStatus: { in: ['DEPOSIT_PAID', 'FULLY_PAID'] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.user.count({
        where: {
          tenantId,
          deletedAt: null,
          bookings: {
            some: {
              bookingDate: bookingRange,
              deletedAt: null,
            },
          },
        },
      }),
      prisma.court.findMany({
        where: {
          tenantId,
          deletedAt: null,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              bookings: {
                where: {
                  bookingDate: bookingRange,
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: { bookings: { _count: 'desc' } },
        take: 5,
      }),
      prisma.booking.groupBy({
        by: ['startTime'],
        where: {
          ...baseWhere,
          bookingDate: bookingRange,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.court.count({
        where: { tenantId, isActive: true, deletedAt: null },
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ['COMPLETED', 'completed'] },
          paymentType: 'PAYMENT',
          createdAt: bookingRange,
        },
        _sum: { amount: true },
      }),
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          paymentStatus: 'PENDING',
          bookingDate: bookingRange,
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.count({
        where: { ...baseWhere, bookingDate: bookingRange },
      }),
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: bookingRangeAnterior,
        },
      }),
      prisma.user.count({
        where: {
          tenantId,
          deletedAt: null,
          bookings: {
            some: {
              bookingDate: bookingRange,
              deletedAt: null,
            },
          },
        },
      }),
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: bookingRange,
          status: 'COMPLETED',
        },
      }),
      prisma.booking.count({
        where: {
          ...baseWhere,
          bookingDate: bookingRange,
          status: 'CANCELLED',
        },
      }),
      prisma.booking.groupBy({
        by: ['bookingDate'],
        where: { ...baseWhere, bookingDate: bookingRange },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      (async () => {
        const withPayment = await prisma.booking.groupBy({
          by: ['bookingDate'],
          where: {
            ...baseWhere,
            bookingDate: bookingRange,
            paymentStatus: { in: ['DEPOSIT_PAID', 'FULLY_PAID'] },
          },
          _sum: { totalPrice: true },
        })
        return withPayment
      })(),
    ])

    let reservasPorUsuario = 0
    let reservasPorAdmin = 0
    try {
      const usoPaginaRows = await prisma.$queryRaw<[{ por_usuario: bigint; por_admin: bigint }]>`
        SELECT
          COUNT(*) FILTER (WHERE "bookedById" IS NOT NULL AND "bookedById" = "userId") as "por_usuario",
          COUNT(*) FILTER (WHERE "bookedById" IS NOT NULL AND "bookedById" != "userId") as "por_admin"
        FROM "Booking"
        WHERE "tenantId" = ${tenantId}
          AND "bookingDate" >= ${inicio}
          AND "bookingDate" <= ${fin}
          AND "deletedAt" IS NULL
      `
      const row = usoPaginaRows[0]
      if (row) {
        reservasPorUsuario = Number(row.por_usuario ?? 0)
        reservasPorAdmin = Number(row.por_admin ?? 0)
      }
    } catch {
      // Columna bookedById puede no existir si la migración no se ha aplicado
    }

    const canchasConReservas = canchasMasUsadas.filter(
      (c) => (c._count.bookings ?? 0) > 0
    )
    const maxReservas = canchasConReservas[0]?._count.bookings ?? 1
    const canchasConPorcentaje = canchasConReservas.map((cancha) => ({
      nombre: cancha.name,
      reservas: cancha._count.bookings,
      porcentaje: Math.round((cancha._count.bookings / maxReservas) * 100),
    }))

    const horariosPico = reservasPorHora.slice(0, 8).map((item) => {
      const [hora, minutos] = item.startTime.split(':')
      const horaInicio = `${hora}:${minutos}`
      const horaFin = `${parseInt(hora, 10) + 1}:${minutos}`
      return {
        hora: `${horaInicio}-${horaFin}`,
        reservas: item._count.id,
      }
    })

    const slotsReference = totalSlotsPosibles * 30 * 12
    const ocupacionPromedio =
      slotsReference > 0
        ? Math.round((reservasCount * 4 / slotsReference) * 100)
        : 0

    const ocupacionAnterior =
      slotsReference > 0 && reservasAnteriorCount !== undefined
        ? Math.round((reservasAnteriorCount * 4 / slotsReference) * 100)
        : null

    const ingresosVal = ingresosMes._sum.totalPrice ?? 0
    const ingresosAnteriorVal = ingresosAnterior._sum.totalPrice ?? 0
    const variacionIngresos =
      ingresosAnteriorVal > 0
        ? Math.round(((ingresosVal - ingresosAnteriorVal) / ingresosAnteriorVal) * 100)
        : null
    const variacionReservas =
      reservasAnteriorCount > 0
        ? Math.round(
            ((reservasCount - reservasAnteriorCount) / reservasAnteriorCount) * 100
          )
        : null
    const variacionOcupacion =
      ocupacionAnterior != null && ocupacionAnterior > 0
        ? Math.round(((ocupacionPromedio - ocupacionAnterior) / ocupacionAnterior) * 100)
        : null

    const promedioReservasPorUsuario =
      totalUsuariosConReservas > 0
        ? parseFloat((reservasCount / totalUsuariosConReservas).toFixed(1))
        : 0

    const totalConOrigen = reservasPorUsuario + reservasPorAdmin
    const porcentajeUsoPagina =
      totalConOrigen > 0 ? Math.round((reservasPorUsuario / totalConOrigen) * 100) : null

    const totalNoCanceladas = completadasCount + (reservasCount - completadasCount - canceladasCount)
    const tasaCumplimiento =
      totalNoCanceladas > 0
        ? Math.round((completadasCount / totalNoCanceladas) * 100)
        : 0

    const dayMs = 24 * 60 * 60 * 1000
    const evolucionReservasMap = new Map<string, number>()
    for (let t = inicio.getTime(); t <= fin.getTime(); t += dayMs) {
      evolucionReservasMap.set(formatDateKey(new Date(t)), 0)
    }
    for (const g of bookingsPorDia) {
      const key = formatDateKey(g.bookingDate)
      evolucionReservasMap.set(key, g._count.id)
    }
    const evolucionReservas = Array.from(evolucionReservasMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))

    const evolucionIngresosMap = new Map<string, number>()
    for (let t = inicio.getTime(); t <= fin.getTime(); t += dayMs) {
      evolucionIngresosMap.set(formatDateKey(new Date(t)), 0)
    }
    for (const g of ingresosPorDia) {
      const key = formatDateKey(g.bookingDate)
      evolucionIngresosMap.set(key, g._sum.totalPrice ?? 0)
    }
    const evolucionIngresos = Array.from(evolucionIngresosMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, total]) => ({ fecha, total }))

    const estadisticas = {
      period,
      reservasHoy: period === 'hoy' ? reservasCount : reservasCount,
      reservasSemana: period === 'semana' ? reservasCount : reservasCount,
      reservasCount,
      reservasAnteriorCount,
      variacionReservas,
      ingresosMes: ingresosVal,
      ingresosAnterior: ingresosAnteriorVal,
      variacionIngresos,
      ocupacionPromedio,
      ocupacionAnterior,
      variacionOcupacion,
      usuariosActivos,
      canchasMasUsadas: canchasConPorcentaje,
      horariosPico,
      financiero: {
        totalRecaudado: totalRecaudado._sum.amount ?? 0,
        saldoPendiente: saldoPendiente._sum.totalPrice ?? 0,
        totalReservas: totalReservasCount,
      },
      promedioReservasPorUsuario,
      satisfaccion: tasaCumplimiento,
      evolucionReservas,
      evolucionIngresos,
      usoPagina: {
        reservasPorUsuario,
        reservasPorAdmin,
        porcentajeUsoPagina,
        sinDato: reservasCount - totalConOrigen,
      },
    }

    return NextResponse.json(
      createSuccessResponse('OK', estadisticas),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    )
  }
}
