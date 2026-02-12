import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isSuper = await isSuperAdminUser(session.user as PermissionsUser)
    if (!isAdmin && !isSuper) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const tenantId = await getUserTenantIdSafe(session.user as PermissionsUser)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Contexto de tenant no disponible' },
        { status: 403 }
      )
    }

    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)

    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const hace60Dias = new Date()
    hace60Dias.setDate(hace60Dias.getDate() - 60)

    const hace90Dias = new Date()
    hace90Dias.setDate(hace90Dias.getDate() - 90)

    const baseWhere = { tenantId, deletedAt: null }

    const totalUsuarios = await prisma.user.count({
      where: baseWhere,
    })

    const usuariosActivos = await prisma.user.count({
      where: {
        ...baseWhere,
        bookings: {
          some: {
            bookingDate: { gte: hace30Dias },
            deletedAt: null,
          },
        },
      },
    })

    const nuevosEsteMes = await prisma.user.count({
      where: {
        ...baseWhere,
        createdAt: { gte: inicioMes },
      },
    })

    const usuariosConReservas60d = await prisma.user.count({
      where: {
        ...baseWhere,
        bookings: {
          some: {
            bookingDate: { gte: hace60Dias },
            deletedAt: null,
          },
        },
      },
    })

    const usuariosConReservas90d = await prisma.user.count({
      where: {
        ...baseWhere,
        bookings: {
          some: {
            bookingDate: { gte: hace90Dias },
            deletedAt: null,
          },
        },
      },
    })

    const retencion =
      usuariosConReservas90d > 0
        ? Math.round((usuariosConReservas60d / usuariosConReservas90d) * 100)
        : 0

    const usuariosConReservas = await prisma.user.findMany({
      where: {
        ...baseWhere,
        bookings: {
          some: {
            bookingDate: { gte: inicioMes },
            deletedAt: null,
          },
        },
      },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                bookingDate: { gte: inicioMes },
                deletedAt: null,
              },
            },
          },
        },
        bookings: {
          where: {
            bookingDate: { gte: inicioMes },
            deletedAt: null,
          },
          include: {
            court: { select: { name: true } },
          },
          orderBy: { bookingDate: 'desc' },
          take: 1,
        },
      },
    })

    const usuariosConEstadisticas = await Promise.all(
      usuariosConReservas.map(async (usuario) => {
        const todasLasReservas = await prisma.booking.findMany({
          where: {
            userId: usuario.id,
            tenantId,
            deletedAt: null,
          },
          include: {
            court: { select: { name: true } },
          },
          orderBy: { bookingDate: 'desc' },
        })

        const reservasUltimos30d = todasLasReservas.filter((b) => {
          const fechaReserva = new Date(b.bookingDate)
          return fechaReserva >= hace30Dias
        }).length

        let frecuencia = 'Mensual'
        if (reservasUltimos30d >= 4) frecuencia = 'Semanal'
        else if (reservasUltimos30d >= 2) frecuencia = 'Bi-semanal'
        else if (reservasUltimos30d >= 1) frecuencia = 'Quincenal'

        const canchasCount = new Map<string, number>()
        todasLasReservas.forEach((b) => {
          const cancha = b.court.name
          canchasCount.set(cancha, (canchasCount.get(cancha) || 0) + 1)
        })

        let canchaPreferida = 'N/A'
        let maxReservas = 0
        canchasCount.forEach((count, cancha) => {
          if (count > maxReservas) {
            maxReservas = count
            canchaPreferida = cancha
          }
        })

        const ultimaReserva = todasLasReservas[0]
        const ultimaReservaFecha = ultimaReserva
          ? new Date(ultimaReserva.bookingDate).toISOString().split('T')[0]
          : null

        const totalReservas = todasLasReservas.length
        let categoria = 'Regular'
        let descuento = 5
        if (totalReservas >= 20) {
          categoria = 'VIP'
          descuento = 15
        } else if (totalReservas >= 10) {
          categoria = 'Premium'
          descuento = 10
        }

        return {
          id: usuario.id,
          nombre:
            usuario.name ||
            usuario.fullName ||
            usuario.email?.split('@')[0] ||
            'Usuario',
          email: usuario.email,
          reservas: totalReservas,
          reservasMes: usuario._count.bookings,
          frecuencia,
          canchaPreferida,
          ultimaReserva: ultimaReservaFecha,
          categoria,
          descuento,
        }
      })
    )

    const clientesMasFrecuentes = usuariosConEstadisticas
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 10)

    const usuariosNuevos = await prisma.user.count({
      where: {
        ...baseWhere,
        createdAt: { gte: hace30Dias },
        bookings: {
          some: {
            bookingDate: { gte: hace30Dias },
            deletedAt: null,
          },
        },
      },
    })

    const usuariosRecurrentes = await prisma.user.count({
      where: {
        ...baseWhere,
        createdAt: { lt: hace30Dias },
        bookings: {
          some: {
            bookingDate: { gte: hace30Dias },
            deletedAt: null,
          },
        },
      },
    })

    const ingresosTotales = await prisma.booking.aggregate({
      where: {
        tenantId,
        bookingDate: { gte: inicioMes },
        paymentStatus: { in: ['DEPOSIT_PAID', 'FULLY_PAID'] },
        deletedAt: null,
      },
      _sum: { totalPrice: true },
    })

    const usuariosConReservasMes = usuariosConReservas.length
    const valorPromedioPorCliente =
      usuariosConReservasMes > 0
        ? Math.round((ingresosTotales._sum.totalPrice || 0) / usuariosConReservasMes)
        : 0

    const distribucionCategorias = {
      VIP: usuariosConEstadisticas.filter((u) => u.categoria === 'VIP').length,
      Premium: usuariosConEstadisticas.filter((u) => u.categoria === 'Premium').length,
      Regular: usuariosConEstadisticas.filter((u) => u.categoria === 'Regular').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        metricas: {
          totalUsuarios: totalUsuarios,
          usuariosActivos,
          nuevosEsteMes,
          retencion,
        },
        clientesMasFrecuentes,
        clientesNuevosVsRecurrentes: {
          nuevos: usuariosNuevos,
          recurrentes: usuariosRecurrentes,
        },
        valorPromedioPorCliente,
        distribucionCategorias,
      },
    })
  } catch (error) {
    console.error('Error al obtener análisis de usuarios:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
