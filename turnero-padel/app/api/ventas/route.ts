import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '../../../lib/database/neon-config'
import { ventaCreateSchema } from '../../../lib/validations/schemas'

// POST /api/ventas - Crear nueva venta directa
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Solo administradores pueden realizar ventas.'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos con Zod
    const validatedData = ventaCreateSchema.parse(body)
    const { productoId, quantity, paymentMethod, notes } = validatedData

    // Procesar venta en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Obtener producto y validar
      const producto = await tx.producto.findFirst({
        where: { id: productoId, activo: true },
      })

      if (!producto) {
        throw new Error('Producto no encontrado o inactivo')
      }

      if (producto.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${quantity}`)
      }

      // Calcular precios
      const unitPrice = producto.precio
      const totalPrice = unitPrice * quantity

      // Crear venta
      const venta = await tx.venta.create({
        data: {
          productoId,
          quantity,
          unitPrice,
          totalPrice,
          paymentMethod,
          processedById: session.user.id,
          notes: notes || null,
        },
        include: {
          producto: true,
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Decrementar stock
      await tx.producto.update({
        where: { id: productoId },
        data: { stock: producto.stock - quantity },
      })

      return venta
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Venta registrada correctamente',
    })
  } catch (error: any) {
    console.error('Error in POST /api/ventas:', error)

    // Manejar errores de validación de Zod
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    // Manejar otros errores
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
      },
      { status: 400 }
    )
  }
}

// GET /api/ventas - Obtener historial de ventas
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Solo administradores pueden ver el historial de ventas.'
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const productoId = searchParams.get('productoId')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (productoId) {
      where.productoId = parseInt(productoId)
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Obtener ventas con paginación
    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.venta.count({ where }),
    ])

    // Calcular estadísticas
    const stats = await prisma.venta.aggregate({
      where,
      _sum: {
        totalPrice: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: ventas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalVentas: stats._count.id,
        totalCantidad: stats._sum.quantity || 0,
        totalIngresos: stats._sum.totalPrice || 0,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/ventas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}















