import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { addAdmin } from '../../../lib/admin-system'
import { z } from 'zod'

// Schema de validación para agregar admin
const addAdminSchema = z.object({
  email: z.string().email('Email inválido'),
  addedBy: z.string().optional(),
  notes: z.string().optional()
})

// POST /api/admin - Agregar nuevo administrador
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Verificar que el usuario esté autenticado y sea admin
    if (!session || !session.user.isAdmin) {
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

    const { email, addedBy, notes } = validation.data

    // Agregar el administrador usando la función del sistema
    const result = await addAdmin(
      email,
      addedBy || session.user.email || 'Sistema',
      notes || `Administrador agregado por ${session.user.email}`
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

// GET /api/admin - Obtener lista de administradores (solo para super admins)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Verificar que el usuario esté autenticado y sea admin
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    // Por seguridad, solo mostrar información básica
    const { getAllAdmins } = await import('@/lib/admin-system')
    const admins = await getAllAdmins()
    
    const adminList = Array.from(admins).map(email => ({
      email,
      isActive: true // Solo se devuelven los activos
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