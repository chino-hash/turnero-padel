/**
 * Endpoint para ejecutar el job de cancelación de reservas expiradas
 * Este endpoint debe ser llamado periódicamente por un cron job (ej: Vercel Cron)
 * 
 * Protección: Debería protegerse con un secret token en producción
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExpiredBookingsService } from '@/lib/services/bookings/ExpiredBookingsService';

export async function POST(request: NextRequest) {
  try {
    // TODO: Agregar validación de token de seguridad en producción
    // const authHeader = request.headers.get('authorization');
    // const expectedToken = process.env.CRON_SECRET;
    // if (authHeader !== `Bearer ${expectedToken}`) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const service = new ExpiredBookingsService();
    
    // Obtener estadísticas antes de cancelar
    const stats = await service.getExpiredBookingsStats();
    
    // Cancelar reservas expiradas
    const cancelledCount = await service.cancelExpiredBookings();

    return NextResponse.json({
      success: true,
      cancelled: cancelledCount,
      stats: {
        totalExpired: stats.totalExpired,
        expiredIds: stats.expiredIds
      },
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
export async function GET() {
  try {
    const service = new ExpiredBookingsService();
    const stats = await service.getExpiredBookingsStats();
    
    return NextResponse.json({
      active: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { active: false, error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}


