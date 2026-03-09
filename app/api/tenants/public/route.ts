import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllActiveTenants } from '@/lib/services/tenants'

/**
 * API pública para listar tenants activos
 * No requiere autenticación - accesible desde la landing page
 * Super admins ven todos los tenants (incluidos los de prueba)
 * 
 * GET /api/tenants/public
 */
export async function GET() {
  try {
    const session = await auth()
    const isSuperAdmin = session?.user?.isSuperAdmin === true

    const tenants = await getAllActiveTenants(isSuperAdmin)

    const cacheHeaders = isSuperAdmin
      ? { 'Cache-Control': 'private, no-store' }
      : { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    
    return NextResponse.json(
      {
        success: true,
        data: tenants,
      },
      {
        status: 200,
        headers: cacheHeaders,
      }
    )
  } catch (error) {
    console.error('Error en GET /api/tenants/public:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}



