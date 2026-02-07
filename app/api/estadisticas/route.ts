import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '../../../lib/database/neon-config'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener fechas para los cálculos
    const hoy = new Date()
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000)
    
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    
    // Reservas de hoy
    const reservasHoy = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: inicioHoy,
          lt: finHoy
        },
        deletedAt: null
      }
    })

    // Reservas de la semana
    const reservasSemana = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: inicioSemana
        },
        deletedAt: null
      }
    })

    // Ingresos del mes
    const ingresosMes = await prisma.booking.aggregate({
      where: {
        bookingDate: {
          gte: inicioMes
        },
        paymentStatus: {
          in: ['DEPOSIT_PAID', 'FULLY_PAID']
        },
        deletedAt: null
      },
      _sum: {
        totalPrice: true
      }
    })

    // Usuarios activos (que han hecho reservas en los últimos 30 días)
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)
    
    const usuariosActivos = await prisma.user.count({
      where: {
        bookings: {
          some: {
            bookingDate: {
              gte: hace30Dias
            },
            deletedAt: null
          }
        },
        deletedAt: null
      }
    })

    // Canchas más utilizadas
    const canchasMasUsadas = await prisma.court.findMany({
      where: {
        deletedAt: null,
        isActive: true
      },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                bookingDate: {
                  gte: inicioMes
                },
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Calcular porcentajes para canchas más utilizadas
    const maxReservas = canchasMasUsadas[0]?._count.bookings || 1
    const canchasConPorcentaje = canchasMasUsadas.map(cancha => ({
      nombre: cancha.name,
      reservas: cancha._count.bookings,
      porcentaje: Math.round((cancha._count.bookings / maxReservas) * 100)
    }))

    // Horarios pico (análisis por hora de inicio)
    const reservasPorHora = await prisma.booking.groupBy({
      by: ['startTime'],
      where: {
        bookingDate: {
          gte: inicioMes
        },
        deletedAt: null
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Formatear horarios pico
    const horariosPico = reservasPorHora.map(item => {
      const [hora, minutos] = item.startTime.split(':')
      const horaInicio = `${hora}:${minutos}`
      const horaFin = `${parseInt(hora) + 1}:${minutos}`
      return {
        hora: `${horaInicio}-${horaFin}`,
        reservas: item._count.id
      }
    }).slice(0, 4)

    // Calcular ocupación promedio
    const totalSlotsPosibles = await prisma.court.count({
      where: {
        isActive: true,
        deletedAt: null
      }
    }) * 30 * 12 // 30 días * 12 slots por día (aproximado)
    
    const ocupacionPromedio = totalSlotsPosibles > 0 
      ? Math.round((reservasSemana * 4 / totalSlotsPosibles) * 100) 
      : 0

    // Estadísticas financieras
    const totalRecaudado = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paymentType: 'PAYMENT',
        createdAt: {
          gte: inicioMes
        },
        deletedAt: null
      },
      _sum: {
        amount: true
      }
    })

    const saldoPendiente = await prisma.booking.aggregate({
      where: {
        paymentStatus: 'PENDING',
        bookingDate: {
          gte: inicioMes
        },
        deletedAt: null
      },
      _sum: {
        totalPrice: true
      }
    })

    const totalReservas = await prisma.booking.aggregate({
      where: {
        bookingDate: {
          gte: inicioMes
        },
        deletedAt: null
      },
      _sum: {
        totalPrice: true
      }
    })

    // Promedio de reservas por usuario
    const totalUsuariosConReservas = await prisma.user.count({
      where: {
        bookings: {
          some: {
            bookingDate: {
              gte: inicioMes
            },
            deletedAt: null
          }
        },
        deletedAt: null
      }
    })

    const promedioReservasPorUsuario = totalUsuariosConReservas > 0 
      ? (reservasSemana * 4 / totalUsuariosConReservas).toFixed(1)
      : '0.0'

    const estadisticas = {
      reservasHoy,
      reservasSemana,
      ingresosMes: ingresosMes._sum.totalPrice || 0,
      ocupacionPromedio,
      usuariosActivos,
      canchasMasUsadas: canchasConPorcentaje,
      horariosPico,
      financiero: {
        totalRecaudado: totalRecaudado._sum.amount || 0,
        saldoPendiente: saldoPendiente._sum.totalPrice || 0,
        totalReservas: totalReservas._sum.totalPrice || 0
      },
      promedioReservasPorUsuario: parseFloat(promedioReservasPorUsuario),
      satisfaccion: 89 // Valor fijo por ahora, se puede implementar un sistema de ratings
    }

    return NextResponse.json({
      success: true,
      data: estadisticas
    })

  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}