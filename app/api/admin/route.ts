import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { addAdmin, listAdmins } from '../../../lib/admin-system'
import { z } from 'zod'
import { Role } from '@prisma/client'

// Schema de validación para agregar admin
const addAdminSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional().default('ADMIN'),
  tenantId: z.string().optional().nullable(),
  addedBy: z.string().optional(),
  notes: z.string().optional()
})

// POST /api/admin - Agregar nuevo administrador
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Verificar que el usuario esté autenticado y sea admin o super admin
    if (!session || (!session.user.isAdmin && !session.user.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validation = addAdminSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { email, role, tenantId, addedBy, notes } = validation.data

    // Validar permisos según el rol a agregar
    // Solo SUPER_ADMIN puede agregar SUPER_ADMIN
    if (role === 'SUPER_ADMIN' && !session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo un Super Administrador puede agregar otros Super Administradores.' },
        { status: 403 }
      )
    }

    // Si se está agregando un ADMIN a un tenant específico, validar que el usuario puede hacerlo
    if (role === 'ADMIN' && tenantId && !session.user.isSuperAdmin) {
      // Un admin de tenant solo puede agregar admins a su propio tenant
      if (session.user.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'No tienes permisos para agregar administradores a este tenant.' },
          { status: 403 }
        )
      }
    }

    // Agregar el administrador usando la función del sistema
    const result = await addAdmin(
      email,
      addedBy || session.user.email || 'Sistema',
      notes || `Administrador agregado por ${session.user.email}`,
      tenantId || (session.user.isSuperAdmin ? null : session.user.tenantId || undefined),
      (role as 'ADMIN' | 'SUPER_ADMIN') || 'ADMIN'
    )

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        email: email,
        isActive: true
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error en POST /api/admin:', error)
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes('ya existe')) {
        return NextResponse.json(
          { error: 'El email ya está registrado como administrador activo' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/admin - Obtener lista de administradores
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Verificar que el usuario esté autenticado y sea admin o super admin
    if (!session || (!session.user.isAdmin && !session.user.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    // Obtener tenantId del query parameter si está disponible (para filtrar)
    const url = new URL(request.url);
    const tenantIdParam = url.searchParams.get('tenantId');
    
    let targetTenantId: string | null | undefined = undefined;
    
    // Si se especifica un tenantId, validar permisos
    if (tenantIdParam !== null) {
      // Super admin puede ver admins de cualquier tenant
      if (session.user.isSuperAdmin) {
        targetTenantId = tenantIdParam || null;
      } else {
        // Admin de tenant solo puede ver admins de su tenant
        if (tenantIdParam && tenantIdParam !== session.user.tenantId) {
          return NextResponse.json(
            { error: 'No tienes permisos para ver administradores de este tenant.' },
            { status: 403 }
          )
        }
        targetTenantId = session.user.tenantId || null;
      }
    } else {
      // Si no se especifica tenantId
      if (session.user.isSuperAdmin) {
        // Super admin puede ver todos los admins (incluyendo super admins con tenantId null)
        targetTenantId = undefined; // undefined = todos
      } else {
        // Admin de tenant solo puede ver admins de su tenant
        targetTenantId = session.user.tenantId || null;
      }
    }

    // Obtener lista de administradores
    const admins = await listAdmins(targetTenantId)
    
    const adminList = admins.map(admin => ({
      email: admin.email,
      role: admin.role,
      tenantId: admin.tenantId,
      isActive: admin.isActive,
      addedBy: admin.addedBy,
      notes: admin.notes,
      createdAt: admin.createdAt
    }))

    return NextResponse.json({
      success: true,
      data: adminList,
      total: adminList.length
    })

  } catch (error) {
    console.error('Error en GET /api/admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}