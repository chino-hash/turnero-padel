import { NextResponse } from 'next/server'
import { getAllActiveTenants } from '@/lib/services/tenants'

/**
 * API pública para listar tenants activos
 * No requiere autenticación - accesible desde la landing page
 * 
 * GET /api/tenants/public
 * 
 * Retorna:
 * {
 *   success: true,
 *   data: TenantPublicInfo[]
 * }
 */
export async function GET() {
  try {
    const tenants = await getAllActiveTenants()
    
    return NextResponse.json(
      {
        success: true,
        data: tenants,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache por 5 minutos
        },
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



