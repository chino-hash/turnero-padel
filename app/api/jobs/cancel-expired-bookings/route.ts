/**
 * Endpoint para ejecutar el job de cancelación de reservas expiradas
 * Este endpoint debe ser llamado periódicamente por un cron job (ej: Vercel Cron)
 * 
 * Soporta multitenancy: puede procesar un tenant específico o todos los tenants (solo super admin)
 * 
 * Protección: Debería protegerse con un secret token en producción
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ExpiredBookingsService } from '@/lib/services/bookings/ExpiredBookingsService';
import { isSuperAdminUser } from '@/lib/utils/permissions';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener tenantId del query string (opcional)
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get('tenantId');

    // Si se proporciona tenantId, validar permisos
    if (tenantIdParam) {
      const user = session.user;
      const isSuperAdmin = await isSuperAdminUser(user);
      
      // Solo super admin puede procesar todos los tenants
      // Admin de tenant puede procesar solo su tenant
      if (!isSuperAdmin && user.tenantId !== tenantIdParam) {
        return NextResponse.json(
          { success: false, error: 'No autorizado para procesar este tenant' },
          { status: 403 }
        );
      }
    } else {
      // Si no se proporciona tenantId, solo super admin puede procesar todos
      const user = session.user;
      const isSuperAdmin = await isSuperAdminUser(user);
      if (!isSuperAdmin) {
        return NextResponse.json(
          { success: false, error: 'Solo super admin puede procesar todos los tenants' },
          { status: 403 }
        );
      }
    }

    // TODO: Agregar validación de token de seguridad en producción para cron jobs externos
    // const authHeader = request.headers.get('authorization');
    // const expectedToken = process.env.CRON_SECRET;
    // if (authHeader !== `Bearer ${expectedToken}`) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const service = new ExpiredBookingsService();
    const tenantId = tenantIdParam || null;
    
    // Obtener estadísticas antes de cancelar
    const stats = await service.getExpiredBookingsStats(tenantId);
    
    // Cancelar reservas expiradas
    const cancelledCount = await service.cancelExpiredBookings(tenantId);

    return NextResponse.json({
      success: true,
      cancelled: cancelledCount,
      stats: {
        totalExpired: stats.totalExpired,
        expiredIds: stats.expiredIds,
        byTenant: stats.byTenant
      },
      tenantId: tenantId || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ejecutando job de cancelación de reservas expiradas:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Permitir GET para verificación del endpoint
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener tenantId del query string (opcional)
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get('tenantId');

    // Si se proporciona tenantId, validar permisos
    if (tenantIdParam) {
      const user = session.user;
      const isSuperAdmin = await isSuperAdminUser(user);
      
      if (!isSuperAdmin && user.tenantId !== tenantIdParam) {
        return NextResponse.json(
          { success: false, error: 'No autorizado para ver estadísticas de este tenant' },
          { status: 403 }
        );
      }
    } else {
      // Si no se proporciona tenantId, solo super admin puede ver todos
      const user = session.user;
      const isSuperAdmin = await isSuperAdminUser(user);
      if (!isSuperAdmin) {
        return NextResponse.json(
          { success: false, error: 'Solo super admin puede ver estadísticas de todos los tenants' },
          { status: 403 }
        );
      }
    }

    const service = new ExpiredBookingsService();
    const tenantId = tenantIdParam || null;
    const stats = await service.getExpiredBookingsStats(tenantId);
    
    return NextResponse.json({
      active: true,
      stats,
      tenantId: tenantId || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { active: false, error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}



