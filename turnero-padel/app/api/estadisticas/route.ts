import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '../../../lib/database/neon-config'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
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
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)
    
    // Mes anterior para comparativa
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59)
    
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

    // Calcular ocupación promedio (MEJORADO)
    const canchasActivas = await prisma.court.count({
      where: {
        isActive: true,
        deletedAt: null
      }
    })

    // Calcular slots disponibles por día (asumiendo 90 min por slot)
    const slotsPorDia = 14 // 08:00 a 22:00 = 14 slots de 90 min
    const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
    const totalSlotsPosibles = canchasActivas * slotsPorDia * diasMes
    
    // Reservas del mes para cálculo de ocupación
    const reservasMes = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: inicioMes,
          lte: finMes
        },
        deletedAt: null
      }
    })
    
    const ocupacionPromedio = totalSlotsPosibles > 0 
      ? Math.round((reservasMes / totalSlotsPosibles) * 100) 
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
      ? (reservasMes / totalUsuariosConReservas).toFixed(1)
      : '0.0'

    // ===== NUEVAS ESTADÍSTICAS DE PRODUCTOS =====
    
    // Productos más vendidos (combinando BookingExtra y Venta)
    const productosVendidosExtras = await prisma.bookingExtra.groupBy({
      by: ['productoId'],
      where: {
        createdAt: {
          gte: inicioMes
        },
        deletedAt: null
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      _count: {
        id: true
      }
    })

    const productosVendidosDirectos = await prisma.venta.groupBy({
      by: ['productoId'],
      where: {
        createdAt: {
          gte: inicioMes
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      _count: {
        id: true
      }
    })

    // Combinar y sumar ventas de ambos tipos
    const productosMap = new Map<number, {
      productoId: number
      cantidad: number
      ingresos: number
      transacciones: number
    }>()

    productosVendidosExtras.forEach(item => {
      productosMap.set(item.productoId, {
        productoId: item.productoId,
        cantidad: item._sum.quantity || 0,
        ingresos: item._sum.totalPrice || 0,
        transacciones: item._count.id
      })
    })

    productosVendidosDirectos.forEach(item => {
      const existente = productosMap.get(item.productoId)
      if (existente) {
        existente.cantidad += item._sum.quantity || 0
        existente.ingresos += item._sum.totalPrice || 0
        existente.transacciones += item._count.id
      } else {
        productosMap.set(item.productoId, {
          productoId: item.productoId,
          cantidad: item._sum.quantity || 0,
          ingresos: item._sum.totalPrice || 0,
          transacciones: item._count.id
        })
      }
    })

    // Obtener nombres de productos
    const productosIds = Array.from(productosMap.keys())
    const productosInfo = await prisma.producto.findMany({
      where: {
        id: { in: productosIds }
      },
      select: {
        id: true,
        nombre: true,
        categoria: true
      }
    })

    const productosMasVendidos = Array.from(productosMap.entries())
      .map(([productoId, stats]) => {
        const producto = productosInfo.find(p => p.id === productoId)
        return {
          nombre: producto?.nombre || 'Producto desconocido',
          categoria: producto?.categoria || 'Sin categoría',
          cantidad: stats.cantidad,
          ingresos: stats.ingresos,
          transacciones: stats.transacciones
        }
      })
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    // Estadísticas generales de ventas de productos
    const totalVentasProductos = await prisma.venta.aggregate({
      where: {
        createdAt: {
          gte: inicioMes
        }
      },
      _sum: {
        totalPrice: true,
        quantity: true
      },
      _count: {
        id: true
      }
    })

    const totalExtrasReservas = await prisma.bookingExtra.aggregate({
      where: {
        createdAt: {
          gte: inicioMes
        },
        deletedAt: null
      },
      _sum: {
        totalPrice: true,
        quantity: true
      },
      _count: {
        id: true
      }
    })

    const ingresosProductos = (totalVentasProductos._sum.totalPrice || 0) + 
                               (totalExtrasReservas._sum.totalPrice || 0)

    // Productos con bajo stock
    const productosBajoStock = await prisma.producto.findMany({
      where: {
        activo: true,
        stock: {
          lt: 10
        }
      },
      select: {
        nombre: true,
        stock: true,
        categoria: true
      },
      orderBy: {
        stock: 'asc'
      }
    })

    // Categorías más rentables
    const categoriasProductos = await prisma.producto.findMany({
      where: {
        activo: true
      },
      select: {
        categoria: true,
        id: true
      }
    })

    const categoriasUnicas = [...new Set(categoriasProductos.map(p => p.categoria))]
    const categoriasRentables = await Promise.all(
      categoriasUnicas.map(async (categoria) => {
        const productosCategoria = categoriasProductos.filter(p => p.categoria === categoria)
        const idsCategoria = productosCategoria.map(p => p.id)

        const ventasCategoria = await prisma.venta.aggregate({
          where: {
            productoId: { in: idsCategoria },
            createdAt: { gte: inicioMes }
          },
          _sum: {
            totalPrice: true,
            quantity: true
          }
        })

        const extrasCategoria = await prisma.bookingExtra.aggregate({
          where: {
            productoId: { in: idsCategoria },
            createdAt: { gte: inicioMes },
            deletedAt: null
          },
          _sum: {
            totalPrice: true,
            quantity: true
          }
        })

        return {
          categoria,
          ingresos: (ventasCategoria._sum.totalPrice || 0) + (extrasCategoria._sum.totalPrice || 0),
          ventas: (ventasCategoria._sum.quantity || 0) + (extrasCategoria._sum.quantity || 0)
        }
      })
    )

    const categoriasRentablesOrdenadas = categoriasRentables
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10)

    // Rotación de inventario (ventas/stock disponible)
    const productosConRotacion = await Promise.all(
      productosInfo.map(async (producto) => {
        const ventasProducto = productosMap.get(producto.id)
        const productoCompleto = await prisma.producto.findUnique({
          where: { id: producto.id },
          select: { stock: true }
        })

        const stockActual = productoCompleto?.stock || 0
        const ventas = ventasProducto?.cantidad || 0
        const rotacion = stockActual > 0 ? (ventas / stockActual) : 0

        return {
          nombre: producto.nombre,
          rotacion: Math.round(rotacion * 100) / 100,
          categoria: producto.categoria
        }
      })
    )

    const rotacionOrdenada = productosConRotacion
      .filter(p => p.rotacion > 0)
      .sort((a, b) => b.rotacion - a.rotacion)
      .slice(0, 10)

    // ===== DÍAS CON MÁS DEMANDA DE TURNOS =====
    const reservasPorDia = await prisma.booking.groupBy({
      by: ['bookingDate'],
      where: {
        bookingDate: {
          gte: inicioMes,
          lte: finMes
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

    const diasMasDemanda = reservasPorDia.map(item => {
      const fecha = new Date(item.bookingDate)
      return {
        fecha: fecha.toISOString().split('T')[0],
        diaSemana: fecha.toLocaleDateString('es-ES', { weekday: 'long' }),
        reservas: item._count.id
      }
    })

    // Días de la semana más populares
    const reservasPorDiaSemana = await prisma.booking.groupBy({
      by: ['bookingDate'],
      where: {
        bookingDate: {
          gte: inicioMes,
          lte: finMes
        },
        deletedAt: null
      },
      _count: {
        id: true
      }
    })

    const diasSemanaCount = [0, 0, 0, 0, 0, 0, 0] // Domingo a Sábado
    reservasPorDiaSemana.forEach(item => {
      const fecha = new Date(item.bookingDate)
      const diaSemana = fecha.getDay()
      diasSemanaCount[diaSemana] += item._count.id
    })

    const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const diasSemanaPopulares = diasSemanaCount
      .map((count, index) => ({
        dia: diasSemanaNombres[index],
        reservas: count,
        porcentaje: reservasMes > 0 ? Math.round((count / reservasMes) * 100) : 0
      }))
      .sort((a, b) => b.reservas - a.reservas)

    // ===== ANÁLISIS TEMPORAL =====
    
    // Comparativa mes anterior vs actual
    const reservasMesAnterior = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: inicioMesAnterior,
          lte: finMesAnterior
        },
        deletedAt: null
      }
    })

    const ingresosMesAnterior = await prisma.booking.aggregate({
      where: {
        bookingDate: {
          gte: inicioMesAnterior,
          lte: finMesAnterior
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

    const diasMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate()
    const totalSlotsMesAnterior = canchasActivas * slotsPorDia * diasMesAnterior
    const ocupacionMesAnterior = totalSlotsMesAnterior > 0
      ? Math.round((reservasMesAnterior / totalSlotsMesAnterior) * 100)
      : 0

    const comparativa = {
      reservas: {
        actual: reservasMes,
        anterior: reservasMesAnterior,
        cambio: reservasMesAnterior > 0 
          ? Math.round(((reservasMes - reservasMesAnterior) / reservasMesAnterior) * 100)
          : 0
      },
      ingresos: {
        actual: ingresosMes._sum.totalPrice || 0,
        anterior: ingresosMesAnterior._sum.totalPrice || 0,
        cambio: (ingresosMesAnterior._sum.totalPrice || 0) > 0
          ? Math.round((((ingresosMes._sum.totalPrice || 0) - (ingresosMesAnterior._sum.totalPrice || 0)) / (ingresosMesAnterior._sum.totalPrice || 0)) * 100)
          : 0
      },
      ocupacion: {
        actual: ocupacionPromedio,
        anterior: ocupacionMesAnterior,
        cambio: ocupacionMesAnterior > 0
          ? Math.round(((ocupacionPromedio - ocupacionMesAnterior) / ocupacionMesAnterior) * 100)
          : 0
      }
    }

    // Tendencia semanal (últimas 4 semanas)
    const semanas = []
    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(hoy)
      inicioSemana.setDate(hoy.getDate() - (hoy.getDay() + (i * 7)))
      inicioSemana.setHours(0, 0, 0, 0)
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)
      finSemana.setHours(23, 59, 59)

      const reservasSemana = await prisma.booking.count({
        where: {
          bookingDate: {
            gte: inicioSemana,
            lte: finSemana
          },
          deletedAt: null
        }
      })

      const ingresosSemana = await prisma.booking.aggregate({
        where: {
          bookingDate: {
            gte: inicioSemana,
            lte: finSemana
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

      semanas.push({
        semana: `Sem ${i + 1}`,
        reservas: reservasSemana,
        ingresos: ingresosSemana._sum.totalPrice || 0
      })
    }

    // Proyección de ingresos (promedio de últimas 4 semanas * días restantes del mes)
    const promedioIngresosSemanal = semanas.reduce((sum, s) => sum + s.ingresos, 0) / semanas.length
    const diasRestantes = Math.max(0, diasMes - hoy.getDate())
    const proyeccionIngresos = Math.round(promedioIngresosSemanal * (diasRestantes / 7))

    // ===== MÉTRICAS DE RENDIMIENTO =====
    
    // Ocupación por cancha individual
    const canchasConOcupacion = await Promise.all(
      canchasMasUsadas.map(async (cancha) => {
        const canchaCompleta = await prisma.court.findUnique({
          where: { id: cancha.id },
          select: { name: true }
        })

        const slotsCancha = slotsPorDia * diasMes
        const ocupacionCancha = slotsCancha > 0
          ? Math.round((cancha._count.bookings / slotsCancha) * 100)
          : 0

        return {
          cancha: canchaCompleta?.name || cancha.name,
          ocupacion: ocupacionCancha,
          reservas: cancha._count.bookings
        }
      })
    )

    // Horarios más rentables (ingresos por horario)
    const reservasPorHorarioConIngresos = await prisma.booking.groupBy({
      by: ['startTime'],
      where: {
        bookingDate: {
          gte: inicioMes,
          lte: finMes
        },
        paymentStatus: {
          in: ['DEPOSIT_PAID', 'FULLY_PAID']
        },
        deletedAt: null
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 10
    })

    const horariosRentables = reservasPorHorarioConIngresos.map(item => {
      const [hora, minutos] = item.startTime.split(':')
      const horaInicio = `${hora}:${minutos}`
      const horaFin = `${parseInt(hora) + 1}:${minutos}`
      return {
        horario: `${horaInicio}-${horaFin}`,
        ingresos: item._sum.totalPrice || 0,
        reservas: item._count.id
      }
    })

    // Eficiencia de turnos fijos
    const turnosRecurrentes = await prisma.booking.count({
      where: {
        bookingDate: {
          gte: inicioMes,
          lte: finMes
        },
        recurringId: {
          not: null
        },
        deletedAt: null
      }
    })

    const turnosPuntuales = reservasMes - turnosRecurrentes
    const porcentajeRecurrentes = reservasMes > 0
      ? Math.round((turnosRecurrentes / reservasMes) * 100)
      : 0

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
      satisfaccion: 89, // Valor fijo por ahora, se puede implementar un sistema de ratings
      // Nuevas estadísticas
      productos: {
        masVendidos: productosMasVendidos,
        totalIngresos: ingresosProductos,
        totalVentas: (totalVentasProductos._count.id || 0) + (totalExtrasReservas._count.id || 0),
        totalCantidad: (totalVentasProductos._sum.quantity || 0) + (totalExtrasReservas._sum.quantity || 0),
        bajoStock: productosBajoStock.map(p => ({
          nombre: p.nombre,
          stock: p.stock,
          categoria: p.categoria
        })),
        categoriasRentables: categoriasRentablesOrdenadas,
        rotacion: rotacionOrdenada
      },
      demanda: {
        diasMasDemanda,
        diasSemanaPopulares
      },
      temporal: {
        comparativa,
        tendenciaSemanal: semanas,
        proyeccionIngresos
      },
      rendimiento: {
        ocupacionPorCancha: canchasConOcupacion,
        horariosRentables,
        eficienciaTurnosFijos: {
          totalRecurrentes: turnosRecurrentes,
          totalPuntuales: turnosPuntuales,
          porcentajeRecurrentes
        }
      }
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