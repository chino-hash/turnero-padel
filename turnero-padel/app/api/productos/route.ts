import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '../../../lib/database/neon-config'

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: productos
    })
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nombre, precio, stock, categoria, activo = true } = body

    // Validaciones
    if (!nombre || !precio || stock === undefined || !categoria) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos'
        },
        { status: 400 }
      )
    }

    if (precio <= 0 || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Precio debe ser mayor a 0 y stock no puede ser negativo'
        },
        { status: 400 }
      )
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        categoria,
        activo
      }
    })

    return NextResponse.json({
      success: true,
      data: nuevoProducto
    })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto existente
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, nombre, precio, stock, categoria, activo } = body

    // Validaciones
    if (!id || !nombre || !precio || stock === undefined || !categoria) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos'
        },
        { status: 400 }
      )
    }

    if (precio <= 0 || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Precio debe ser mayor a 0 y stock no puede ser negativo'
        },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    })

    if (!productoExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Producto no encontrado'
        },
        { status: 404 }
      )
    }

    const productoActualizado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        categoria,
        activo
      }
    })

    return NextResponse.json({
      success: true,
      data: productoActualizado
    })
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar producto
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID del producto requerido'
        },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    })

    if (!productoExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Producto no encontrado'
        },
        { status: 404 }
      )
    }

    await prisma.producto.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}