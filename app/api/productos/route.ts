import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '../../../lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '../../../lib/utils/permissions'

// GET - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    // Intentar obtener sesión (opcional para endpoints públicos, pero productos pueden ser por tenant)
    let user: PermissionsUser | null = null
    let userTenantId: string | null = null
    let isSuperAdmin = false

    try {
      const session = await auth()
      if (session?.user) {
        user = {
          id: session.user.id,
          email: session.user.email || null,
          role: session.user.role || 'USER',
          isAdmin: session.user.isAdmin || false,
          isSuperAdmin: session.user.isSuperAdmin || false,
          tenantId: session.user.tenantId || null,
        }
        isSuperAdmin = await isSuperAdminUser(user)
        userTenantId = await getUserTenantIdSafe(user)
      }
    } catch {}

    const whereClause: any = {}
    if (!isSuperAdmin && userTenantId) {
      whereClause.tenantId = userTenantId
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
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
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
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

    if (!user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      )
    }

    const userTenantId = await getUserTenantIdSafe(user)

    const body = await request.json()
    const { nombre, precio, stock, categoria, activo = true, tenantId } = body

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

    // Validar tenantId: si no es super admin, usar el tenantId del usuario
    let finalTenantId = tenantId
    if (!isSuperAdmin) {
      if (tenantId && tenantId !== userTenantId) {
        return NextResponse.json(
          {
            success: false,
            error: 'No tienes permisos para crear productos en otro tenant'
          },
          { status: 403 }
        )
      }
      finalTenantId = userTenantId
    } else if (!finalTenantId && userTenantId) {
      // Si es super admin pero no especificó tenantId, usar el del usuario
      finalTenantId = userTenantId
    }

    if (!finalTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'tenantId es requerido'
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
        activo,
        tenantId: finalTenantId
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
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
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

    if (!user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      )
    }

    const userTenantId = await getUserTenantIdSafe(user)

    const body = await request.json()
    const { id, nombre, precio, stock, categoria, activo, tenantId } = body

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

    // Validar permisos cross-tenant: verificar que el producto pertenece al tenant del usuario
    const productoExistente = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      select: { tenantId: true }
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

    if (!isSuperAdmin && userTenantId && productoExistente.tenantId !== userTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para actualizar este producto'
        },
        { status: 403 }
      )
    }

    // Prevenir cambio de tenantId si no es super admin
    if (!isSuperAdmin && tenantId && tenantId !== productoExistente.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No puedes cambiar el tenantId del producto'
        },
        { status: 403 }
      )
    }

    const productoActualizado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        categoria,
        activo,
        ...(isSuperAdmin && tenantId && { tenantId })
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
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
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

    if (!user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      )
    }

    const userTenantId = await getUserTenantIdSafe(user)

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

    // Verificar que el producto existe y validar permisos cross-tenant
    const productoExistente = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      select: { tenantId: true }
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

    if (!isSuperAdmin && userTenantId && productoExistente.tenantId !== userTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para eliminar este producto'
        },
        { status: 403 }
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